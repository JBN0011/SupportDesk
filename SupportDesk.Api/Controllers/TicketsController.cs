using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportDesk.Api.Data;
using SupportDesk.Api.Dtos;
using SupportDesk.Api.Extensions;
using SupportDesk.Api.Models;
using SupportDesk.Api.Services;

namespace SupportDesk.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]   // every action here needs a valid token
public class TicketsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AiTriageService _ai;

    public TicketsController(AppDbContext db, AiTriageService ai)
    {
        _db = db;
        _ai = ai;
    }

    // ---------- Create ----------
    [HttpPost]
    public async Task<ActionResult<TicketDetailDto>> Create(CreateTicketRequest request)
    {
        var ticket = new Ticket
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            CreatedById = User.GetUserId()
        };

        // AI suggestion with safe defaults if AI is unavailable
        var triage = await _ai.TriageAsync(ticket.Title, ticket.Description);
        ticket.Category = triage?.Category ?? TicketCategory.Other;
        ticket.Priority = triage?.Priority ?? TicketPriority.Medium;
        ticket.AiTriaged = triage is not null;

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();

        var dto = await LoadDetail(ticket.Id);
        return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, dto);
    }

    // ---------- List with filters and paging ----------
    [HttpGet]
    public async Task<ActionResult<PagedResult<TicketSummaryDto>>> List([FromQuery] TicketQuery q)
    {
        var query = _db.Tickets.AsNoTracking().AsQueryable();
        var userId = User.GetUserId();

        // Customers only ever see their own tickets
        if (!User.IsStaff())
            query = query.Where(t => t.CreatedById == userId);
        else if (q.AssignedToMe)
            query = query.Where(t => t.AssignedToId == userId);

        if (q.Status.HasValue) query = query.Where(t => t.Status == q.Status.Value);
        if (q.Priority.HasValue) query = query.Where(t => t.Priority == q.Priority.Value);
        if (q.Category.HasValue) query = query.Where(t => t.Category == q.Category.Value);
        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(t => t.Title.Contains(q.Search));

        var page = Math.Max(q.Page, 1);
        var size = Math.Clamp(q.PageSize, 1, 50);
        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(t => new TicketSummaryDto(
                t.Id, t.Title, t.Status, t.Priority, t.Category,
                t.CreatedBy.Name,
                t.AssignedTo != null ? t.AssignedTo.Name : null,
                t.CreatedAt, t.UpdatedAt))
            .ToListAsync();

        return new PagedResult<TicketSummaryDto>(items, total, page, size);
    }

    // ---------- Details ----------
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TicketDetailDto>> GetById(int id)
    {
        var dto = await LoadDetail(id);
        if (dto is null) return NotFound();
        return dto;
    }

    // ---------- Change status ----------
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> ChangeStatus(int id, UpdateStatusRequest request)
    {
        var ticket = await _db.Tickets.FindAsync(id);
        if (ticket is null || !CanAccess(ticket)) return NotFound();

        // Customers may only close their own ticket
        if (!User.IsStaff() && request.Status != TicketStatus.Closed)
            return Forbid();

        if (!TicketWorkflow.CanChange(ticket.Status, request.Status))
            return BadRequest(new { error = $"Cannot change status from {ticket.Status} to {request.Status}." });

        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;
        if (request.Status == TicketStatus.Resolved)
            ticket.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Change priority (staff only) ----------
    [HttpPatch("{id:int}/priority")]
    [Authorize(Roles = "Agent,Admin")]
    public async Task<IActionResult> ChangePriority(int id, UpdatePriorityRequest request)
    {
        var ticket = await _db.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();

        ticket.Priority = request.Priority;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Assign (staff only) ----------
    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = "Agent,Admin")]
    public async Task<IActionResult> Assign(int id, AssignRequest request)
    {
        var ticket = await _db.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();

        // An agent may only take a ticket for themselves. An admin can assign anyone.
        if (User.IsInRole("Agent") && request.AgentId != User.GetUserId())
            return Forbid();

        var agent = await _db.Users.FirstOrDefaultAsync(u =>
            u.Id == request.AgentId && u.Role != UserRole.Customer);
        if (agent is null)
            return BadRequest(new { error = "Agent not found." });

        ticket.AssignedToId = agent.Id;
        if (ticket.Status == TicketStatus.Open)
            ticket.Status = TicketStatus.InProgress;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Comments ----------
    [HttpPost("{id:int}/comments")]
    public async Task<ActionResult<CommentDto>> AddComment(int id, AddCommentRequest request)
    {
        var ticket = await _db.Tickets.FindAsync(id);
        if (ticket is null || !CanAccess(ticket)) return NotFound();

        if (ticket.Status == TicketStatus.Closed)
            return BadRequest(new { error = "This ticket is closed." });

        var comment = new TicketComment
        {
            TicketId = id,
            AuthorId = User.GetUserId(),
            Message = request.Message.Trim()
        };

        _db.Comments.Add(comment);
        ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var authorName = User.FindFirst("name")?.Value ?? "";
        var authorRole = User.FindFirst("role")?.Value ?? "";
        return new CommentDto(comment.Id, authorName, authorRole, comment.Message, comment.CreatedAt);
    }

    // ---------- AI draft reply (staff only) ----------
    [HttpPost("{id:int}/suggest-reply")]
    [Authorize(Roles = "Agent,Admin")]
    public async Task<IActionResult> SuggestReply(int id)
    {
        var ticket = await _db.Tickets.AsNoTracking()
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null) return NotFound();

        var history = ticket.Comments
            .OrderBy(c => c.CreatedAt)
            .Select(c => $"{c.Author.Role}: {c.Message}");

        var draft = await _ai.SuggestReplyAsync(ticket.Title, ticket.Description, history);
        if (draft is null)
            return StatusCode(503, new { error = "AI is not available right now. Please write the reply yourself." });

        return Ok(new { draft });
    }

    // ---------- Statistics (staff only) ----------
    [HttpGet("stats")]
    [Authorize(Roles = "Agent,Admin")]
    public async Task<IActionResult> Stats()
    {
        var byStatus = await _db.Tickets
            .GroupBy(t => t.Status)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync();

        var activeByPriority = await _db.Tickets
            .Where(t => t.Status != TicketStatus.Closed)
            .GroupBy(t => t.Priority)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync();

        var unassigned = await _db.Tickets.CountAsync(t =>
            t.AssignedToId == null && t.Status != TicketStatus.Closed);

        return Ok(new
        {
            byStatus = byStatus.Select(x => new { status = x.Key.ToString(), x.Count }),
            activeByPriority = activeByPriority.Select(x => new { priority = x.Key.ToString(), x.Count }),
            unassignedActive = unassigned
        });
    }

    // ---------- Helpers ----------
    private bool CanAccess(Ticket ticket) =>
        User.IsStaff() || ticket.CreatedById == User.GetUserId();

    private async Task<TicketDetailDto?> LoadDetail(int id)
    {
        var ticket = await _db.Tickets.AsNoTracking()
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket is null || !CanAccess(ticket)) return null;
        return ToDetail(ticket);
    }

    private static TicketDetailDto ToDetail(Ticket t) => new(
        t.Id, t.Title, t.Description, t.Status, t.Priority, t.Category, t.AiTriaged,
        t.CreatedBy.Name, t.AssignedTo?.Name,
        t.CreatedAt, t.UpdatedAt, t.ResolvedAt,
        t.Comments.OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, c.Author.Name, c.Author.Role.ToString(), c.Message, c.CreatedAt))
            .ToList());
}

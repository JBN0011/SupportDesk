using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportDesk.Api.Data;
using SupportDesk.Api.Dtos;
using SupportDesk.Api.Models;

namespace SupportDesk.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    [HttpPost("agents")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAgent(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { error = "This email is already registered." });

        var agent = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Agent
        };

        _db.Users.Add(agent);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { agent.Id, agent.Name, agent.Email, agent.Role });
    }

    [HttpGet("agents")]
    [Authorize(Roles = "Admin,Agent")]
    public async Task<IActionResult> ListAgents()
    {
        var staff = await _db.Users.AsNoTracking()
            .Where(u => u.Role != UserRole.Customer)
            .Select(u => new { u.Id, u.Name, u.Email, u.Role })
            .ToListAsync();

        return Ok(staff);
    }
}

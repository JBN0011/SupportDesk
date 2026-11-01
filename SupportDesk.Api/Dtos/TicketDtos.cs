using System.ComponentModel.DataAnnotations;
using SupportDesk.Api.Models;

namespace SupportDesk.Api.Dtos;

public class CreateTicketRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = "";

    [Required, MaxLength(4000)]
    public string Description { get; set; } = "";
}

public class UpdateStatusRequest
{
    public TicketStatus Status { get; set; }
}

public class UpdatePriorityRequest
{
    public TicketPriority Priority { get; set; }
}

public class AssignRequest
{
    public int AgentId { get; set; }
}

public class AddCommentRequest
{
    [Required, MaxLength(2000)]
    public string Message { get; set; } = "";
}

public class TicketQuery
{
    public TicketStatus? Status { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketCategory? Category { get; set; }
    public string? Search { get; set; }
    public bool AssignedToMe { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public record TicketSummaryDto(
    int Id, string Title, TicketStatus Status, TicketPriority Priority,
    TicketCategory Category, string CreatedBy, string? AssignedTo,
    DateTime CreatedAt, DateTime UpdatedAt);

public record CommentDto(int Id, string Author, string Role, string Message, DateTime CreatedAt);

public record TicketDetailDto(
    int Id, string Title, string Description, TicketStatus Status,
    TicketPriority Priority, TicketCategory Category, bool AiTriaged,
    string CreatedBy, string? AssignedTo,
    DateTime CreatedAt, DateTime UpdatedAt, DateTime? ResolvedAt,
    List<CommentDto> Comments);

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

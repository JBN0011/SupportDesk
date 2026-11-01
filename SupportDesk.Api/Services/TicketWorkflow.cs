using SupportDesk.Api.Models;

namespace SupportDesk.Api.Services;

public static class TicketWorkflow
{
    private static readonly Dictionary<TicketStatus, TicketStatus[]> Allowed = new()
    {
        [TicketStatus.Open] = new[] { TicketStatus.InProgress, TicketStatus.Closed },
        [TicketStatus.InProgress] = new[] { TicketStatus.Resolved, TicketStatus.Open },
        [TicketStatus.Resolved] = new[] { TicketStatus.Closed, TicketStatus.InProgress },
        [TicketStatus.Closed] = Array.Empty<TicketStatus>()
    };

    public static bool CanChange(TicketStatus from, TicketStatus to) =>
        Allowed[from].Contains(to);
}

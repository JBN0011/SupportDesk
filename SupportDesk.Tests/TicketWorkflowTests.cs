using SupportDesk.Api.Models;
using SupportDesk.Api.Services;

namespace SupportDesk.Tests;

public class TicketWorkflowTests
{
    [Theory]
    [InlineData(TicketStatus.Open, TicketStatus.InProgress, true)]
    [InlineData(TicketStatus.Open, TicketStatus.Closed, true)]
    [InlineData(TicketStatus.Open, TicketStatus.Resolved, false)]
    [InlineData(TicketStatus.InProgress, TicketStatus.Resolved, true)]
    [InlineData(TicketStatus.Resolved, TicketStatus.InProgress, true)]
    [InlineData(TicketStatus.Closed, TicketStatus.Open, false)]
    [InlineData(TicketStatus.Closed, TicketStatus.InProgress, false)]
    public void CanChange_follows_the_rules(TicketStatus from, TicketStatus to, bool expected)
    {
        Assert.Equal(expected, TicketWorkflow.CanChange(from, to));
    }
}

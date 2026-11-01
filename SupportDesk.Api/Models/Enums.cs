namespace SupportDesk.Api.Models;

public enum UserRole { Customer, Agent, Admin }
public enum TicketStatus { Open, InProgress, Resolved, Closed }
public enum TicketPriority { Low, Medium, High, Urgent }
public enum TicketCategory { Bug, Billing, Account, FeatureRequest, Other }

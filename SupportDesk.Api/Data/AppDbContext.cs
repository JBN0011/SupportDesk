using Microsoft.EntityFrameworkCore;
using SupportDesk.Api.Models;

namespace SupportDesk.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> Comments => Set<TicketComment>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Store enums as readable text instead of numbers
        b.Entity<User>().Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        b.Entity<Ticket>().Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
        b.Entity<Ticket>().Property(t => t.Priority).HasConversion<string>().HasMaxLength(20);
        b.Entity<Ticket>().Property(t => t.Category).HasConversion<string>().HasMaxLength(20);

        // Restrict = you cannot delete a user who still has tickets or comments
        b.Entity<Ticket>().HasOne(t => t.CreatedBy).WithMany()
            .HasForeignKey(t => t.CreatedById).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Ticket>().HasOne(t => t.AssignedTo).WithMany()
            .HasForeignKey(t => t.AssignedToId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<TicketComment>().HasOne(c => c.Author).WithMany()
            .HasForeignKey(c => c.AuthorId).OnDelete(DeleteBehavior.Restrict);

        // Deleting a ticket deletes its comments
        b.Entity<TicketComment>().HasOne(c => c.Ticket).WithMany(t => t.Comments)
            .HasForeignKey(c => c.TicketId).OnDelete(DeleteBehavior.Cascade);
    }
}

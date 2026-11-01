using SupportDesk.Api.Models;

namespace SupportDesk.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db, IConfiguration config)
    {
        if (db.Users.Any()) return;

        var password = config["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(password)) return;

        db.Users.Add(new User
        {
            Name = "Admin",
            Email = config["Seed:AdminEmail"] ?? "admin@supportdesk.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin
        });
        db.SaveChanges();
    }
}

# Support Ticket System (.NET)

Help-desk REST API: Customers raise tickets, Agents work them, Admins manage agents.
ASP.NET Core Web API, EF Core, SQL Server, JWT, BCrypt, xUnit, optional Gemini AI triage.

## Run it

Prerequisites: .NET 8 SDK (or newer, see note below), SQL Server LocalDB (ships with Visual Studio), `dotnet tool install --global dotnet-ef`.

```powershell
cd SupportDesk.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Server=(localdb)\MSSQLLocalDB;Database=SupportDeskDb;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "Jwt:Key" "change-this-to-a-long-random-text-of-at-least-32-characters"
dotnet user-secrets set "Seed:AdminPassword" "Admin@12345"

# optional AI (without these, AI features return safe defaults / 503)
dotnet user-secrets set "Gemini:ApiKey" "YOUR_KEY"
dotnet user-secrets set "Gemini:Model" "CURRENT_MODEL_NAME"

dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

Open `https://localhost:<port>/swagger`. Seeded admin: `admin@supportdesk.local` / the password you set.

Tests (no database or internet needed): run `dotnet test` from this folder.

Note: the projects target `net8.0`. If you use a newer SDK, change `TargetFramework` in both `.csproj` files and the `Version` of the EF Core / JwtBearer packages to match.

## Endpoints

| Method and URL | Who | Purpose |
| --- | --- | --- |
| POST /api/auth/register | Anyone | Create a customer account |
| POST /api/auth/login | Anyone | Get a JWT |
| POST /api/users/agents | Admin | Create an agent |
| GET /api/users/agents | Agent, Admin | List staff |
| POST /api/tickets | Logged in | Create a ticket (AI suggests category/priority) |
| GET /api/tickets | Logged in | List with filters and paging |
| GET /api/tickets/{id} | Logged in | Details and comments |
| PATCH /api/tickets/{id}/status | Logged in | Change status (workflow rules) |
| PATCH /api/tickets/{id}/priority | Agent, Admin | Change priority |
| POST /api/tickets/{id}/assign | Agent, Admin | Assign |
| POST /api/tickets/{id}/comments | Logged in | Comment |
| POST /api/tickets/{id}/suggest-reply | Agent, Admin | AI draft reply |
| GET /api/tickets/stats | Agent, Admin | Counts by status and priority |

## Design decisions

- Status workflow: Open -> InProgress -> Resolved -> Closed, Closed is final.
- Other customers' tickets return 404, not 403, so their existence is not leaked.
- AI only suggests; its output is validated against enums, with a safe fallback.
- No comments on closed tickets. Registration always creates a Customer.

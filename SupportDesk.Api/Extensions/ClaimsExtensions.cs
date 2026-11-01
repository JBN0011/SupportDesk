using System.Security.Claims;

namespace SupportDesk.Api.Extensions;

public static class ClaimsExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirst("sub")!.Value);

    public static bool IsStaff(this ClaimsPrincipal user) =>
        user.IsInRole("Agent") || user.IsInRole("Admin");
}

using System.Security.Claims;

namespace StudienPlaner;

/// <summary>Extension methods for HttpContext to simplify common operations.</summary>
public static class HttpContextExtensions
{
    /// <summary>Extracts the authenticated user's ID from JWT claims.</summary>
    public static Guid GetUserId(this HttpContext ctx)
    {
        var sub = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? ctx.User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token.");

        return Guid.Parse(sub);
    }
}

using Microsoft.AspNetCore.Mvc;
using StudienPlaner.Models.Requests;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Auth;
using StudienPlaner.Services.Portal;

namespace StudienPlaner.Endpoints;

/// <summary>Authentication endpoints for register, login, and portal credentials.</summary>
public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", RegisterAsync)
            .WithName("Register")
            .WithSummary("Register a new user account")
            .Produces<AuthResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapPost("/login", LoginAsync)
            .WithName("Login")
            .WithSummary("Authenticate and receive JWT tokens")
            .Produces<AuthResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPost("/portal-login", PortalLoginAsync)
            .WithName("PortalLogin")
            .WithSummary("Save FH portal credentials and sync modules")
            .RequireAuthorization()
            .Produces<ModuleSyncResultDto>()
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/portal-logout", PortalLogoutAsync)
            .WithName("PortalLogout")
            .WithSummary("Clear stored FH portal credentials")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent);
    }

    private static async Task<IResult> RegisterAsync(
        [FromBody] RegisterRequest request,
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var (user, accessToken, refreshToken) = await authService.RegisterAsync(request, ct);
        SetAuthCookies(ctx, accessToken, refreshToken);
        return Results.Created($"/api/user/profile", new AuthResponse(user.Id, user.Email, accessToken));
    }

    private static async Task<IResult> LoginAsync(
        [FromBody] LoginRequest request,
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var (user, accessToken, refreshToken) = await authService.LoginAsync(request, ct);
        SetAuthCookies(ctx, accessToken, refreshToken);
        return Results.Ok(new AuthResponse(user.Id, user.Email, accessToken));
    }

    private static async Task<IResult> PortalLoginAsync(
        [FromBody] PortalLoginRequest request,
        [FromServices] AuthService authService,
        [FromServices] FhPortalService portalService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        await authService.SetPortalCredentialsAsync(userId, request.FhUsername, request.FhPassword, ct);
        var result = await portalService.SyncModulesAsync(userId, request.FhUsername, request.FhPassword, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> PortalLogoutAsync(
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        await authService.ClearPortalCredentialsAsync(userId, ct);
        return Results.NoContent();
    }

    private static void SetAuthCookies(HttpContext ctx, string accessToken, string refreshToken)
    {
        ctx.Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            MaxAge = TimeSpan.FromMinutes(15)
        });
        ctx.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            MaxAge = TimeSpan.FromDays(7)
        });
    }
}

using Microsoft.AspNetCore.Mvc;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Auth;
using StudienPlaner.Services.Portal;

namespace StudienPlaner.Endpoints;

/// <summary>Portal endpoints for syncing and retrieving FH module data.</summary>
public static class PortalEndpoints
{
    public static void MapPortalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/portal")
            .WithTags("Portal")
            .RequireAuthorization();

        group.MapPost("/sync", SyncModulesAsync)
            .WithName("SyncModules")
            .WithSummary("Sync modules from the FH portal")
            .Produces<ModuleSyncResultDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapGet("/modules", GetModulesAsync)
            .WithName("GetModules")
            .WithSummary("Get all cached modules for the authenticated user")
            .Produces<List<ModuleDto>>();

        group.MapGet("/modules/{key}", GetModuleAsync)
            .WithName("GetModule")
            .WithSummary("Get a specific cached module by key")
            .Produces<ModuleDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> SyncModulesAsync(
        [FromServices] AuthService authService,
        [FromServices] FhPortalService portalService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        var credentials = await authService.GetPortalCredentialsAsync(userId, ct);

        if (credentials is null)
            return Results.Problem("No FH portal credentials found. Please log in to the portal first.",
                statusCode: 400);

        var result = await portalService.SyncModulesAsync(userId, credentials.Value.username,
            credentials.Value.password, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetModulesAsync(
        [FromServices] FhPortalService portalService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        var modules = await portalService.GetModulesAsync(userId, ct);
        return Results.Ok(modules);
    }

    private static async Task<IResult> GetModuleAsync(
        string key,
        [FromServices] FhPortalService portalService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        var module = await portalService.GetModuleAsync(userId, key, ct);
        return module is null ? Results.NotFound() : Results.Ok(module);
    }
}

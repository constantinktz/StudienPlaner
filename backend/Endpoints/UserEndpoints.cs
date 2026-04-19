using Microsoft.AspNetCore.Mvc;
using StudienPlaner.Models.Requests;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Auth;

namespace StudienPlaner.Endpoints;

/// <summary>User profile management endpoints.</summary>
public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/user")
            .WithTags("User")
            .RequireAuthorization();

        group.MapGet("/profile", GetProfileAsync)
            .WithName("GetProfile")
            .WithSummary("Get the authenticated user's profile")
            .Produces<UserProfileDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/profile", UpdateProfileAsync)
            .WithName("UpdateProfile")
            .WithSummary("Update user profile settings")
            .Produces<UserProfileDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetProfileAsync(
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var profile = await authService.GetUserProfileAsync(ctx.GetUserId(), ct);
        return Results.Ok(profile);
    }

    private static async Task<IResult> UpdateProfileAsync(
        [FromBody] UpdateProfileRequest request,
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var profile = await authService.UpdateProfileAsync(ctx.GetUserId(), request, ct);
        return Results.Ok(profile);
    }
}

using Microsoft.AspNetCore.Mvc;
using StudienPlaner.Models.Requests;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Planner;

namespace StudienPlaner.Endpoints;

/// <summary>Study planner endpoints for managing study plans and recommendations.</summary>
public static class PlannerEndpoints
{
    public static void MapPlannerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/planner")
            .WithTags("Planner")
            .RequireAuthorization();

        group.MapGet("/studyplan", GetStudyPlanAsync)
            .WithName("GetStudyPlan")
            .WithSummary("Get the authenticated user's study plan")
            .Produces<List<StudyPlanEntryDto>>();

        group.MapPost("/studyplan", AddToStudyPlanAsync)
            .WithName("AddToStudyPlan")
            .WithSummary("Add a module to the study plan")
            .Produces<StudyPlanEntryDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapPatch("/studyplan/{id:guid}", MoveStudyPlanEntryAsync)
            .WithName("MoveStudyPlanEntry")
            .WithSummary("Move a study plan entry to a different semester")
            .Produces<StudyPlanEntryDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/studyplan/{id:guid}", DeleteStudyPlanEntryAsync)
            .WithName("DeleteStudyPlanEntry")
            .WithSummary("Delete a study plan entry")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/recommendations", GetRecommendationsAsync)
            .WithName("GetRecommendations")
            .WithSummary("Get personalized study plan recommendations")
            .Produces<List<RecommendationDto>>();

        group.MapPatch("/recommendations/{id:guid}/dismiss", DismissRecommendationAsync)
            .WithName("DismissRecommendation")
            .WithSummary("Dismiss a recommendation")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetStudyPlanAsync(
        [FromServices] PlannerService plannerService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var entries = await plannerService.GetStudyPlanAsync(ctx.GetUserId(), ct);
        return Results.Ok(entries);
    }

    private static async Task<IResult> AddToStudyPlanAsync(
        [FromBody] AddToStudyPlanRequest request,
        [FromServices] PlannerService plannerService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var entry = await plannerService.AddToStudyPlanAsync(ctx.GetUserId(), request, ct);
        return Results.Created($"/api/planner/studyplan/{entry.Id}", entry);
    }

    private static async Task<IResult> MoveStudyPlanEntryAsync(
        Guid id,
        [FromBody] MoveStudyPlanEntryRequest request,
        [FromServices] PlannerService plannerService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var entry = await plannerService.MoveEntryAsync(ctx.GetUserId(), id, request, ct);
        return Results.Ok(entry);
    }

    private static async Task<IResult> DeleteStudyPlanEntryAsync(
        Guid id,
        [FromServices] PlannerService plannerService,
        HttpContext ctx,
        CancellationToken ct)
    {
        await plannerService.DeleteEntryAsync(ctx.GetUserId(), id, ct);
        return Results.NoContent();
    }

    private static async Task<IResult> GetRecommendationsAsync(
        [FromServices] PlannerService plannerService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var recs = await plannerService.GetRecommendationsAsync(ctx.GetUserId(), ct);
        return Results.Ok(recs);
    }

    private static async Task<IResult> DismissRecommendationAsync(
        Guid id,
        [FromServices] PlannerService plannerService,
        HttpContext ctx,
        CancellationToken ct)
    {
        await plannerService.DismissRecommendationAsync(ctx.GetUserId(), id, ct);
        return Results.NoContent();
    }
}

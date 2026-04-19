using Microsoft.AspNetCore.Mvc;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Auth;
using StudienPlaner.Services.Schedule;

namespace StudienPlaner.Endpoints;

/// <summary>Schedule endpoints for retrieving FH Dortmund timetables.</summary>
public static class ScheduleEndpoints
{
    public static void MapScheduleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/schedule").WithTags("Schedule");

        group.MapGet("/courses", GetCoursesAsync)
            .WithName("GetCourses")
            .WithSummary("Get all available courses of study")
            .Produces<List<CourseOfStudyDto>>();

        group.MapGet("/mine", GetMyScheduleAsync)
            .WithName("GetMySchedule")
            .WithSummary("Get the authenticated user's schedule based on their profile")
            .RequireAuthorization()
            .Produces<ScheduleQueryResult>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapGet("/{key}/{semester:int}", GetScheduleAsync)
            .WithName("GetSchedule")
            .WithSummary("Get schedule for a specific course and semester")
            .Produces<ScheduleQueryResult>();

        group.MapGet("/mine/ical", GetMyScheduleIcalAsync)
            .WithName("GetMyScheduleIcal")
            .WithSummary("Download authenticated user's schedule as iCalendar file")
            .RequireAuthorization()
            .Produces<string>(StatusCodes.Status200OK, "text/calendar");
    }

    private static async Task<IResult> GetCoursesAsync(
        [FromServices] ScheduleService scheduleService,
        CancellationToken ct)
    {
        var courses = await scheduleService.GetCoursesAsync(ct);
        return Results.Ok(courses);
    }

    private static async Task<IResult> GetMyScheduleAsync(
        [FromServices] ScheduleService scheduleService,
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        var profile = await authService.GetUserProfileAsync(userId, ct);

        if (profile.CourseKey is null || profile.CurrentSemester is null)
            return Results.Problem("Profile is incomplete. Please set your course and semester.", statusCode: 400);

        var result = await scheduleService.GetScheduleAsync(
            profile.CourseKey, profile.CurrentSemester.Value, profile.StudentGroup, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetScheduleAsync(
        string key,
        int semester,
        [FromQuery] string? group,
        [FromServices] ScheduleService scheduleService,
        CancellationToken ct)
    {
        var result = await scheduleService.GetScheduleAsync(key, semester, group, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetMyScheduleIcalAsync(
        [FromServices] ScheduleService scheduleService,
        [FromServices] AuthService authService,
        HttpContext ctx,
        CancellationToken ct)
    {
        var userId = ctx.GetUserId();
        var profile = await authService.GetUserProfileAsync(userId, ct);

        if (profile.CourseKey is null || profile.CurrentSemester is null)
            return Results.Problem("Profile is incomplete.", statusCode: 400);

        var ical = await scheduleService.GetScheduleIcalAsync(
            profile.CourseKey, profile.CurrentSemester.Value, profile.StudentGroup, ct);

        return Results.File(
            System.Text.Encoding.UTF8.GetBytes(ical),
            "text/calendar",
            $"stundenplan_{profile.CourseKey}_sem{profile.CurrentSemester}.ics"
        );
    }
}

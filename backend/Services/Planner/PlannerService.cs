using Microsoft.EntityFrameworkCore;
using StudienPlaner.Database;
using StudienPlaner.Database.Entities;
using StudienPlaner.Models.Requests;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Portal;
using StudienPlaner.Services.Schedule;

namespace StudienPlaner.Services.Planner;

/// <summary>Manages study plan entries and recommendations for users.</summary>
public class PlannerService(
    AppDbContext db,
    FhPortalService portalService,
    ScheduleService scheduleService,
    RecommendationEngine recommendationEngine,
    ILogger<PlannerService> logger)
{
    /// <summary>Returns all study plan entries for a user.</summary>
    public async Task<List<StudyPlanEntryDto>> GetStudyPlanAsync(Guid userId, CancellationToken ct = default)
    {
        var entries = await db.StudyPlanEntries
            .Where(e => e.UserId == userId)
            .OrderBy(e => e.PlannedSemester)
            .ToListAsync(ct);

        return entries.Select(ToDto).ToList();
    }

    /// <summary>Adds a module to a user's study plan.</summary>
    public async Task<StudyPlanEntryDto> AddToStudyPlanAsync(
        Guid userId, AddToStudyPlanRequest request, CancellationToken ct = default)
    {
        var existing = await db.StudyPlanEntries
            .FirstOrDefaultAsync(e => e.UserId == userId && e.ModuleKey == request.ModuleKey, ct);

        if (existing is not null)
            throw new InvalidOperationException($"Module '{request.ModuleKey}' is already in your study plan.");

        var entry = new StudyPlanEntryEntity
        {
            UserId = userId,
            ModuleKey = request.ModuleKey,
            PlannedSemester = request.PlannedSemester,
            IsRecommended = false
        };

        db.StudyPlanEntries.Add(entry);
        await db.SaveChangesAsync(ct);

        return ToDto(entry);
    }

    /// <summary>Moves a study plan entry to a different semester.</summary>
    public async Task<StudyPlanEntryDto> MoveEntryAsync(
        Guid userId, Guid entryId, MoveStudyPlanEntryRequest request, CancellationToken ct = default)
    {
        var entry = await db.StudyPlanEntries
            .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Study plan entry not found.");

        entry.PlannedSemester = request.NewSemester;
        await db.SaveChangesAsync(ct);
        return ToDto(entry);
    }

    /// <summary>Deletes a study plan entry.</summary>
    public async Task DeleteEntryAsync(Guid userId, Guid entryId, CancellationToken ct = default)
    {
        var entry = await db.StudyPlanEntries
            .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Study plan entry not found.");

        db.StudyPlanEntries.Remove(entry);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Returns active (non-dismissed) recommendations sorted by priority descending.</summary>
    public async Task<List<RecommendationDto>> GetRecommendationsAsync(
        Guid userId, CancellationToken ct = default)
    {
        // Regenerate recommendations from current data
        await RegenerateRecommendationsAsync(userId, ct);

        var recommendations = await db.Recommendations
            .Where(r => r.UserId == userId && !r.IsDismissed)
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => r.GeneratedAt)
            .ToListAsync(ct);

        return recommendations.Select(r => new RecommendationDto(
            r.Id, r.Type, r.ModuleKey, r.Message, r.Priority, r.GeneratedAt
        )).ToList();
    }

    /// <summary>Dismisses a recommendation so it is no longer shown.</summary>
    public async Task DismissRecommendationAsync(
        Guid userId, Guid recommendationId, CancellationToken ct = default)
    {
        var rec = await db.Recommendations
            .FirstOrDefaultAsync(r => r.Id == recommendationId && r.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Recommendation not found.");

        rec.IsDismissed = true;
        await db.SaveChangesAsync(ct);
    }

    private async Task RegenerateRecommendationsAsync(Guid userId, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return;

        var modules = await portalService.GetModulesAsync(userId, ct);
        if (modules.Count == 0) return;

        List<ScheduleEventDto> schedule = [];
        if (user.CourseKey is not null && user.CurrentSemester is not null)
        {
            try
            {
                var result = await scheduleService.GetScheduleAsync(
                    user.CourseKey, user.CurrentSemester.Value, user.StudentGroup, ct);
                schedule = [.. result.Events];
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not load schedule for recommendation generation");
            }
        }

        var currentSemester = user.CurrentSemester ?? 1;
        var newRecs = recommendationEngine.GenerateRecommendations(modules, schedule, currentSemester, userId);

        // Remove old non-dismissed, re-add fresh ones
        var old = db.Recommendations.Where(r => r.UserId == userId && !r.IsDismissed);
        db.Recommendations.RemoveRange(old);
        db.Recommendations.AddRange(newRecs);
        await db.SaveChangesAsync(ct);
    }

    private static StudyPlanEntryDto ToDto(StudyPlanEntryEntity e) =>
        new(e.Id, e.ModuleKey, e.PlannedSemester, e.IsRecommended, e.RecommendationReason);
}

using StudienPlaner.Database.Entities;
using StudienPlaner.Models.Responses;

namespace StudienPlaner.Services.Planner;

/// <summary>Generates study plan recommendations based on module status and schedule.</summary>
public class RecommendationEngine(ILogger<RecommendationEngine> logger)
{
    /// <summary>Generates recommendations for a student based on their modules and current schedule.</summary>
    public List<RecommendationEntity> GenerateRecommendations(
        List<ModuleDto> allModules,
        List<ScheduleEventDto> currentSchedule,
        int currentSemester,
        Guid userId)
    {
        var recommendations = new List<RecommendationEntity>();

        // Helper: check if a module has a matching schedule event
        bool HasScheduleEvent(ModuleDto module) =>
            currentSchedule.Any(e =>
                e.Title.Contains(module.ModuleName, StringComparison.OrdinalIgnoreCase) ||
                e.Title.Contains(module.ModuleKey, StringComparison.OrdinalIgnoreCase));

        bool AllPrerequisitesPassed(ModuleDto module) =>
            module.Prerequisites.All(prereqKey =>
                allModules.Any(m => m.ModuleKey == prereqKey && m.Status == ModuleStatus.Passed));

        // Rule 1 – PullForward
        foreach (var module in allModules.Where(m =>
            m.Status == ModuleStatus.Open &&
            m.SemesterPlanned > currentSemester &&
            AllPrerequisitesPassed(m) &&
            HasScheduleEvent(m)))
        {
            recommendations.Add(new RecommendationEntity
            {
                UserId = userId,
                Type = RecommendationType.PullForward,
                ModuleKey = module.ModuleKey,
                Message = $"'{module.ModuleName}' is offered this semester and all prerequisites are complete. " +
                          "Consider pulling it forward to reduce future workload.",
                Priority = 1
            });
        }

        // Rule 2 – RetryNow
        foreach (var module in allModules.Where(m =>
            m.Status == ModuleStatus.Failed && HasScheduleEvent(m)))
        {
            recommendations.Add(new RecommendationEntity
            {
                UserId = userId,
                Type = RecommendationType.RetryNow,
                ModuleKey = module.ModuleKey,
                Message = $"'{module.ModuleName}' is currently offered and you have a failed attempt. " +
                          "This semester is a great time to retry.",
                Priority = 2
            });
        }

        // Rule 3 – RetryLater
        foreach (var module in allModules.Where(m =>
            m.Status == ModuleStatus.Failed && !HasScheduleEvent(m)))
        {
            recommendations.Add(new RecommendationEntity
            {
                UserId = userId,
                Type = RecommendationType.RetryLater,
                ModuleKey = module.ModuleKey,
                Message = $"'{module.ModuleName}' was failed but is not offered this semester. " +
                          "Plan to retry it next semester.",
                Priority = 1
            });
        }

        // Rule 4 – MissingMandatory
        foreach (var module in allModules.Where(m =>
            m.IsMandatory &&
            m.SemesterPlanned == currentSemester &&
            m.Status == ModuleStatus.Open &&
            !HasScheduleEvent(m)))
        {
            recommendations.Add(new RecommendationEntity
            {
                UserId = userId,
                Type = RecommendationType.MissingMandatory,
                ModuleKey = module.ModuleKey,
                Message = $"'{module.ModuleName}' is a mandatory module for semester {currentSemester} " +
                          "but has no matching schedule entry. Please check with your faculty.",
                Priority = 2
            });
        }

        // Rule 5 – OverloadWarning
        var enrolledCredits = allModules
            .Where(m => m.Status == ModuleStatus.Enrolled || m.Status == ModuleStatus.Planned)
            .Sum(m => m.Credits);

        if (enrolledCredits > 36)
        {
            recommendations.Add(new RecommendationEntity
            {
                UserId = userId,
                Type = RecommendationType.OverloadWarning,
                Message = $"Your current semester load is {enrolledCredits} ECTS, which exceeds the recommended " +
                          "maximum of 36. Consider removing some modules to avoid burnout.",
                Priority = 1
            });
        }

        // Rule 6 – UnderloadWarning
        if (enrolledCredits < 18 && enrolledCredits > 0)
        {
            recommendations.Add(new RecommendationEntity
            {
                UserId = userId,
                Type = RecommendationType.UnderloadWarning,
                Message = $"Your current semester load is only {enrolledCredits} ECTS. " +
                          "Consider enrolling in more modules to stay on track for graduation.",
                Priority = 1
            });
        }

        logger.LogInformation("Generated {Count} recommendations for user {UserId}",
            recommendations.Count, userId);

        return recommendations;
    }
}

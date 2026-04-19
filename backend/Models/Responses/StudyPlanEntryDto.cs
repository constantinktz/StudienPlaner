namespace StudienPlaner.Models.Responses;

/// <summary>A study plan entry DTO.</summary>
public record StudyPlanEntryDto(
    Guid Id,
    string ModuleKey,
    int PlannedSemester,
    bool IsRecommended,
    string? RecommendationReason
);

using StudienPlaner.Database.Entities;

namespace StudienPlaner.Models.Responses;

/// <summary>A recommendation for the student's study plan.</summary>
public record RecommendationDto(
    Guid Id,
    RecommendationType Type,
    string? ModuleKey,
    string Message,
    int Priority,
    DateTime GeneratedAt
);

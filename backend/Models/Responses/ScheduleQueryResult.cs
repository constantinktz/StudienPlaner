namespace StudienPlaner.Models.Responses;

/// <summary>Result of a schedule query.</summary>
public record ScheduleQueryResult(
    string CourseKey,
    int Semester,
    string? Group,
    IReadOnlyList<ScheduleEventDto> Events,
    DateTime CachedAt
);

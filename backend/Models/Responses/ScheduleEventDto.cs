namespace StudienPlaner.Models.Responses;

/// <summary>A single event/lecture in the schedule.</summary>
public record ScheduleEventDto(
    string Title,
    string? Room,
    string? Lecturer,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? EventType
);

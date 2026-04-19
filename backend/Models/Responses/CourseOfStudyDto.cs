namespace StudienPlaner.Models.Responses;

/// <summary>A course of study offered at FH Dortmund.</summary>
public record CourseOfStudyDto(
    string Key,
    string Name,
    string Faculty
);

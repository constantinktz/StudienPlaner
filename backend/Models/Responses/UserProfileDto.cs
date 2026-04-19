namespace StudienPlaner.Models.Responses;

/// <summary>User profile information.</summary>
public record UserProfileDto(
    Guid Id,
    string Email,
    string MatrikelNumber,
    string? CourseKey,
    int? CurrentSemester,
    string? StudentGroup,
    bool HasPortalCredentials,
    DateTime CreatedAt
);

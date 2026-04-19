namespace StudienPlaner.Models.Requests;

/// <summary>Request body for updating user profile information.</summary>
public record UpdateProfileRequest(
    string? CourseKey,
    int? CurrentSemester,
    string? StudentGroup
);

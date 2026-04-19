using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Models.Requests;

/// <summary>Request body for moving a study plan entry to a different semester.</summary>
public record MoveStudyPlanEntryRequest(
    [Range(1, 12)] int NewSemester
);

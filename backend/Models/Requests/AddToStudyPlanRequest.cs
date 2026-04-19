using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Models.Requests;

/// <summary>Request body for adding a module to the study plan.</summary>
public record AddToStudyPlanRequest(
    [Required] string ModuleKey,
    [Range(1, 12)] int PlannedSemester
);

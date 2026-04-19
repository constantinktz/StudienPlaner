using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Database.Entities;

/// <summary>An entry in a student's personal study plan.</summary>
public class StudyPlanEntryEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    [Required, MaxLength(100)]
    public string ModuleKey { get; set; } = "";

    public int PlannedSemester { get; set; }

    public bool IsRecommended { get; set; }

    [MaxLength(512)]
    public string? RecommendationReason { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Database.Entities;

/// <summary>Type of recommendation generated for a student.</summary>
public enum RecommendationType
{
    PullForward,
    RetryNow,
    RetryLater,
    MissingMandatory,
    OverloadWarning,
    UnderloadWarning
}

/// <summary>An AI-generated recommendation for a student's study plan.</summary>
public class RecommendationEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    public RecommendationType Type { get; set; }

    [MaxLength(100)]
    public string? ModuleKey { get; set; }

    [Required]
    public string Message { get; set; } = "";

    /// <summary>Priority level: 0=low, 1=medium, 2=high.</summary>
    public int Priority { get; set; }

    public bool IsDismissed { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

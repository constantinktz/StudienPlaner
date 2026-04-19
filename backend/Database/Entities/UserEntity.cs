using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Database.Entities;

/// <summary>Represents a registered user in the system.</summary>
public class UserEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(256)]
    public string Email { get; set; } = "";

    [Required]
    public string PasswordHash { get; set; } = "";

    [Required, MaxLength(20)]
    public string MatrikelNumber { get; set; } = "";

    [MaxLength(50)]
    public string? CourseKey { get; set; }

    public int? CurrentSemester { get; set; }

    [MaxLength(50)]
    public string? StudentGroup { get; set; }

    /// <summary>AES-GCM encrypted FH portal username.</summary>
    public string? FhUsernameEnc { get; set; }

    /// <summary>AES-GCM encrypted FH portal password.</summary>
    public string? FhPasswordEnc { get; set; }

    /// <summary>Initialization vector used for FH credential encryption.</summary>
    public string? FhIv { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public ICollection<ModuleCacheEntity> ModuleCache { get; set; } = [];
    public ICollection<StudyPlanEntryEntity> StudyPlanEntries { get; set; } = [];
    public ICollection<RecommendationEntity> Recommendations { get; set; } = [];
}

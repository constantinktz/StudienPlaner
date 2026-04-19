using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Database.Entities;

/// <summary>Status of a module in the student's academic record.</summary>
public enum ModuleStatus
{
    Open,
    Enrolled,
    Passed,
    Failed,
    Planned
}

/// <summary>Cached module data scraped from the FH portal.</summary>
public class ModuleCacheEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    [Required, MaxLength(100)]
    public string ModuleKey { get; set; } = "";

    [Required, MaxLength(256)]
    public string ModuleName { get; set; } = "";

    public int Credits { get; set; }

    public ModuleStatus Status { get; set; } = ModuleStatus.Open;

    public double? Grade { get; set; }

    public int? SemesterPlanned { get; set; }

    public int? SemesterTaken { get; set; }

    public int AttemptCount { get; set; }

    public bool IsMandatory { get; set; }

    /// <summary>JSON-serialized list of prerequisite module keys.</summary>
    public string Prerequisites { get; set; } = "[]";

    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}

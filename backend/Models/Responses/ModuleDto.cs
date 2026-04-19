using StudienPlaner.Database.Entities;

namespace StudienPlaner.Models.Responses;

/// <summary>Module information from the FH portal cache.</summary>
public record ModuleDto(
    string ModuleKey,
    string ModuleName,
    int Credits,
    ModuleStatus Status,
    double? Grade,
    int? SemesterPlanned,
    int? SemesterTaken,
    int AttemptCount,
    bool IsMandatory,
    List<string> Prerequisites,
    DateTime SyncedAt
);

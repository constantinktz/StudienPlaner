namespace StudienPlaner.Models.Responses;

/// <summary>Result of a module sync operation from the FH portal.</summary>
public record ModuleSyncResultDto(
    int TotalModules,
    int NewModules,
    int UpdatedModules,
    DateTime SyncedAt,
    string? Error
);

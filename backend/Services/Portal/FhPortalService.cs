using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StudienPlaner.Database;
using StudienPlaner.Database.Entities;
using StudienPlaner.Models.Responses;

namespace StudienPlaner.Services.Portal;

/// <summary>Manages FH portal module synchronization and retrieval.</summary>
public class FhPortalService(
    AppDbContext db,
    FhPortalScraper scraper,
    ILogger<FhPortalService> logger)
{
    /// <summary>Syncs modules from the FH portal for a user.</summary>
    public async Task<ModuleSyncResultDto> SyncModulesAsync(
        Guid userId, string fhUsername, string fhPassword, CancellationToken ct = default)
    {
        List<ModuleDto> scraped;
        try
        {
            scraped = await scraper.ScrapeModulesAsync(fhUsername, fhPassword, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scraping failed for user {UserId}", userId);
            return new ModuleSyncResultDto(0, 0, 0, DateTime.UtcNow, ex.Message);
        }

        var newCount = 0;
        var updatedCount = 0;

        foreach (var module in scraped)
        {
            var existing = await db.ModuleCache
                .FirstOrDefaultAsync(m => m.UserId == userId && m.ModuleKey == module.ModuleKey, ct);

            if (existing is null)
            {
                db.ModuleCache.Add(new ModuleCacheEntity
                {
                    UserId = userId,
                    ModuleKey = module.ModuleKey,
                    ModuleName = module.ModuleName,
                    Credits = module.Credits,
                    Status = module.Status,
                    Grade = module.Grade,
                    SemesterPlanned = module.SemesterPlanned,
                    SemesterTaken = module.SemesterTaken,
                    AttemptCount = module.AttemptCount,
                    IsMandatory = module.IsMandatory,
                    Prerequisites = JsonSerializer.Serialize(module.Prerequisites),
                    SyncedAt = DateTime.UtcNow
                });
                newCount++;
            }
            else
            {
                existing.ModuleName = module.ModuleName;
                existing.Credits = module.Credits;
                existing.Status = module.Status;
                existing.Grade = module.Grade;
                existing.SemesterTaken = module.SemesterTaken;
                existing.AttemptCount = module.AttemptCount;
                existing.Prerequisites = JsonSerializer.Serialize(module.Prerequisites);
                existing.SyncedAt = DateTime.UtcNow;
                updatedCount++;
            }
        }

        await db.SaveChangesAsync(ct);

        return new ModuleSyncResultDto(
            scraped.Count,
            newCount,
            updatedCount,
            DateTime.UtcNow,
            null
        );
    }

    /// <summary>Returns all cached modules for a user.</summary>
    public async Task<List<ModuleDto>> GetModulesAsync(Guid userId, CancellationToken ct = default)
    {
        var entities = await db.ModuleCache
            .Where(m => m.UserId == userId)
            .ToListAsync(ct);

        return entities.Select(ToDto).ToList();
    }

    /// <summary>Returns a single cached module for a user by module key.</summary>
    public async Task<ModuleDto?> GetModuleAsync(Guid userId, string moduleKey, CancellationToken ct = default)
    {
        var entity = await db.ModuleCache
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ModuleKey == moduleKey, ct);

        return entity is null ? null : ToDto(entity);
    }

    private static ModuleDto ToDto(ModuleCacheEntity entity)
    {
        List<string> prerequisites;
        try
        {
            prerequisites = JsonSerializer.Deserialize<List<string>>(entity.Prerequisites) ?? [];
        }
        catch
        {
            prerequisites = [];
        }

        return new ModuleDto(
            entity.ModuleKey,
            entity.ModuleName,
            entity.Credits,
            entity.Status,
            entity.Grade,
            entity.SemesterPlanned,
            entity.SemesterTaken,
            entity.AttemptCount,
            entity.IsMandatory,
            prerequisites,
            entity.SyncedAt
        );
    }
}

using Microsoft.EntityFrameworkCore;
using StudienPlaner.Database.Entities;

namespace StudienPlaner.Database;

/// <summary>Entity Framework database context for StudienPlaner.</summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<ModuleCacheEntity> ModuleCache => Set<ModuleCacheEntity>();
    public DbSet<StudyPlanEntryEntity> StudyPlanEntries => Set<StudyPlanEntryEntity>();
    public DbSet<RecommendationEntity> Recommendations => Set<RecommendationEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.MatrikelNumber).IsUnique();
        });

        modelBuilder.Entity<ModuleCacheEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.ModuleKey }).IsUnique();
            entity.Property(e => e.Status)
                  .HasConversion<string>();
            entity.HasOne(e => e.User)
                  .WithMany(u => u.ModuleCache)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StudyPlanEntryEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.StudyPlanEntries)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RecommendationEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type)
                  .HasConversion<string>();
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Recommendations)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

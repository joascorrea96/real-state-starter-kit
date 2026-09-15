using Core.Domain.Common;
using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Core.Infrastructure.Data;

/// <summary>
/// Single DbContext for the whole platform (all verticals). Each module
/// (Modules.Gym, Modules.RealState...) registers its own entities here
/// via extension methods in OnModelCreating, keeping Core independent
/// from the specific modules.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Every vertical module (Modules.RealState, Modules.Gym, ...)
        // ships its own IEntityTypeConfiguration<T> classes. We discover
        // them here by scanning loaded assemblies whose name starts with
        // "Modules.", instead of Core.Infrastructure referencing each
        // module directly — that's what keeps Core independent from
        // every vertical. This MUST run before the soft-delete loop
        // below, otherwise module entities (e.g. Property) wouldn't be
        // registered in the model yet and would miss the global filter.
        var moduleAssemblies = AppDomain.CurrentDomain.GetAssemblies()
            .Where(a => a.GetName().Name?.StartsWith("Modules.") == true);

        foreach (var assembly in moduleAssemblies)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(assembly);
        }

        // Automatically applies a global "WHERE IsDeleted = false" filter
        // to EVERY entity that inherits from BaseEntity, so no module has
        // to remember to filter out deleted records manually.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(AppDbContext)
                    .GetMethod(nameof(SetSoftDeleteFilter),
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
                    .MakeGenericMethod(entityType.ClrType);

                method.Invoke(null, new object[] { modelBuilder });
            }
        }

        modelBuilder.Entity<User>()
            .HasOne(u => u.Company)
            .WithMany(c => c.Users)
            .HasForeignKey(u => u.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Company>().HasIndex(c => c.Slug).IsUnique();
    }

    private static void SetSoftDeleteFilter<T>(ModelBuilder modelBuilder) where T : BaseEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
    }
}

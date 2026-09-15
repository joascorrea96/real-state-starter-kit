using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Modules.RealState.Entities;

namespace Modules.RealState.Persistence;

/// <summary>
/// Picked up automatically by AppDbContext via ApplyConfigurationsFromAssembly
/// — Core.Infrastructure never needs to know this type exists. This is the
/// pattern every module follows to plug its own entities into the shared
/// DbContext without Core referencing the module.
/// </summary>
public class PropertyConfiguration : IEntityTypeConfiguration<Property>
{
    public void Configure(EntityTypeBuilder<Property> builder)
    {
        builder.ToTable("Properties");

        builder.Property(p => p.Title).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Price).HasColumnType("decimal(14,2)");
        builder.Property(p => p.CondoFee).HasColumnType("decimal(14,2)");
        builder.Property(p => p.AreaSqm).HasColumnType("decimal(10,2)");

        // Indexes that matter for a property listing/search page.
        builder.HasIndex(p => p.CompanyId);
        builder.HasIndex(p => p.City);
        builder.HasIndex(p => p.Neighborhood);
        builder.HasIndex(p => p.Price);
        builder.HasIndex(p => p.Type);
    }
}

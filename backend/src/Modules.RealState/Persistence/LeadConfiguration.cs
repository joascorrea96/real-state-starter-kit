using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Modules.RealState.Entities;

namespace Modules.RealState.Persistence;

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.ToTable("Leads");

        builder.Property(l => l.Name).HasMaxLength(200).IsRequired();
        builder.Property(l => l.Phone).HasMaxLength(30).IsRequired();

        builder.HasOne(l => l.Property)
            .WithMany()
            .HasForeignKey(l => l.PropertyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(l => l.CompanyId);
        builder.HasIndex(l => l.PropertyId);
        builder.HasIndex(l => l.Status);
    }
}

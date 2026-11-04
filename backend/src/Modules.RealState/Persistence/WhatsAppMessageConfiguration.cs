using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Modules.RealState.Entities;

namespace Modules.RealState.Persistence;

public class WhatsAppMessageConfiguration : IEntityTypeConfiguration<WhatsAppMessage>
{
    public void Configure(EntityTypeBuilder<WhatsAppMessage> builder)
    {
        builder.ToTable("WhatsAppMessages");
        builder.HasKey(m => m.Id);
        builder.HasIndex(m => m.CompanyId);
        builder.HasIndex(m => m.LeadId);
        builder.HasIndex(m => m.Phone);

        builder.HasOne(m => m.Lead)
            .WithMany()
            .HasForeignKey(m => m.LeadId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

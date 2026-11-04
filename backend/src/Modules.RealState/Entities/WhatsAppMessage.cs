using Core.Domain.Common;

namespace Modules.RealState.Entities;

public class WhatsAppMessage : TenantEntity
{
    public Guid? LeadId { get; set; }
    public string RemoteJid { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool FromMe { get; set; }
    public string? SenderName { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string MessageType { get; set; } = "conversation";
    public string? MediaUrl { get; set; }
    public string Status { get; set; } = "SENT";
    public string? ExternalId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Lead? Lead { get; set; }
}

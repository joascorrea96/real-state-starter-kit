using Core.Domain.Common;
using Core.Domain.Entities;

namespace Modules.RealState.Entities;

/// <summary>
/// A contact captured from the public site — either from a specific
/// property's "I'm interested" / "schedule a visit" form, or a general
/// contact form. This is the whole point of having a public site at all:
/// every lead here is a potential sale for the client company, and shows
/// up in their admin panel to follow up on.
/// </summary>
public class Lead : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Message { get; set; }

    /// <summary>Null for a general "contact us" lead, not tied to one listing.</summary>
    public Guid? PropertyId { get; set; }

    public LeadStatus Status { get; set; } = LeadStatus.New;

    public Guid? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }

    public Property? Property { get; set; }
}

public enum LeadStatus
{
    New = 0,
    Contacted = 1,
    Qualified = 2,
    Lost = 3,
    Converted = 4,
}

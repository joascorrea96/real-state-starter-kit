using Core.Domain.Common;

namespace Core.Domain.Entities;

/// <summary>
/// Generic customer record — every gym, real estate agency, restaurant or
/// shop needs this. Vertical-specific modules (e.g. Member in the gym
/// module) can reference this Customer and add their own fields in a
/// related table, instead of duplicating name/email/phone/address in
/// every module.
/// </summary>
public class Customer : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? TaxId { get; set; }

    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }

    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}

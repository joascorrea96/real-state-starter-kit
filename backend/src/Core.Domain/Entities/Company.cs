using Core.Domain.Common;

namespace Core.Domain.Entities;

/// <summary>
/// Represents each client company (gym, real estate agency, restaurant,
/// etc.) that has purchased one of the systems. One row here = one signed
/// contract.
/// </summary>
public class Company : BaseEntity
{
    public string LegalName { get; set; } = string.Empty;
    public string TradeName { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }

    /// <summary>
    /// URL-friendly public identifier (e.g. "demo-imoveis"), used by the
    /// public-facing site to resolve which company's data to show without
    /// any login — e.g. GET /api/public/demo-imoveis/properties. Never
    /// expose the raw Company Id in a public URL.
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Which vertical this client uses: Gym, RealState, Restaurants,
    /// Commercial, Others. Used to decide which modules/screens to enable
    /// for this company.
    /// </summary>
    public string Vertical { get; set; } = string.Empty;

    /// <summary>
    /// Basic visual customization (white-label) — logo, primary color, etc.
    /// Stored as JSON so no migration is needed every time something
    /// visual changes.
    /// </summary>
    public string? SettingsJson { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<User> Users { get; set; } = new List<User>();
}

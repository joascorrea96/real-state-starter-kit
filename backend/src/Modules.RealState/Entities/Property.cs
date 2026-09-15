using Core.Domain.Common;

namespace Modules.RealState.Entities;

/// <summary>
/// The pillar entity for the real estate vertical: every real estate
/// agency needs a property catalog with search, filters and pagination.
/// Inherits TenantEntity so it's automatically scoped to the owning
/// company by GenericService&lt;T&gt; — no extra code needed for that.
/// </summary>
public class Property : TenantEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public PropertyType Type { get; set; }
    public ListingType ListingType { get; set; } = ListingType.ForSale;
    public PropertyStatus Status { get; set; } = PropertyStatus.Available;

    public decimal Price { get; set; }

    /// <summary>Monthly condo fee, only relevant for apartments/commercial units.</summary>
    public decimal? CondoFee { get; set; }

    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int ParkingSpots { get; set; }
    public decimal AreaSqm { get; set; }

    public string Address { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string? ZipCode { get; set; }

    /// <summary>
    /// Native Postgres text[] array via Npgsql — no value converter needed.
    /// </summary>
    public List<string> ImageUrls { get; set; } = new();

    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
}

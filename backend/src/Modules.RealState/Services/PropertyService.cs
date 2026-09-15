using Core.Application.Services;
using Core.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Modules.RealState.Entities;

namespace Modules.RealState.Services;

/// <summary>
/// Everything the Core base class doesn't know how to do on its own:
/// which fields to search, and how to interpret this vertical's specific
/// filters (price range, property type, listing type, bedrooms...).
/// This is the whole point of the Core + Modules split — the pagination,
/// soft-delete and tenant-scoping logic in GenericService is not repeated
/// here at all.
/// </summary>
public class PropertyService : GenericService<Property>
{
    public PropertyService(IGenericRepository<Property> repository) : base(repository) { }

    protected override IQueryable<Property> ApplySearch(IQueryable<Property> query, string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm)) return query;

        var term = searchTerm.Trim();
        return query.Where(p =>
            EF.Functions.ILike(p.Title, $"%{term}%") ||
            (p.Description != null && EF.Functions.ILike(p.Description, $"%{term}%")) ||
            EF.Functions.ILike(p.Neighborhood, $"%{term}%") ||
            EF.Functions.ILike(p.City, $"%{term}%"));
    }

    protected override IQueryable<Property> ApplyPublicVisibilityFilter(IQueryable<Property> query)
        => query.Where(p => p.IsActive && p.Status != PropertyStatus.Paused);

    protected override IQueryable<Property> ApplyCustomFilters(IQueryable<Property> query, Dictionary<string, string>? filters)
    {
        if (filters is null || filters.Count == 0) return query;

        if (filters.TryGetValue("minPrice", out var minPriceRaw) && decimal.TryParse(minPriceRaw, out var minPrice))
            query = query.Where(p => p.Price >= minPrice);

        if (filters.TryGetValue("maxPrice", out var maxPriceRaw) && decimal.TryParse(maxPriceRaw, out var maxPrice))
            query = query.Where(p => p.Price <= maxPrice);

        if (filters.TryGetValue("propertyType", out var typeRaw) && Enum.TryParse<PropertyType>(typeRaw, true, out var propertyType))
            query = query.Where(p => p.Type == propertyType);

        if (filters.TryGetValue("listingType", out var listingRaw) && Enum.TryParse<ListingType>(listingRaw, true, out var listingType))
            query = query.Where(p => p.ListingType == listingType);

        if (filters.TryGetValue("city", out var city) && !string.IsNullOrWhiteSpace(city))
            query = query.Where(p => EF.Functions.ILike(p.City, city));

        if (filters.TryGetValue("neighborhood", out var neighborhood) && !string.IsNullOrWhiteSpace(neighborhood))
            query = query.Where(p => EF.Functions.ILike(p.Neighborhood, neighborhood));

        if (filters.TryGetValue("minBedrooms", out var minBedroomsRaw) && int.TryParse(minBedroomsRaw, out var minBedrooms))
            query = query.Where(p => p.Bedrooms >= minBedrooms);

        if (filters.TryGetValue("isFeatured", out var isFeaturedRaw) && bool.TryParse(isFeaturedRaw, out var isFeatured))
            query = query.Where(p => p.IsFeatured == isFeatured);

        if (filters.TryGetValue("status", out var statusRaw) && Enum.TryParse<PropertyStatus>(statusRaw, true, out var propertyStatus))
            query = query.Where(p => p.Status == propertyStatus);

        return query;
    }
}

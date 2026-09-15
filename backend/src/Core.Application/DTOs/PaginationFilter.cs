namespace Core.Application.DTOs;

/// <summary>
/// Standard parameters that ANY listing screen in the system sends to the
/// backend, via query string, e.g.:
/// GET /api/customers?pageNumber=1&amp;pageSize=10&amp;searchTerm=john&amp;sortBy=name&amp;sortDescending=false
/// </summary>
public class PaginationFilter
{
    private const int MaxPageSize = 100;
    private int _pageSize = 10;

    public int PageNumber { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 10 : value);
    }

    /// <summary>Free-text search (applied to the fields each module defines).</summary>
    public string? SearchTerm { get; set; }

    /// <summary>Field name to sort by, e.g. "name", "price", "createdAt".</summary>
    public string? SortBy { get; set; }

    public bool SortDescending { get; set; } = false;

    /// <summary>
    /// Extra filters specific to each module (e.g. neighborhood, price
    /// range, property type). Passed as a free dictionary so we don't
    /// need a new filter class for every screen — each module decides
    /// how to interpret it.
    /// </summary>
    public Dictionary<string, string>? Filters { get; set; }
}

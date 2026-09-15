namespace Core.Application.DTOs;

/// <summary>
/// Standard response envelope for ANY listing in the system (customers,
/// properties, products, menu items...). The Angular front end always
/// receives this same shape, so the table/pagination component in
/// Angular is also unique and reusable.
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

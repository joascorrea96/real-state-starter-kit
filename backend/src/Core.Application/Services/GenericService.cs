using Core.Application.DTOs;
using Core.Application.Interfaces;
using Core.Domain.Common;
using Core.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;

namespace Core.Application.Services;

/// <summary>
/// Base implementation of CRUD + paged/searchable/sortable listing. Every
/// "pillar" entity (Customer, Property, Product, Member, MenuItem...)
/// inherits from this. This is where the pagination/search/filter logic
/// lives — without this base class you'd rewrite it in each of the 5
/// systems.
/// </summary>
public class GenericService<T> : IGenericService<T> where T : TenantEntity
{
    protected readonly IGenericRepository<T> Repository;

    public GenericService(IGenericRepository<T> repository)
    {
        Repository = repository;
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, bool publicOnly = false)
    {
        var query = Repository.Query().Where(e => e.Id == id && !e.IsDeleted);

        if (publicOnly)
            query = ApplyPublicVisibilityFilter(query);

        return await query.FirstOrDefaultAsync();
    }

    // PagedResult is fully qualified here on purpose: System.Linq.Dynamic.Core
    // also ships its own PagedResult<T> type, so an unqualified reference is
    // ambiguous as soon as both usings are present in the same file.
    public virtual async Task<Core.Application.DTOs.PagedResult<T>> GetPagedAsync(PaginationFilter filter, Guid companyId, bool publicOnly = false)
    {
        var query = Repository.Query()
            .Where(e => !e.IsDeleted && e.CompanyId == companyId);

        if (publicOnly)
            query = ApplyPublicVisibilityFilter(query);

        query = ApplySearch(query, filter.SearchTerm);
        query = ApplyCustomFilters(query, filter.Filters);

        var totalCount = await query.CountAsync();

        if (!string.IsNullOrWhiteSpace(filter.SortBy) && IsSortableProperty(filter.SortBy))
        {
            var direction = filter.SortDescending ? "descending" : "ascending";
            query = query.OrderBy($"{filter.SortBy} {direction}");
        }
        else
        {
            query = query.OrderByDescending(e => e.CreatedAt);
        }

        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new Core.Application.DTOs.PagedResult<T>
        {
            Items = items,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalCount = totalCount
        };
    }

    public virtual async Task<T> CreateAsync(T entity, Guid companyId)
    {
        entity.CompanyId = companyId;
        entity.CreatedAt = DateTime.UtcNow;
        await Repository.AddAsync(entity);
        await Repository.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        Repository.Update(entity);
        await Repository.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(Guid id)
    {
        var entity = await Repository.GetByIdAsync(id);
        if (entity is null) return;

        // Soft delete — the client company's history is never lost
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        Repository.Update(entity);
        await Repository.SaveChangesAsync();
    }

    /// <summary>
    /// Each module overrides this to say which fields the free-text
    /// search should look into. E.g. CustomerService searches
    /// Name/Email/Phone; PropertyService searches Title/Neighborhood/Address.
    /// </summary>
    protected virtual IQueryable<T> ApplySearch(IQueryable<T> query, string? searchTerm)
        => query;

    /// <summary>
    /// Each module overrides this to handle its own specific filters
    /// (e.g. price range, property type, menu category).
    /// </summary>
    protected virtual IQueryable<T> ApplyCustomFilters(IQueryable<T> query, Dictionary<string, string>? filters)
        => query;

    /// <summary>
    /// Each module overrides this to hide records that shouldn't be
    /// visible to unauthenticated public visitors, even though they're
    /// not deleted (e.g. Property.IsActive == false — a draft/sold
    /// listing the company isn't ready to publish). No-op by default:
    /// modules without a "public site" concept never need it.
    /// </summary>
    protected virtual IQueryable<T> ApplyPublicVisibilityFilter(IQueryable<T> query)
        => query;

    // Cached per closed generic type (e.g. once for Property, once for
    // Customer) so reflection only runs the first time each T is sorted.
    private static readonly Lazy<HashSet<string>> SortableProperties = new(() =>
        typeof(T)
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p => p.CanRead && (p.PropertyType.IsPrimitive
                || p.PropertyType == typeof(string)
                || p.PropertyType == typeof(decimal)
                || p.PropertyType == typeof(DateTime)
                || p.PropertyType == typeof(DateTime?)
                || p.PropertyType == typeof(Guid)
                || p.PropertyType.IsEnum))
            .Select(p => p.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase));

    /// <summary>
    /// Whitelists SortBy against T's own scalar properties before it ever
    /// reaches System.Linq.Dynamic.Core's OrderBy(string). SortBy comes
    /// straight from the query string — without this check a caller could
    /// try to sort by an unrelated member exposed via reflection (the
    /// exact class of issue behind CVE-2024-51417 in versions of that
    /// package before 1.6.0). Keep this even though the package is
    /// patched: defense in depth against whatever ships next.
    /// </summary>
    private static bool IsSortableProperty(string sortBy) => SortableProperties.Value.Contains(sortBy);
}

using Core.Application.DTOs;
using Core.Domain.Common;

namespace Core.Application.Interfaces;

/// <summary>
/// Generic contract for CRUD + paged listing. Each module
/// (CustomerService, PropertyService, ProductService...) implements this
/// by inheriting GenericService{T}, only overriding what's specific to it
/// (e.g. which fields are included in the text search).
/// </summary>
public interface IGenericService<T> where T : BaseEntity
{
    /// <param name="publicOnly">
    /// When true, applies each module's ApplyPublicVisibilityFilter (e.g.
    /// Property.IsActive) on top of the usual soft-delete/tenant scoping.
    /// Used by public (unauthenticated) endpoints so a company's own
    /// admin can see drafts/inactive records while public visitors can't.
    /// </param>
    Task<T?> GetByIdAsync(Guid id, bool publicOnly = false);
    Task<PagedResult<T>> GetPagedAsync(PaginationFilter filter, Guid companyId, bool publicOnly = false);
    Task<T> CreateAsync(T entity, Guid companyId);
    Task UpdateAsync(T entity);
    Task DeleteAsync(Guid id);
}

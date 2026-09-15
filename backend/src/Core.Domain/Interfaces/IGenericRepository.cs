using Core.Domain.Common;

namespace Core.Domain.Interfaces;

/// <summary>
/// Generic repository: implemented ONCE in Core.Infrastructure and reused
/// by Customer, Property, Product, Member, etc. This is what eliminates
/// repeated CRUD code across verticals.
/// </summary>
public interface IGenericRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id);

    /// <summary>
    /// Returns an IQueryable so pagination/filtering/sorting can be built
    /// in the Application layer without repeating data-access logic.
    /// </summary>
    IQueryable<T> Query();

    Task<T> AddAsync(T entity);
    void Update(T entity);

    /// <summary>Soft delete — never physically removes the record.</summary>
    void Delete(T entity);

    Task<int> SaveChangesAsync();
}

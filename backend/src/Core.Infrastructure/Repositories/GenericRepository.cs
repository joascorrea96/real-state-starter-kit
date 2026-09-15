using Core.Domain.Common;
using Core.Domain.Interfaces;
using Core.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Core.Infrastructure.Repositories;

/// <summary>
/// Single implementation of the generic repository, used by Customer,
/// Property, Product, Member, etc. via dependency injection:
/// services.AddScoped(typeof(IGenericRepository&lt;&gt;), typeof(GenericRepository&lt;&gt;));
/// </summary>
public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;

    public GenericRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
        => await _dbSet.FirstOrDefaultAsync(e => e.Id == id);

    public IQueryable<T> Query() => _dbSet.AsQueryable();

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public void Update(T entity)
    {
        var existing = _dbSet.Local.FirstOrDefault(e => e.Id == entity.Id);
        if (existing != null)
        {
            _context.Entry(existing).State = EntityState.Detached;
        }
        _dbSet.Update(entity);
    }

    public void Delete(T entity) => _dbSet.Remove(entity);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();
}

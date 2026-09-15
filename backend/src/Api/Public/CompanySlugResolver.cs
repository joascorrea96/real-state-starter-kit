using Core.Domain.Entities;
using Core.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Public;

public interface ICompanySlugResolver
{
    Task<Company?> ResolveAsync(string slug);
}

/// <summary>
/// Every public (unauthenticated) controller needs to turn a URL slug
/// into a CompanyId before it can query anything — this is that single
/// lookup, shared instead of duplicated across PublicPropertiesController,
/// PublicLeadsController, etc.
/// </summary>
public class CompanySlugResolver : ICompanySlugResolver
{
    private readonly AppDbContext _context;

    public CompanySlugResolver(AppDbContext context)
    {
        _context = context;
    }

    public Task<Company?> ResolveAsync(string slug)
        => _context.Companies.FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive);
}

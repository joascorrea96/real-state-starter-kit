using Core.Application.Services;
using Core.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Modules.RealState.Entities;

namespace Modules.RealState.Services;

public class LeadService : GenericService<Lead>
{
    public LeadService(IGenericRepository<Lead> repository) : base(repository) { }

    protected override IQueryable<Lead> ApplySearch(IQueryable<Lead> query, string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm)) return query;

        var term = searchTerm.Trim();
        return query.Where(l =>
            EF.Functions.ILike(l.Name, $"%{term}%") ||
            EF.Functions.ILike(l.Phone, $"%{term}%") ||
            (l.Email != null && EF.Functions.ILike(l.Email, $"%{term}%")));
    }

    protected override IQueryable<Lead> ApplyCustomFilters(IQueryable<Lead> query, Dictionary<string, string>? filters)
    {
        // Always include related data for leads
        query = query.Include(l => l.AssignedUser).Include(l => l.Property);

        if (filters is null || filters.Count == 0) return query;

        if (filters.TryGetValue("status", out var statusRaw) && Enum.TryParse<LeadStatus>(statusRaw, true, out var status))
            query = query.Where(l => l.Status == status);

        if (filters.TryGetValue("assignedUserId", out var assignedUserIdRaw) && Guid.TryParse(assignedUserIdRaw, out var assignedUserId))
            query = query.Where(l => l.AssignedUserId == assignedUserId);

        return query;
    }
}

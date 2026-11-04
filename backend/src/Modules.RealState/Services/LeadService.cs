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

        if (filters.TryGetValue("status", out var statusRaw) && !string.IsNullOrWhiteSpace(statusRaw) && Enum.TryParse<LeadStatus>(statusRaw, true, out var status))
            query = query.Where(l => l.Status == status);

        if (filters.TryGetValue("assignedUserId", out var assignedUserIdRaw) && !string.IsNullOrWhiteSpace(assignedUserIdRaw))
        {
            if (assignedUserIdRaw.Equals("unassigned", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.AssignedUserId == null);
            }
            else if (Guid.TryParse(assignedUserIdRaw, out var assignedUserId))
            {
                query = query.Where(l => l.AssignedUserId == assignedUserId);
            }
        }

        if (filters.TryGetValue("startDate", out var startRaw) && !string.IsNullOrWhiteSpace(startRaw) &&
            DateTime.TryParse(startRaw, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var startDate))
        {
            var startUtc = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            query = query.Where(l => l.CreatedAt >= startUtc);
        }

        if (filters.TryGetValue("endDate", out var endRaw) && !string.IsNullOrWhiteSpace(endRaw) &&
            DateTime.TryParse(endRaw, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var endDate))
        {
            var endUtc = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);
            query = query.Where(l => l.CreatedAt <= endUtc);
        }

        return query;
    }
}

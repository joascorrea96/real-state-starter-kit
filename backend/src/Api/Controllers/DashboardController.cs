using Api.Auth;
using Api.DTOs;
using Core.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Modules.RealState.Entities;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(AppDbContext dbContext, ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
    {
        var companyId = _currentUser.CompanyId;

        var totalProperties = await _dbContext.Set<Property>()
            .CountAsync(p => p.CompanyId == companyId);

        var activeProperties = await _dbContext.Set<Property>()
            .CountAsync(p => p.CompanyId == companyId && p.IsActive);

        var totalLeads = await _dbContext.Set<Lead>()
            .CountAsync(l => l.CompanyId == companyId);

        var leadsByStatusRaw = await _dbContext.Set<Lead>()
            .Where(l => l.CompanyId == companyId)
            .GroupBy(l => l.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var leadsByStatus = leadsByStatusRaw
            .ToDictionary(x => x.Status.ToString(), x => x.Count);

        var topProperties = await _dbContext.Set<Lead>()
            .Where(l => l.CompanyId == companyId && l.PropertyId != null)
            .GroupBy(l => new { l.PropertyId, l.Property!.Title })
            .Select(g => new TopPropertyDto
            {
                PropertyId = g.Key.PropertyId!.Value,
                Title = g.Key.Title,
                LeadsCount = g.Count()
            })
            .OrderByDescending(x => x.LeadsCount)
            .Take(5)
            .ToListAsync();

        return Ok(new DashboardSummaryDto
        {
            TotalProperties = totalProperties,
            ActiveProperties = activeProperties,
            TotalLeads = totalLeads,
            LeadsByStatus = leadsByStatus,
            TopPropertiesByLeads = topProperties
        });
    }
}

using Api.Auth;
using Core.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CompaniesController(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<ActionResult<CompanySettingsDto>> GetMyCompany()
    {
        var company = await _db.Companies.FindAsync(_currentUser.CompanyId);
        if (company is null) return NotFound();

        return Ok(new CompanySettingsDto(company.TradeName, company.Phone, company.SettingsJson));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyCompany(CompanySettingsDto dto)
    {
        if (_currentUser.Role != "CompanyAdmin" && _currentUser.Role != "SuperAdmin")
        {
            return Forbid();
        }

        var company = await _db.Companies.FindAsync(_currentUser.CompanyId);
        if (company is null) return NotFound();

        company.TradeName = dto.TradeName ?? company.TradeName;
        company.Phone = dto.Phone;
        company.SettingsJson = dto.SettingsJson;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CompanySettingsDto(string? TradeName, string? Phone, string? SettingsJson);

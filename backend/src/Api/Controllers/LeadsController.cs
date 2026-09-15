using Api.Auth;
using Core.Application.DTOs;
using Core.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.RealState.Entities;
using Core.Domain.Entities;

namespace Api.Controllers;

/// <summary>
/// Same shape as PropertiesController/CustomersController. Leads are
/// created only through the public, unauthenticated PublicLeadsController
/// — this controller is read/manage-only for the company's own staff.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly IGenericService<Lead> _service;
    private readonly ICurrentUserService _currentUser;

    public LeadsController(IGenericService<Lead> service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Lead>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<Lead>>> GetPaged([FromQuery] PaginationFilter filter)
    {
        if (_currentUser.Role == UserRole.Employee.ToString())
        {
            filter.Filters ??= new Dictionary<string, string>();
            filter.Filters["assignedUserId"] = _currentUser.UserId.ToString();
        }

        var result = await _service.GetPagedAsync(filter, _currentUser.CompanyId);
        
        // Remove password hashes from AssignedUser
        if (result.Items != null)
        {
            foreach (var item in result.Items)
            {
                if (item.AssignedUser != null)
                    item.AssignedUser.PasswordHash = string.Empty;
            }
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Lead), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Lead>> GetById(Guid id)
    {
        var entity = await _service.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, Lead lead)
    {
        if (id != lead.Id) return BadRequest("Route id and body id must match.");

        var existing = await _service.GetByIdAsync(id);
        if (existing is null) return NotFound();

        await _service.UpdateAsync(lead);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}

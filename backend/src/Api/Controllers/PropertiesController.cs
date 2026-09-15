using Api.Auth;
using Core.Application.DTOs;
using Core.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.RealState.Entities;

namespace Api.Controllers;

/// <summary>
/// Same shape as CustomersController — only the entity type changes.
/// PropertyService (registered as IGenericService&lt;Property&gt; in
/// Program.cs) supplies the vertical-specific search/filter behavior.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PropertiesController : ControllerBase
{
    private readonly IGenericService<Property> _service;
    private readonly ICurrentUserService _currentUser;

    public PropertiesController(IGenericService<Property> service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Example: GET /api/properties?pageNumber=1&amp;pageSize=12&amp;searchTerm=downtown
    /// &amp;filters[minPrice]=200000&amp;filters[maxPrice]=500000&amp;filters[propertyType]=Apartment
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Property>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<Property>>> GetPaged([FromQuery] PaginationFilter filter)
    {
        var result = await _service.GetPagedAsync(filter, _currentUser.CompanyId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Property), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Property>> GetById(Guid id)
    {
        var entity = await _service.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Property), StatusCodes.Status201Created)]
    public async Task<ActionResult<Property>> Create(Property property)
    {
        var created = await _service.CreateAsync(property, _currentUser.CompanyId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, Property property)
    {
        if (id != property.Id) return BadRequest("Route id and body id must match.");

        var existing = await _service.GetByIdAsync(id);
        if (existing is null) return NotFound();

        await _service.UpdateAsync(property);
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

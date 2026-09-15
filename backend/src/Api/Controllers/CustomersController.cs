using Api.Auth;
using Core.Application.DTOs;
using Core.Application.Interfaces;
using Core.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Reference controller: every vertical-specific controller (Properties,
/// Products, Members, MenuItems...) follows this exact same shape — the
/// only thing that changes is the entity type and the service used.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly IGenericService<Customer> _service;
    private readonly ICurrentUserService _currentUser;

    public CustomersController(IGenericService<Customer> service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Customer>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<Customer>>> GetPaged([FromQuery] PaginationFilter filter)
    {
        var result = await _service.GetPagedAsync(filter, _currentUser.CompanyId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Customer>> GetById(Guid id)
    {
        var entity = await _service.GetByIdAsync(id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status201Created)]
    public async Task<ActionResult<Customer>> Create(Customer customer)
    {
        var created = await _service.CreateAsync(customer, _currentUser.CompanyId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, Customer customer)
    {
        if (id != customer.Id) return BadRequest("Route id and body id must match.");

        var existing = await _service.GetByIdAsync(id);
        if (existing is null) return NotFound();

        await _service.UpdateAsync(customer);
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

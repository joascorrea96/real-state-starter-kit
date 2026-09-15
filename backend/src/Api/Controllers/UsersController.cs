using Api.Auth;
using Core.Application.DTOs;
using Core.Application.Interfaces;
using Core.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IGenericService<User> _service;
    private readonly ICurrentUserService _currentUser;
    private readonly IPasswordHasher _passwordHasher;

    public UsersController(
        IGenericService<User> service, 
        ICurrentUserService currentUser,
        IPasswordHasher passwordHasher)
    {
        _service = service;
        _currentUser = currentUser;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<User>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<User>>> GetPaged([FromQuery] PaginationFilter filter)
    {
        // Require CompanyAdmin or SuperAdmin
        if (!IsAdmin()) return Forbid();

        var result = await _service.GetPagedAsync(filter, _currentUser.CompanyId);
        
        // Sanitize password hashes from response
        foreach (var user in result.Items)
        {
            user.PasswordHash = string.Empty;
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<User>> GetById(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var entity = await _service.GetByIdAsync(id);
        if (entity is null) return NotFound();

        entity.PasswordHash = string.Empty;
        return Ok(entity);
    }

    [HttpPost]
    [ProducesResponseType(typeof(User), StatusCodes.Status201Created)]
    public async Task<ActionResult<User>> Create(User user)
    {
        if (!IsAdmin()) return Forbid();

        // Hash the initial password
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return BadRequest("Password is required.");
        }
        
        user.PasswordHash = _passwordHasher.Hash(user.PasswordHash);

        var created = await _service.CreateAsync(user, _currentUser.CompanyId);
        created.PasswordHash = string.Empty;
        
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, User user)
    {
        if (!IsAdmin()) return Forbid();
        if (id != user.Id) return BadRequest("Route id and body id must match.");

        var existing = await _service.GetByIdAsync(id);
        if (existing is null) return NotFound();

        // If the client sent a new password, hash it. Otherwise, keep existing.
        if (!string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            user.PasswordHash = _passwordHasher.Hash(user.PasswordHash);
        }
        else
        {
            user.PasswordHash = existing.PasswordHash;
        }

        await _service.UpdateAsync(user);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        await _service.DeleteAsync(id);
        return NoContent();
    }

    private bool IsAdmin()
    {
        return _currentUser.Role == UserRole.SuperAdmin.ToString() || _currentUser.Role == UserRole.CompanyAdmin.ToString();
    }
}

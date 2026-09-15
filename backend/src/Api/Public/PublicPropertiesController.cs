using Core.Application.DTOs;
using Core.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Modules.RealState.Entities;

namespace Api.Public;

/// <summary>
/// The public catalog every visitor of the client company's site hits —
/// no login, scoped by URL slug instead of a JWT claim. Only ever
/// returns properties where IsActive == true (enforced by
/// PropertyService.ApplyPublicVisibilityFilter via the publicOnly flag).
/// </summary>
[ApiController]
[Route("api/public/{slug}/properties")]
public class PublicPropertiesController : ControllerBase
{
    private readonly IGenericService<Property> _service;
    private readonly ICompanySlugResolver _slugResolver;

    public PublicPropertiesController(IGenericService<Property> service, ICompanySlugResolver slugResolver)
    {
        _service = service;
        _slugResolver = slugResolver;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Property>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResult<Property>>> GetPaged(string slug, [FromQuery] PaginationFilter filter)
    {
        var company = await _slugResolver.ResolveAsync(slug);
        if (company is null) return NotFound();

        var result = await _service.GetPagedAsync(filter, company.Id, publicOnly: true);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Property), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Property>> GetById(string slug, Guid id)
    {
        var company = await _slugResolver.ResolveAsync(slug);
        if (company is null) return NotFound();

        var property = await _service.GetByIdAsync(id, publicOnly: true);
        if (property is null || property.CompanyId != company.Id) return NotFound();

        return Ok(property);
    }
}

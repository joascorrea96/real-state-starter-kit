using Core.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Modules.RealState.Entities;

namespace Api.Public;

/// <summary>
/// The whole reason the public site exists commercially: turns a
/// visitor's interest into a Lead the client company can follow up on
/// from their admin panel. No auth — anyone can submit a form here, so
/// keep this endpoint free of anything sensitive.
/// </summary>
[ApiController]
[Route("api/public/{slug}/leads")]
public class PublicLeadsController : ControllerBase
{
    private readonly IGenericService<Lead> _service;
    private readonly ICompanySlugResolver _slugResolver;

    public PublicLeadsController(IGenericService<Lead> service, ICompanySlugResolver slugResolver)
    {
        _service = service;
        _slugResolver = slugResolver;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(string slug, CreateLeadRequest request)
    {
        var company = await _slugResolver.ResolveAsync(slug);
        if (company is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest("Name and phone are required.");

        var lead = new Lead
        {
            Name = request.Name.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim(),
            Message = request.Message?.Trim(),
            PropertyId = request.PropertyId,
        };

        await _service.CreateAsync(lead, company.Id);
        return StatusCode(StatusCodes.Status201Created);
    }
}

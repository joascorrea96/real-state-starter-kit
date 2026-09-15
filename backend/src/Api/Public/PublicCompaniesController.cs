using Microsoft.AspNetCore.Mvc;

namespace Api.Public;

[ApiController]
[Route("api/public/companies")]
public class PublicCompaniesController : ControllerBase
{
    private readonly ICompanySlugResolver _slugResolver;

    public PublicCompaniesController(ICompanySlugResolver slugResolver)
    {
        _slugResolver = slugResolver;
    }

    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(PublicCompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicCompanyDto>> GetBySlug(string slug)
    {
        var company = await _slugResolver.ResolveAsync(slug);
        if (company is null) return NotFound();

        return Ok(new PublicCompanyDto(company.Slug, company.TradeName, company.Phone, company.SettingsJson));
    }
}

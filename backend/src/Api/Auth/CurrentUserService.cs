using System.Security.Claims;

namespace Api.Auth;

public interface ICurrentUserService
{
    Guid UserId { get; }
    Guid CompanyId { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}

/// <summary>
/// Reads the authenticated user's claims out of the current HTTP context.
/// Every controller uses this instead of parsing claims manually, so
/// multi-tenant scoping (CompanyId) is applied consistently everywhere.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid UserId
    {
        get
        {
            var value = User?.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    public Guid CompanyId
    {
        get
        {
            var value = User?.FindFirstValue("companyId");
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    public string? Role => User?.FindFirstValue(ClaimTypes.Role);
}

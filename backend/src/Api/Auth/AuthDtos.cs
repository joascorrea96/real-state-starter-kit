namespace Api.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, DateTime ExpiresAt, string Name, string Role, Guid CompanyId);

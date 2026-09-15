namespace Api.Public;

/// <summary>Minimal, safe-to-expose company info for the public site header/branding.</summary>
public record PublicCompanyDto(string Slug, string TradeName, string? Phone, string? SettingsJson);

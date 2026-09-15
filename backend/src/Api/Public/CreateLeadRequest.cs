namespace Api.Public;

public record CreateLeadRequest(string Name, string Phone, string? Email, string? Message, Guid? PropertyId);

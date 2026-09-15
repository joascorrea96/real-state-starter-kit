using Core.Domain.Common;

namespace Core.Domain.Entities;

public enum UserRole
{
    SuperAdmin = 0,   // you — access to every company
    CompanyAdmin = 1, // owner/manager of the client business
    Employee = 2,     // day-to-day operator
    EndUser = 3       // final user (member, buyer, etc.), if applicable
}

/// <summary>
/// System user. Linked to a Company (except SuperAdmin).
/// </summary>
public class User : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Employee;
    public bool IsActive { get; set; } = true;

    public Company? Company { get; set; }
}

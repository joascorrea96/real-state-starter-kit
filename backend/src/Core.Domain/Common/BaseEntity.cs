namespace Core.Domain.Common;

/// <summary>
/// Base entity for every module (Gym, RealState, Restaurants, etc).
/// Every record in the system inherits from this.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Soft delete: records are never physically removed, only flagged.
    /// Prevents data loss and keeps a history/audit trail.
    /// </summary>
    public bool IsDeleted { get; set; } = false;
}

/// <summary>
/// Base entity for data that belongs to a specific company (multi-tenant).
/// E.g. Customer, Product, Property, Member — anything that is "data owned
/// by a client company using the SaaS".
/// </summary>
public abstract class TenantEntity : BaseEntity
{
    /// <summary>
    /// Identifies which company (the platform's client) this record
    /// belongs to. Lets a single database/API serve multiple client
    /// companies at no extra infrastructure cost.
    /// </summary>
    public Guid CompanyId { get; set; }
}

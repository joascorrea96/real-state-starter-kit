namespace Api.DTOs;

public class DashboardSummaryDto
{
    public int TotalProperties { get; set; }
    public int ActiveProperties { get; set; }
    public int TotalLeads { get; set; }
    public Dictionary<string, int> LeadsByStatus { get; set; } = new();
    public List<TopPropertyDto> TopPropertiesByLeads { get; set; } = new();
}

public class TopPropertyDto
{
    public Guid PropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int LeadsCount { get; set; }
}

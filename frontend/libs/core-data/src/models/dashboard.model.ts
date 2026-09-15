export interface TopPropertyDto {
  propertyId: string;
  title: string;
  leadsCount: number;
}

export interface DashboardSummary {
  totalProperties: number;
  activeProperties: number;
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  topPropertiesByLeads: TopPropertyDto[];
}

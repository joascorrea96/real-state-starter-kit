export enum LeadStatus {
  New = 'New',
  Contacted = 'Contacted',
  Qualified = 'Qualified',
  Lost = 'Lost',
  Converted = 'Converted',
}

/** Mirrors Modules.RealState.Entities.Lead from the backend. */
export interface Lead {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  propertyId?: string;
  property?: { title: string };
  status: LeadStatus;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string };
  createdAt: string;
  updatedAt?: string;
}

/** Payload for the public (unauthenticated) lead-capture form. */
export interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  propertyId?: string;
}

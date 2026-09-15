/** Mirrors Core.Domain.Entities.Customer from the backend. */
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;

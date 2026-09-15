export enum PropertyType {
  House = 'House',
  Apartment = 'Apartment',
  Land = 'Land',
  Commercial = 'Commercial',
  Farm = 'Farm',
}

export enum ListingType {
  ForSale = 'ForSale',
  ForRent = 'ForRent',
}

export enum PropertyStatus {
  Available = 'Available',
  Sold = 'Sold',
  Rented = 'Rented',
  Paused = 'Paused',
}

/** Mirrors Modules.RealState.Entities.Property from the backend. */
export interface Property {
  id: string;
  companyId: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;

  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  condoFee?: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaSqm: number;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string;
  imageUrls: string[];
  updatedAt?: string;
}

/** Payload shape for create/update — omits server-generated fields. */
export type PropertyInput = Omit<Property, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;

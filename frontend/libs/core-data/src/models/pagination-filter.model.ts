/**
 * Mirrors Core.Application.DTOs.PaginationFilter from the backend.
 * Built by GenericApiService and sent as query params to any
 * GET /api/{resource} endpoint.
 */
export interface PaginationFilter {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  /** Vertical-specific filters, e.g. { minPrice: '200000', propertyType: 'Apartment' } */
  filters?: Record<string, string>;
}

export const DEFAULT_PAGINATION_FILTER: PaginationFilter = {
  pageNumber: 1,
  pageSize: 10,
};

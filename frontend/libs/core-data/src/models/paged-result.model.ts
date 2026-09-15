/**
 * Mirrors Core.Application.DTOs.PagedResult<T> from the backend.
 * Every listing screen in every vertical consumes this same shape.
 */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

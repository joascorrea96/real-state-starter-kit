import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url.token';
import { PagedResult } from '../models/paged-result.model';
import { PaginationFilter } from '../models/pagination-filter.model';

/**
 * Generic CRUD + paged-listing client, mirroring the backend's
 * GenericService<T> / the {Resource}Controller pattern (see
 * CustomersController / PropertiesController). Every feature service
 * (PropertyService, CustomerService, MemberService...) extends this
 * instead of rewriting the same HTTP calls.
 *
 * Usage:
 *   @Injectable({ providedIn: 'root' })
 *   export class PropertyService extends GenericApiService<Property> {
 *     constructor() { super('properties'); }
 *   }
 */
@Injectable()
export abstract class GenericApiService<T extends { id: string }> {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected constructor(private readonly resourcePath: string) {}

  private get endpoint(): string {
    return `${this.baseUrl}/${this.resourcePath}`;
  }

  getPaged(filter: PaginationFilter): Observable<PagedResult<T>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending);

    if (filter.filters) {
      for (const [key, value] of Object.entries(filter.filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(`filters[${key}]`, value);
        }
      }
    }

    return this.http.get<PagedResult<T>>(this.endpoint, { params });
  }

  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<T>): Observable<T> {
    return this.http.post<T>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<T>): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

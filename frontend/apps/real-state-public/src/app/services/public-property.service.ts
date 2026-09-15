import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL, COMPANY_SLUG, PagedResult, PaginationFilter, Property } from '@web-systems/core-data';
import { Observable } from 'rxjs';

/**
 * Talks to PublicPropertiesController on the backend — no auth, scoped
 * by COMPANY_SLUG instead of a JWT claim. Deliberately not built on
 * GenericApiService: the public API shape (path includes the slug, no
 * create/update/delete) is different enough from the admin CRUD pattern
 * that forcing it into that abstraction would add more confusion than
 * it saves.
 */
@Injectable({ providedIn: 'root' })
export class PublicPropertyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly slug = inject(COMPANY_SLUG);

  private get endpoint(): string {
    return `${this.baseUrl}/public/${this.slug}/properties`;
  }

  getPaged(filter: PaginationFilter): Observable<PagedResult<Property>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber)
      .set('pageSize', filter.pageSize);

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending);

    if (filter.filters) {
      for (const [key, value] of Object.entries(filter.filters)) {
        if (value) params = params.set(`filters[${key}]`, value);
      }
    }

    return this.http.get<PagedResult<Property>>(this.endpoint, { params });
  }

  getById(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.endpoint}/${id}`);
  }
}

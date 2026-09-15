import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL, COMPANY_SLUG, CreateLeadRequest } from '@web-systems/core-data';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PublicLeadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly slug = inject(COMPANY_SLUG);

  create(request: CreateLeadRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/public/${this.slug}/leads`, request);
  }
}

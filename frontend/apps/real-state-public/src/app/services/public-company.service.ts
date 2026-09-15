import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL, COMPANY_SLUG } from '@web-systems/core-data';
import { Observable } from 'rxjs';

export interface PublicCompany {
  slug: string;
  tradeName: string;
  phone?: string;
  settingsJson?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicCompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly slug = inject(COMPANY_SLUG);

  getCompany(): Observable<PublicCompany> {
    return this.http.get<PublicCompany>(`${this.baseUrl}/public/companies/${this.slug}`);
  }
}

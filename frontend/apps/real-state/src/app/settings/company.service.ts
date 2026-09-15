import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@web-systems/core-data';
import { Observable } from 'rxjs';

export interface CompanySettings {
  tradeName?: string;
  phone?: string;
  settingsJson?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.baseUrl}/companies/me`;
  }

  getMyCompany(): Observable<CompanySettings> {
    return this.http.get<CompanySettings>(this.endpoint);
  }

  updateMyCompany(settings: CompanySettings): Observable<void> {
    return this.http.put<void>(this.endpoint, settings);
  }
}

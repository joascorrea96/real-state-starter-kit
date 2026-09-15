import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_BASE_URL, COMPANY_SLUG } from '@web-systems/core-data';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    // No auth interceptor here on purpose — this app never sends a JWT,
    // every request is anonymous and scoped by COMPANY_SLUG instead.
    provideHttpClient(),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: COMPANY_SLUG, useValue: environment.companySlug }, provideClientHydration(),
  ],
};

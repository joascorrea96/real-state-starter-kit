import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '@web-systems/core-data';
import { AuthService } from './auth.service';

/**
 * Attaches "Authorization: Bearer {token}" to every request that targets
 * our own API. Registered once in app.config.ts via
 * provideHttpClient(withInterceptors([authInterceptor])).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const baseUrl = inject(API_BASE_URL);
  const token = authService.token();

  if (!token || !req.url.startsWith(baseUrl)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};

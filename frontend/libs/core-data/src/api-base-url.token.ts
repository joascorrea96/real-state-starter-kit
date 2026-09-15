import { InjectionToken } from '@angular/core';

/**
 * Each app (real-state, gym, restaurants...) provides its own value for
 * this token in app.config.ts, pointing at the shared backend API.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

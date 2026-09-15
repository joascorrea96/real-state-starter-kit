import { InjectionToken } from '@angular/core';

/**
 * Every public-facing app (real-state-public, and future gym-public,
 * restaurants-public...) provides this in app.config.ts with the one
 * client company it's deployed for. Each client's public site is its
 * own build/deployment with its own slug baked in via environment.ts —
 * that's the white-label mechanism on the frontend side.
 */
export const COMPANY_SLUG = new InjectionToken<string>('COMPANY_SLUG');

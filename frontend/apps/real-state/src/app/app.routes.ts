import { Routes } from '@angular/router';
import { authGuard } from '@web-systems/core-auth';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'properties',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./properties/properties-list/properties-list.component').then(
        (m) => m.PropertiesListComponent,
      ),
  },
  {
    path: 'properties/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./properties/property-form/property-form.component').then(
        (m) => m.PropertyFormComponent,
      ),
  },
  {
    path: 'properties/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./properties/property-form/property-form.component').then(
        (m) => m.PropertyFormComponent,
      ),
  },
  {
    path: 'leads',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./leads/leads-list/leads-list.component').then((m) => m.LeadsListComponent),
  },
  {
    path: 'leads/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./leads/lead-form/lead-form.component').then((m) => m.LeadFormComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./users/users-list/users-list.component').then((m) => m.UsersListComponent),
  },
  {
    path: 'users/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./users/user-form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'users/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./users/user-form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

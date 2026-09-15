import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./catalog/catalog.component').then((m) => m.CatalogComponent),
  },
  {
    path: 'imoveis/:id',
    loadComponent: () =>
      import('./property-detail/property-detail.component').then((m) => m.PropertyDetailComponent),
  },
  {
    path: 'buscar',
    loadComponent: () => import('./search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./favorites/favorites.component').then((m) => m.FavoritesComponent),
  },
  { path: '**', redirectTo: '' },
];

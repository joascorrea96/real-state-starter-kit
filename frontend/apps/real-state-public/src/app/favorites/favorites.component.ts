import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Property } from '@web-systems/core-data';
import { switchMap, of, forkJoin, catchError } from 'rxjs';
import { FavoritesService } from '../services/favorites.service';
import { PublicPropertyService } from '../services/public-property.service';
import { PropertyCardComponent } from '../shared/property-card/property-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent {
  private readonly favoritesService = inject(FavoritesService);
  private readonly propertyService = inject(PublicPropertyService);

  readonly favoriteIds = this.favoritesService.favoriteIds;

  // We map the signal to an observable to fetch each property by ID
  readonly properties = toSignal(
    toObservable(this.favoriteIds).pipe(
      switchMap(ids => {
        if (ids.length === 0) return of([]);
        // Fetch each property by id individually (since API doesn't support bulk ids yet)
        const requests = ids.map(id => this.propertyService.getById(id).pipe(catchError(() => of(null))));
        return forkJoin(requests);
      })
    ),
    { initialValue: [] as (Property | null)[] }
  );
  
  readonly validProperties = computed(() => this.properties().filter(p => p !== null) as Property[]);
}

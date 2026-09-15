import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import {
  DEFAULT_PAGINATION_FILTER,
  ListingType,
  Property,
  PropertyType,
} from '@web-systems/core-data';
import { SearchFilterBarComponent } from '@web-systems/core-ui';
import { PropertyCardComponent } from '../shared/property-card/property-card.component';
import { PublicPropertyService } from '../services/public-property.service';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.House]: 'Casa',
  [PropertyType.Apartment]: 'Apartamento',
  [PropertyType.Land]: 'Terreno',
  [PropertyType.Commercial]: 'Comercial',
  [PropertyType.Farm]: 'Sítio/Fazenda',
};

const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  [ListingType.ForSale]: 'Comprar',
  [ListingType.ForRent]: 'Alugar',
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, SearchFilterBarComponent, PropertyCardComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  private readonly propertyService = inject(PublicPropertyService);
  private readonly router = inject(Router);

  readonly propertyTypes = Object.values(PropertyType);
  readonly listingTypes = Object.values(ListingType);
  readonly propertyTypeLabel = (type: PropertyType) => PROPERTY_TYPE_LABELS[type];
  readonly listingTypeLabel = (type: ListingType) => LISTING_TYPE_LABELS[type];

  readonly featuredProperties = signal<Property[]>([]);
  readonly saleProperties = signal<Property[]>([]);
  readonly rentProperties = signal<Property[]>([]);

  readonly loadingFeatured = signal(false);
  readonly loadingSale = signal(false);
  readonly loadingRent = signal(false);

  @ViewChildren('carouselRef') carousels!: QueryList<ElementRef<HTMLDivElement>>;

  constructor() {
    this.fetchFeatured();
    this.fetchSale();
    this.fetchRent();
  }

  onSearchChange(term: string): void {
    if (term) {
      this.router.navigate(['/buscar'], { queryParams: { q: term } });
    }
  }

  onPropertyTypeChange(value: string): void {
    if (value) this.router.navigate(['/buscar'], { queryParams: { propertyType: value } });
  }

  onListingTypeChange(value: string): void {
    if (value) this.router.navigate(['/buscar'], { queryParams: { listingType: value } });
  }

  onMinBedroomsChange(value: string): void {
    if (value) this.router.navigate(['/buscar'], { queryParams: { minBedrooms: value } });
  }

  onMinPriceChange(value: string): void {
    if (value) this.router.navigate(['/buscar'], { queryParams: { minPrice: value } });
  }

  onMaxPriceChange(value: string): void {
    if (value) this.router.navigate(['/buscar'], { queryParams: { maxPrice: value } });
  }

  scrollCarousel(index: number, direction: 'left' | 'right') {
    const el = this.carousels.toArray()[index]?.nativeElement;
    if (el) {
      const scrollAmount = 320 * 3; // Approx 3 cards
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }

  private fetchFeatured(): void {
    this.loadingFeatured.set(true);
    this.propertyService.getPaged({
      ...DEFAULT_PAGINATION_FILTER,
      pageSize: 10,
      filters: { isFeatured: 'true', status: 'Available' }
    }).subscribe({
      next: (res) => { this.featuredProperties.set(res.items); this.loadingFeatured.set(false); },
      error: () => this.loadingFeatured.set(false),
    });
  }

  private fetchSale(): void {
    this.loadingSale.set(true);
    this.propertyService.getPaged({
      ...DEFAULT_PAGINATION_FILTER,
      pageSize: 10,
      filters: { listingType: 'ForSale', status: 'Available' }
    }).subscribe({
      next: (res) => { this.saleProperties.set(res.items); this.loadingSale.set(false); },
      error: () => this.loadingSale.set(false),
    });
  }

  private fetchRent(): void {
    this.loadingRent.set(true);
    this.propertyService.getPaged({
      ...DEFAULT_PAGINATION_FILTER,
      pageSize: 10,
      filters: { listingType: 'ForRent', status: 'Available' }
    }).subscribe({
      next: (res) => { this.rentProperties.set(res.items); this.loadingRent.set(false); },
      error: () => this.loadingRent.set(false),
    });
  }
}

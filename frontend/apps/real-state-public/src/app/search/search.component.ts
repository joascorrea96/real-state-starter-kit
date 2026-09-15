import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DEFAULT_PAGINATION_FILTER,
  ListingType,
  PagedResult,
  PaginationFilter,
  Property,
  PropertyType,
} from '@web-systems/core-data';
import { PaginationBarComponent, SearchFilterBarComponent } from '@web-systems/core-ui';
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
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, SearchFilterBarComponent, PaginationBarComponent, PropertyCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  private readonly propertyService = inject(PublicPropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly propertyTypes = Object.values(PropertyType);
  readonly listingTypes = Object.values(ListingType);
  readonly propertyTypeLabel = (type: PropertyType) => PROPERTY_TYPE_LABELS[type];
  readonly listingTypeLabel = (type: ListingType) => LISTING_TYPE_LABELS[type];

  readonly result = signal<PagedResult<Property> | null>(null);
  readonly loading = signal(false);

  private filter: PaginationFilter = { ...DEFAULT_PAGINATION_FILTER, pageSize: 12 };
  private customFilters: Record<string, string> = {};

  // Track initial values for the select inputs
  readonly initialSearch = signal('');
  readonly initialListingType = signal('');
  readonly initialPropertyType = signal('');
  readonly initialMinBedrooms = signal('');
  readonly initialMinPrice = signal('');
  readonly initialMaxPrice = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Read initial params
      const q = params['q'] || '';
      const listingType = params['listingType'] || '';
      const propertyType = params['propertyType'] || '';
      const minBedrooms = params['minBedrooms'] || '';
      const minPrice = params['minPrice'] || '';
      const maxPrice = params['maxPrice'] || '';

      this.initialSearch.set(q);
      this.initialListingType.set(listingType);
      this.initialPropertyType.set(propertyType);
      this.initialMinBedrooms.set(minBedrooms);
      this.initialMinPrice.set(minPrice);
      this.initialMaxPrice.set(maxPrice);

      this.filter = { ...this.filter, pageNumber: 1, searchTerm: q || undefined };
      
      this.customFilters = {};
      if (listingType) this.customFilters['listingType'] = listingType;
      if (propertyType) this.customFilters['propertyType'] = propertyType;
      if (minBedrooms) this.customFilters['minBedrooms'] = minBedrooms;
      if (minPrice) this.customFilters['minPrice'] = minPrice;
      if (maxPrice) this.customFilters['maxPrice'] = maxPrice;
      
      this.filter.filters = this.customFilters;
      this.fetch();
    });
  }

  onSearchChange(term: string): void {
    this.updateQueryParam('q', term);
  }

  onPropertyTypeChange(value: string): void {
    this.updateQueryParam('propertyType', value);
  }

  onListingTypeChange(value: string): void {
    this.updateQueryParam('listingType', value);
  }

  onMinBedroomsChange(value: string): void {
    this.updateQueryParam('minBedrooms', value);
  }

  onMinPriceChange(value: string): void {
    this.updateQueryParam('minPrice', value);
  }

  onMaxPriceChange(value: string): void {
    this.updateQueryParam('maxPrice', value);
  }

  onPageChange(pageNumber: number): void {
    this.filter = { ...this.filter, pageNumber };
    this.fetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateQueryParam(key: string, value: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value || null },
      queryParamsHandling: 'merge'
    });
  }

  private applyCustomFilter(key: string, value: string): void {
    this.customFilters = { ...this.customFilters, [key]: value };
    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.propertyService.getPaged(this.filter).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  DEFAULT_PAGINATION_FILTER,
  ListingType,
  PagedResult,
  PaginationFilter,
  Property,
  PropertyType,
} from '@web-systems/core-data';
import {
  BadgeComponent,
  DataTableComponent,
  PaginationBarComponent,
  SearchFilterBarComponent,
  SortChange,
  TableColumn,
} from '@web-systems/core-ui';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../property.service';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.House]: 'Casa',
  [PropertyType.Apartment]: 'Apartamento',
  [PropertyType.Land]: 'Terreno',
  [PropertyType.Commercial]: 'Comercial',
  [PropertyType.Farm]: 'Sítio/Fazenda',
};

const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  [ListingType.ForSale]: 'À venda',
  [ListingType.ForRent]: 'Para alugar',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

@Component({
  selector: 'app-properties-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    PaginationBarComponent,
    SearchFilterBarComponent,
    BadgeComponent,
    RouterLink,
  ],
  templateUrl: './properties-list.component.html',
  styleUrl: './properties-list.component.scss',
})
export class PropertiesListComponent {
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);

  readonly propertyTypes = Object.values(PropertyType);
  readonly listingTypes = Object.values(ListingType);
  readonly propertyTypeLabel = (type: PropertyType) => PROPERTY_TYPE_LABELS[type];
  readonly listingTypeLabel = (type: ListingType) => LISTING_TYPE_LABELS[type];

  readonly columns: TableColumn<Property>[] = [
    { key: 'title', label: 'Título', sortable: true },
    {
      key: 'listingType',
      label: 'Tipo',
      formatter: (row) => `${this.propertyTypeLabel(row.type)} · ${this.listingTypeLabel(row.listingType)}`,
    },
    { key: 'neighborhood', label: 'Bairro', sortable: true },
    { key: 'city', label: 'Cidade', sortable: true },
    {
      key: 'price',
      label: 'Preço',
      sortable: true,
      align: 'right',
      formatter: (row) => currencyFormatter.format(row.price),
    },
    { key: 'bedrooms', label: 'Quartos', align: 'center' },
    { key: 'areaSqm', label: 'Área (m²)', align: 'right', formatter: (row) => row.areaSqm.toFixed(0) },
  ];

  readonly result = signal<PagedResult<Property> | null>(null);
  readonly loading = signal(false);

  private filter: PaginationFilter = { ...DEFAULT_PAGINATION_FILTER, pageSize: 10 };
  private customFilters: Record<string, string> = {};

  constructor() {
    this.fetch();
  }

  onSearchChange(term: string): void {
    this.filter = { ...this.filter, pageNumber: 1, searchTerm: term || undefined };
    this.fetch();
  }

  onPropertyTypeChange(value: string): void {
    this.applyCustomFilter('propertyType', value);
  }

  onListingTypeChange(value: string): void {
    this.applyCustomFilter('listingType', value);
  }

  onMinPriceChange(value: string): void {
    this.applyCustomFilter('minPrice', value);
  }

  onMaxPriceChange(value: string): void {
    this.applyCustomFilter('maxPrice', value);
  }

  onSortChange(sort: SortChange): void {
    this.filter = { ...this.filter, sortBy: sort.sortBy, sortDescending: sort.sortDescending, pageNumber: 1 };
    this.fetch();
  }

  onPageChange(pageNumber: number): void {
    this.filter = { ...this.filter, pageNumber };
    this.fetch();
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

  editProperty(property: Property): void {
    this.router.navigate(['/properties', property.id, 'edit']);
  }
}

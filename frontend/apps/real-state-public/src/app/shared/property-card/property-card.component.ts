import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListingType, Property, PropertyType } from '@web-systems/core-data';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.House]: 'Casa',
  [PropertyType.Apartment]: 'Apartamento',
  [PropertyType.Land]: 'Terreno',
  [PropertyType.Commercial]: 'Comercial',
  [PropertyType.Farm]: 'Sítio/Fazenda',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();
  private readonly favoritesService = inject(FavoritesService);

  readonly isFavorite = computed(() => this.favoritesService.favoriteIds().includes(this.property().id));

  toggleFavorite(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggleFavorite(this.property().id);
  }

  readonly typeLabel = computed(() => PROPERTY_TYPE_LABELS[this.property().type]);
  readonly isRental = computed(() => this.property().listingType === ListingType.ForRent);

  readonly formattedPrice = computed(() => {
    const price = currencyFormatter.format(this.property().price);
    return this.isRental() ? `${price}/mês` : price;
  });

  readonly currentImageIndex = signal(0);
  
  readonly currentImage = computed(() => {
    const images = this.property().imageUrls;
    if (!images || images.length === 0) return null;
    return images[this.currentImageIndex()];
  });

  readonly hasMultipleImages = computed(() => this.property().imageUrls?.length > 1);

  nextImage(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const images = this.property().imageUrls;
    if (!images || images.length <= 1) return;
    this.currentImageIndex.update(i => (i + 1) % images.length);
  }

  prevImage(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const images = this.property().imageUrls;
    if (!images || images.length <= 1) return;
    this.currentImageIndex.update(i => (i === 0 ? images.length - 1 : i - 1));
  }
}

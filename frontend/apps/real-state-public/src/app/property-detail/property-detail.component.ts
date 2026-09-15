import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DEFAULT_PAGINATION_FILTER, ListingType, Property, PropertyType } from '@web-systems/core-data';
import { PublicPropertyService } from '../services/public-property.service';
import { LeadFormComponent } from '../shared/lead-form/lead-form.component';
import { PropertyCardComponent } from '../shared/property-card/property-card.component';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.House]: 'Casa',
  [PropertyType.Apartment]: 'Apartamento',
  [PropertyType.Land]: 'Terreno',
  [PropertyType.Commercial]: 'Comercial',
  [PropertyType.Farm]: 'Sítio/Fazenda',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LeadFormComponent, PropertyCardComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PublicPropertyService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly property = signal<Property | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly selectedImageIndex = signal(0);

  readonly similarProperties = signal<Property[]>([]);
  readonly loadingSimilar = signal(false);
  readonly fullscreenGallery = signal(false);

  @ViewChild('carouselRef') carouselRef?: ElementRef<HTMLDivElement>;

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      
      this.selectedImageIndex.set(0);
      this.loading.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      this.propertyService.getById(id).subscribe({
        next: (property) => {
          this.property.set(property);
          this.loading.set(false);
          this.updateMetaTags(property);
          this.fetchSimilar(property);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  ngOnDestroy() {
    // Optional: reset meta tags when leaving
    this.titleService.setTitle('Imobiliária');
    this.metaService.removeTag("property='og:title'");
    this.metaService.removeTag("property='og:description'");
    this.metaService.removeTag("property='og:image'");
  }

  private updateMetaTags(property: Property) {
    const pageTitle = `${this.typeLabel(property)} em ${property.neighborhood}, ${property.city}`;
    this.titleService.setTitle(`${pageTitle} | Imobiliária`);
    
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    
    const desc = property.description || `${this.typeLabel(property)} incrível para ${this.isRental(property) ? 'alugar' : 'comprar'} em ${property.city}. Confira!`;
    this.metaService.updateTag({ property: 'og:description', content: desc });
    
    if (property.imageUrls.length > 0) {
      this.metaService.updateTag({ property: 'og:image', content: property.imageUrls[0] });
    }
  }

  typeLabel(property: Property): string {
    return PROPERTY_TYPE_LABELS[property.type];
  }

  isRental(property: Property): boolean {
    return property.listingType === ListingType.ForRent;
  }

  formattedPrice(property: Property): string {
    const price = currencyFormatter.format(property.price);
    return this.isRental(property) ? `${price}/mês` : price;
  }

  formattedCondoFee(property: Property): string | null {
    return property.condoFee ? currencyFormatter.format(property.condoFee) : null;
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  nextImage(length: number): void {
    if (length > 0) {
      this.selectedImageIndex.set((this.selectedImageIndex() + 1) % length);
    }
  }

  prevImage(length: number): void {
    if (length > 0) {
      this.selectedImageIndex.set((this.selectedImageIndex() - 1 + length) % length);
    }
  }

  openFullscreen(): void {
    this.fullscreenGallery.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeFullscreen(): void {
    this.fullscreenGallery.set(false);
    document.body.style.overflow = '';
  }

  scrollSimilar(direction: 'left' | 'right') {
    const el = this.carouselRef?.nativeElement;
    if (el) {
      const scrollAmount = 320 * 3;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }

  private fetchSimilar(property: Property) {
    this.loadingSimilar.set(true);
    this.propertyService.getPaged({
      ...DEFAULT_PAGINATION_FILTER,
      pageSize: 10,
      filters: { 
        propertyType: property.type,
        listingType: property.listingType,
        status: 'Available'
      }
    }).subscribe({
      next: (res) => {
        // Exclude current property
        this.similarProperties.set(res.items.filter(p => p.id !== property.id));
        this.loadingSimilar.set(false);
      },
      error: () => this.loadingSimilar.set(false)
    });
  }
}

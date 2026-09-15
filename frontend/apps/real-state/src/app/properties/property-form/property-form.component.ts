import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListingType, Property, PropertyType, PropertyStatus } from '@web-systems/core-data';
import { PropertyService } from '../property.service';

import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

import { SupabaseStorageService } from '@web-systems/core-data';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss',
})
export class PropertyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly storageService = inject(SupabaseStorageService);

  readonly isEditing = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingImages = signal(false);

  // Translate Enums
  readonly propertyTypes = [
    { value: PropertyType.Apartment, label: 'Apartamento' },
    { value: PropertyType.House, label: 'Casa' },
    { value: PropertyType.Commercial, label: 'Comercial' },
    { value: PropertyType.Land, label: 'Terreno' },
  ];

  readonly listingTypes = [
    { value: ListingType.ForSale, label: 'Venda' },
    { value: ListingType.ForRent, label: 'Aluguel' },
  ];

  readonly propertyStatuses = [
    { value: PropertyStatus.Available, label: 'Disponível' },
    { value: PropertyStatus.Sold, label: 'Vendido' },
    { value: PropertyStatus.Rented, label: 'Alugado' },
    { value: PropertyStatus.Paused, label: 'Pausado' },
  ];

  form!: FormGroup;
  propertyId?: string;
  private originalProperty?: Property;
  uploadedImages: string[] = [];

  ngOnInit(): void {
    // Initialize Supabase Storage
    this.storageService.init(environment.supabaseUrl, environment.supabaseKey);

    this.propertyId = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEditing.set(!!this.propertyId);

    this.initForm();

    if (this.isEditing() && this.propertyId) {
      this.loadProperty(this.propertyId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      type: [PropertyType.Apartment, [Validators.required]],
      listingType: [ListingType.ForSale, [Validators.required]],
      status: [PropertyStatus.Available, [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      condoFee: [0],
      bedrooms: [0, [Validators.min(0)]],
      bathrooms: [0, [Validators.min(0)]],
      parkingSpots: [0, [Validators.min(0)]],
      areaSqm: [0, [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required]],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: [''],
      isActive: [true],
      isFeatured: [false],
    });
  }

  private loadProperty(id: string): void {
    this.loading.set(true);
    this.propertyService.getById(id).subscribe({
      next: (property) => {
        this.originalProperty = property;
        this.uploadedImages = (property.imageUrls || []).filter((url: string) => url && url.trim().length > 0);
        this.form.patchValue(property);
        this.loading.set(false);
      },
      error: () => {
        alert('Erro ao carregar imóvel.');
        this.router.navigate(['/properties']);
      },
    });
  }

  async onFileSelected(event: any): Promise<void> {
    const files: FileList = event.target.files;
    if (!files.length) return;

    this.uploadingImages.set(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Opcional: adicionar validação de tipo/tamanho aqui
        const url = await this.storageService.uploadFile('properties', file);
        this.uploadedImages.push(url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erro ao fazer upload da imagem. Verifique se o bucket "properties" é público.');
    } finally {
      this.uploadingImages.set(false);
      // Reset input file
      event.target.value = '';
    }
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;
    const propertyData: Partial<Property> = {
      ...(this.originalProperty || {}),
      ...formValue,
      id: this.propertyId,
      imageUrls: this.uploadedImages,
    };

    if (this.isEditing()) {
      this.propertyService.update(this.propertyId!, propertyData).subscribe({
        next: () => this.router.navigate(['/properties']),
        error: (err: unknown) => {
          alert('Erro ao atualizar imóvel.');
          console.error(err);
          this.saving.set(false);
        },
      });
    } else {
      this.propertyService.create(propertyData).subscribe({
        next: () => this.router.navigate(['/properties']),
        error: (err: unknown) => {
          alert('Erro ao salvar novo imóvel.');
          console.error(err);
          this.saving.set(false);
        },
      });
    }
  }

  deleteProperty(): void {
    if (!this.isEditing() || !this.propertyId) return;
    
    if (confirm('Tem certeza que deseja excluir este imóvel? Essa ação não pode ser desfeita.')) {
      this.saving.set(true);
      this.propertyService.delete(this.propertyId).subscribe({
        next: () => {
          this.router.navigate(['/properties']);
        },
        error: (err: unknown) => {
          alert('Erro ao excluir imóvel.');
          console.error(err);
          this.saving.set(false);
        }
      });
    }
  }
}

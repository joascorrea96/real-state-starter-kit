import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseStorageService } from '@web-systems/core-data';
import { environment } from '../../environments/environment';
import { CompanyService, CompanySettings } from './company.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly storageService = inject(SupabaseStorageService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingLogo = signal(false);

  form!: FormGroup;
  logoUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.storageService.init(environment.supabaseUrl, environment.supabaseKey);
    this.initForm();
    this.loadSettings();
  }

  private initForm(): void {
    this.form = this.fb.group({
      tradeName: ['', [Validators.required]],
      phone: [''],
      primaryColor: ['#007bff'],
      whatsapp: [''],
      instagram: [''],
      aboutText: [''],
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    this.companyService.getMyCompany().subscribe({
      next: (company) => {
        let settings: any = {};
        if (company.settingsJson) {
          try {
            settings = JSON.parse(company.settingsJson);
          } catch (e) {
            console.error('Failed to parse settings JSON', e);
          }
        }

        this.logoUrl.set(settings.logoUrl || null);

        this.form.patchValue({
          tradeName: company.tradeName || '',
          phone: company.phone || '',
          primaryColor: settings.primaryColor || '#007bff',
          whatsapp: settings.whatsapp || '',
          instagram: settings.instagram || '',
          aboutText: settings.aboutText || '',
        });

        this.loading.set(false);
      },
      error: () => {
        alert('Erro ao carregar configurações.');
        this.loading.set(false);
      }
    });
  }

  async onLogoSelected(event: any): Promise<void> {
    const files: FileList = event.target.files;
    if (!files.length) return;

    this.uploadingLogo.set(true);
    const file = files[0];

    try {
      const url = await this.storageService.uploadFile('properties', file);
      this.logoUrl.set(url);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erro ao fazer upload da imagem. O bucket "properties" está público?');
    } finally {
      this.uploadingLogo.set(false);
      event.target.value = '';
    }
  }

  removeLogo(): void {
    this.logoUrl.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const val = this.form.value;

    const settingsJson = JSON.stringify({
      logoUrl: this.logoUrl(),
      primaryColor: val.primaryColor,
      whatsapp: val.whatsapp,
      instagram: val.instagram,
      aboutText: val.aboutText,
    });

    const data: CompanySettings = {
      tradeName: val.tradeName,
      phone: val.phone,
      settingsJson: settingsJson,
    };

    this.companyService.updateMyCompany(data).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao salvar configurações.');
        this.saving.set(false);
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PublicCompanyService } from './services/public-company.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly companyService = inject(PublicCompanyService);

  readonly companyName = signal<string>('Imóveis');
  readonly whatsappLink = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly instagramUrl = signal<string | null>(null);
  readonly aboutText = signal<string | null>(null);
  readonly phoneStr = signal<string | null>(null);

  constructor() {
    this.companyService.getCompany().subscribe({
      next: (company) => {
        this.companyName.set(company.tradeName);
        this.phoneStr.set(company.phone || null);
        
        let settings: any = {};
        if (company.settingsJson) {
          try {
            settings = JSON.parse(company.settingsJson);
          } catch (e) { }
        }

        this.logoUrl.set(settings.logoUrl || null);
        this.instagramUrl.set(settings.instagram || null);
        this.aboutText.set(settings.aboutText || null);
        
        const whatsappNumber = settings.whatsapp || company.phone;
        if (whatsappNumber) {
          const digitsOnly = whatsappNumber.replace(/\D/g, '');
          this.whatsappLink.set(`https://wa.me/55${digitsOnly}`); // Assume BR country code if missing
        }

        if (settings.primaryColor && typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
          document.documentElement.style.setProperty('--color-accent', settings.primaryColor);
          const contrast = this.getContrastColor(settings.primaryColor);
          document.documentElement.style.setProperty('--color-primary-contrast', contrast);
          document.documentElement.style.setProperty('--color-accent-contrast', contrast);
        }
      },
      error: () => {},
    });
  }

  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 128 ? '#1c1f1c' : '#ffffff';
    }
    return '#ffffff';
  }
}

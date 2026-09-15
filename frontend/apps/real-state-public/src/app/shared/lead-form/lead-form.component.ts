import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicLeadService } from '../../services/public-lead.service';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lead-form.component.html',
  styleUrl: './lead-form.component.scss',
})
export class LeadFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadService = inject(PublicLeadService);

  /** Omit to use this as a general "contact us" form instead of a property-specific one. */
  readonly propertyId = input<string | undefined>(undefined);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    message: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    this.leadService
      .create({
        name: raw.name,
        phone: raw.phone,
        email: raw.email || undefined,
        message: raw.message || undefined,
        propertyId: this.propertyId(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.form.reset();
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Não foi possível enviar. Tente novamente em instantes.');
        },
      });
  }
}

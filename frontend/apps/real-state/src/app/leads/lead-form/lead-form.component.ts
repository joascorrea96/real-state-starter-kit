import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Lead, LeadStatus, User } from '@web-systems/core-data';
import { LeadService } from '../lead.service';
import { UserService } from '../../users/user.service';
import { AuthService } from '@web-systems/core-auth';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './lead-form.component.html',
  styleUrl: './lead-form.component.scss',
})
export class LeadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadService = inject(LeadService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly users = signal<User[]>([]);
  readonly isAdmin = signal(false);

  readonly statuses = [
    { value: LeadStatus.New, label: 'Novo' },
    { value: LeadStatus.Contacted, label: 'Contatado' },
    { value: LeadStatus.Qualified, label: 'Visita / Qualificado' },
    { value: LeadStatus.Lost, label: 'Perdido' },
    { value: LeadStatus.Converted, label: 'Ganho / Vendido' },
  ];

  getStatusLabel(value: LeadStatus): string {
    return this.statuses.find(s => s.value === value)?.label || value;
  }

  form!: FormGroup;
  leadId?: string;
  originalLead?: Lead;

  ngOnInit(): void {
    this.leadId = this.route.snapshot.paramMap.get('id') ?? undefined;
    
    const userRole = this.authService.currentUser()?.role;
    this.isAdmin.set(userRole === 'CompanyAdmin' || userRole === 'SuperAdmin');

    this.initForm();

    if (this.isAdmin()) {
      this.loadUsers();
    }

    if (this.leadId) {
      this.loadLead(this.leadId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      status: [LeadStatus.New, [Validators.required]],
      assignedUserId: [{ value: '', disabled: !this.isAdmin() }],
    });
  }

  private loadUsers(): void {
    // Load brokers for assignment dropdown
    this.userService.getPaged({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        // Only allow assigning to Employees or CompanyAdmins
        this.users.set(result.items);
      }
    });
  }

  private loadLead(id: string): void {
    this.loading.set(true);
    this.leadService.getById(id).subscribe({
      next: (lead) => {
        this.originalLead = lead;
        this.form.patchValue({
          status: lead.status,
          assignedUserId: lead.assignedUserId || '',
        });
        this.loading.set(false);
      },
      error: () => {
        alert('Erro ao carregar lead.');
        this.router.navigate(['/leads']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.originalLead) {
      return;
    }

    this.saving.set(true);

    const formValue = this.form.getRawValue(); // getRawValue to get disabled fields too
    const leadData: Partial<Lead> = {
      ...this.originalLead,
      status: formValue.status,
      assignedUserId: formValue.assignedUserId || null,
    };

    this.leadService.update(this.leadId!, leadData).subscribe({
      next: () => this.router.navigate(['/leads']),
      error: (err: unknown) => {
        alert('Erro ao atualizar lead.');
        console.error(err);
        this.saving.set(false);
      },
    });
  }
}

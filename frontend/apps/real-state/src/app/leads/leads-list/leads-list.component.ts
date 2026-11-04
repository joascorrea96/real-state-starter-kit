import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import {
  DEFAULT_PAGINATION_FILTER,
  Lead,
  LeadStatus,
  PagedResult,
  PaginationFilter,
  User,
} from '@web-systems/core-data';
import {
  BadgeComponent,
  DataTableComponent,
  PaginationBarComponent,
  SearchFilterBarComponent,
  SortChange,
  TableColumn,
} from '@web-systems/core-ui';
import { LeadService } from '../lead.service';
import { UserService } from '../../users/user.service';
import { AuthService } from '@web-systems/core-auth';
import { Router, RouterLink } from '@angular/router';

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'Novo',
  [LeadStatus.Contacted]: 'Contatado',
  [LeadStatus.Qualified]: 'Visita / Qualificado',
  [LeadStatus.Lost]: 'Perdido',
  [LeadStatus.Converted]: 'Ganho / Vendido',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PaginationBarComponent, SearchFilterBarComponent, BadgeComponent, RouterLink],
  templateUrl: './leads-list.component.html',
  styleUrl: './leads-list.component.scss',
})
export class LeadsListComponent implements OnInit {
  private readonly leadService = inject(LeadService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('userTemplate', { static: true }) userTemplate!: TemplateRef<any>;

  readonly statuses = Object.values(LeadStatus);
  readonly statusLabel = (status: LeadStatus) => STATUS_LABELS[status] || status;

  readonly users = signal<User[]>([]);
  readonly isAdmin = signal(false);

  // Controle de qual dropdown está aberto: { leadId, type: 'status' | 'user' }
  readonly activeDropdown = signal<{ leadId: string; type: 'status' | 'user' } | null>(null);

  // Controle de período personalizado (datas de início e fim)
  readonly isCustomPeriod = signal(false);

  columns: TableColumn<Lead>[] = [];

  readonly result = signal<PagedResult<Lead> | null>(null);
  readonly loading = signal(false);

  private filter: PaginationFilter = { ...DEFAULT_PAGINATION_FILTER, pageSize: 10, sortBy: 'createdAt', sortDescending: true };
  private customFilters: Record<string, string> = {};

  ngOnInit(): void {
    const userRole = this.authService.currentUser()?.role;
    this.isAdmin.set(userRole === 'CompanyAdmin' || userRole === 'SuperAdmin');

    this.columns = [
      { key: 'name', label: 'Nome', sortable: true },
      { key: 'phone', label: 'Telefone' },
      {
        key: 'status',
        label: 'Status',
        template: this.statusTemplate,
        formatter: (row) => this.statusLabel(row.status),
      },
      {
        key: 'assignedUser',
        label: 'Responsável',
        template: this.userTemplate,
        formatter: (row) => row.assignedUser?.name || 'Não atribuído',
      },
      {
        key: 'createdAt',
        label: 'Recebido em',
        sortable: true,
        formatter: (row) => dateFormatter.format(new Date(row.createdAt)),
      },
    ];

    if (this.isAdmin()) {
      this.loadUsers();
    }

    this.fetch();
  }

  private loadUsers(): void {
    this.userService.getPaged({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (res) => this.users.set(res.items),
      error: (err) => console.error('Erro ao carregar corretores', err),
    });
  }

  toggleDropdown(leadId: string, type: 'status' | 'user', event: MouseEvent): void {
    event.stopPropagation();
    const current = this.activeDropdown();
    if (current?.leadId === leadId && current?.type === type) {
      this.activeDropdown.set(null);
    } else {
      this.activeDropdown.set({ leadId, type });
    }
  }

  isDropdownOpen(leadId: string, type: 'status' | 'user'): boolean {
    const current = this.activeDropdown();
    return current?.leadId === leadId && current?.type === type;
  }

  closeDropdowns(): void {
    this.activeDropdown.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeDropdowns();
  }

  onSelectStatus(lead: Lead, newStatus: LeadStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.closeDropdowns();

    if (lead.status === newStatus) return;

    const previousStatus = lead.status;
    lead.status = newStatus;

    const payload = {
      id: lead.id,
      companyId: lead.companyId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      propertyId: lead.propertyId,
      status: newStatus,
      assignedUserId: lead.assignedUserId,
    };

    this.leadService.update(lead.id, payload as any).subscribe({
      error: (err) => {
        console.error('Erro ao atualizar status', err);
        lead.status = previousStatus;
        alert('Erro ao atualizar status do lead.');
      },
    });
  }

  onSelectUser(lead: Lead, newUserId: string | null, event: MouseEvent): void {
    event.stopPropagation();
    this.closeDropdowns();

    const targetUserId = newUserId || undefined;
    if (lead.assignedUserId === targetUserId) return;

    const previousAssignedUserId = lead.assignedUserId;
    const previousAssignedUser = lead.assignedUser;

    const selectedUser = this.users().find((u) => u.id === targetUserId);
    lead.assignedUserId = targetUserId;
    lead.assignedUser = selectedUser ? { id: selectedUser.id, name: selectedUser.name } : undefined;

    const payload = {
      id: lead.id,
      companyId: lead.companyId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      propertyId: lead.propertyId,
      status: lead.status,
      assignedUserId: targetUserId ?? null,
    };

    this.leadService.update(lead.id, payload as any).subscribe({
      error: (err) => {
        console.error('Erro ao atualizar responsável', err);
        lead.assignedUserId = previousAssignedUserId;
        lead.assignedUser = previousAssignedUser;
        alert('Erro ao atualizar responsável do lead.');
      },
    });
  }

  onRowClick(lead: Lead): void {
    this.router.navigate(['/leads', lead.id, 'edit']);
  }

  onSearchChange(term: string): void {
    this.filter = { ...this.filter, pageNumber: 1, searchTerm: term || undefined };
    this.fetch();
  }

  onStatusFilterChange(value: string): void {
    if (value) {
      this.customFilters = { ...this.customFilters, status: value };
    } else {
      const { status, ...rest } = this.customFilters;
      this.customFilters = rest;
    }
    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  onUserFilterChange(userId: string): void {
    if (userId) {
      this.customFilters = { ...this.customFilters, assignedUserId: userId };
    } else {
      const { assignedUserId, ...rest } = this.customFilters;
      this.customFilters = rest;
    }
    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  onPeriodSelectChange(period: string): void {
    const { startDate, endDate, ...rest } = this.customFilters;
    this.customFilters = rest;

    if (period === 'custom') {
      this.isCustomPeriod.set(true);
      return;
    }

    this.isCustomPeriod.set(false);
    const now = new Date();

    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      this.customFilters = { ...this.customFilters, startDate: start.toISOString(), endDate: end.toISOString() };
    } else if (period === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      this.customFilters = { ...this.customFilters, startDate: start.toISOString(), endDate: end.toISOString() };
    } else if (period === 'last7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      this.customFilters = { ...this.customFilters, startDate: start.toISOString() };
    } else if (period === 'last30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      this.customFilters = { ...this.customFilters, startDate: start.toISOString() };
    } else if (period === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      this.customFilters = { ...this.customFilters, startDate: start.toISOString() };
    } else if (period === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      this.customFilters = { ...this.customFilters, startDate: start.toISOString(), endDate: end.toISOString() };
    }

    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  onCustomStartDateChange(dateStr: string): void {
    if (dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      this.customFilters = { ...this.customFilters, startDate: d.toISOString() };
    } else {
      const { startDate, ...rest } = this.customFilters;
      this.customFilters = rest;
    }
    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  onCustomEndDateChange(dateStr: string): void {
    if (dateStr) {
      const d = new Date(dateStr + 'T23:59:59.999');
      this.customFilters = { ...this.customFilters, endDate: d.toISOString() };
    } else {
      const { endDate, ...rest } = this.customFilters;
      this.customFilters = rest;
    }
    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  onSortChange(sort: SortChange): void {
    this.filter = { ...this.filter, sortBy: sort.sortBy, sortDescending: sort.sortDescending, pageNumber: 1 };
    this.fetch();
  }

  onPageChange(pageNumber: number): void {
    this.filter = { ...this.filter, pageNumber };
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.leadService.getPaged(this.filter).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

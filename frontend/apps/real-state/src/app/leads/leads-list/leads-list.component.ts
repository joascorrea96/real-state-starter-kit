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

  // Modo de visualização: Kanban (Funil) ou Lista
  readonly viewMode = signal<'kanban' | 'list'>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('leads_view_mode') as 'kanban' | 'list')) || 'kanban'
  );

  // Drag and Drop do Kanban
  readonly draggedLead = signal<Lead | null>(null);
  readonly dragOverColumn = signal<LeadStatus | null>(null);

  columns: TableColumn<Lead>[] = [];

  readonly result = signal<PagedResult<Lead> | null>(null);
  readonly loading = signal(false);

  private filter: PaginationFilter = { ...DEFAULT_PAGINATION_FILTER, pageSize: 10, sortBy: 'createdAt', sortDescending: true };
  private customFilters: Record<string, string> = {};

  ngOnInit(): void {
    const userRole = this.authService.currentUser()?.role;
    this.isAdmin.set(userRole === 'CompanyAdmin' || userRole === 'SuperAdmin');

    if (this.viewMode() === 'kanban') {
      this.filter.pageSize = 100;
    }

    this.columns = [
      { key: 'name', label: 'Nome', sortable: true },
      { key: 'phone', label: 'Telefone' },
      {
        key: 'status',
        label: 'Fase de Atendimento',
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

  setViewMode(mode: 'kanban' | 'list'): void {
    this.viewMode.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('leads_view_mode', mode);
    }
    this.filter.pageSize = mode === 'kanban' ? 100 : 10;
    this.filter.pageNumber = 1;
    this.fetch();
  }

  getLeadsByStatus(status: LeadStatus): Lead[] {
    const items = this.result()?.items ?? [];
    return items.filter((l) => l.status === status);
  }

  openLead(lead: Lead): void {
    this.router.navigate(['/leads', lead.id, 'edit']);
  }

  onDragStart(lead: Lead, event: DragEvent): void {
    this.draggedLead.set(lead);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', lead.id);
    }
  }

  onDragOver(status: LeadStatus, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverColumn() !== status) {
      this.dragOverColumn.set(status);
    }
  }

  onDragLeave(status: LeadStatus, event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (!related || !target.contains(related)) {
      if (this.dragOverColumn() === status) {
        this.dragOverColumn.set(null);
      }
    }
  }

  onDragEnd(): void {
    this.draggedLead.set(null);
    this.dragOverColumn.set(null);
  }

  onDrop(targetStatus: LeadStatus, event: DragEvent): void {
    event.preventDefault();
    const lead = this.draggedLead();
    this.dragOverColumn.set(null);
    this.draggedLead.set(null);

    if (!lead || lead.status === targetStatus) return;

    const previousStatus = lead.status;
    lead.status = targetStatus;

    const payload = {
      id: lead.id,
      companyId: lead.companyId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      propertyId: lead.propertyId,
      status: targetStatus,
      assignedUserId: lead.assignedUserId,
    };

    this.leadService.update(lead.id, payload as any).subscribe({
      error: (err) => {
        console.error('Erro ao mover lead', err);
        lead.status = previousStatus;
        alert('Não foi possível mover o lead de fase.');
      },
    });
  }

  formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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

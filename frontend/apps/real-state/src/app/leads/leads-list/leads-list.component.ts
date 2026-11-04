import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
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
  readonly statusLabel = (status: LeadStatus) => STATUS_LABELS[status];

  readonly users = signal<User[]>([]);
  readonly isAdmin = signal(false);

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

  onRowClick(lead: Lead): void {
    this.router.navigate(['/leads', lead.id, 'edit']);
  }

  onSearchChange(term: string): void {
    this.filter = { ...this.filter, pageNumber: 1, searchTerm: term || undefined };
    this.fetch();
  }

  onStatusFilterChange(value: string): void {
    this.customFilters = { ...this.customFilters, status: value };
    this.filter = { ...this.filter, pageNumber: 1, filters: this.customFilters };
    this.fetch();
  }

  onStatusSelectChange(lead: Lead, newStatus: string): void {
    const status = newStatus as LeadStatus;
    if (lead.status === status) return;

    const previousStatus = lead.status;
    lead.status = status;

    this.leadService.update(lead.id, {
      ...lead,
      status: status,
    }).subscribe({
      error: (err) => {
        console.error('Erro ao atualizar status', err);
        lead.status = previousStatus;
        alert('Erro ao atualizar status do lead.');
      },
    });
  }

  onAssignedUserSelectChange(lead: Lead, newUserId: string): void {
    const assignedUserId = newUserId ? newUserId : null;
    if (lead.assignedUserId === assignedUserId) return;

    const previousAssignedUserId = lead.assignedUserId;
    const previousAssignedUser = lead.assignedUser;

    const selectedUser = this.users().find((u) => u.id === assignedUserId);
    lead.assignedUserId = assignedUserId ?? undefined;
    lead.assignedUser = selectedUser ? { id: selectedUser.id, name: selectedUser.name } : undefined;

    this.leadService.update(lead.id, {
      ...lead,
      assignedUserId: assignedUserId ?? undefined,
    }).subscribe({
      error: (err) => {
        console.error('Erro ao atualizar responsável', err);
        lead.assignedUserId = previousAssignedUserId;
        lead.assignedUser = previousAssignedUser;
        alert('Erro ao atualizar responsável do lead.');
      },
    });
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

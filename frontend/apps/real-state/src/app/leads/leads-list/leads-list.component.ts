import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  DEFAULT_PAGINATION_FILTER,
  Lead,
  LeadStatus,
  PagedResult,
  PaginationFilter,
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
export class LeadsListComponent {
  private readonly leadService = inject(LeadService);
  private readonly router = inject(Router);

  readonly statuses = Object.values(LeadStatus);
  readonly statusLabel = (status: LeadStatus) => STATUS_LABELS[status];

  readonly columns: TableColumn<Lead>[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'phone', label: 'Telefone' },
    { key: 'status', label: 'Status', formatter: (row) => this.statusLabel(row.status) },
    {
      key: 'assignedUser',
      label: 'Responsável',
      formatter: (row) => row.assignedUser?.name || 'Não atribuído',
    },
    {
      key: 'createdAt',
      label: 'Recebido em',
      sortable: true,
      formatter: (row) => dateFormatter.format(new Date(row.createdAt)),
    },
  ];

  readonly result = signal<PagedResult<Lead> | null>(null);
  readonly loading = signal(false);

  private filter: PaginationFilter = { ...DEFAULT_PAGINATION_FILTER, pageSize: 10, sortBy: 'createdAt', sortDescending: true };
  private customFilters: Record<string, string> = {};

  constructor() {
    this.fetch();
  }

  onRowClick(lead: Lead): void {
    this.router.navigate(['/leads', lead.id, 'edit']);
  }

  onSearchChange(term: string): void {
    this.filter = { ...this.filter, pageNumber: 1, searchTerm: term || undefined };
    this.fetch();
  }

  onStatusChange(value: string): void {
    this.customFilters = { ...this.customFilters, status: value };
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

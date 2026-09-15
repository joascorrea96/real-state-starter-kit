import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableColumn } from './table-column.model';

export interface SortChange {
  sortBy: string;
  sortDescending: boolean;
}

/**
 * Generic, reusable data table: every listing screen in every vertical
 * (customers, properties, products, members...) renders through this
 * same component, only swapping the `columns` and `rows` inputs. This is
 * the direct Angular counterpart of the backend's GenericService<T> —
 * it's what keeps the "we always need a searchable/sortable/paginated
 * list" pillar from being rebuilt per business.
 */
@Component({
  selector: 'ws-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends object> {
  @Input({ required: true }) columns: TableColumn<T>[] = [];
  @Input({ required: true }) rows: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'Nenhum registro encontrado.';
  @Input() skeletonRows = 5;
  @Input() sortBy?: string;
  @Input() sortDescending = false;
  @Input() trackByKey = 'id';

  @Output() sortChange = new EventEmitter<SortChange>();
  @Output() rowClick = new EventEmitter<T>();

  onHeaderClick(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const descending = this.sortBy === column.key ? !this.sortDescending : false;
    this.sortChange.emit({ sortBy: column.key, sortDescending: descending });
  }

  cellValue(column: TableColumn<T>, row: T): string {
    if (column.formatter) return column.formatter(row);
    const value = (row as Record<string, unknown>)[column.key];
    return value === null || value === undefined ? '—' : String(value);
  }

  trackRow = (_: number, row: T): unknown => (row as Record<string, unknown>)[this.trackByKey] ?? row;

  get skeletonRowsArray(): number[] {
    return Array.from({ length: this.skeletonRows }, (_, i) => i);
  }
}

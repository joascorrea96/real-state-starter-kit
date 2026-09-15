import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Reusable pager, driven entirely by PagedResult<T> fields. Every listing
 * screen in every vertical wires this the same way:
 *   <ws-pagination-bar [pageNumber]="result.pageNumber" [totalPages]="result.totalPages"
 *     [hasPreviousPage]="result.hasPreviousPage" [hasNextPage]="result.hasNextPage"
 *     (pageChange)="onPageChange($event)" />
 */
@Component({
  selector: 'ws-pagination-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination-bar.component.html',
  styleUrl: './pagination-bar.component.scss',
})
export class PaginationBarComponent {
  @Input({ required: true }) pageNumber = 1;
  @Input({ required: true }) totalPages = 1;
  @Input() totalCount = 0;
  @Input() hasPreviousPage = false;
  @Input() hasNextPage = false;

  @Output() pageChange = new EventEmitter<number>();

  goToPrevious(): void {
    if (this.hasPreviousPage) this.pageChange.emit(this.pageNumber - 1);
  }

  goToNext(): void {
    if (this.hasNextPage) this.pageChange.emit(this.pageNumber + 1);
  }
}

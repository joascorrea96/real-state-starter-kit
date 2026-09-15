import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

/**
 * Free-text search input shared by every listing screen. Debounces
 * keystrokes before emitting, so the paged HTTP call isn't fired on
 * every character. Vertical-specific filters (price range, property
 * type, etc.) are projected via <ng-content> instead of being props
 * here, so this component never needs to know about any module.
 *
 * Usage:
 *   <ws-search-filter-bar placeholder="Buscar imóveis..." (searchChange)="onSearch($event)">
 *     <select (change)="onTypeChange($event)">...</select>
 *   </ws-search-filter-bar>
 */
@Component({
  selector: 'ws-search-filter-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-filter-bar.component.html',
  styleUrl: './search-filter-bar.component.scss',
})
export class SearchFilterBarComponent implements OnDestroy {
  @Input() initialSearch = '';
  @Input() placeholder = 'Buscar...';
  @Input() debounceMs = 350;

  @Output() searchChange = new EventEmitter<string>();

  private readonly inputSubject = new Subject<string>();
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = this.inputSubject
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged())
      .subscribe((value) => this.searchChange.emit(value));
  }

  onInput(value: string): void {
    this.inputSubject.next(value.trim());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

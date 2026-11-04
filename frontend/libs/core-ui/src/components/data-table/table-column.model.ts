import { TemplateRef } from '@angular/core';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Custom cell rendering; defaults to `String(row[key])` when omitted. */
  formatter?: (row: T) => string;
  /** Optional custom template for rich interactive cells. */
  template?: TemplateRef<any>;
  align?: 'left' | 'right' | 'center';
}

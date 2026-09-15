export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Custom cell rendering; defaults to `String(row[key])` when omitted. */
  formatter?: (row: T) => string;
  align?: 'left' | 'right' | 'center';
}

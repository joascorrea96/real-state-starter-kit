import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/**
 * Small status pill used across every vertical: "For Sale" / "For Rent",
 * "Active" / "Inactive", "Pending" / "Confirmed", etc.
 */
@Component({
  selector: 'ws-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="ws-badge" [class]="'tone-' + tone"><ng-content></ng-content></span>`,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
}

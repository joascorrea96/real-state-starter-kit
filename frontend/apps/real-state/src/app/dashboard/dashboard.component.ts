import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardSummary } from '@web-systems/core-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  
  summary = signal<DashboardSummary | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard summary', err);
        this.error.set('Erro ao carregar o resumo do dashboard.');
        this.loading.set(false);
      }
    });
  }

  getLeadStatusName(statusStr: string): string {
    const statusMap: Record<string, string> = {
      'New': 'Novo',
      'Contacted': 'Contatado',
      'Qualified': 'Qualificado',
      'Lost': 'Perdido',
      'Converted': 'Convertido'
    };
    return statusMap[statusStr] || statusStr;
  }
}

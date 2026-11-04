import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { WhatsAppConnect, WhatsAppService, WhatsAppStatus } from '../whatsapp.service';

@Component({
  selector: 'app-whatsapp-connection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-connection.component.html',
  styleUrl: './whatsapp-connection.component.scss',
})
export class WhatsAppConnectionComponent implements OnInit, OnDestroy {
  private readonly whatsappService = inject(WhatsAppService);

  readonly loading = signal(true);
  readonly status = signal<WhatsAppStatus | null>(null);
  readonly connecting = signal(false);
  readonly qrCode = signal<string | null>(null);
  readonly actionLoading = signal(false);

  private pollTimer: any = null;

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadStatus(): void {
    this.loading.set(true);
    this.whatsappService.getStatus().subscribe({
      next: (res) => {
        this.status.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao verificar status do WhatsApp', err);
        this.loading.set(false);
      },
    });
  }

  startConnect(): void {
    this.actionLoading.set(true);
    this.whatsappService.connect().subscribe({
      next: (res: WhatsAppConnect) => {
        this.actionLoading.set(false);
        if (res.state === 'open') {
          this.loadStatus();
          return;
        }

        if (res.qrCodeBase64) {
          this.qrCode.set(res.qrCodeBase64);
          this.connecting.set(true);
          this.startPolling();
        } else {
          alert('Não foi possível gerar o QR Code no momento. Tente novamente em alguns segundos.');
        }
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error('Erro ao conectar WhatsApp', err);
        alert('Erro ao comunicar com o servidor do WhatsApp.');
      },
    });
  }

  cancelConnect(): void {
    this.stopPolling();
    this.connecting.set(false);
    this.qrCode.set(null);
    this.loadStatus();
  }

  disconnect(): void {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp da imobiliária? As novas mensagens não serão mais sincronizadas até reconectar.')) {
      return;
    }

    this.actionLoading.set(true);
    this.whatsappService.disconnect().subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.status.set(null);
        this.connecting.set(false);
        this.qrCode.set(null);
        this.loadStatus();
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error('Erro ao desconectar WhatsApp', err);
        alert('Erro ao desconectar WhatsApp.');
      },
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.whatsappService.getStatus().subscribe({
        next: (res) => {
          this.status.set(res);
          if (res.isConnected) {
            this.stopPolling();
            this.connecting.set(false);
            this.qrCode.set(null);
          }
        },
        error: (err) => console.error('Erro no polling de status', err),
      });
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  formatPhone(phone?: string): string {
    if (!phone) return '';
    // Format 5547999999999 to +55 (47) 99999-9999
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    }
    if (clean.length === 12 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 8)}-${clean.substring(8)}`;
    }
    return phone;
  }
}

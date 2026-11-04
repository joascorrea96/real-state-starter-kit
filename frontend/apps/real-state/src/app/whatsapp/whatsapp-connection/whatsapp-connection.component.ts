import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WhatsAppConnect, WhatsAppConversation, WhatsAppMessage, WhatsAppService, WhatsAppStatus } from '../whatsapp.service';

@Component({
  selector: 'app-whatsapp-connection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './whatsapp-connection.component.html',
  styleUrl: './whatsapp-connection.component.scss',
})
export class WhatsAppConnectionComponent implements OnInit, OnDestroy {
  private readonly whatsappService = inject(WhatsAppService);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  readonly loading = signal(true);
  readonly status = signal<WhatsAppStatus | null>(null);
  readonly connecting = signal(false);
  readonly qrCode = signal<string | null>(null);
  readonly actionLoading = signal(false);

  readonly activeTab = signal<'conversations' | 'connection'>('conversations');

  readonly conversations = signal<WhatsAppConversation[]>([]);
  readonly selectedConversation = signal<WhatsAppConversation | null>(null);
  readonly messages = signal<WhatsAppMessage[]>([]);
  readonly loadingConversations = signal(false);
  readonly loadingMessages = signal(false);
  readonly sendingMessage = signal(false);

  searchQuery = '';
  newMessage = '';

  private pollTimer: any = null;

  ngOnInit(): void {
    this.loadStatus(true);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  setTab(tab: 'conversations' | 'connection'): void {
    this.activeTab.set(tab);
    if (tab === 'conversations') {
      this.loadConversations(true);
    }
  }

  loadStatus(isInitial = false): void {
    this.loading.set(true);
    this.whatsappService.getStatus().subscribe({
      next: (res) => {
        this.status.set(res);
        this.loading.set(false);

        if (res.isConnected) {
          if (isInitial) {
            this.activeTab.set('conversations');
          }
          this.loadConversations(true);
          this.startConversationsPolling();
        } else {
          this.activeTab.set('connection');
        }
      },
      error: (err) => {
        console.error('Erro ao verificar status do WhatsApp', err);
        this.loading.set(false);
      },
    });
  }

  loadConversations(selectFirstIfEmpty = false): void {
    this.loadingConversations.set(true);
    this.whatsappService.getConversations().subscribe({
      next: (list) => {
        this.conversations.set(list);
        this.loadingConversations.set(false);

        const currentSelected = this.selectedConversation();
        if (currentSelected) {
          const updated = list.find((c) => this.matchPhone(c.phone, currentSelected.phone));
          if (updated) {
            this.selectedConversation.set(updated);
          }
        } else if (selectFirstIfEmpty && list.length > 0) {
          this.selectConversation(list[0]);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar conversas do WhatsApp', err);
        this.loadingConversations.set(false);
      },
    });
  }

  selectConversation(conv: WhatsAppConversation): void {
    this.selectedConversation.set(conv);
    this.loadMessages(conv.phone);
  }

  loadMessages(phone: string, preserveScroll = false): void {
    this.loadingMessages.set(true);
    this.whatsappService.getConversationMessages(phone).subscribe({
      next: (res) => {
        const previousCount = this.messages().length;
        this.messages.set(res);
        this.loadingMessages.set(false);

        if (!preserveScroll || res.length > previousCount) {
          this.scrollToBottom();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar mensagens da conversa', err);
        this.loadingMessages.set(false);
      },
    });
  }

  sendActiveMessage(): void {
    const current = this.selectedConversation();
    const text = this.newMessage.trim();
    if (!current || !text || this.sendingMessage()) return;

    this.sendingMessage.set(true);
    this.whatsappService.sendConversationMessage(current.phone, text).subscribe({
      next: (msg) => {
        this.newMessage = '';
        this.sendingMessage.set(false);
        this.messages.update((list) => [...list, msg]);
        this.scrollToBottom();
        this.loadConversations(false);
      },
      error: (err) => {
        this.sendingMessage.set(false);
        console.error('Erro ao enviar mensagem', err);
        alert('Não foi possível enviar a mensagem no momento.');
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendActiveMessage();
    }
  }

  get filteredConversations(): WhatsAppConversation[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.conversations();
    return this.conversations().filter(
      (c) =>
        c.contactName.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.lastMessage.toLowerCase().includes(query) ||
        (c.propertyTitle && c.propertyTitle.toLowerCase().includes(query))
    );
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
          this.startStatusPolling();
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
        this.activeTab.set('connection');
        this.loadStatus();
      },
      error: (err) => {
        this.actionLoading.set(false);
        console.error('Erro ao desconectar WhatsApp', err);
        alert('Erro ao desconectar WhatsApp.');
      },
    });
  }

  private startStatusPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.whatsappService.getStatus().subscribe({
        next: (res) => {
          this.status.set(res);
          if (res.isConnected) {
            this.stopPolling();
            this.connecting.set(false);
            this.qrCode.set(null);
            this.activeTab.set('conversations');
            this.loadConversations(true);
            this.startConversationsPolling();
          }
        },
        error: (err) => console.error('Erro no polling de status', err),
      });
    }, 3000);
  }

  private startConversationsPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.activeTab() === 'conversations') {
        this.loadConversations(false);
        const current = this.selectedConversation();
        if (current) {
          this.loadMessages(current.phone, true);
        }
      }
    }, 4000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  formatPhone(phone?: string): string {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    }
    if (clean.length === 12 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 8)}-${clean.substring(8)}`;
    }
    if (clean.length === 11) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
    return phone;
  }

  formatTime(iso?: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`;
  }

  private matchPhone(p1: string, p2: string): boolean {
    const c1 = p1.replace(/\D/g, '');
    const c2 = p2.replace(/\D/g, '');
    const t1 = c1.length >= 8 ? c1.slice(-8) : c1;
    const t2 = c2.length >= 8 ? c2.slice(-8) : c2;
    return t1 === t2;
  }
}

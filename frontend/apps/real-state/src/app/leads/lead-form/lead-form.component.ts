import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Lead, LeadStatus, User } from '@web-systems/core-data';
import { LeadService } from '../lead.service';
import { UserService } from '../../users/user.service';
import { AuthService } from '@web-systems/core-auth';
import { WhatsAppMessage, WhatsAppService, WhatsAppStatus } from '../../whatsapp/whatsapp.service';

const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './lead-form.component.html',
  styleUrl: './lead-form.component.scss',
})
export class LeadFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadService = inject(LeadService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly whatsappService = inject(WhatsAppService);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly users = signal<User[]>([]);
  readonly isAdmin = signal(false);

  // WhatsApp Chat State
  readonly whatsAppStatus = signal<WhatsAppStatus | null>(null);
  readonly messages = signal<WhatsAppMessage[]>([]);
  readonly loadingMessages = signal(false);
  readonly sendingMessage = signal(false);
  newMessage = '';

  private messagePollTimer: any = null;

  readonly statuses = [
    { value: LeadStatus.New, label: 'Novo' },
    { value: LeadStatus.Contacted, label: 'Contatado' },
    { value: LeadStatus.Qualified, label: 'Visita / Qualificado' },
    { value: LeadStatus.Lost, label: 'Perdido' },
    { value: LeadStatus.Converted, label: 'Ganho / Vendido' },
  ];

  getStatusLabel(value: LeadStatus): string {
    return this.statuses.find(s => s.value === value)?.label || value;
  }

  form!: FormGroup;
  leadId?: string;
  originalLead?: Lead;

  ngOnInit(): void {
    this.leadId = this.route.snapshot.paramMap.get('id') ?? undefined;
    
    const userRole = this.authService.currentUser()?.role;
    this.isAdmin.set(userRole === 'CompanyAdmin' || userRole === 'SuperAdmin');

    this.initForm();

    if (this.isAdmin()) {
      this.loadUsers();
    }

    if (this.leadId) {
      this.loadLead(this.leadId);
      this.loadWhatsAppStatus();
      this.loadMessages(this.leadId);
      this.startMessagePolling(this.leadId);
    }
  }

  ngOnDestroy(): void {
    this.stopMessagePolling();
  }

  private initForm(): void {
    this.form = this.fb.group({
      status: [LeadStatus.New, [Validators.required]],
      assignedUserId: [{ value: '', disabled: !this.isAdmin() }],
    });
  }

  private loadUsers(): void {
    this.userService.getPaged({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.users.set(result.items);
      }
    });
  }

  private loadLead(id: string): void {
    this.loading.set(true);
    this.leadService.getById(id).subscribe({
      next: (lead) => {
        this.originalLead = lead;
        this.form.patchValue({
          status: lead.status,
          assignedUserId: lead.assignedUserId || '',
        });
        this.loading.set(false);
      },
      error: () => {
        alert('Erro ao carregar lead.');
        this.router.navigate(['/leads']);
      },
    });
  }

  private loadWhatsAppStatus(): void {
    this.whatsappService.getStatus().subscribe({
      next: (status) => this.whatsAppStatus.set(status),
      error: (err) => console.error('Erro ao verificar status do WhatsApp', err),
    });
  }

  loadMessages(leadId: string): void {
    this.whatsappService.getLeadMessages(leadId).subscribe({
      next: (msgs) => {
        const hadFewer = msgs.length > this.messages().length;
        this.messages.set(msgs);
        if (hadFewer) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (err) => console.error('Erro ao carregar mensagens do WhatsApp', err),
    });
  }

  sendWhatsAppMessage(): void {
    const text = this.newMessage.trim();
    if (!text || !this.leadId || this.sendingMessage()) return;

    if (!this.whatsAppStatus()?.isConnected) {
      alert('O WhatsApp da imobiliária não está conectado. Vá até o menu WhatsApp para conectar antes de enviar mensagens.');
      return;
    }

    this.sendingMessage.set(true);
    this.whatsappService.sendLeadMessage(this.leadId, text).subscribe({
      next: (newMsg) => {
        this.messages.set([...this.messages(), newMsg]);
        this.newMessage = '';
        this.sendingMessage.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err) => {
        this.sendingMessage.set(false);
        console.error('Erro ao enviar mensagem', err);
        alert('Erro ao enviar mensagem pelo WhatsApp. Verifique se o WhatsApp da imobiliária continua conectado.');
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendWhatsAppMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  private startMessagePolling(leadId: string): void {
    this.stopMessagePolling();
    this.messagePollTimer = setInterval(() => {
      this.loadMessages(leadId);
    }, 5000);
  }

  private stopMessagePolling(): void {
    if (this.messagePollTimer) {
      clearInterval(this.messagePollTimer);
      this.messagePollTimer = null;
    }
  }

  formatTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const isToday = new Date().toDateString() === date.toDateString();
      return isToday ? timeFormatter.format(date) : dateTimeFormatter.format(date);
    } catch {
      return '';
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.originalLead) {
      return;
    }

    this.saving.set(true);

    const formValue = this.form.getRawValue();
    const leadData = {
      id: this.originalLead.id,
      companyId: this.originalLead.companyId,
      name: this.originalLead.name,
      phone: this.originalLead.phone,
      email: this.originalLead.email,
      message: this.originalLead.message,
      propertyId: this.originalLead.propertyId,
      status: formValue.status,
      assignedUserId: formValue.assignedUserId || null,
    };

    this.leadService.update(this.leadId!, leadData).subscribe({
      next: () => this.router.navigate(['/leads']),
      error: (err: unknown) => {
        alert('Erro ao atualizar lead.');
        console.error(err);
        this.saving.set(false);
      },
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WhatsAppStatus {
  state: 'open' | 'connecting' | 'close';
  isConnected: boolean;
  phoneNumber?: string;
  profileName?: string;
  profilePictureUrl?: string;
}

export interface WhatsAppConnect {
  state: string;
  qrCodeBase64?: string;
  pairingCode?: string;
}

export interface WhatsAppMessage {
  id: string;
  leadId?: string;
  phone: string;
  fromMe: boolean;
  senderName?: string;
  messageText: string;
  messageType?: string;
  status: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/whatsapp`;

  getStatus(): Observable<WhatsAppStatus> {
    return this.http.get<WhatsAppStatus>(`${this.baseUrl}/status`);
  }

  connect(): Observable<WhatsAppConnect> {
    return this.http.post<WhatsAppConnect>(`${this.baseUrl}/connect`, {});
  }

  disconnect(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/disconnect`, {});
  }

  getLeadMessages(leadId: string): Observable<WhatsAppMessage[]> {
    return this.http.get<WhatsAppMessage[]>(`${this.baseUrl}/leads/${leadId}/messages`);
  }

  sendLeadMessage(leadId: string, message: string): Observable<WhatsAppMessage> {
    return this.http.post<WhatsAppMessage>(`${this.baseUrl}/leads/${leadId}/messages`, { message });
  }
}

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
}

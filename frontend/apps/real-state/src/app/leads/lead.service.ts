import { Injectable } from '@angular/core';
import { GenericApiService, Lead } from '@web-systems/core-data';

@Injectable({ providedIn: 'root' })
export class LeadService extends GenericApiService<Lead> {
  constructor() {
    super('leads');
  }
}

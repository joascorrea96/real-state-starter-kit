import { Injectable } from '@angular/core';
import { GenericApiService, Property } from '@web-systems/core-data';

/**
 * The entire real estate module's data layer is this one line of actual
 * logic — everything else (pagination, search, CRUD) comes from
 * GenericApiService. Compare to Modules.RealState.Services.PropertyService
 * on the backend: same idea, same name, opposite side of the wire.
 */
@Injectable({ providedIn: 'root' })
export class PropertyService extends GenericApiService<Property> {
  constructor() {
    super('properties');
  }
}

import { Injectable } from '@angular/core';
import { GenericApiService, User } from '@web-systems/core-data';

@Injectable({ providedIn: 'root' })
export class UserService extends GenericApiService<User> {
  constructor() {
    super('users');
  }
}

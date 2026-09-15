export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  CompanyAdmin = 'CompanyAdmin',
  Employee = 'Employee',
  EndUser = 'EndUser'
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string; // used for sending password on create/update
  role: UserRole;
  isActive: boolean;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

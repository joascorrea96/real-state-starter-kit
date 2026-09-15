export interface LoginRequest {
  email: string;
  password: string;
}

/** Mirrors Api.Auth.LoginResponse from the backend. */
export interface LoginResponse {
  token: string;
  expiresAt: string;
  name: string;
  role: 'SuperAdmin' | 'CompanyAdmin' | 'Employee' | 'EndUser';
  companyId: string;
}

export interface CurrentUser {
  name: string;
  role: LoginResponse['role'];
  companyId: string;
  tokenExpiresAt: string;
}

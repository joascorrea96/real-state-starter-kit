import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@web-systems/core-auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  ngOnInit() {
    const savedEmail = localStorage.getItem('saved_login_email');
    if (savedEmail) {
      this.form.patchValue({ email: savedEmail, rememberMe: true });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.form.getRawValue();

    this.auth.login({ email, password }, rememberMe).subscribe({
      next: () => {
        if (rememberMe) {
          localStorage.setItem('saved_login_email', email);
        } else {
          localStorage.removeItem('saved_login_email');
        }

        this.loading.set(false);
        this.router.navigate(['/properties']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.describeError(err));
      },
    });
  }

  private describeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Não foi possível contactar o servidor. A API está rodando? Confira também bloqueios de CORS no console (F12).';
    }
    if (err.status === 401) {
      return 'Email ou senha inválidos.';
    }
    if (err.status >= 500) {
      return 'Erro no servidor ao tentar entrar. Veja o terminal da API para mais detalhes.';
    }
    return `Erro inesperado (HTTP ${err.status}). Veja o console (F12) para mais detalhes.`;
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { User, UserRole } from '@web-systems/core-data';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly isEditing = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly userRoles = [
    { value: UserRole.Employee, label: 'Corretor (Employee)' },
    { value: UserRole.CompanyAdmin, label: 'Gerente (Admin)' },
  ];

  form!: FormGroup;
  userId?: string;
  private originalUser?: User;

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEditing.set(!!this.userId);
    this.initForm();

    if (this.isEditing() && this.userId) {
      this.loadUser(this.userId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      // Password is required on create, optional on edit
      passwordHash: ['', this.isEditing() ? [] : [Validators.required, Validators.minLength(6)]],
      role: [UserRole.Employee, [Validators.required]],
      isActive: [true],
    });
  }

  private loadUser(id: string): void {
    this.loading.set(true);
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.originalUser = user;
        this.form.patchValue({
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          passwordHash: '' // Do not load password hash
        });
        this.loading.set(false);
      },
      error: () => {
        alert('Erro ao carregar usuário.');
        this.router.navigate(['/users']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.form.value;
    const userData: Partial<User> = {
      ...(this.originalUser || {}),
      name: formValue.name,
      email: formValue.email,
      role: formValue.role,
      isActive: formValue.isActive,
      passwordHash: formValue.passwordHash,
      id: this.userId,
    };

    if (this.isEditing()) {
      this.userService.update(this.userId!, userData).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (err: unknown) => {
          alert('Erro ao atualizar usuário.');
          console.error(err);
          this.saving.set(false);
        },
      });
    } else {
      this.userService.create(userData).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (err: unknown) => {
          alert('Erro ao criar usuário. O email pode já estar em uso.');
          console.error(err);
          this.saving.set(false);
        },
      });
    }
  }

  deleteUser(): void {
    if (!this.isEditing() || !this.userId) return;
    
    if (confirm('Tem certeza que deseja inativar/excluir este usuário?')) {
      this.saving.set(true);
      this.userService.delete(this.userId).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (err: unknown) => {
          alert('Erro ao excluir usuário.');
          console.error(err);
          this.saving.set(false);
        }
      });
    }
  }
}

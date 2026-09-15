import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PagedResult, User } from '@web-systems/core-data';
import { UserService } from '../user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getPaged({ pageNumber: 1, pageSize: 50 }).subscribe({
      next: (result: PagedResult<User>) => {
        this.users.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        alert('Erro ao carregar equipe.');
        this.loading.set(false);
      },
    });
  }
}

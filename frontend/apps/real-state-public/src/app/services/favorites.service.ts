import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly STORAGE_KEY = 'real_state_favorites';
  
  readonly favoriteIds = signal<string[]>(this.loadFavorites());

  toggleFavorite(id: string): void {
    const current = this.favoriteIds();
    const isFav = current.includes(id);
    const updated = isFav ? current.filter(i => i !== id) : [...current, id];
    
    this.favoriteIds.set(updated);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().includes(id);
  }

  private loadFavorites(): string[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

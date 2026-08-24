import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Cart } from './models';
import { finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly api = inject(ApiService); readonly cart = signal<Cart | null>(null); readonly loading = signal(false); readonly count = computed(() => this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0);
  load(): void { this.loading.set(true); this.api.cart().pipe(finalize(() => this.loading.set(false))).subscribe({ next: value => this.cart.set(value), error: () => this.cart.set(null) }); }
  setItem(id: string, quantity: number): void { this.api.setCartItem(id, quantity).subscribe({ next: value => this.cart.set(value) }); }
}

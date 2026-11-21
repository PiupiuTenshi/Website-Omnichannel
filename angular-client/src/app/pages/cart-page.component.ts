import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../core/cart.store';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cart-page app-container">
      <header>
        <h1>Giỏ hàng của bạn</h1>
        <p>Kiểm tra danh sách thực phẩm và nhu yếu phẩm trước khi đặt hàng</p>
      </header>

      @if (cart.loading()) {
        <div class="no-data" style="text-align: center; padding: 3rem;">Đang tải giỏ hàng…</div>
      } @else if (!cart.cart()?.items?.length) {
        <div class="empty-state" style="padding: 4rem 2rem; background: var(--color-surface); border-radius: var(--radius-xl); border: 1px solid var(--color-border); text-align: center;">
          <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">🛒</span>
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Hãy thêm các món đồ tươi ngon vào giỏ hàng ngay nhé!</p>
          <a class="btn-primary hover-lift" routerLink="/">Xem danh mục sản phẩm</a>
        </div>
      } @else {
        <ul class="cart-page__items" role="list">
          @for (item of cart.cart()!.items; track item.productVariantId) {
            <li class="cart-page__item">
              <div>
                <h2>{{ item.name }}</h2>
                <p>Quy cách: {{ item.variantName }}</p>
              </div>

              <div class="cart-page__quantity">
                <button type="button" (click)="change(item.productVariantId, item.quantity - 1)">−</button>
                <span>{{ item.quantity }}</span>
                <button type="button" (click)="change(item.productVariantId, item.quantity + 1)">+</button>
              </div>

              <strong>{{ item.lineTotal | currency:'VND':'symbol':'1.0-0' }}</strong>

              <button
                type="button"
                class="cart-page__delete-btn"
                (click)="change(item.productVariantId, 0)"
                aria-label="Xóa khỏi giỏ"
              >
                Xóa
              </button>
            </li>
          }
        </ul>

        <div class="cart-page__summary">
          <div>
            <span style="display: block; font-size: 0.9rem; color: var(--color-text-muted);">Tổng giá trị đơn hàng:</span>
            <strong>{{ cart.cart()!.subtotal | currency:'VND':'symbol':'1.0-0' }}</strong>
          </div>
          <a class="cart-page__checkout-link hover-lift" routerLink="/checkout">
            Tiến hành đặt hàng →
          </a>
        </div>
      }
    </div>
  `
})
export class CartPageComponent {
  readonly cart = inject(CartStore);

  change(id: string, quantity: number) {
    this.cart.setItem(id, Math.max(0, quantity));
  }
}

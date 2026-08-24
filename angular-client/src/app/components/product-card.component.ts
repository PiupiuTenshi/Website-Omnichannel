import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { CartStore } from '../core/cart.store';
import { ProductListItem } from '../core/models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="product-card">
      <div class="product-card__image-container">
        <a class="product-card__image-link" [routerLink]="['/products', product().slug]" [attr.aria-label]="'Xem ' + product().name">
          @if (api.imageUrl(product().primaryImageUrl); as image) {
            <img class="product-card__image" [src]="image" [alt]="product().name" loading="lazy" />
          } @else {
            <div class="product-card__placeholder" aria-hidden="true">
              <svg class="product-card__placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span>Chưa có ảnh</span>
            </div>
          }
        </a>
        <span class="product-card__category-badge" [class]="getCategoryClass(product().categoryName)">
          {{ product().categoryName }}
        </span>
      </div>

      <div class="product-card__content">
        <h2 class="product-card__title">
          <a [routerLink]="['/products', product().slug]">{{ product().name }}</a>
        </h2>
        <div class="product-card__footer">
          <div class="product-card__price-group">
            <span class="product-card__price">{{ product().sellingPrice | currency:'VND':'symbol':'1.0-0' }}</span>
            @if (product().compareAtPrice && product().compareAtPrice! > product().sellingPrice) {
              <span class="product-card__compare-price">{{ product().compareAtPrice | currency:'VND':'symbol':'1.0-0' }}</span>
            }
            <span class="product-card__unit">/ {{ product().unitName }}</span>
          </div>
          <button
            type="button"
            class="product-card__add-btn"
            [attr.aria-label]="'Thêm ' + product().name + ' vào giỏ hàng'"
            (click)="addToCart()"
            [disabled]="isAdding()"
          >
            <svg class="product-card__add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        @if (addError()) {
          <p class="product-card__add-error" role="alert">{{ addError() }}</p>
        }
      </div>
    </article>
  `
})
export class ProductCardComponent {
  readonly product = input.required<ProductListItem>();
  readonly api = inject(ApiService);
  readonly cart = inject(CartStore);
  readonly isAdding = signal(false);
  readonly addError = signal('');

  addToCart() {
    this.isAdding.set(true);
    this.addError.set('');

    this.api.product(this.product().slug).subscribe({
      next: detail => {
        const variant = detail.variants.find(v => v.isActive);
        if (!variant) {
          this.addError.set('Sản phẩm chưa có quy cách mở bán.');
          this.isAdding.set(false);
          return;
        }
        this.cart.setItem(variant.productVariantId, detail.allowsDecimal ? 0.1 : 1);
        this.isAdding.set(false);
      },
      error: () => {
        this.addError.set('Không thể thêm sản phẩm.');
        this.isAdding.set(false);
      }
    });
  }

  getCategoryClass(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('rau') || name.includes('củ') || name.includes('nấm') || name.includes('veggie')) {
      return 'category--veggies';
    }
    if (name.includes('trái') || name.includes('quả') || name.includes('fruit')) {
      return 'category--fruits';
    }
    if (name.includes('thịt') || name.includes('cá') || name.includes('hải sản') || name.includes('meat')) {
      return 'category--meat';
    }
    if (name.includes('sữa') || name.includes('trứng') || name.includes('dairy')) {
      return 'category--dairy';
    }
    if (name.includes('nước') || name.includes('uống') || name.includes('beverage')) {
      return 'category--beverages';
    }
    if (name.includes('ăn vặt') || name.includes('bánh') || name.includes('snack')) {
      return 'category--snacks';
    }
    return 'category--default';
  }
}

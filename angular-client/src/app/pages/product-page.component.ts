import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { CartStore } from '../core/cart.store';
import { ProductDetail } from '../core/models';
import { errorMessage } from '../core/api-error';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-detail-page app-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a routerLink="/">Trang chủ</a>
        <span class="separator">/</span>
        <a routerLink="/">Sản phẩm</a>
        <span class="separator">/</span>
        <span class="current-item">{{ product()?.name || 'Chi tiết' }}</span>
      </nav>

      @if (error()) {
        <p class="error-message" role="alert">{{ error() }}</p>
      } @else if (!product()) {
        <div class="no-data" style="text-align: center; padding: 3rem;">Đang tải thông tin sản phẩm…</div>
      } @else {
        <article class="product-detail">
          <!-- Left Column: Gallery Image -->
          <div class="product-detail__gallery">
            <div class="product-detail__image-container">
              @if (api.imageUrl(product()!.primaryImageUrl); as image) {
                <img class="product-detail__main-img" [src]="image" [alt]="product()!.name" />
              } @else {
                <div class="product-detail__placeholder">
                  <span style="font-size: 4rem;">📦</span>
                  <span>Chưa có hình ảnh sản phẩm</span>
                </div>
              }
            </div>
          </div>

          <!-- Right Column: Details & Order -->
          <div class="product-detail__content">
            <div>
              <span class="product-detail__cat-tag">{{ product()!.categoryName }}</span>
              <h1 class="product-detail__title">{{ product()!.name }}</h1>
            </div>

            <!-- Pricing Group -->
            <div class="product-detail__price-group">
              <span class="product-detail__price">
                {{ selectedVariantPrice() | currency:'VND':'symbol':'1.0-0' }}
              </span>
              @if (selectedVariantComparePrice(); as comparePrice) {
                <span class="product-detail__compare-price">
                  {{ comparePrice | currency:'VND':'symbol':'1.0-0' }}
                </span>
              }
              <span class="price-unit">/ {{ product()!.unitName }}</span>
            </div>

            <!-- Description -->
            @if (product()!.description) {
              <div class="product-detail__description">
                <h3>Mô tả sản phẩm</h3>
                <p>{{ product()!.description }}</p>
              </div>
            }

            <!-- Variant Selection Pills -->
            <div class="product-detail__variants">
              <h3>Chọn quy cách đóng gói</h3>
              <div class="variant-pills">
                @for (variant of product()!.variants; track variant.productVariantId) {
                  <button
                    type="button"
                    class="variant-pill"
                    [class.active]="selected() === variant.productVariantId"
                    (click)="selected.set(variant.productVariantId)"
                  >
                    <span class="variant-pill__name">{{ variant.name }}</span>
                    <span class="variant-pill__price">{{ variant.sellingPrice | currency:'VND':'symbol':'1.0-0' }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Quantity & Actions -->
            <div class="product-detail__purchase-section">
              <span class="field-label" style="margin: 0;">Số lượng</span>
              <div class="quantity-selector">
                <button type="button" class="qty-btn" (click)="decreaseQuantity()">−</button>
                <span>{{ quantity() }}</span>
                <button type="button" class="qty-btn" (click)="increaseQuantity()">+</button>
              </div>
            </div>

            <button
              type="button"
              class="product-detail__add-button hover-lift"
              [disabled]="!selected() || isAdding()"
              (click)="add()"
            >
              {{ isAdding() ? 'Đang thêm vào giỏ…' : '🛒 Thêm vào giỏ hàng' }}
            </button>

            @if (addedSuccess()) {
              <div class="product-detail__message">
                <span>✓ Đã thêm sản phẩm vào giỏ hàng!</span>
                <a routerLink="/cart" class="cart-redirect-btn">Xem giỏ hàng</a>
              </div>
            }
          </div>
        </article>

        <!-- Commitment Banner -->
        <div class="product-detail__commitments">
          <div class="commitment-card">
            <span class="commitment-icon">🌿</span>
            <h4>Tươi mới 100%</h4>
            <p>Cam kết chất lượng thực phẩm đạt chuẩn an toàn vệ sinh</p>
          </div>
          <div class="commitment-card">
            <span class="commitment-icon">🔄</span>
            <h4>Đổi trả dễ dàng</h4>
            <p>Hỗ trợ đổi trả trong 24h nếu sản phẩm có lỗi</p>
          </div>
          <div class="commitment-card">
            <span class="commitment-icon">🚚</span>
            <h4>Giao hàng siêu tốc</h4>
            <p>Đóng gói và giao tới tay bạn trong vòng 2 giờ</p>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductPageComponent {
  readonly slug = input.required<string>();
  readonly api = inject(ApiService);
  readonly cart = inject(CartStore);

  readonly product = signal<ProductDetail | null>(null);
  readonly selected = signal('');
  readonly quantity = signal(1);
  readonly isAdding = signal(false);
  readonly addedSuccess = signal(false);
  readonly error = signal('');

  ngOnInit() {
    this.api.product(this.slug()).subscribe({
      next: p => {
        this.product.set(p);
        const activeVar = p.variants.find(v => v.isActive);
        this.selected.set(activeVar?.productVariantId ?? '');
      },
      error: e => this.error.set(errorMessage(e))
    });
  }

  selectedVariantPrice(): number {
    const p = this.product();
    if (!p) return 0;
    const v = p.variants.find(candidate => candidate.productVariantId === this.selected());
    return v?.sellingPrice ?? p.sellingPrice;
  }

  selectedVariantComparePrice(): number | null {
    const p = this.product();
    if (!p) return null;
    const v = p.variants.find(candidate => candidate.productVariantId === this.selected());
    return v?.compareAtPrice ?? null;
  }

  increaseQuantity() {
    this.quantity.update(q => q + 1);
  }

  decreaseQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  add() {
    if (!this.selected()) return;
    this.isAdding.set(true);
    this.addedSuccess.set(false);

    this.cart.setItem(this.selected(), this.quantity());
    this.isAdding.set(false);
    this.addedSuccess.set(true);

    setTimeout(() => {
      this.addedSuccess.set(false);
    }, 4000);
  }
}

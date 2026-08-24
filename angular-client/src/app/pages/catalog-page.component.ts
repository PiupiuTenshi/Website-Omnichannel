import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Category, PagedResponse, ProductListItem } from '../core/models';
import { errorMessage } from '../core/api-error';
import { ProductCardComponent } from '../components/product-card.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="catalog-page app-container" aria-labelledby="catalog-heading">
      <!-- Hero Banner -->
      <header class="catalog-page__hero">
        <p>Tạp hóa chị Tỏ</p>
        <h1 id="catalog-heading">Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày</h1>
      </header>

      <!-- Search Bar with Autocomplete -->
      <form class="catalog-page__search-bar" (ngSubmit)="submitSearch()">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            [ngModel]="searchInput()"
            (ngModelChange)="onSearchInputChange($event)"
            name="searchInput"
            placeholder="Tìm rau củ, thịt cá, đồ dùng..."
            autocomplete="off"
          />
          @if (searchInput()) {
            <button
              type="button"
              class="search-clear-btn"
              (click)="clearSearch()"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          }

          <!-- Suggestions Dropdown -->
          @if (showSuggestions()) {
            <div class="search-suggestions" role="listbox" aria-label="Gợi ý sản phẩm">
              @if (suggestions().length > 0) {
                @for (item of suggestions(); track item.productId) {
                  <button
                    type="button"
                    class="suggestion-item"
                    role="option"
                    (click)="goToProduct(item.slug)"
                  >
                    <div class="suggestion-item__img">
                      @if (api.imageUrl(item.primaryImageUrl); as image) {
                        <img [src]="image" alt="" loading="lazy" />
                      } @else {
                        <span class="suggestion-item__placeholder">📦</span>
                      }
                    </div>
                    <div class="suggestion-item__info">
                      <span class="suggestion-item__name">{{ item.name }}</span>
                      <span class="suggestion-item__category">{{ item.categoryName }}</span>
                    </div>
                    <span class="suggestion-item__price">{{ item.sellingPrice | currency:'VND':'symbol':'1.0-0' }}</span>
                  </button>
                }
                <div class="suggestion-footer">
                  <span>Nhấn Enter để xem tất cả kết quả</span>
                </div>
              } @else {
                <div class="suggestion-no-results">
                  Không tìm thấy sản phẩm
                </div>
              }
            </div>
          }
        </div>
      </form>

      <!-- Category Circular Navigation -->
      <div class="catalog-page__category-nav" role="group" aria-label="Lọc theo danh mục">
        <button
          type="button"
          class="cat-circle-btn"
          [class.active]="categoryId() === ''"
          (click)="selectCategory('')"
        >
          <div class="cat-circle bg-surface">🌟</div>
          <span>Tất cả</span>
        </button>
        @for (category of categories(); track category.categoryId) {
          <button
            type="button"
            class="cat-circle-btn"
            [class.active]="categoryId() === category.categoryId"
            (click)="selectCategory(category.categoryId)"
          >
            <div class="cat-circle" [class]="getCategoryBgClass(category.name)">
              {{ getCategoryIcon(category.name) }}
            </div>
            <span>{{ category.name }}</span>
          </button>
        }
      </div>

      <!-- Promotional Banner -->
      <div class="catalog-page__promo-banner">
        <div class="promo-text">
          <h2>Rau củ tươi mỗi sáng, giá rẻ mỗi ngày</h2>
          <p>Thu mua trực tiếp từ nông trại, giao trong 2 giờ</p>
          <button type="button" class="btn-promo hover-lift" (click)="selectCategory('')">Mua ngay</button>
        </div>
        <div class="promo-icon">🛒</div>
      </div>

      <!-- Trust Badges -->
      <div class="catalog-page__trust-badges">
        <div class="trust-badge">
          <span class="trust-icon">💰</span>
          <p>Giá rẻ mỗi ngày</p>
        </div>
        <div class="trust-badge">
          <span class="trust-icon">🥬</span>
          <p>Tươi mới 100%</p>
        </div>
        <div class="trust-badge">
          <span class="trust-icon">⏱️</span>
          <p>Giao nhanh 2 giờ</p>
        </div>
        <div class="trust-badge">
          <span class="trust-icon">🏪</span>
          <p>Chỉ 1 cửa hàng duy nhất</p>
        </div>
      </div>

      <!-- Flash Sale -->
      @if (promotions().length > 0) {
        <section class="catalog-page__flash-sale">
          <div class="flash-sale-header">
            <h2>Sản phẩm đang giảm giá</h2>
            <span class="countdown-timer">Khuyến mãi cực hot</span>
          </div>
          <div class="product-grid">
            @for (product of promotions(); track product.productId) {
              <app-product-card [product]="product" />
            }
          </div>
        </section>
      }

      <!-- Main Products Section -->
      <div class="catalog-page__section-header">
        <h2>{{ categoryId() ? 'Sản phẩm theo danh mục' : 'Tất cả sản phẩm' }}</h2>
      </div>

      @if (error()) {
        <p role="alert" class="error-message">{{ error() }}</p>
      } @else if (loading()) {
        <p class="no-data" style="text-align: center; padding: 2rem;">Đang tải sản phẩm…</p>
      } @else if (result()?.items?.length === 0) {
        <p class="no-data" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
          Không tìm thấy sản phẩm nào phù hợp với từ khóa tìm kiếm.
        </p>
      } @else {
        <div class="product-grid">
          @for (product of result()?.items ?? []; track product.productId) {
            <app-product-card [product]="product" />
          }
        </div>

        <!-- Pagination -->
        @if (result() && result()!.totalCount > result()!.pageSize) {
          <nav class="catalog-page__pagination" aria-label="Phân trang">
            <button
              type="button"
              [disabled]="page() === 1"
              (click)="changePage(page() - 1)"
            >
              Trang trước
            </button>
            <span class="pagination-info">
              Trang {{ page() }} / {{ totalPages() }}
            </span>
            <button
              type="button"
              [disabled]="page() * result()!.pageSize >= result()!.totalCount"
              (click)="changePage(page() + 1)"
            >
              Trang sau
            </button>
          </nav>
        }
      }
    </section>
  `
})
export class CatalogPageComponent {
  readonly api = inject(ApiService);
  readonly router = inject(Router);
  readonly elementRef = inject(ElementRef);

  readonly categories = signal<Category[]>([]);
  readonly result = signal<PagedResponse<ProductListItem> | null>(null);
  readonly promotions = signal<ProductListItem[]>([]);
  readonly suggestions = signal<ProductListItem[]>([]);
  readonly showSuggestions = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly searchInput = signal('');
  readonly search = signal('');
  readonly categoryId = signal('');
  readonly page = signal(1);

  private debounceTimer: any = null;

  constructor() {
    this.api.categories().subscribe({
      next: value => this.categories.set(value)
    });
    this.load();
    this.loadPromotions();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.products(this.search(), this.categoryId(), this.page()).subscribe({
      next: value => {
        this.result.set(value);
        this.loading.set(false);
      },
      error: e => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      }
    });
  }

  loadPromotions() {
    this.api.products('', '', 1, 100).subscribe({
      next: res => {
        const promos = res.items.filter(p => p.compareAtPrice !== null && p.compareAtPrice > p.sellingPrice);
        this.promotions.set(promos.slice(0, 4));
      }
    });
  }

  onSearchInputChange(value: string) {
    this.searchInput.set(value);
    this.search.set(value);
    this.page.set(1);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (value.trim().length < 2) {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.api.products(value.trim(), '', 1, 5).subscribe({
        next: res => {
          this.suggestions.set(res.items);
          this.showSuggestions.set(true);
        },
        error: () => {
          this.suggestions.set([]);
          this.showSuggestions.set(true);
        }
      });
    }, 300);
  }

  submitSearch() {
    this.showSuggestions.set(false);
    this.page.set(1);
    this.load();
  }

  clearSearch() {
    this.searchInput.set('');
    this.search.set('');
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.page.set(1);
    this.load();
  }

  goToProduct(slug: string) {
    this.showSuggestions.set(false);
    this.router.navigate(['/products', slug]);
  }

  selectCategory(id: string) {
    this.categoryId.set(id);
    this.page.set(1);
    this.load();
  }

  changePage(newPage: number) {
    this.page.set(newPage);
    this.load();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  totalPages(): number {
    const res = this.result();
    if (!res) return 1;
    return Math.ceil(res.totalCount / res.pageSize);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions.set(false);
    }
  }

  getCategoryBgClass(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('rau') || n.includes('củ')) return 'bg-success';
    if (n.includes('trái') || n.includes('quả')) return 'bg-warning';
    if (n.includes('thịt') || n.includes('cá')) return 'bg-danger';
    if (n.includes('sữa') || n.includes('trứng')) return 'bg-info';
    if (n.includes('nước') || n.includes('uống')) return 'bg-violet';
    if (n.includes('bánh') || n.includes('snack')) return 'bg-orange';
    return 'bg-surface';
  }

  getCategoryIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('rau') || n.includes('củ')) return '🥬';
    if (n.includes('trái') || n.includes('quả')) return '🍎';
    if (n.includes('thịt') || n.includes('cá')) return '🥩';
    if (n.includes('sữa') || n.includes('trứng')) return '🥛';
    if (n.includes('nước') || n.includes('uống')) return '🥤';
    if (n.includes('bánh') || n.includes('snack')) return '🍿';
    return '📦';
  }
}

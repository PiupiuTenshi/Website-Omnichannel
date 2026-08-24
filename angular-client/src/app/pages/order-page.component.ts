import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { OnlineOrder } from '../core/models';
import { errorMessage } from '../core/api-error';

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="order-tracking app-container">
      <a routerLink="/" style="color: var(--color-primary); font-weight: 600; text-decoration: none;">
        ← Quay lại danh mục
      </a>

      @if (error()) {
        <p class="error-message" role="alert">{{ error() }}</p>
      } @else if (!order()) {
        <div class="no-data" style="text-align: center; padding: 3rem;">Đang tải thông tin đơn hàng…</div>
      } @else {
        <!-- Header -->
        <div class="order-tracking__header">
          <div>
            <span style="font-size: 0.85rem; color: var(--color-text-muted);">
              Khởi tạo lúc {{ order()!.createdAtUtc | date:'HH:mm - dd/MM/yyyy' }}
            </span>
            <h1 class="order-tracking__title">Đơn hàng #{{ order()!.orderCode }}</h1>
          </div>
          <span class="order-tracking__status-tag">
            {{ getStatusText(order()!.status) }}
          </span>
        </div>

        <!-- Timeline 5-Steps Progress -->
        <div class="order-tracking__timeline-card">
          <ul class="order-tracking__timeline">
            <li class="order-tracking__step" [class.order-tracking__step--active]="getStepIndex(order()!.status) >= 1">
              <span class="order-tracking__step-num">1</span>
              <span class="order-tracking__step-text">Đã đặt hàng</span>
            </li>
            <li class="order-tracking__step" [class.order-tracking__step--active]="getStepIndex(order()!.status) >= 2">
              <span class="order-tracking__step-num">2</span>
              <span class="order-tracking__step-text">Đã xác nhận</span>
            </li>
            <li class="order-tracking__step" [class.order-tracking__step--active]="getStepIndex(order()!.status) >= 3">
              <span class="order-tracking__step-num">3</span>
              <span class="order-tracking__step-text">Đang đóng gói</span>
            </li>
            <li class="order-tracking__step" [class.order-tracking__step--active]="getStepIndex(order()!.status) >= 4">
              <span class="order-tracking__step-num">4</span>
              <span class="order-tracking__step-text">Đang giao</span>
            </li>
            <li class="order-tracking__step" [class.order-tracking__step--active]="getStepIndex(order()!.status) >= 5">
              <span class="order-tracking__step-num">5</span>
              <span class="order-tracking__step-text">Hoàn thành</span>
            </li>
          </ul>
        </div>

        @if (order()!.managerMessage) {
          <div style="background: #fff9db; border-left: 4px solid #fcc419; padding: 1rem; border-radius: 0.5rem; color: #5c4804;">
            <strong style="display: block; margin-bottom: 0.25rem;">Ghi chú từ cửa hàng:</strong>
            <p style="margin: 0; font-style: italic;">{{ order()!.managerMessage }}</p>
          </div>
        }

        <!-- Details Card -->
        <div class="order-tracking__card">
          <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem 0;">Chi tiết thanh toán</h2>
          
          <div class="order-tracking__bill-row">
            <span>Tạm tính hàng hóa:</span>
            <strong>{{ order()!.subtotal | currency:'VND':'symbol':'1.0-0' }}</strong>
          </div>

          <div class="order-tracking__bill-row">
            <span>Khoảng cách giao:</span>
            <span>{{ order()!.distanceKm ?? '—' }} km</span>
          </div>

          <div class="order-tracking__bill-row">
            <span>Phí vận chuyển:</span>
            @if (order()!.shippingFee !== null) {
              <span>{{ order()!.shippingFee | currency:'VND':'symbol':'1.0-0' }}</span>
            } @else {
              <span style="color: #d97706; font-style: italic;">Đang chờ báo giá</span>
            }
          </div>

          <div class="order-tracking__bill-row order-tracking__bill-row--total">
            <span>Tổng cộng:</span>
            <strong>{{ order()!.total | currency:'VND':'symbol':'1.0-0' }}</strong>
          </div>

          @if (order()!.status === 'AwaitingShippingQuote' && order()!.shippingFee !== null) {
            <button
              type="button"
              class="btn-primary hover-lift"
              style="margin-top: 1rem; width: 100%;"
              (click)="accept()"
            >
              Xác nhận đồng ý phí giao hàng
            </button>
          }
        </div>
      }
    </div>
  `
})
export class OrderPageComponent {
  readonly id = input.required<string>();
  private readonly api = inject(ApiService);
  readonly order = signal<OnlineOrder | null>(null);
  readonly error = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.order(this.id()).subscribe({
      next: o => this.order.set(o),
      error: e => this.error.set(errorMessage(e))
    });
  }

  accept() {
    this.api.acceptQuote(this.id()).subscribe({
      next: o => this.order.set(o),
      error: e => this.error.set(errorMessage(e))
    });
  }

  getStepIndex(status: string): number {
    const s = status.toLowerCase();
    if (s === 'pending' || s === 'awaitingshippingquote') return 1;
    if (s === 'quoteaccepted' || s === 'confirmed') return 2;
    if (s === 'preparing') return 3;
    if (s === 'delivering') return 4;
    if (s === 'delivered' || s === 'completed') return 5;
    return 1;
  }

  getStatusText(status: string): string {
    const s = status.toLowerCase();
    if (s === 'pending') return 'Chờ xử lý';
    if (s === 'awaitingshippingquote') return 'Chờ báo phí giao hàng';
    if (s === 'quoteaccepted') return 'Đã xác nhận phí';
    if (s === 'confirmed') return 'Đã xác nhận đơn';
    if (s === 'preparing') return 'Đang đóng gói';
    if (s === 'delivering') return 'Đang giao hàng';
    if (s === 'delivered') return 'Đã giao hàng';
    if (s === 'cancelled') return 'Đã hủy đơn';
    return status;
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { CartStore } from '../core/cart.store';
import { errorMessage } from '../core/api-error';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="checkout-page app-container">
      <div>
        <h1>Thanh toán đơn hàng</h1>
        <p>Phí giao hàng và tổng tiền được hệ thống tự động kiểm tra để bảo đảm đúng tồn kho & ưu đãi.</p>
      </div>

      <form (ngSubmit)="submit()">
        <label>
          <span>Họ và tên người nhận</span>
          <input name="name" [(ngModel)]="name" placeholder="Nguyễn Văn A" required />
        </label>

        <label>
          <span>Số điện thoại liên hệ</span>
          <input name="phone" [(ngModel)]="phone" placeholder="0901 234 567" type="tel" required />
        </label>

        <label>
          <span>Địa chỉ nhận hàng chi tiết</span>
          <textarea name="address" [(ngModel)]="address" rows="3" placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." required></textarea>
        </label>

        <fieldset>
          <legend>Phương thức thanh toán</legend>
          <label>
            <input type="radio" name="payment" value="Cod" [(ngModel)]="payment" />
            <span>Thanh toán khi nhận hàng (COD)</span>
          </label>
          <label>
            <input type="radio" name="payment" value="BankTransfer" [(ngModel)]="payment" />
            <span>Chuyển khoản ngân hàng (QR Code)</span>
          </label>
        </fieldset>

        @if (error()) {
          <div role="alert" class="error-box">{{ error() }}</div>
        }

        <button type="submit" class="btn-submit hover-lift" [disabled]="loading()">
          {{ loading() ? 'Đang tạo đơn hàng…' : 'Xác nhận đặt hàng' }}
        </button>
      </form>
    </div>
  `
})
export class CheckoutPageComponent {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartStore);
  private readonly router = inject(Router);

  name = '';
  phone = '';
  address = '';
  payment = 'Cod';

  readonly error = signal('');
  readonly loading = signal(false);

  submit() {
    if (!this.name.trim() || !this.phone.trim() || !this.address.trim()) {
      this.error.set('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.checkout({
      recipientName: this.name,
      recipientPhoneNumber: this.phone,
      deliveryAddress: this.address,
      paymentMethod: this.payment
    }).subscribe({
      next: order => {
        this.cart.load();
        this.router.navigate(['/orders', order.onlineOrderId]);
      },
      error: e => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      }
    });
  }
}

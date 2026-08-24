import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-utility-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page app-container">
      <div class="auth-card" style="width: min(100%, 38rem);">
        <div class="auth-card__header">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥬</div>
          <h1 class="auth-card__title">{{ title() }}</h1>
          <p class="auth-card__description">{{ copy() }}</p>
        </div>

        @switch (kind()) {
          @case ('foundation') {
            <div style="display: grid; gap: 1rem;">
              <div style="background: var(--color-surface-muted); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                <h3 style="color: var(--color-primary-strong); font-size: 1.1rem; margin-bottom: 0.5rem;">Về Chợ Xanh</h3>
                <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6;">
                  Chợ Xanh (Tạp hóa chị Tỏ) là nền tảng bán lẻ nông sản sạch và nhu yếu phẩm tươi ngon mỗi ngày.
                  Ứng dụng hỗ trợ trải nghiệm mua sắm mượt mà trên web client cùng hệ thống quản lý kho, giá và bán hàng tại quầy (POS) đồng bộ.
                </p>
              </div>
            </div>
          }

          @case ('account') {
            <form class="auth-form">
              <label class="auth-form__field">
                <span>Họ và tên</span>
                <input class="auth-form__input" placeholder="Cập nhật họ tên của bạn" />
              </label>
              <label class="auth-form__field">
                <span>Số điện thoại</span>
                <input class="auth-form__input" placeholder="0901 234 567" />
              </label>
              <label class="auth-form__field">
                <span>Địa chỉ giao hàng mặc định</span>
                <textarea class="auth-form__input" rows="3" placeholder="Nhập địa chỉ nhận hàng"></textarea>
              </label>
              <button type="button" class="auth-form__submit hover-lift">Lưu thay đổi hồ sơ</button>
            </form>
          }

          @case ('not-found') {
            <div style="text-align: center; padding: 2rem 0;">
              <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">404</span>
              <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
              <a class="btn-primary hover-lift" routerLink="/">Trở về trang chủ</a>
            </div>
          }

          @default {
            <form class="auth-form">
              <label class="auth-form__field">
                <span>Email hoặc Số điện thoại</span>
                <input class="auth-form__input" type="text" placeholder="Nhập email hoặc SĐT" />
              </label>

              @if (kind() === 'reset') {
                <label class="auth-form__field">
                  <span>Mật khẩu mới</span>
                  <input class="auth-form__input" type="password" placeholder="••••••••" />
                </label>
              }

              <button type="button" class="auth-form__submit hover-lift">{{ button() }}</button>
            </form>
          }
        }

        <div class="auth-card__footer">
          <a routerLink="/">← Trở về trang chủ mua sắm</a>
        </div>
      </div>
    </div>
  `
})
export class UtilityPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly kind = computed(() => String(this.route.snapshot.data['kind'] ?? 'forgot'));

  readonly title = computed(() => ({
    foundation: 'Giới thiệu Chợ Xanh',
    account: 'Hồ sơ cá nhân',
    forgot: 'Quên mật khẩu',
    reset: 'Đặt lại mật khẩu',
    verify: 'Xác minh tài khoản'
  })[this.kind()] ?? '404 - Không tìm thấy trang');

  readonly copy = computed(() => ({
    foundation: 'Tổng quan hệ thống cửa hàng và quy tắc vận hành.',
    account: 'Cập nhật thông tin liên hệ và địa chỉ giao hàng.',
    forgot: 'Hướng dẫn khôi phục mật khẩu sẽ được gửi đến email đăng ký.',
    reset: 'Nhập mật khẩu mới để hoàn tất khôi phục tài khoản.',
    verify: 'Xác minh email hoặc số điện thoại để kích hoạt đầy đủ quyền.'
  })[this.kind()] ?? 'Đường dẫn không hợp lệ.');

  readonly button = computed(() => this.kind() === 'verify' ? 'Xác minh ngay' : 'Gửi yêu cầu');
}

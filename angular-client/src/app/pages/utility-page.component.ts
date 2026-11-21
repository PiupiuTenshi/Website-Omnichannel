import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, Observable, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AccountProfile } from '../core/models';
import { errorMessage } from '../core/api-error';

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

        @if (error()) { <p class="auth-form__message" role="alert">{{ error() }}</p> }
        @if (message()) { <p class="auth-form__message auth-form__message--success" role="status">{{ message() }}</p> }

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
            <form class="auth-form" (ngSubmit)="saveProfile()">
              <label class="auth-form__field">
                <span>Họ và tên</span>
                <input class="auth-form__input" name="displayName" [(ngModel)]="displayName" autocomplete="name" />
              </label>
              <label class="auth-form__field">
                <span>Số điện thoại</span>
                <input class="auth-form__input" [value]="phoneNumber" type="tel" readonly />
              </label>
              <label class="auth-form__field">
                <span>Địa chỉ giao hàng mặc định</span>
                <textarea class="auth-form__input" name="address" [(ngModel)]="address" rows="3" autocomplete="street-address"></textarea>
              </label>
              <button type="submit" class="auth-form__submit hover-lift" [disabled]="loading() || !profileLoaded()">Lưu thay đổi hồ sơ</button>
            </form>
          }

          @case ('not-found') {
            <div style="text-align: center; padding: 2rem 0;">
              <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">404</span>
              <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
              <a class="btn-primary hover-lift" routerLink="/">Trở về trang chủ</a>
            </div>
          }

          @case ('forgot') {
            <form class="auth-form" (ngSubmit)="requestReset()">
              <label class="auth-form__field">
                <span>Email hoặc Số điện thoại</span>
                <input class="auth-form__input" name="identifier" [(ngModel)]="identifier" autocomplete="username" required />
              </label>
              <button type="submit" class="auth-form__submit hover-lift" [disabled]="loading() || !identifier.trim()">Gửi yêu cầu</button>
            </form>
          }

          @case ('reset') {
            @if (completed()) {
              <a routerLink="/login">Đăng nhập</a>
            } @else if (!userId || !resetToken) {
              <a routerLink="/forgot-password">Yêu cầu liên kết mới</a>
            } @else {
              <form class="auth-form" (ngSubmit)="resetPassword()">
                <label class="auth-form__field">
                  <span>Mật khẩu mới</span>
                  <input class="auth-form__input" name="newPassword" [(ngModel)]="newPassword" type="password" autocomplete="new-password" required minlength="8" />
                </label>
                <label class="auth-form__field">
                  <span>Xác nhận mật khẩu mới</span>
                  <input class="auth-form__input" name="confirmPassword" [(ngModel)]="confirmPassword" type="password" autocomplete="new-password" required />
                </label>
                <button type="submit" class="auth-form__submit hover-lift" [disabled]="loading()">Đặt lại mật khẩu</button>
              </form>
            }
          }

          @case ('verify') {
            @if (completed()) {
              <a routerLink="/login">Đăng nhập</a>
            } @else if (userId) {
              @if (showEmailVerification) {
                <form class="auth-form" (ngSubmit)="verify('email')">
                  <label class="auth-form__field">
                    <span>Mã xác minh email</span>
                    <input class="auth-form__input" name="emailCode" [(ngModel)]="emailCode" inputmode="numeric" autocomplete="one-time-code" required />
                  </label>
                  <button type="submit" class="auth-form__submit" [disabled]="loading() || !emailCode.trim()">Xác minh email</button>
                </form>
              }
              @if (showPhoneVerification) {
                <form class="auth-form" (ngSubmit)="verify('phone')">
                  <label class="auth-form__field">
                    <span>Mã xác minh SMS</span>
                    <input class="auth-form__input" name="phoneCode" [(ngModel)]="phoneCode" inputmode="numeric" autocomplete="one-time-code" required />
                  </label>
                  <button type="submit" class="auth-form__submit" [disabled]="loading() || !phoneCode.trim()">Xác minh số điện thoại</button>
                </form>
              }
            }
          }
        }

        <div class="auth-card__footer">
          <a routerLink="/">← Trở về trang chủ mua sắm</a>
        </div>
      </div>
    </div>
  `
})
export class UtilityPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly query = this.route.snapshot.queryParamMap;

  readonly userId = this.query.get('userId')?.trim() ?? '';
  readonly resetToken = this.query.get('token') ?? '';
  readonly showEmailVerification = this.query.get('email') === '1' || this.query.get('phone') !== '1';
  readonly showPhoneVerification = this.query.get('phone') === '1' || this.query.get('email') !== '1';
  readonly error = signal('');
  readonly message = signal('');
  readonly completed = signal(false);
  readonly loading = signal(false);
  readonly profileLoaded = signal(false);
  identifier = '';
  emailCode = '';
  phoneCode = '';
  newPassword = '';
  confirmPassword = '';
  displayName = '';
  address = '';
  phoneNumber = '';

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
    forgot: 'Yêu cầu gửi hướng dẫn khôi phục đến thông tin liên hệ đã xác minh.',
    reset: 'Nhập mật khẩu mới để hoàn tất khôi phục tài khoản.',
    verify: 'Xác minh email hoặc số điện thoại để kích hoạt đầy đủ quyền.'
  })[this.kind()] ?? 'Đường dẫn không hợp lệ.');

  ngOnInit() {
    if (this.kind() === 'account') {
      this.run(this.api.profile().pipe(tap(profile => this.applyProfile(profile))));
    } else if (this.kind() === 'reset' && (!this.userId || !this.resetToken)) {
      this.error.set('Liên kết đặt lại mật khẩu không hợp lệ.');
    } else if (this.kind() === 'verify' && !this.userId) {
      this.error.set('Liên kết xác minh thiếu thông tin tài khoản. Hãy dùng liên kết sau khi đăng ký.');
    }
  }

  requestReset() {
    if (!this.identifier.trim()) return;
    const resetUrl = new URL('/reset-password', window.location.origin).href;
    this.run(this.api.requestPasswordReset(this.identifier.trim(), resetUrl), 'Nếu tài khoản đủ điều kiện, hướng dẫn khôi phục sẽ được gửi.');
  }

  resetPassword() {
    if (!this.userId || !this.resetToken) return;
    if (this.newPassword.length < 8 || this.newPassword !== this.confirmPassword) {
      this.error.set('Mật khẩu mới phải có ít nhất 8 ký tự và khớp với phần xác nhận.');
      return;
    }
    const request = this.api.resetPassword(this.userId, this.resetToken, this.newPassword).pipe(tap(() => {
      this.newPassword = '';
      this.confirmPassword = '';
      this.completed.set(true);
    }));
    this.run(request, 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.');
  }

  verify(channel: 'email' | 'phone') {
    const code = (channel === 'email' ? this.emailCode : this.phoneCode).trim();
    if (!this.userId || !code) return;
    const request = channel === 'email' ? this.api.confirmEmail(this.userId, code) : this.api.confirmPhone(this.userId, code);
    this.run(request.pipe(tap(() => this.completed.set(true))), 'Đã xác minh tài khoản. Bạn có thể đăng nhập.');
  }

  saveProfile() {
    if (!this.profileLoaded()) return;
    const request = this.api.updateProfile(this.displayName.trim() || null, this.address.trim() || null);
    this.run(request.pipe(tap(profile => this.applyProfile(profile))), 'Đã lưu hồ sơ.');
  }

  private applyProfile(profile: AccountProfile) {
    this.displayName = profile.displayName ?? '';
    this.address = profile.defaultDeliveryAddress ?? '';
    this.phoneNumber = profile.phoneNumber ?? '';
    this.profileLoaded.set(true);
  }

  private run(request: Observable<unknown>, successMessage = '') {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.message.set(successMessage),
      error: error => this.error.set(errorMessage(error)),
    });
  }
}

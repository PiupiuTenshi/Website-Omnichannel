import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { errorMessage } from '../core/api-error';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page app-container">
      <div class="auth-card">
        <div class="auth-card__header">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥬</div>
          <h1 class="auth-card__title">Đăng ký tài khoản</h1>
          <p class="auth-card__description">Tạo tài khoản mới để trải nghiệm mua sắm thực phẩm tiện lợi</p>
        </div>

        <form class="auth-form" (ngSubmit)="submit()">
          <label class="auth-form__field">
            <span>Địa chỉ Email</span>
            <input class="auth-form__input" type="email" name="email" [(ngModel)]="email" placeholder="example@domain.com" required />
          </label>

          <label class="auth-form__field">
            <span>Số điện thoại</span>
            <input class="auth-form__input" type="tel" name="phone" [(ngModel)]="phone" placeholder="0901234567" />
          </label>

          <label class="auth-form__field">
            <span>Mật khẩu</span>
            <input class="auth-form__input" type="password" name="password" [(ngModel)]="password" placeholder="••••••••" required />
          </label>

          @if (error()) {
            <div role="alert" class="auth-form__message">{{ error() }}</div>
          }

          <button type="submit" class="auth-form__submit hover-lift" [disabled]="loading()">
            {{ loading() ? 'Đang tạo tài khoản…' : 'Đăng ký' }}
          </button>
        </form>

        <div class="auth-card__footer">
          Đã có tài khoản? <a routerLink="/login">Đăng nhập</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterPageComponent {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  email = '';
  phone = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);

  submit() {
    if (!this.email.trim() || !this.password) {
      this.error.set('Vui lòng nhập email và mật khẩu.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.register(this.email, this.phone, this.password).subscribe({
      next: res => {
        this.session.setSession(res);
        this.router.navigate(['/']);
      },
      error: e => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { errorMessage } from '../core/api-error';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page app-container">
      <div class="auth-card">
        <div class="auth-card__header">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🥬</div>
          <h1 class="auth-card__title">Đăng nhập Chợ Xanh</h1>
          <p class="auth-card__description">Đăng nhập tài khoản mua hàng hoặc tài khoản quản trị viên</p>
        </div>

        <form class="auth-form" (ngSubmit)="submit()">
          <label class="auth-form__field">
            <span>Tên đăng nhập hoặc Email</span>
            <input
              class="auth-form__input"
              name="username"
              [(ngModel)]="username"
              placeholder="Nhập username hoặc email"
              required
            />
          </label>

          <label class="auth-form__field">
            <span>Mật khẩu</span>
            <input
              class="auth-form__input"
              type="password"
              name="password"
              [(ngModel)]="password"
              placeholder="••••••••"
              required
            />
          </label>

          @if (error()) {
            <div role="alert" class="auth-form__message">{{ error() }}</div>
          }

          <button type="submit" class="auth-form__submit hover-lift" [disabled]="loading()">
            {{ loading() ? 'Đang đăng nhập…' : 'Đăng nhập' }}
          </button>
        </form>

        <div class="auth-card__footer">
          Chưa có tài khoản? <a routerLink="/register">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);

  submit() {
    if (!this.username.trim() || !this.password) {
      this.error.set('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.login(this.username, this.password).subscribe({
      next: res => {
        this.session.setSession(res);
        const roles = this.session.roles();
        if (roles.includes('Admin')) {
          this.router.navigate(['/admin/dashboard']);
        } else if (roles.includes('Manager')) {
          this.router.navigate(['/manager/dashboard']);
        } else if (roles.includes('Seller')) {
          this.router.navigate(['/seller/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: e => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      }
    });
  }
}

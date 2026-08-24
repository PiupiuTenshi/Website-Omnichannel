import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SessionService } from '../core/session.service';
import { CartStore } from '../core/cart.store';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="public-layout">
      <!-- Top Banner -->
      <div class="public-layout__top-banner">
        <div class="app-container banner-content">
          <span>🎉 Miễn phí giao hàng cho đơn từ 99.000đ</span>
          <span>Hotline: 1900 6868</span>
        </div>
      </div>

      <!-- Main Header -->
      <header class="public-layout__header glass-panel">
        <div class="app-container public-layout__header-content">
          <a class="public-layout__brand" routerLink="/">
            <span class="brand-icon">🥬</span> Chợ Xanh
          </a>
          <nav class="public-layout__navigation">
            <a class="nav-link" routerLink="/">Sản phẩm</a>
            <a class="nav-link" routerLink="/cart">Giỏ hàng ({{ cart.count() }})</a>
            
            @if (session.isAuthenticated()) {
              @if (session.hasRole('Admin')) {
                <a class="nav-link" routerLink="/admin/dashboard">Quản trị</a>
              } @else if (session.hasRole('Manager')) {
                <a class="nav-link" routerLink="/manager/dashboard">Quản lý</a>
              } @else if (session.hasRole('Seller')) {
                <a class="nav-link" routerLink="/seller/dashboard">Bán hàng</a>
              }
              <a class="nav-link" routerLink="/account">Tài khoản</a>
              <button class="btn-outline hover-lift" (click)="logout()">Đăng xuất</button>
            } @else {
              <a class="btn-primary hover-lift" routerLink="/login">Đăng nhập</a>
            }
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="public-layout__main">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="public-layout__footer">
        <div class="app-container footer-content">
          <div class="footer-brand">
            <h3>Chợ Xanh</h3>
            <p>Nông sản sạch & nhu yếu phẩm tươi ngon mỗi ngày.</p>
          </div>
          <div class="footer-links">
            <a routerLink="/foundation">Về chúng tôi</a>
            <a routerLink="/">Cửa hàng</a>
            <a routerLink="/">Liên hệ</a>
          </div>
          <div class="footer-copyright">
            © 2026 Chợ Xanh. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `
})
export class PublicLayoutComponent {
  readonly session = inject(SessionService);
  readonly cart = inject(CartStore);

  logout() {
    this.session.clearSession();
    this.cart.load();
  }
}

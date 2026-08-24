import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../core/session.service';
import { CartStore } from '../core/cart.store';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <!-- Mobile Overlay -->
      @if (sidebarOpen()) {
        <div class="dashboard-layout__overlay" (click)="toggleSidebar()"></div>
      }

      <!-- Sidebar -->
      <aside class="dashboard-layout__sidebar" [class.dashboard-layout__sidebar--open]="sidebarOpen()">
        <div class="dashboard-layout__brand">
          <a class="dashboard-layout__brand-link" routerLink="/">
            <span class="brand-icon">🥬</span>
            <span>Chợ Xanh</span>
          </a>
          <span class="dashboard-layout__role-tag">
            {{ userRole() }}
          </span>
        </div>

        <nav class="dashboard-layout__nav">
          <div class="dashboard-layout__nav-section">
            <span class="dashboard-layout__nav-title">Vận hành</span>
            <a class="dashboard-layout__nav-link" [routerLink]="dashboardLink()" routerLinkActive="dashboard-layout__nav-link--active">
              📊 Tổng quan
            </a>
            <a class="dashboard-layout__nav-link" routerLink="/manager/pos" routerLinkActive="dashboard-layout__nav-link--active">
              💻 Bán hàng (POS)
            </a>
          </div>

          @if (session.hasRole('Admin') || session.hasRole('Manager')) {
            <div class="dashboard-layout__nav-section">
              <span class="dashboard-layout__nav-title">Quản lý</span>
              <a class="dashboard-layout__nav-link" routerLink="/manager/products" routerLinkActive="dashboard-layout__nav-link--active">
                📦 Sản phẩm
              </a>
              <a class="dashboard-layout__nav-link" routerLink="/manager/promotions" routerLinkActive="dashboard-layout__nav-link--active">
                🏷️ Khuyến mãi
              </a>
              <a class="dashboard-layout__nav-link" routerLink="/manager/orders" routerLinkActive="dashboard-layout__nav-link--active">
                🛒 Đơn hàng online
              </a>
              <a class="dashboard-layout__nav-link" routerLink="/manager/inventory/batches" routerLinkActive="dashboard-layout__nav-link--active">
                🏭 Kho & Tồn hàng
              </a>
            </div>
          }

          @if (session.hasRole('Seller')) {
            <div class="dashboard-layout__nav-section">
              <span class="dashboard-layout__nav-title">Công cụ</span>
              <a class="dashboard-layout__nav-link" routerLink="/seller/price-tags" routerLinkActive="dashboard-layout__nav-link--active">
                🏷️ In tag giá
              </a>
            </div>
          }

          <div class="dashboard-layout__nav-section">
            <span class="dashboard-layout__nav-title">Hệ thống</span>
            @if (session.hasRole('Admin') || session.hasRole('Manager')) {
              <a class="dashboard-layout__nav-link" routerLink="/manager/reports" routerLinkActive="dashboard-layout__nav-link--active">
                📈 Báo cáo doanh thu
              </a>
              <a class="dashboard-layout__nav-link" routerLink="/manager/store-settings" routerLinkActive="dashboard-layout__nav-link--active">
                ⚙️ Thiết lập cửa hàng
              </a>
            }
            @if (session.hasRole('Admin')) {
              <a class="dashboard-layout__nav-link" routerLink="/admin/users" routerLinkActive="dashboard-layout__nav-link--active">
                👥 Quản lý người dùng
              </a>
              <a class="dashboard-layout__nav-link" routerLink="/admin/audit-logs" routerLinkActive="dashboard-layout__nav-link--active">
                📜 Nhật ký hoạt động
              </a>
            }
          </div>
        </nav>

        <div class="dashboard-layout__footer">
          <div class="dashboard-layout__user-card">
            <div class="dashboard-layout__user-avatar">
              {{ userName().charAt(0).toUpperCase() }}
            </div>
            <div class="dashboard-layout__user-details">
              <span class="dashboard-layout__user-name">{{ userName() }}</span>
              <span class="dashboard-layout__user-status">● Đang hoạt động</span>
            </div>
          </div>
          <div class="dashboard-layout__actions">
            <a class="dashboard-layout__action-btn" routerLink="/">
              🏠 Về trang mua sắm
            </a>
            <button class="dashboard-layout__action-btn dashboard-layout__action-btn--logout" (click)="logout()">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="dashboard-layout__content">
        <header class="dashboard-layout__header">
          <button class="dashboard-layout__menu-toggle" (click)="toggleSidebar()" aria-label="Menu">
            ☰
          </button>
          <div class="dashboard-layout__breadcrumb">
            <span class="dashboard-layout__title-main">Quản trị</span>
            <span class="dashboard-layout__title-separator">/</span>
            <span class="dashboard-layout__title-sub">Backoffice</span>
          </div>
          <div class="dashboard-layout__header-right">
            <div class="dashboard-layout__badge">
              <span class="dashboard-layout__badge-dot"></span>
              <span>Hệ thống sẵn sàng</span>
            </div>
          </div>
        </header>

        <main class="dashboard-layout__main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  readonly session = inject(SessionService);
  readonly cart = inject(CartStore);
  readonly router = inject(Router);
  readonly sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  userRole(): string {
    const roles = this.session.roles();
    if (roles.includes('Admin')) return 'ADMIN';
    if (roles.includes('Manager')) return 'MANAGER';
    if (roles.includes('Seller')) return 'SELLER';
    return 'STAFF';
  }

  dashboardLink(): string {
    const roles = this.session.roles();
    if (roles.includes('Admin')) return '/admin/dashboard';
    if (roles.includes('Manager')) return '/manager/dashboard';
    if (roles.includes('Seller')) return '/seller/dashboard';
    return '/manager/dashboard';
  }

  userName(): string {
    return this.session.username() || 'Nhân viên';
  }

  logout() {
    this.session.clearSession();
    this.cart.load();
    this.router.navigate(['/login']);
  }
}

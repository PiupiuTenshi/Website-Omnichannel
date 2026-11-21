import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../core/session.service';
import { CartStore } from '../core/cart.store';

@Component({ selector:'app-dashboard-layout', imports:[RouterOutlet,RouterLink,RouterLinkActive], changeDetection:ChangeDetectionStrategy.OnPush, template:`
<div class="dashboard-layout"><aside class="dashboard-layout__sidebar"><div class="dashboard-layout__brand"><a class="dashboard-layout__brand-link" routerLink="/">🥬 Chợ Xanh</a><span class="dashboard-layout__role-tag">{{role()}}</span></div><nav class="dashboard-layout__nav">
<div class="dashboard-layout__nav-section"><span class="dashboard-layout__nav-title">Vận hành</span>@if(isManager()){<a class="dashboard-layout__nav-link" [routerLink]="dashboardLink()" routerLinkActive="dashboard-layout__nav-link--active">Tổng quan</a>}<a class="dashboard-layout__nav-link" routerLink="/manager/pos" routerLinkActive="dashboard-layout__nav-link--active">Bán hàng (POS)</a></div>
@if(isManager()){<div class="dashboard-layout__nav-section"><span class="dashboard-layout__nav-title">Quản lý</span><a class="dashboard-layout__nav-link" routerLink="/manager/products">Sản phẩm</a><a class="dashboard-layout__nav-link" routerLink="/manager/promotions">Khuyến mãi</a><a class="dashboard-layout__nav-link" routerLink="/manager/orders">Đơn hàng online</a><a class="dashboard-layout__nav-link" routerLink="/manager/inventory/suppliers">Nhà cung cấp</a><a class="dashboard-layout__nav-link" routerLink="/manager/inventory/batches">Kho & tồn hàng</a><a class="dashboard-layout__nav-link" routerLink="/manager/inventory/low-stock">Tồn thấp</a></div><div class="dashboard-layout__nav-section"><span class="dashboard-layout__nav-title">Báo cáo</span><a class="dashboard-layout__nav-link" routerLink="/manager/reports">Báo cáo doanh thu</a><a class="dashboard-layout__nav-link" routerLink="/manager/store-settings">Thiết lập cửa hàng</a></div>}@if(session.hasRole('Admin')){<div class="dashboard-layout__nav-section"><span class="dashboard-layout__nav-title">Hệ thống</span><a class="dashboard-layout__nav-link" routerLink="/admin/users">Người dùng</a><a class="dashboard-layout__nav-link" routerLink="/admin/audit-logs">Nhật ký hoạt động</a></div>}</nav><div class="dashboard-layout__footer"><a class="dashboard-layout__action-btn" routerLink="/">Về trang mua sắm</a><button class="dashboard-layout__action-btn dashboard-layout__action-btn--logout" (click)="logout()" [disabled]="session.endingSession()">Đăng xuất</button>@if(session.logoutError()){<p role="alert">{{session.logoutError()}}</p>}</div></aside><div class="dashboard-layout__content"><header class="dashboard-layout__header"><strong>Quản trị</strong><span>{{role()}}</span></header><main class="dashboard-layout__main-content"><router-outlet/></main></div></div>`})
export class DashboardLayoutComponent {
  readonly session = inject(SessionService);
  readonly cart = inject(CartStore);
  private readonly router = inject(Router);

  isManager() { return this.session.hasRole('Admin') || this.session.hasRole('Manager'); }
  role() { return this.session.roles().join(', ') || 'Staff'; }
  dashboardLink() { return this.session.hasRole('Admin') ? '/admin/dashboard' : '/manager/dashboard'; }

  async logout() {
    if (await this.session.clearSession()) {
      this.cart.load();
      await this.router.navigate(['/login']);
    }
  }
}

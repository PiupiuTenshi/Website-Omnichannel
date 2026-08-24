import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout.component';
import { CatalogPageComponent } from './pages/catalog-page.component';
import { ProductPageComponent } from './pages/product-page.component';
import { CartPageComponent } from './pages/cart-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { CheckoutPageComponent } from './pages/checkout-page.component';
import { OrderPageComponent } from './pages/order-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { ManagementPageComponent } from './pages/management-page.component';
import { UtilityPageComponent } from './pages/utility-page.component';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: CatalogPageComponent, title: 'Tạp hóa chị Tỏ - Chợ Xanh' },
      { path: 'products/:slug', component: ProductPageComponent, title: 'Sản phẩm' },
      { path: 'cart', component: CartPageComponent, title: 'Giỏ hàng' },
      { path: 'login', component: LoginPageComponent, title: 'Đăng nhập' },
      { path: 'register', component: RegisterPageComponent, title: 'Đăng ký' },
      { path: 'forgot-password', component: UtilityPageComponent, data: { kind: 'forgot' }, title: 'Quên mật khẩu' },
      { path: 'reset-password', component: UtilityPageComponent, data: { kind: 'reset' }, title: 'Đặt lại mật khẩu' },
      { path: 'verify', component: UtilityPageComponent, data: { kind: 'verify' }, title: 'Xác minh' },
      { path: 'foundation', component: UtilityPageComponent, data: { kind: 'foundation' }, title: 'Nền tảng' },
      { path: 'account', component: UtilityPageComponent, canActivate: [roleGuard], data: { kind: 'account' }, title: 'Tài khoản' },
      { path: 'checkout', component: CheckoutPageComponent, title: 'Đặt hàng' },
      { path: 'orders/:id', component: OrderPageComponent, title: 'Theo dõi đơn' },
    ]
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: 'admin/dashboard', component: DashboardPageComponent, data: { roles: ['Admin'] }, title: 'Admin' },
      { path: 'manager/dashboard', component: DashboardPageComponent, data: { roles: ['Manager'] }, title: 'Manager' },
      { path: 'seller/dashboard', component: DashboardPageComponent, data: { roles: ['Seller'] }, title: 'Seller' },
      { path: 'manager/pos', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager', 'Seller'], view: 'pos' }, title: 'POS' },
      { path: 'seller/price-tags', component: ManagementPageComponent, data: { roles: ['Seller'], view: 'price-tags' }, title: 'In tag giá' },
      { path: 'admin/audit-logs', component: ManagementPageComponent, data: { roles: ['Admin'], view: 'audit', resource: 'audit' }, title: 'Nhật ký' },
      { path: 'admin/users', component: ManagementPageComponent, data: { roles: ['Admin'], view: 'people', resource: 'users' }, title: 'Người dùng' },
      { path: 'manager/reports', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'reports', resource: 'reports' }, title: 'Báo cáo' },
      { path: 'manager/store-settings', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'settings', resource: 'settings' }, title: 'Thiết lập' },
      { path: 'manager/products', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'catalog' }, title: 'Sản phẩm' },
      { path: 'manager/products/new', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'catalog' }, title: 'Tạo sản phẩm' },
      { path: 'manager/promotions', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'promotions' }, title: 'Khuyến mãi' },
      { path: 'manager/orders', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'orders', resource: 'orders' }, title: 'Đơn hàng' },
      { path: 'manager/inventory/suppliers', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'inventory', resource: 'suppliers' }, title: 'Nhà cung cấp' },
      { path: 'manager/inventory/receive', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'inventory', resource: 'batches' }, title: 'Nhập kho' },
      { path: 'manager/inventory/batches', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'inventory', resource: 'batches' }, title: 'Lô tồn kho' },
      { path: 'manager/inventory/low-stock', component: ManagementPageComponent, data: { roles: ['Admin', 'Manager'], view: 'inventory', resource: 'low-stock' }, title: 'Tồn thấp' },
    ]
  },
  {
    path: '**',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: UtilityPageComponent, data: { kind: 'not-found' }, title: 'Không tìm thấy' }
    ]
  }
];

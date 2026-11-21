import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiBaseUrl } from './api.config';
import { AccountProfile, AuthSession, Cart, Category, DirectAuthResponse, OnlineOrder, PagedResponse, ProductDetail, ProductListItem, RegistrationResponse, ReportingDashboard } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  categories() { return this.http.get<Category[]>(`${apiBaseUrl}/categories`); }
  products(search = '', categoryId = '', page = 1, pageSize = 15) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) params = params.set('search', search.trim());
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<PagedResponse<ProductListItem>>(`${apiBaseUrl}/products`, { params });
  }
  adminProducts(search = '', categoryId = '', page = 1, pageSize = 15) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) params = params.set('search', search.trim());
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<PagedResponse<ProductListItem>>(`${apiBaseUrl}/admin/catalog/products`, { params });
  }
  product(slug: string) { return this.http.get<ProductDetail>(`${apiBaseUrl}/products/by-slug/${encodeURIComponent(slug)}`); }
  cart() { return this.http.get<Cart>(`${apiBaseUrl}/cart`); }
  setCartItem(productVariantId: string, quantity: number) { return this.http.put<Cart>(`${apiBaseUrl}/cart/items`, { productVariantId, quantity }); }
  login(identifier: string, password: string) { return this.http.post<AuthSession | DirectAuthResponse>(`${apiBaseUrl}/auth/login`, { identifier: identifier.trim(), password }); }
  restoreSession() { return this.http.get<AuthSession | null>(`${apiBaseUrl}/session`, { timeout: 3000 }); }
  endSession() { return this.http.delete<void>(`${apiBaseUrl}/session`, { timeout: 5000 }); }
  mergeCart() { return this.http.post<Cart>(`${apiBaseUrl}/cart/merge`, {}); }
  register(email: string, phoneNumber: string, password: string) {
    return this.http.post<RegistrationResponse>(`${apiBaseUrl}/auth/register`, { email: email.trim() || null, phoneNumber: phoneNumber.trim() || null, password });
  }
  confirmEmail(userId: string, token: string) { return this.http.post<void>(`${apiBaseUrl}/auth/confirm-email`, { userId, token }); }
  confirmPhone(userId: string, code: string) { return this.http.post<void>(`${apiBaseUrl}/auth/confirm-phone`, { userId, code }); }
  requestPasswordReset(identifier: string, resetUrl: string) { return this.http.post<void>(`${apiBaseUrl}/auth/password-resets`, { identifier, resetUrl }); }
  resetPassword(userId: string, token: string, newPassword: string) { return this.http.post<void>(`${apiBaseUrl}/auth/password-resets/confirm`, { userId, token, newPassword }); }
  profile() { return this.http.get<AccountProfile>(`${apiBaseUrl}/account/profile`); }
  updateProfile(displayName: string | null, defaultDeliveryAddress: string | null) {
    return this.http.put<AccountProfile>(`${apiBaseUrl}/account/profile`, { displayName, defaultDeliveryAddress });
  }
  checkout(payload: { recipientName: string; recipientPhoneNumber: string; deliveryAddress: string; paymentMethod: string }) { return this.http.post<OnlineOrder>(`${apiBaseUrl}/online-orders/checkout`, payload); }
  order(id: string) { return this.http.get<OnlineOrder>(`${apiBaseUrl}/online-orders/${id}`); }
  acceptQuote(id: string) { return this.http.post<OnlineOrder>(`${apiBaseUrl}/online-orders/${id}/accept-quote`, {}); }
  managementOrders() { return this.http.get<OnlineOrder[]>(`${apiBaseUrl}/online-orders`); }
  reports() { return this.http.get<ReportingDashboard>(`${apiBaseUrl}/admin/reports`); }
  suppliers() { return this.http.get<Record<string, unknown>[]>(`${apiBaseUrl}/admin/inventory/suppliers`); }
  inventoryBatches() { return this.http.get<Record<string, unknown>[]>(`${apiBaseUrl}/admin/inventory/batches`); }
  lowStock() { return this.http.get<Record<string, unknown>[]>(`${apiBaseUrl}/admin/inventory/low-stock`); }
  users() { return this.http.get<Record<string, unknown>[]>(`${apiBaseUrl}/users`); }
  auditLogs() { return this.http.get<Record<string, unknown>[]>(`${apiBaseUrl}/audit-logs`); }
  storeSettings() { return this.http.get<Record<string, unknown>>(`${apiBaseUrl}/store-settings`); }
  imageUrl(path: string | null): string | null { if (!path || /^https?:\/\//.test(path)) return path; return `${apiBaseUrl.replace(/\/api\/?$/, '')}/${path.replace(/^\//, '')}`; }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiBaseUrl } from './api.config';
import { AuthSession, Cart, Category, OnlineOrder, PagedResponse, ProductDetail, ProductListItem, ReportingDashboard } from './models';

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
  login(identifier: string, password: string) { return this.http.post<Omit<AuthSession, 'roles'>>(`${apiBaseUrl}/auth/login`, { identifier: identifier.trim(), password }); }
  mergeCart() { return this.http.post<Cart>(`${apiBaseUrl}/cart/merge`, {}); }
  register(email: string, phoneNumber: string, password: string) { return this.http.post<Omit<AuthSession, 'roles'>>(`${apiBaseUrl}/auth/register`, { email: email.trim() || null, phoneNumber: phoneNumber.trim() || null, password }); }
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

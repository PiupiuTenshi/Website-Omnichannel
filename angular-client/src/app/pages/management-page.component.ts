import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Category, PagedResponse, ProductListItem } from '../core/models';
import { errorMessage } from '../core/api-error';

@Component({
  imports: [FormsModule, RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`.backoffice{max-width:1200px;margin:2rem auto;padding:0 1rem}.head,.filters,.pager{display:flex;gap:1rem;align-items:center;justify-content:space-between}.filters{margin:1rem 0}.filters input{flex:1}.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:1rem;text-align:left;border-bottom:1px solid #e2e8f0}th{font-size:.8rem;color:#64748b;text-transform:uppercase}td img{width:48px;height:48px;object-fit:cover;border-radius:8px;vertical-align:middle;margin-right:.75rem}.badge{background:#d1fae5;color:#047857;border-radius:99px;padding:.25rem .6rem;font-size:.8rem;font-weight:700}.empty,.error{padding:2rem;text-align:center}.error{background:#fee2e2;color:#b91c1c}@media(max-width:650px){.head,.filters{align-items:stretch;flex-direction:column}th:nth-child(2),td:nth-child(2),th:nth-child(4),td:nth-child(4){display:none}}`],
  template: `
<section class="backoffice">
  @if (isCatalog()) {
    <div class="head"><div><p class="eyebrow">Catalog</p><h1>Quản lý sản phẩm</h1></div><a class="btn-primary" routerLink="/manager/products/new">Thêm sản phẩm</a></div>
    <div class="filters"><input [(ngModel)]="search" (keyup.enter)="load()" placeholder="Tìm theo tên, SKU hoặc barcode"><select [(ngModel)]="categoryId" (change)="resetAndLoad()"><option value="">Tất cả danh mục</option>@for (category of categories(); track category.categoryId) {<option [value]="category.categoryId">{{category.name}}</option>}</select><button class="btn-outline" (click)="resetAndLoad()">Lọc</button></div>
    @if (error()) {<p class="error">{{error()}}</p>} @else if (loading()) {<p class="empty">Đang tải sản phẩm…</p>} @else {<div class="card"><table><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Đơn vị</th><th>Trạng thái</th><th></th></tr></thead><tbody>@for (product of products()?.items ?? []; track product.productId) {<tr><td>@if (api.imageUrl(product.primaryImageUrl); as image) {<img [src]="image" [alt]="product.name">}<strong>{{product.name}}</strong><br><small>{{product.slug}}</small></td><td>{{product.categoryName}}</td><td>{{product.sellingPrice | currency:'VND':'symbol':'1.0-0'}}</td><td>{{product.unitName}}</td><td><span class="badge">Đang bán</span></td><td><a [routerLink]="['/products',product.slug]">Xem</a></td></tr>} @empty {<tr><td colspan="6" class="empty">Không có sản phẩm phù hợp.</td></tr>}</tbody></table>@if ((products()?.totalCount ?? 0) > 15) {<div class="pager"><button class="btn-outline" [disabled]="page()===1" (click)="previous()">Trang trước</button><span>Trang {{page()}}</span><button class="btn-outline" [disabled]="page()*15 >= (products()?.totalCount ?? 0)" (click)="next()">Trang sau</button></div>}</div>}
  } @else {<div class="head"><div><p class="eyebrow">Back office</p><h1>{{title()}}</h1></div></div>@if (loading()) {<p class="empty">Đang tải dữ liệu…</p>} @else if (error()) {<p class="error">{{error()}}</p>} @else {<div class="card"><pre class="data-preview">{{rawData()}}</pre></div>}}
</section>`
})
export class ManagementPageComponent {
  readonly api=inject(ApiService); private readonly route=inject(ActivatedRoute);
  readonly view=computed(()=>String(this.route.snapshot.data['view'] ?? 'catalog')); readonly resource=computed(()=>String(this.route.snapshot.data['resource'] ?? ''));
  readonly isCatalog=computed(()=>this.view()==='catalog');
  readonly title=computed(()=>({inventory:'Kho hàng',orders:'Đơn hàng online',people:'Người dùng',reports:'Báo cáo vận hành',settings:'Thiết lập cửa hàng',pos:'Bán hàng tại quầy',audit:'Nhật ký hoạt động',promotions:'Khuyến mãi','price-tags':'In tag giá'} as Record<string,string>)[this.view()] ?? 'Quản lý sản phẩm');
  readonly categories=signal<Category[]>([]); readonly products=signal<PagedResponse<ProductListItem>|null>(null); readonly loading=signal(false); readonly error=signal(''); readonly rawData=signal(''); readonly page=signal(1);
  search=''; categoryId='';
  constructor(){if(this.isCatalog()){this.api.categories().subscribe({next:value=>this.categories.set(value)});this.load();}else{this.loadResource();}}
  resetAndLoad(){this.page.set(1);this.load();} previous(){this.page.update(value=>value-1);this.load();} next(){this.page.update(value=>value+1);this.load();}
  load(){this.loading.set(true);this.error.set('');this.api.adminProducts(this.search,this.categoryId,this.page()).subscribe({next:value=>{this.products.set(value);this.loading.set(false);},error:value=>{this.error.set(errorMessage(value));this.loading.set(false);}});}
  loadResource(){const source=this.source();if(!source){this.rawData.set('Chức năng này không có endpoint đọc dữ liệu.');return;}this.loading.set(true);this.error.set('');source.subscribe({next:value=>{this.rawData.set(JSON.stringify(value,null,2));this.loading.set(false);},error:value=>{this.error.set(errorMessage(value));this.loading.set(false);}});}
  private source(): Observable<unknown> | null {switch(this.resource()){case 'orders':return this.api.managementOrders();case 'suppliers':return this.api.suppliers();case 'batches':return this.api.inventoryBatches();case 'low-stock':return this.api.lowStock();case 'users':return this.api.users();case 'audit':return this.api.auditLogs();case 'reports':return this.api.reports();case 'settings':return this.api.storeSettings();default:return null;}}
}

import { requestJson } from "../../../shared/api/apiClient";
import type { Category, PagedResponse, ProductDetail, ProductListItem, UnitOfMeasure } from "../types/catalogTypes";
import type { ProductVariant } from "../types/catalogTypes";

export interface ProductVariantPayload {
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  promotionStartAtUtc?: string | null;
  promotionEndAtUtc?: string | null;
}

export interface ProductPayload {
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  unitOfMeasureId: string;
  isActive: boolean;
  variants?: ProductVariantPayload[];
}

export function getCategories(): Promise<Category[]> {
  return requestJson<Category[]>("/categories");
}

export function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  return requestJson<UnitOfMeasure[]>("/units-of-measure");
}

export function getProducts(search: string, categoryId: string, page: number, pageSize = 15): Promise<PagedResponse<ProductListItem>> {
  const parameters = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
  if (search.trim()) parameters.set("search", search.trim());
  if (categoryId) parameters.set("categoryId", categoryId);
  return requestJson<PagedResponse<ProductListItem>>(`/products?${parameters}`);
}

export function searchSuggestions(query: string): Promise<PagedResponse<ProductListItem>> {
  const parameters = new URLSearchParams({ page: "1", pageSize: "6", search: query.trim() });
  return requestJson<PagedResponse<ProductListItem>>(`/products?${parameters}`);
}

export function getProductBySlug(slug: string): Promise<ProductDetail> {
  return requestJson<ProductDetail>(`/products/by-slug/${encodeURIComponent(slug)}`);
}

export function createProduct(accessToken: string, payload: ProductPayload): Promise<ProductDetail> {
  return requestJson<ProductDetail>("/admin/catalog/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function getProductsForAdmin(accessToken: string, search: string, categoryId: string, page: number, pageSize = 15): Promise<PagedResponse<ProductListItem>> {
  const parameters = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
  if (search.trim()) parameters.set("search", search.trim());
  if (categoryId) parameters.set("categoryId", categoryId);
  return requestJson<PagedResponse<ProductListItem>>(`/admin/catalog/products?${parameters}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function getProductForAdminById(accessToken: string, productId: string): Promise<ProductDetail> {
  return requestJson<ProductDetail>(`/admin/catalog/products/${productId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function updateProduct(accessToken: string, productId: string, payload: ProductPayload): Promise<ProductDetail> {
  return requestJson<ProductDetail>(`/admin/catalog/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function deleteProduct(accessToken: string, productId: string): Promise<void> {
  return requestJson<void>(`/admin/catalog/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function createProductVariant(accessToken: string, productId: string, payload: ProductVariantPayload): Promise<ProductVariant> {
  return requestJson<ProductVariant>(`/admin/catalog/products/${productId}/variants`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function updateProductVariant(accessToken: string, productId: string, variantId: string, payload: ProductVariantPayload): Promise<ProductVariant> {
  return requestJson<ProductVariant>(`/admin/catalog/products/${productId}/variants/${variantId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function deleteProductVariant(accessToken: string, productId: string, variantId: string): Promise<void> {
  return requestJson<void>(`/admin/catalog/products/${productId}/variants/${variantId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

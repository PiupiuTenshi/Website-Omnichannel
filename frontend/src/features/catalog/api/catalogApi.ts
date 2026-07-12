import { requestJson } from "../../../shared/api/apiClient";
import type { Category, PagedResponse, ProductDetail, ProductListItem, UnitOfMeasure } from "../types/catalogTypes";

export function getCategories(): Promise<Category[]> {
  return requestJson<Category[]>("/categories");
}

export function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  return requestJson<UnitOfMeasure[]>("/units-of-measure");
}

export function getProducts(search: string, categoryId: string, page: number): Promise<PagedResponse<ProductListItem>> {
  const parameters = new URLSearchParams({ page: page.toString(), pageSize: "12" });
  if (search.trim()) parameters.set("search", search.trim());
  if (categoryId) parameters.set("categoryId", categoryId);
  return requestJson<PagedResponse<ProductListItem>>(`/products?${parameters}`);
}

export function getProductBySlug(slug: string): Promise<ProductDetail> {
  return requestJson<ProductDetail>(`/products/by-slug/${encodeURIComponent(slug)}`);
}

export function createProduct(accessToken: string, payload: object): Promise<ProductDetail> {
  return requestJson<ProductDetail>("/admin/catalog/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

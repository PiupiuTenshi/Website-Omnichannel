export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface UnitOfMeasure {
  unitOfMeasureId: string;
  code: string;
  name: string;
  allowsDecimal: boolean;
  decimalScale: number;
  isActive: boolean;
}

export interface ProductListItem {
  productId: string;
  name: string;
  slug: string;
  categoryName: string;
  unitName: string;
  sellingPrice: number;
  compareAtPrice: number | null;
  primaryImageUrl: string | null;
}

export interface ProductVariant {
  productVariantId: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  rowVersion: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  categoryId: string;
  unitOfMeasureId: string;
  allowsDecimal: boolean;
  decimalScale: number;
  isActive: boolean;
  variants: ProductVariant[];
  images: Array<{ productImageId: string; url: string; isPrimary: boolean }>;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

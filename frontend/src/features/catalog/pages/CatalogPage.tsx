import { useEffect, useState } from "react";
import { getCategories, getProducts } from "../api/catalogApi";
import { ProductCard } from "../components/ProductCard";
import type { Category, PagedResponse, ProductListItem } from "../types/catalogTypes";
import "./CatalogPage.css";

export function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]); const [products, setProducts] = useState<PagedResponse<ProductListItem> | null>(null);
  const [search, setSearch] = useState(""); const [categoryId, setCategoryId] = useState(""); const [page, setPage] = useState(1); const [error, setError] = useState("");
  useEffect(() => { void getCategories().then(setCategories).catch(() => setError("Không thể tải danh mục.")); }, []);
  useEffect(() => { void getProducts(search, categoryId, page).then(setProducts).catch(() => setError("Không thể tải sản phẩm.")); }, [search, categoryId, page]);
  return <section className="catalog-page app-container" aria-labelledby="catalog-heading"><header className="catalog-page__hero"><p>Tạp hóa chị Tỏ</p><h1 id="catalog-heading">Rau tươi và nhu yếu phẩm mỗi ngày</h1></header><form className="catalog-page__filters" onSubmit={(event) => { event.preventDefault(); setPage(1); }}><label>Tìm sản phẩm<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tên sản phẩm" /></label><label>Danh mục<select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}><option value="">Tất cả</option>{categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)}</select></label></form>{error ? <p role="alert">{error}</p> : null}<div className="catalog-page__grid">{products?.items.map((product) => <ProductCard key={product.productId} product={product} />)}</div>{products && products.totalCount > products.pageSize ? <nav className="catalog-page__pagination" aria-label="Phân trang"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page}</span><button type="button" disabled={page * products.pageSize >= products.totalCount} onClick={() => setPage(page + 1)}>Trang sau</button></nav> : null}</section>;
}

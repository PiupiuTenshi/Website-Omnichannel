import { useEffect, useState } from "react";
import { getCategories, getProducts } from "../api/catalogApi";
import { ProductCard } from "../components/ProductCard";
import type { Category, PagedResponse, ProductListItem } from "../types/catalogTypes";
import "./CatalogPage.css";

export function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<PagedResponse<ProductListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    void getCategories()
      .then(setCategories)
      .catch(() => setError("Không thể tải danh mục."));
  }, []);

  useEffect(() => {
    void getProducts(search, categoryId, page)
      .then(setProducts)
      .catch(() => setError("Không thể tải sản phẩm."));
  }, [search, categoryId, page]);

  return (
    <section className="catalog-page app-container" aria-labelledby="catalog-heading">
      <header className="catalog-page__hero">
        <p>Tạp hóa chị Tỏ</p>
        <h1 id="catalog-heading">Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày</h1>
      </header>

      <form className="catalog-page__filters" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
        <div className="filter-input-group">
          <label htmlFor="search-input">Tìm sản phẩm</label>
          <div className="search-box">
            <input
              id="search-input"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Tên sản phẩm cần tìm..."
            />
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="filter-input-group mobile-only-select">
          <label htmlFor="category-select">Danh mục</label>
          <select
            id="category-select"
            value={categoryId}
            onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Visual Category Badges for Desktop & Tablet */}
      <div className="catalog-page__category-tags" role="group" aria-label="Lọc theo danh mục">
        <button
          type="button"
          className={`category-tag ${categoryId === "" ? "active" : ""}`}
          onClick={() => { setCategoryId(""); setPage(1); }}
        >
          🍉 Tất cả
        </button>
        {categories.map((category) => {
          const categoryClass = getCategoryClass(category.name);
          const icon = getCategoryIcon(category.name);
          return (
            <button
              key={category.categoryId}
              type="button"
              className={`category-tag ${categoryId === category.categoryId ? "active" : ""} ${categoryClass}`}
              onClick={() => { setCategoryId(category.categoryId); setPage(1); }}
            >
              {icon} {category.name}
            </button>
          );
        })}
      </div>

      {error ? <p role="alert" className="error-message">{error}</p> : null}

      <div className="catalog-page__grid">
        {products?.items.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>

      {products && products.totalCount > products.pageSize ? (
        <nav className="catalog-page__pagination" aria-label="Phân trang">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span className="pagination-info">Trang {page}</span>
          <button
            type="button"
            disabled={page * products.pageSize >= products.totalCount}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function getCategoryClass(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("rau") || name.includes("củ") || name.includes("nấm") || name.includes("veggie") || name.includes("vegetable")) {
    return "tag--veggies";
  }
  if (name.includes("trái") || name.includes("quả") || name.includes("fruit")) {
    return "tag--fruits";
  }
  if (name.includes("thịt") || name.includes("cá") || name.includes("hải sản") || name.includes("meat") || name.includes("seafood")) {
    return "tag--meat";
  }
  if (name.includes("sữa") || name.includes("trứng") || name.includes("dairy") || name.includes("egg")) {
    return "tag--dairy";
  }
  if (name.includes("nước") || name.includes("uống") || name.includes("giải khát") || name.includes("beverage") || name.includes("drink")) {
    return "tag--beverages";
  }
  if (name.includes("ăn vặt") || name.includes("bánh") || name.includes("kẹo") || name.includes("snack") || name.includes("sweet")) {
    return "tag--snacks";
  }
  return "tag--default";
}

function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("rau") || name.includes("củ") || name.includes("nấm") || name.includes("veggie") || name.includes("vegetable")) {
    return "🥬";
  }
  if (name.includes("trái") || name.includes("quả") || name.includes("fruit")) {
    return "🍎";
  }
  if (name.includes("thịt") || name.includes("cá") || name.includes("hải sản") || name.includes("meat") || name.includes("seafood")) {
    return "🥩";
  }
  if (name.includes("sữa") || name.includes("trứng") || name.includes("dairy") || name.includes("egg")) {
    return "🥛";
  }
  if (name.includes("nước") || name.includes("uống") || name.includes("giải khát") || name.includes("beverage") || name.includes("drink")) {
    return "🥤";
  }
  if (name.includes("ăn vặt") || name.includes("bánh") || name.includes("kẹo") || name.includes("snack") || name.includes("sweet")) {
    return "🍿";
  }
  return "📦";
}

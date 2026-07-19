import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getCategories, getProducts, searchSuggestions } from "../api/catalogApi";
import { ProductCard } from "../components/ProductCard";
import type { Category, PagedResponse, ProductListItem } from "../types/catalogTypes";
import type { StoreSettings } from "../../admin/types/storeSettingsTypes";
import "./CatalogPage.css";

export function CatalogPage() {
  const storeSettings = useOutletContext<StoreSettings | null>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<PagedResponse<ProductListItem> | null>(null);
  const [promotions, setPromotions] = useState<ProductListItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<ProductListItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productsHeaderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let isMounted = true;
    void getCategories()
      .then((loadedCategories) => {
        if (isMounted) setCategories(loadedCategories);
      })
      .catch(() => {
        if (isMounted) setError("Không thể tải danh mục.");
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    void getProducts(search, categoryId, page)
      .then((loadedProducts) => {
        if (isMounted) setProducts(loadedProducts);
      })
      .catch(() => {
        if (isMounted) setError("Không thể tải sản phẩm.");
      });
    return () => { isMounted = false; };
  }, [search, categoryId, page]);

  useEffect(() => {
    let isMounted = true;
    void getProducts("", "", 1, 100)
      .then((result) => {
        if (isMounted) {
          const activePromos = result.items.filter((product) => product.compareAtPrice !== null && product.compareAtPrice > product.sellingPrice);
          setPromotions(activePromos);
          
          const endTimes = activePromos
            .map(p => p.promotionEndAtUtc ? new Date(p.promotionEndAtUtc).getTime() : 0)
            .filter(t => t > Date.now());
            
          if (endTimes.length > 0) {
            setTimeLeft(Math.max(0, Math.min(...endTimes) - Date.now()));
          }
        }
      })
      .catch(() => {
        if (isMounted) setPromotions([]);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return "Đã kết thúc";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 24) {
       const days = Math.floor(hours / 24);
       return `${days} ngày ${hours % 24} giờ`;
    }
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Debounced search suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void searchSuggestions(searchInput.trim())
        .then((result) => {
          setSuggestions(result.items);
          setShowSuggestions(true);
        })
        .catch(() => {
          setSuggestions([]);
          setShowSuggestions(true);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
    setPage(1);
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    navigate(`/products/${slug}`);
  };

  const handleCategorySelect = (id: string) => {
    setCategoryId(id);
    setPage(1);
    setTimeout(() => {
      if (productsHeaderRef.current) {
        const headerOffset = 90; // sticky header height + some margins
        const elementPosition = productsHeaderRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

  return (
    <section className="catalog-page app-container" aria-labelledby="catalog-heading">
      <header className="catalog-page__hero">
        <p>{storeSettings?.name || "Tạp hóa chị Tỏ"}</p>
        <h1 id="catalog-heading">Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày</h1>
      </header>

      {/* Search Bar with Autocomplete */}
      <form className="catalog-page__search-bar" onSubmit={(event) => { event.preventDefault(); setShowSuggestions(false); setPage(1); }}>
        <div className="search-box" ref={searchBoxRef}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-input"
            value={searchInput}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Tìm rau củ, thịt cá, đồ dùng..."
            autoComplete="off"
          />
          {searchInput && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => { setSearchInput(""); setSearch(""); setSuggestions([]); setShowSuggestions(false); setPage(1); }}
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="search-suggestions" ref={suggestionsRef} role="listbox" aria-label="Gợi ý sản phẩm">
              {suggestions.length > 0 ? (
                <>
                  {suggestions.map((item) => (
                    <button
                      key={item.productId}
                      type="button"
                      className="suggestion-item"
                      role="option"
                      onClick={() => handleSuggestionClick(item.slug)}
                    >
                      <div className="suggestion-item__img">
                        {item.primaryImageUrl ? (
                          <img src={item.primaryImageUrl} alt="" loading="lazy" />
                        ) : (
                          <span className="suggestion-item__placeholder">📦</span>
                        )}
                      </div>
                      <div className="suggestion-item__info">
                        <span className="suggestion-item__name">{item.name}</span>
                        <span className="suggestion-item__category">{item.categoryName}</span>
                      </div>
                      <span className="suggestion-item__price">{formatPrice(item.sellingPrice)}</span>
                    </button>
                  ))}
                  <div className="suggestion-footer">
                    <span>Nhấn Enter để xem tất cả kết quả</span>
                  </div>
                </>
              ) : (
                <div className="suggestion-no-results">
                  Không tìm thấy sản phẩm
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Visual Category Circular Icons */}
      <div className="catalog-page__category-nav" role="group" aria-label="Lọc theo danh mục">
        <button
          type="button"
          className={`cat-circle-btn ${categoryId === "" ? "active" : ""}`}
          onClick={() => handleCategorySelect("")}
        >
          <div className="cat-circle bg-surface">🌟</div>
          <span>Tất cả</span>
        </button>
        {categories.map((category) => {
          const categoryClass = getCategoryClass(category.name);
          const icon = getCategoryIcon(category.name);
          return (
            <button
              key={category.categoryId}
              type="button"
              className={`cat-circle-btn ${categoryId === category.categoryId ? "active" : ""}`}
              onClick={() => handleCategorySelect(category.categoryId)}
            >
              <div className={`cat-circle ${categoryClass}`}>{icon}</div>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Promotional Banner */}
      <div className="catalog-page__promo-banner">
        <div className="promo-text">
          <h2>Rau củ tươi mỗi sáng, giá rẻ mỗi ngày</h2>
          <p>Thu mua trực tiếp từ nông trại, giao trong 2 giờ</p>
          <button className="btn-promo hover-lift">Mua ngay</button>
        </div>
        <div className="promo-icon">🛒</div>
      </div>

      {/* Trust Badges */}
      <div className="catalog-page__trust-badges">
        <div className="trust-badge">
          <span className="trust-icon">💰</span>
          <p>Giá rẻ mỗi ngày</p>
        </div>
        <div className="trust-badge">
          <span className="trust-icon">🥬</span>
          <p>Tươi mới 100%</p>
        </div>
        <div className="trust-badge">
          <span className="trust-icon">⏱️</span>
          <p>Giao nhanh 2 giờ</p>
        </div>
        <div className="trust-badge">
          <span className="trust-icon">🏪</span>
          <p>Chỉ 1 cửa hàng duy nhất</p>
        </div>
      </div>

      {promotions.length > 0 && (
        <section className="catalog-page__flash-sale" aria-labelledby="promotion-heading">
          <div className="flash-sale-header">
            <h2 id="promotion-heading">Sản phẩm đang giảm giá</h2>
            <span className="countdown-timer">Kết thúc trong {formatTime(timeLeft)}</span>
          </div>
          <div className="flash-sale-grid">
            {promotions.slice(0, 4).map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale is disabled until it is backed by the promotion API. */}
      {/*
      <div className="catalog-page__flash-sale">
        <div className="flash-sale-header">
          <h2>Khung giờ vàng, giảm sâu</h2>
          <span className="countdown-timer">Kết thúc trong {formatTime(timeLeft)}</span>
        </div>
        <div className="flash-sale-grid">
          <Link to="/products/ca-rot-da-lat" className="flash-sale-card hover-lift">
            <span className="discount-tag">-20%</span>
            <div className="fs-icon bg-success">🥕</div>
            <p className="fs-title">Cà rốt Đà Lạt 1kg</p>
            <p className="fs-price">16.000đ <s>20.000đ</s></p>
          </Link>
          <Link to="/products/trung-ga-vinamilk" className="flash-sale-card hover-lift">
            <span className="discount-tag">-15%</span>
            <div className="fs-icon bg-warning">🥚</div>
            <p className="fs-title">Trứng gà Vinamilk (Hộp)</p>
            <p className="fs-price">28.000đ <s>33.000đ</s></p>
          </Link>
          <Link to="/products/sua-th-true-milk" className="flash-sale-card hover-lift">
            <span className="discount-tag">-10%</span>
            <div className="fs-icon bg-info">🥛</div>
            <p className="fs-title">Sữa tươi TH True Milk 1L</p>
            <p className="fs-price">29.500đ <s>33.000đ</s></p>
          </Link>
          <Link to="/products/banh-cosy-marie" className="flash-sale-card hover-lift">
            <span className="discount-tag">-25%</span>
            <div className="fs-icon bg-surface">🍪</div>
            <p className="fs-title">Bánh quy Cosy Marie</p>
            <p className="fs-price">15.000đ <s>20.000đ</s></p>
          </Link>
        </div>
      </div>

      */}
      <div className="catalog-page__section-header" ref={productsHeaderRef}>
        <h2>{categoryId ? "Sản phẩm theo danh mục" : "Tất cả sản phẩm"}</h2>
      </div>

      {error ? <p role="alert" className="error-message">{error}</p> : null}

      {products && products.items.length === 0 ? (
        <p className="no-data" style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--color-text-muted)" }}>
          Không tìm thấy sản phẩm nào phù hợp với từ khóa tìm kiếm.
        </p>
      ) : (
        <div className="product-grid">
          {products?.items.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      )}

      {products && products.totalCount > products.pageSize ? (
        <nav className="catalog-page__pagination" aria-label="Phân trang">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span className="pagination-info">Trang {page} / {Math.ceil(products.totalCount / products.pageSize)}</span>
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
    return "bg-success";
  }
  if (name.includes("trái") || name.includes("quả") || name.includes("fruit")) {
    return "bg-warning";
  }
  if (name.includes("thịt") || name.includes("cá") || name.includes("hải sản") || name.includes("meat") || name.includes("seafood")) {
    return "bg-danger";
  }
  if (name.includes("sữa") || name.includes("trứng") || name.includes("dairy") || name.includes("egg")) {
    return "bg-info";
  }
  if (name.includes("nước") || name.includes("uống") || name.includes("giải khát") || name.includes("beverage") || name.includes("drink")) {
    return "bg-violet";
  }
  if (name.includes("ăn vặt") || name.includes("bánh") || name.includes("kẹo") || name.includes("snack") || name.includes("sweet")) {
    return "bg-orange";
  }
  return "bg-surface";
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

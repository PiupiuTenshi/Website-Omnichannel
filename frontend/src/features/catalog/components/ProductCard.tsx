import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../cart";
import type { ProductListItem } from "../types/catalogTypes";
import "./ProductCard.css";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const categoryClass = getCategoryClass(product.categoryName);
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  async function addToCart() {
    setIsAdding(true);
    setAddError("");
    try {
      await addItem(product.productVariantId, product.isWeighed ? 0.1 : 1);
    } catch {
      setAddError("Không thể thêm sản phẩm vào giỏ hàng.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <article className="product-card">
      <div className="product-card__image-container">
        <Link className="product-card__image-link" to={`/products/${product.slug}`} aria-label={`Xem ${product.name}`}>
          {product.primaryImageUrl ? (
            <img className="product-card__image" src={product.primaryImageUrl} alt="" loading="lazy" />
          ) : (
            <div className="product-card__placeholder" aria-hidden="true">
              <svg className="product-card__placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span>Chưa có ảnh</span>
            </div>
          )}
        </Link>
        <span className={`product-card__category-badge ${categoryClass}`}>
          {product.categoryName}
        </span>
      </div>

      <div className="product-card__content">
        <h2 className="product-card__title">
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h2>
        <div className="product-card__footer">
          <div className="product-card__price-group">
            <span className="product-card__price">{formatCurrency(product.sellingPrice)}</span>
            <span className="product-card__unit">/ {product.unitName}</span>
          </div>
          <button type="button" className="product-card__add-btn" aria-label={`Thêm ${product.name} vào giỏ hàng`} onClick={() => void addToCart()} disabled={isAdding}>
            <svg className="product-card__add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        {addError ? <p className="product-card__add-error" role="alert">{addError}</p> : null}
      </div>
    </article>
  );
}

function getCategoryClass(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("rau") || name.includes("củ") || name.includes("nấm") || name.includes("veggie") || name.includes("vegetable")) {
    return "category--veggies";
  }
  if (name.includes("trái") || name.includes("quả") || name.includes("fruit")) {
    return "category--fruits";
  }
  if (name.includes("thịt") || name.includes("cá") || name.includes("hải sản") || name.includes("meat") || name.includes("seafood")) {
    return "category--meat";
  }
  if (name.includes("sữa") || name.includes("trứng") || name.includes("dairy") || name.includes("egg")) {
    return "category--dairy";
  }
  if (name.includes("nước") || name.includes("uống") || name.includes("giải khát") || name.includes("beverage") || name.includes("drink")) {
    return "category--beverages";
  }
  if (name.includes("ăn vặt") || name.includes("bánh") || name.includes("kẹo") || name.includes("snack") || name.includes("sweet")) {
    return "category--snacks";
  }
  return "category--default";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

import { Link } from "react-router-dom";
import type { ProductListItem } from "../types/catalogTypes";
import "./ProductCard.css";

interface ProductCardProps { product: ProductListItem; }

export function ProductCard({ product }: ProductCardProps) {
  return <article className="product-card">
    <Link className="product-card__image-link" to={`/products/${product.slug}`} aria-label={`Xem ${product.name}`}>
      {product.primaryImageUrl ? <img className="product-card__image" src={product.primaryImageUrl} alt="" loading="lazy" /> : <span className="product-card__placeholder" aria-hidden="true">Ảnh sản phẩm</span>}
    </Link>
    <div className="product-card__content"><p className="product-card__category">{product.categoryName}</p><h2 className="product-card__title"><Link to={`/products/${product.slug}`}>{product.name}</Link></h2><p className="product-card__price">{formatCurrency(product.sellingPrice)} <span>/ {product.unitName}</span></p></div>
  </article>;
}

function formatCurrency(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value); }

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductBySlug } from "../api/catalogApi";
import type { ProductDetail } from "../types/catalogTypes";
import "./ProductDetailPage.css";

export function ProductDetailPage() { const { slug = "" } = useParams(); const [product, setProduct] = useState<ProductDetail | null>(null); const [error, setError] = useState(""); useEffect(() => { void getProductBySlug(slug).then(setProduct).catch(() => setError("Không tìm thấy sản phẩm.")); }, [slug]); if (error) return <p className="app-container" role="alert">{error}</p>; if (!product) return <p className="app-container">Đang tải sản phẩm…</p>; const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0]; return <article className="product-detail app-container"><div className="product-detail__image">{primaryImage ? <img src={primaryImage.url} alt="" /> : <span>Ảnh sản phẩm</span>}</div><div><p>{product.categoryName}</p><h1>{product.name}</h1><p>{product.description}</p><ul>{product.variants.filter((variant) => variant.isActive).map((variant) => <li key={variant.productVariantId}>{variant.name}: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(variant.sellingPrice)}</li>)}</ul></div></article>; }

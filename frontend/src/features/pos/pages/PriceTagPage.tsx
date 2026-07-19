import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { searchPosProducts } from "../api/posApi";
import type { PosProduct } from "../types/posTypes";
import "./PriceTagPage.css";

export function PriceTagPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const [error, setError] = useState("");

  const searchProducts = async (value: string) => {
    setQuery(value);
    if (!session || !value.trim()) {
      setProducts([]);
      return;
    }

    try {
      setError("");
      setProducts(await searchPosProducts(session.accessToken, value));
    } catch {
      setProducts([]);
      setError("Không thể tìm sản phẩm để in tag.");
    }
  };

  return <section className="price-tag-page app-container" aria-labelledby="price-tag-heading">
    <header className="price-tag-page__header no-print">
      <div>
        <h1 id="price-tag-heading">In tag giá</h1>
        <p>Tìm sản phẩm, kiểm tra nhãn và in khổ 40 × 60 mm.</p>
      </div>
      <button type="button" className="btn btn--outline" onClick={() => navigate("/manager/pos")}>Quay lại POS</button>
    </header>

    <div className="price-tag-page__content no-print">
      <section className="card price-tag-page__search-panel">
        <label className="form__label" htmlFor="price-tag-search">Sản phẩm, SKU hoặc mã vạch</label>
        <input id="price-tag-search" className="form__input" autoFocus value={query} onChange={(event) => void searchProducts(event.target.value)} placeholder="Nhập tên sản phẩm, SKU hoặc quét mã vạch" />
        {error && <p className="price-tag-page__error" role="alert">{error}</p>}
        {products.length > 0 && <div className="price-tag-page__results">
          {products.map((product) => <button type="button" key={product.productVariantId} className="price-tag-page__result" onClick={() => setSelectedProduct(product)}>
            <span><strong>{product.productName}</strong><small>{product.variantName} · SKU: {product.sku}</small></span>
            <strong>{product.price.toLocaleString("vi-VN")} đ</strong>
          </button>)}
        </div>}
      </section>

      <section className="card price-tag-page__preview-panel">
        <h2>Tag xem trước</h2>
        {selectedProduct ? <>
          <div className="price-tag-print">
            <div className="price-tag-print__brand">TẠP HÓA CHỊ TỎ</div>
            <div className="price-tag-print__title">{selectedProduct.productName}</div>
            <div className="price-tag-print__variant">{selectedProduct.variantName}</div>
            <div className="price-tag-print__sku">SKU: {selectedProduct.sku}</div>
            <div className="price-tag-print__barcode">|||| ||||| || |||<span>{selectedProduct.barcode ?? selectedProduct.sku}</span></div>
            <div className="price-tag-print__price">{selectedProduct.price.toLocaleString("vi-VN")} đ</div>
          </div>
          <button type="button" className="btn btn--primary price-tag-page__print-button" onClick={() => window.print()}>In tag (40 × 60 mm)</button>
        </> : <p className="price-tag-page__empty">Chọn một sản phẩm để tạo tag giá.</p>}
      </section>
    </div>
  </section>;
}

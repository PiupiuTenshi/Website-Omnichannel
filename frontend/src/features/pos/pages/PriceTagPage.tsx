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
  const [selectedProducts, setSelectedProducts] = useState<PosProduct[]>([]);
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

  const toggleProduct = (product: PosProduct) => {
    setSelectedProducts((current) => current.some((item) => item.productVariantId === product.productVariantId)
      ? current.filter((item) => item.productVariantId !== product.productVariantId)
      : [...current, product]);
  };

  const printSelectedTags = () => {
    const printWindow = window.open("", "price-tag-print", "width=1100,height=800");
    if (printWindow === null) {
      setError("Trình duyệt đã chặn cửa sổ in. Hãy cho phép mở cửa sổ bật lên rồi thử lại.");
      return;
    }

    const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
    const tags = selectedProducts.map((product) => `
      <article class="tag">
        <div class="product">
          <div class="brand">TẠP HÓA CHỊ TỎ</div>
          <div class="title">${escapeHtml(product.productName)}</div>
          <div class="variant">${escapeHtml(product.variantName)}</div>
          <div class="sku">SKU: ${escapeHtml(product.sku)}</div>
        </div>
        <div class="pricing">
          <div class="barcode">|||| ||||| || |||<span>${escapeHtml(product.barcode ?? product.sku)}</span></div>
          <div class="price">${product.price.toLocaleString("vi-VN")} đ</div>
        </div>
      </article>`).join("");

    printWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>In tag giá</title><style>
      @page { size: A4 portrait; margin: 10mm; }
      * { box-sizing: border-box; } body { margin: 0; font-family: Arial, sans-serif; color: #000; }
      .tags { display: grid; grid-template-columns: repeat(3, 60mm); grid-auto-rows: 40mm; gap: 2mm; align-content: start; }
      .tag { width: 60mm; height: 40mm; padding: 3mm 4mm; border: 1px solid #000; border-radius: 1mm; display: grid; grid-template-columns: minmax(0, 1fr) 22mm; column-gap: 3mm; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
      .product { min-width: 0; overflow: hidden; }.brand { font-size: 8pt; font-weight: 800; white-space: nowrap; }.title { margin-top: 3mm; font-size: 10pt; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }.variant, .sku { margin-top: 1.5mm; font-size: 7pt; line-height: 1.15; overflow-wrap: anywhere; }.pricing { min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }.barcode { width: 100%; overflow: hidden; font-family: monospace; font-size: 8pt; line-height: 1; text-align: center; }.barcode span { display: block; margin-top: 1mm; font-size: 6pt; overflow-wrap: anywhere; }.price { max-width: 100%; font-size: 13pt; font-weight: 800; line-height: 1; white-space: nowrap; text-align: center; }
    </style></head><body><main class="tags">${tags}</main><script>window.onload = () => { window.focus(); window.print(); };</script></body></html>`);
    printWindow.document.close();
  };

  return <section className="price-tag-page app-container" aria-labelledby="price-tag-heading">
    <header className="price-tag-page__header no-print">
      <div>
        <h1 id="price-tag-heading">In tag giá</h1>
        <p>Chọn nhiều sản phẩm, kiểm tra nhãn và in tag ngang khổ 60 × 40 mm.</p>
      </div>
      <button type="button" className="btn btn--outline" onClick={() => navigate("/manager/pos")}>Quay lại POS</button>
    </header>

    <div className="price-tag-page__content no-print">
      <section className="card price-tag-page__search-panel">
        <label className="form__label" htmlFor="price-tag-search">Sản phẩm, SKU hoặc mã vạch</label>
        <input id="price-tag-search" className="form__input" autoFocus value={query} onChange={(event) => void searchProducts(event.target.value)} placeholder="Nhập tên sản phẩm, SKU hoặc quét mã vạch" />
        {error && <p className="price-tag-page__error" role="alert">{error}</p>}
        {products.length > 0 && <div className="price-tag-page__results">
          {products.map((product) => {
            const isSelected = selectedProducts.some((item) => item.productVariantId === product.productVariantId);
            return <button type="button" key={product.productVariantId} className={`price-tag-page__result ${isSelected ? "price-tag-page__result--selected" : ""}`} onClick={() => toggleProduct(product)}>
            <span><strong>{product.productName}</strong><small>{product.variantName} · SKU: {product.sku}</small></span>
            <span className="price-tag-page__result-price"><strong>{product.price.toLocaleString("vi-VN")} đ</strong><small>{isSelected ? "Đã chọn" : "Chọn tag"}</small></span>
          </button>;
          })}
        </div>}
      </section>

      <section className="card price-tag-page__preview-panel">
        <div className="price-tag-page__preview-heading">
          <h2>Tag đã chọn ({selectedProducts.length})</h2>
          {selectedProducts.length > 0 && <button type="button" className="btn btn--outline btn--sm" onClick={() => setSelectedProducts([])}>Bỏ chọn tất cả</button>}
        </div>
        {selectedProducts.length > 0 ? <>
          <div className="price-tag-page__tags">
            {selectedProducts.map((product) => <div className="price-tag-print" key={product.productVariantId}>
              <div className="price-tag-print__product">
                <div className="price-tag-print__brand">TẠP HÓA CHỊ TỎ</div>
                <div className="price-tag-print__title">{product.productName}</div>
                <div className="price-tag-print__variant">{product.variantName}</div>
                <div className="price-tag-print__sku">SKU: {product.sku}</div>
              </div>
              <div className="price-tag-print__pricing">
                <div className="price-tag-print__barcode">|||| ||||| || |||<span>{product.barcode ?? product.sku}</span></div>
                <div className="price-tag-print__price">{product.price.toLocaleString("vi-VN")} đ</div>
              </div>
            </div>)}
          </div>
          <button type="button" className="btn btn--primary price-tag-page__print-button" onClick={printSelectedTags}>In {selectedProducts.length} tag ngang trên A4</button>
        </> : <p className="price-tag-page__empty">Chọn một hoặc nhiều sản phẩm để tạo tag giá.</p>}
      </section>
    </div>
  </section>;
}

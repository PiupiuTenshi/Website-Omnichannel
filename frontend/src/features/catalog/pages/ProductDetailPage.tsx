import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, getImageUrl } from "../../../shared/api/apiClient";
import { useCart } from "../../cart";
import { getProductBySlug } from "../api/catalogApi";
import type { ProductDetail } from "../types/catalogTypes";
import "./ProductDetailPage.css";

const moneyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

/** Pre-defined portion sizes for weight-based (KG) products. Weight is in kg. */
const PORTION_PRESETS = [
  { label: "Phần nhỏ", grams: 200, weight: 0.2 },
  { label: "Phần vừa", grams: 500, weight: 0.5 },
  { label: "Phần 1 kg", grams: 1000, weight: 1 },
  { label: "Phần 2 kg", grams: 2000, weight: 2 },
  { label: "Phần 5 kg", grams: 5000, weight: 5 },
];

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedPortionIndex, setSelectedPortionIndex] = useState(1); // default "Phần vừa"
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setProduct(null);
    setError("");
    void getProductBySlug(slug)
      .then((loadedProduct) => {
        setProduct(loadedProduct);
        setSelectedVariantId(loadedProduct.variants.find((variant) => variant.isActive)?.productVariantId ?? "");
        if (loadedProduct.allowsDecimal) {
          // For weight products, default to "Phần vừa" (500g = 0.5 kg)
          setSelectedPortionIndex(1);
          setQuantity(PORTION_PRESETS[1].weight.toString());
        } else {
          setQuantity("1");
        }
      })
      .catch(() => setError("Không tìm thấy sản phẩm."));
  }, [slug]);

  if (error) return <p className="app-container" role="alert">{error}</p>;
  if (!product) return <p className="app-container">Đang tải sản phẩm…</p>;

  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const selectedVariant = activeVariants.find((variant) => variant.productVariantId === selectedVariantId) ?? null;
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const isWeightBased = product.allowsDecimal;

  async function handleAddToCart() {
    if (product === null || selectedVariant === null) {
      setError("Sản phẩm hiện không có biến thể có thể mua.");
      return;
    }

    const requestedQuantity = Number(quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      setError("Số lượng phải lớn hơn 0.");
      return;
    }

    if (isWeightBased) {
      const followsWeightStep = Math.abs(requestedQuantity * 10 - Math.round(requestedQuantity * 10)) < Number.EPSILON;
      if (!followsWeightStep) {
        setError("Khối lượng phải theo bước 0,1 kg.");
        return;
      }
    }

    setIsAdding(true);
    setError("");
    setMessage("");
    try {
      await addItem(selectedVariant.productVariantId, requestedQuantity);
      const portionLabel = isWeightBased ? PORTION_PRESETS[selectedPortionIndex].label : `${requestedQuantity}`;
      setMessage(`Đã thêm ${product.name} (${portionLabel}) vào giỏ hàng.`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Không thể thêm sản phẩm vào giỏ hàng.");
    } finally {
      setIsAdding(false);
    }
  }

  // For discrete products: +/- quantity buttons
  const handleDecreaseQuantity = () => {
    const currentVal = parseInt(quantity, 10) || 1;
    setQuantity(Math.max(1, currentVal - 1).toString());
  };

  const handleIncreaseQuantity = () => {
    const currentVal = parseInt(quantity, 10) || 1;
    setQuantity((currentVal + 1).toString());
  };

  // Discount calculation
  const hasDiscount = selectedVariant && selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.sellingPrice;
  const discountPercent = hasDiscount && selectedVariant.compareAtPrice
    ? Math.round(((selectedVariant.compareAtPrice - selectedVariant.sellingPrice) / selectedVariant.compareAtPrice) * 100)
    : 0;

  // Subtotal: for weight products use portion weight × price/kg, for discrete use quantity × price
  const subtotal = selectedVariant
    ? selectedVariant.sellingPrice * (parseFloat(quantity) || 0)
    : 0;

  // Unit price display (price per gram for weight products)
  const pricePerGram = selectedVariant ? selectedVariant.sellingPrice / 1000 : 0;

  return (
    <section className="product-detail-page app-container">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Cửa hàng</Link>
        <span className="separator">/</span>
        <span className="current-category">{product.categoryName}</span>
        <span className="separator">/</span>
        <span className="current-item">{product.name}</span>
      </nav>

      <article className="product-detail">
        {/* Left Column: Image Gallery */}
        <div className="product-detail__gallery">
          <div className="product-detail__image-container">
            {primaryImage ? (
              <img src={getImageUrl(primaryImage.url)} alt={product.name} className="product-detail__main-img" />
            ) : (
              <div className="product-detail__placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span>Chưa có ảnh</span>
              </div>
            )}
            {hasDiscount && <span className="product-detail__discount-badge">-{discountPercent}%</span>}
          </div>
          <div className="product-detail__badges">
            <span className="badge-item">🥬 100% Tươi Sạch</span>
            <span className="badge-item">🛡️ Đã Kiểm Định</span>
          </div>
        </div>

        {/* Right Column: Info & Action */}
        <div className="product-detail__content">
          <div className="product-detail__header">
            <span className="product-detail__cat-tag">{product.categoryName}</span>
            <h1 className="product-detail__title">{product.name}</h1>
          </div>

          {/* Unit Price Reference */}
          {selectedVariant && (
            <div className="product-detail__price-group">
              {isWeightBased ? (
                <>
                  <span className="product-detail__price">{moneyFormatter.format(selectedVariant.sellingPrice)}<span className="price-unit"> / kg</span></span>
                  <span className="product-detail__price-gram">(≈ {moneyFormatter.format(pricePerGram)} / gram)</span>
                </>
              ) : (
                <span className="product-detail__price">{moneyFormatter.format(selectedVariant.sellingPrice)}<span className="price-unit"> / {product.unitName}</span></span>
              )}
              {hasDiscount && (
                <>
                  <span className="product-detail__compare-price">{moneyFormatter.format(selectedVariant.compareAtPrice!)}</span>
                  <span className="product-detail__discount-label">Tiết kiệm {moneyFormatter.format(selectedVariant.compareAtPrice! - selectedVariant.sellingPrice)}</span>
                </>
              )}
            </div>
          )}

          {/* Short Description */}
          <div className="product-detail__description">
            <h3>Mô tả sản phẩm</h3>
            <p>{product.description || "Sản phẩm được tuyển chọn kỹ lưỡng, đảm bảo tiêu chuẩn vệ sinh an toàn thực phẩm, tươi ngon, giàu dinh dưỡng cho bữa ăn gia đình."}</p>
          </div>

          {/* Variant Selection Pills (only show if multiple variants) */}
          {activeVariants.length > 1 && (
            <div className="product-detail__variants">
              <h3>Chọn phân loại</h3>
              <div className="variant-pills">
                {activeVariants.map((variant) => (
                  <button
                    key={variant.productVariantId}
                    type="button"
                    className={`variant-pill ${selectedVariantId === variant.productVariantId ? "active" : ""}`}
                    onClick={() => {
                      setSelectedVariantId(variant.productVariantId);
                      setMessage("");
                      setError("");
                    }}
                  >
                    <span className="variant-pill__name">{variant.name}</span>
                    <span className="variant-pill__price">{moneyFormatter.format(variant.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WEIGHT-BASED: Portion Selector */}
          {isWeightBased && selectedVariant && (
            <div className="product-detail__portions">
              <h3>Chọn phần mua</h3>
              <div className="portion-grid">
                {PORTION_PRESETS.map((portion, index) => {
                  const portionTotal = selectedVariant.sellingPrice * portion.weight;
                  return (
                    <button
                      key={portion.grams}
                      type="button"
                      className={`portion-card ${selectedPortionIndex === index ? "active" : ""}`}
                      onClick={() => {
                        setSelectedPortionIndex(index);
                        setQuantity(portion.weight.toString());
                        setMessage("");
                        setError("");
                      }}
                    >
                      <span className="portion-card__label">{portion.label}</span>
                      <span className="portion-card__grams">{portion.grams}g</span>
                      <span className="portion-card__price">{moneyFormatter.format(portionTotal)}</span>
                    </button>
                  );
                })}
              </div>
              <p className="portion-note">
                Giá tính theo: {moneyFormatter.format(selectedVariant.sellingPrice)}/kg
              </p>
            </div>
          )}

          {/* DISCRETE: Quantity Selector */}
          {!isWeightBased && (
            <div className="product-detail__purchase-section">
              <div className="quantity-and-label">
                <span className="field-label">Số lượng</span>
                <div className="quantity-selector">
                  <button type="button" className="qty-btn" onClick={handleDecreaseQuantity}>-</button>
                  <input
                    id="product-quantity"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                  <button type="button" className="qty-btn" onClick={handleIncreaseQuantity}>+</button>
                </div>
              </div>
            </div>
          )}

          {/* Subtotal */}
          {selectedVariant && (
            <div className="product-detail__subtotal-bar">
              <div className="subtotal-info">
                <span className="subtotal-label">Tạm tính:</span>
                {isWeightBased && (
                  <span className="subtotal-detail">
                    {PORTION_PRESETS[selectedPortionIndex].grams}g × {moneyFormatter.format(pricePerGram)}/g
                  </span>
                )}
                {!isWeightBased && (
                  <span className="subtotal-detail">
                    {quantity} × {moneyFormatter.format(selectedVariant.sellingPrice)}
                  </span>
                )}
              </div>
              <span className="subtotal-value">{moneyFormatter.format(subtotal)}</span>
            </div>
          )}

          {/* Messages */}
          {error ? <p className="product-detail__message product-detail__message--error" role="alert">{error}</p> : null}
          {message ? <p className="product-detail__message" role="status">{message} <Link to="/cart" className="cart-redirect-btn">Xem giỏ hàng</Link></p> : null}

          {/* Primary Action Button */}
          <button
            className="product-detail__add-button hover-lift"
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={isAdding || selectedVariant === null}
          >
            <svg className="cart-add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span>{isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}</span>
          </button>
        </div>
      </article>

      {/* Specifications / Detail Information */}
      <section className="product-detail__specs">
        <h2>Thông tin chi tiết</h2>
        <div className="specs-grid">
          <div className="spec-row">
            <span className="spec-label">Thương hiệu</span>
            <span className="spec-value">Tạp hóa chị Tỏ</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Xuất xứ</span>
            <span className="spec-value">{product.categoryName.includes("Rau") || product.categoryName.includes("Trái") ? "Đà Lạt, Lâm Đồng, Việt Nam" : "Việt Nam"}</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Đơn vị tính</span>
            <span className="spec-value">{product.unitName}</span>
          </div>
          {selectedVariant && (
            <div className="spec-row">
              <span className="spec-label">Mã vạch (Barcode)</span>
              <span className="spec-value">{selectedVariant.barcode || "Đang cập nhật"}</span>
            </div>
          )}
          {isWeightBased && selectedVariant && (
            <div className="spec-row">
              <span className="spec-label">Bảng giá tham khảo</span>
              <span className="spec-value">{moneyFormatter.format(pricePerGram)}/gram — {moneyFormatter.format(selectedVariant.sellingPrice)}/kg</span>
            </div>
          )}
          <div className="spec-row">
            <span className="spec-label">Quy cách bảo quản</span>
            <span className="spec-value">{product.categoryName.includes("Thịt") || product.categoryName.includes("Sữa") || product.categoryName.includes("Đông") || product.categoryName.includes("Rau") ? "Ngăn mát/đông tủ lạnh (2-8°C)" : "Nơi khô ráo thoáng mát"}</span>
          </div>
        </div>
      </section>

      {/* Trust Commitments */}
      <section className="product-detail__commitments">
        <div className="commitment-card">
          <span className="commitment-icon">🥬</span>
          <h4>100% Hữu Cơ & Sạch</h4>
          <p>Sản phẩm được tuyển chọn kỹ lưỡng, đạt tiêu chuẩn VietGAP/GlobalGAP.</p>
        </div>
        <div className="commitment-card">
          <span className="commitment-icon">🚚</span>
          <h4>Giao Hàng Nhanh 2h</h4>
          <p>Cam kết bảo quản lạnh trong quá trình vận chuyển để duy trì độ tươi ngon.</p>
        </div>
        <div className="commitment-card">
          <span className="commitment-icon">🔄</span>
          <h4>Đổi Trả Dễ Dàng</h4>
          <p>Hỗ trợ đổi trả miễn phí trong vòng 24h nếu sản phẩm không đúng chất lượng.</p>
        </div>
      </section>
    </section>
  );
}

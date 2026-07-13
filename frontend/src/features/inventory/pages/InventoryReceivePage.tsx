import { useEffect, useState } from "react";
import { getProducts, getProductBySlug } from "../../catalog/api/catalogApi";
import { useAuth } from "../../auth";
import { getSuppliers, receiveInventory } from "../api/inventoryApi";
import type { Supplier } from "../types/inventoryTypes";
import type { ProductListItem, ProductVariant } from "../../catalog/types/catalogTypes";
import "./InventoryReceivePage.css";

export function InventoryReceivePage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().substring(0, 16));
  const [manufacturedAt, setManufacturedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reference, setReference] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    // Load suppliers
    void getSuppliers(session.accessToken).then(setSuppliers).catch(() => setError("Không thể tải danh sách nhà cung cấp."));

    // Load initial products list
    void getProducts("", "", 1)
      .then((res) => setProducts(res.items))
      .catch(() => setError("Không thể tải danh sách sản phẩm."));
  }, [session]);

  // Handle product search
  const handleSearchProducts = async (query: string) => {
    setSearchQuery(query);
    try {
      const res = await getProducts(query, "", 1);
      setProducts(res.items);
    } catch {
      setError("Tìm kiếm sản phẩm thất bại.");
    }
  };

  // When product is selected, load its details to get variants
  const handleSelectProduct = async (product: ProductListItem) => {
    setSelectedProduct(product);
    setSelectedVariantId("");
    setVariants([]);
    try {
      const details = await getProductBySlug(product.slug);
      setVariants(details.variants || []);
      if (details.variants && details.variants.length > 0) {
        setSelectedVariantId(details.variants[0].productVariantId);
      }
    } catch {
      setError("Không thể tải thông tin chi tiết các biến thể sản phẩm.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!selectedVariantId) {
      setError("Vui lòng chọn biến thể sản phẩm.");
      return;
    }
    const qtyVal = Number(quantity);
    const costVal = Number(unitCost);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError("Số lượng nhận kho phải lớn hơn 0.");
      return;
    }

    if (isNaN(costVal) || costVal < 0) {
      setError("Đơn giá nhập kho không được âm.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        productVariantId: selectedVariantId,
        supplierId: selectedSupplierId || undefined,
        quantity: qtyVal,
        unitCost: costVal,
        receivedAtUtc: new Date(receivedAt).toISOString(),
        manufacturedAtUtc: manufacturedAt ? new Date(manufacturedAt).toISOString() : undefined,
        expiresAtUtc: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        reference: reference.trim() || undefined
      };

      await receiveInventory(session.accessToken, payload);

      setSuccess("Nhập lô hàng thành công!");
      setQuantity("");
      setUnitCost("");
      setManufacturedAt("");
      setExpiresAt("");
      setReference("");
      setSelectedProduct(null);
      setVariants([]);
      setSelectedVariantId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi nhập kho lô hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="receive-page app-container" aria-labelledby="receive-heading">
      <div className="receive-page__header">
        <h1 id="receive-heading" className="receive-page__title">Nhập kho lô hàng</h1>
        <p className="receive-page__subtitle">Ghi nhận thông tin nhận hàng, đơn giá nhập, hạn sử dụng và lưu vào ledger tồn kho</p>
      </div>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}</div>}

      <div className="receive-page__content grid-two-columns">
        <div className="receive-page__search-section card">
          <h2 className="card__title">1. Chọn sản phẩm cần nhập</h2>
          <label className="form__field">
            <span className="form__label">Tìm kiếm tên hoặc mã vạch</span>
            <input
              type="search"
              className="form__input"
              value={searchQuery}
              onChange={(e) => void handleSearchProducts(e.target.value)}
              placeholder="Nhập tên sản phẩm để tìm kiếm..."
            />
          </label>

          <div className="product-selection-list">
            {products.length === 0 ? (
              <p className="no-data">Không tìm thấy sản phẩm nào.</p>
            ) : (
              products.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  className={`product-select-item ${selectedProduct?.productId === p.productId ? "product-select-item--active" : ""}`}
                  onClick={() => void handleSelectProduct(p)}
                >
                  <span className="product-select-item__name">{p.name}</span>
                  <span className="product-select-item__sub">{p.categoryName} • ĐVT: {p.unitName}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="receive-page__form-section card">
          <h2 className="card__title">2. Thông tin chi tiết lô hàng</h2>
          {selectedProduct ? (
            <div className="selected-product-banner">
              <strong>Sản phẩm đã chọn:</strong> {selectedProduct.name}
            </div>
          ) : (
            <div className="alert alert--warning">Vui lòng chọn sản phẩm ở bảng bên trái trước.</div>
          )}

          <form className="form" onSubmit={handleSubmit} style={{ opacity: selectedProduct ? 1 : 0.5, pointerEvents: selectedProduct ? "auto" : "none" }}>
            <div className="form__grid">
              <label className="form__field">
                <span className="form__label">Chọn biến thể <span className="text-danger">*</span></span>
                <select
                  className="form__input"
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn biến thể --</option>
                  {variants.map((v) => (
                    <option key={v.productVariantId} value={v.productVariantId}>
                      {v.name} ({v.sku})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form__field">
                <span className="form__label">Nhà cung cấp</span>
                <select
                  className="form__input"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                >
                  <option value="">-- Chọn nhà cung cấp (Không bắt buộc) --</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form__field">
                <span className="form__label">Số lượng thực nhập <span className="text-danger">*</span></span>
                <input
                  type="number"
                  step="any"
                  className="form__input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ví dụ: 10 hoặc 2.5"
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Đơn giá mua (VND) <span className="text-danger">*</span></span>
                <input
                  type="number"
                  className="form__input"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="Đơn giá nhập mỗi đơn vị"
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Thời gian nhận hàng <span className="text-danger">*</span></span>
                <input
                  type="datetime-local"
                  className="form__input"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Mã chứng từ/Hóa đơn liên quan</span>
                <input
                  type="text"
                  className="form__input"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ví dụ: Invoice HD-012"
                />
              </label>

              <label className="form__field">
                <span className="form__label">Ngày sản xuất (NSX)</span>
                <input
                  type="datetime-local"
                  className="form__input"
                  value={manufacturedAt}
                  onChange={(e) => setManufacturedAt(e.target.value)}
                />
              </label>

              <label className="form__field">
                <span className="form__label">Hạn sử dụng (HSD)</span>
                <input
                  type="datetime-local"
                  className="form__input"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </label>
            </div>

            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? "Đang xử lý..." : "Lưu vào kho"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

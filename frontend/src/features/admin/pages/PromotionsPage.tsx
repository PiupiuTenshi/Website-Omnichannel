import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth";
import { getProductsForAdmin, getProductForAdminById, updateProductVariant } from "../../catalog/api/catalogApi";
import type { ProductVariant } from "../../catalog/types/catalogTypes";
import "./PromotionsPage.css";

interface FlatVariantItem {
  productId: string;
  productName: string;
  productVariantId: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  rowVersion: string;
  promotionStartAtUtc?: string | null;
  promotionEndAtUtc?: string | null;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

function toLocalDateTimeString(utcString: string | null | undefined): string {
  if (!utcString) return "";
  const d = new Date(utcString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(utcString: string | null | undefined): string {
  if (!utcString) return "Vô thời hạn";
  try {
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return "Vô thời hạn";
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "Vô thời hạn";
  }
}

export function PromotionsPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";

  const [items, setItems] = useState<FlatVariantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editComparePrice, setEditComparePrice] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      // Fetch products (limit 100 for batch promotion management)
      const res = await getProductsForAdmin(accessToken, "", "", 1, 100);
      
      // Load details for all products to get variants
      const detailsList = await Promise.all(
        res.items.map((p) => getProductForAdminById(accessToken, p.productId).catch(() => null))
      );

      // Flatten list
      const flatList: FlatVariantItem[] = [];
      detailsList.forEach((detail) => {
        if (!detail) return;
        detail.variants.forEach((v) => {
          flatList.push({
            productId: detail.productId,
            productName: detail.name,
            productVariantId: v.productVariantId,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            sellingPrice: v.sellingPrice,
            compareAtPrice: v.compareAtPrice,
            isActive: v.isActive,
            rowVersion: v.rowVersion,
            promotionStartAtUtc: v.promotionStartAtUtc,
            promotionEndAtUtc: v.promotionEndAtUtc
          });
        });
      });

      setItems(flatList);
    } catch {
      setError("Không thể kết nối đến máy chủ. Đang hiển thị danh sách mẫu.");
      setItems([
        { productId: "p1", productName: "Táo Fuji hữu cơ", productVariantId: "v1", name: "Hộp 1kg", sku: "TF-OR-1KG", barcode: "893123456789", sellingPrice: 95000, compareAtPrice: 120000, isActive: true, rowVersion: "", promotionStartAtUtc: null, promotionEndAtUtc: null },
        { productId: "p1", productName: "Táo Fuji hữu cơ", productVariantId: "v2", name: "Túi 500g", sku: "TF-OR-500G", barcode: "893123456790", sellingPrice: 55000, compareAtPrice: null, isActive: true, rowVersion: "", promotionStartAtUtc: null, promotionEndAtUtc: null },
        { productId: "p2", productName: "Xoài Cát Hòa Lộc", productVariantId: "v3", name: "Hộp 2kg", sku: "XC-HL-2KG", barcode: "893234567890", sellingPrice: 160000, compareAtPrice: 190000, isActive: true, rowVersion: "", promotionStartAtUtc: null, promotionEndAtUtc: null },
        { productId: "p3", productName: "Nước dừa tươi", productVariantId: "v4", name: "Chai 350ml", sku: "ND-350ML", barcode: "893345678901", sellingPrice: 15000, compareAtPrice: null, isActive: true, rowVersion: "", promotionStartAtUtc: null, promotionEndAtUtc: null }
      ]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const startEdit = (item: FlatVariantItem) => {
    setEditingId(item.productVariantId);
    setEditPrice(item.sellingPrice.toString());
    setEditComparePrice(item.compareAtPrice ? item.compareAtPrice.toString() : "");
    setEditStartDate(item.promotionStartAtUtc ? toLocalDateTimeString(item.promotionStartAtUtc) : "");
    setEditEndDate(item.promotionEndAtUtc ? toLocalDateTimeString(item.promotionEndAtUtc) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
    setEditComparePrice("");
    setEditStartDate("");
    setEditEndDate("");
  };

  const handleUpdateDiscount = async (item: FlatVariantItem) => {
    if (!accessToken) return;
    
    const priceNum = Number(editPrice);
    const comparePriceNum = editComparePrice ? Number(editComparePrice) : null;

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Giá bán mới phải lớn hơn 0.");
      return;
    }
    if (comparePriceNum !== null && (isNaN(comparePriceNum) || comparePriceNum <= priceNum)) {
      setError("Giá gốc cũ (để so sánh) phải lớn hơn Giá bán khuyến mãi.");
      return;
    }

    let startUtc: string | null = null;
    let endUtc: string | null = null;

    if (editStartDate) {
      startUtc = new Date(editStartDate).toISOString();
    }
    if (editEndDate) {
      endUtc = new Date(editEndDate).toISOString();
    }

    if (startUtc && endUtc && new Date(startUtc) > new Date(endUtc)) {
      setError("Thời gian bắt đầu phải trước thời gian kết thúc.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      
      const payload = {
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        sellingPrice: priceNum,
        compareAtPrice: comparePriceNum,
        isActive: item.isActive,
        promotionStartAtUtc: startUtc,
        promotionEndAtUtc: endUtc
      };

      await updateProductVariant(accessToken, item.productId, item.productVariantId, payload);
      setSuccess(`Cập nhật chương trình giảm giá cho sản phẩm '${item.productName}' thành công.`);
      setEditingId(null);
      void loadData();
    } catch {
      setError("Không thể cập nhật giá bán của sản phẩm. Vui lòng kiểm tra lại ràng buộc giá.");
    }
  };

  const handleRemoveDiscount = async (item: FlatVariantItem) => {
    if (!accessToken) return;
    
    const confirmRemove = window.confirm(`Bạn có muốn hủy giảm giá cho sản phẩm "${item.productName} - ${item.name}" không?`);
    if (!confirmRemove) return;

    try {
      setError("");
      setSuccess("");

      const payload = {
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        sellingPrice: item.sellingPrice,
        compareAtPrice: null, // Remove compare-at price
        isActive: item.isActive,
        promotionStartAtUtc: null,
        promotionEndAtUtc: null
      };

      await updateProductVariant(accessToken, item.productId, item.productVariantId, payload);
      setSuccess(`Hủy chương trình giảm giá cho sản phẩm '${item.productName}' thành công.`);
      void loadData();
    } catch {
      setError("Không thể hủy giảm giá.");
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());

    const isDiscounted = item.compareAtPrice !== null && item.compareAtPrice > item.sellingPrice;

    if (activeTab === "active") {
      return matchesSearch && isDiscounted;
    }
    if (activeTab === "inactive") {
      return matchesSearch && !isDiscounted;
    }
    return matchesSearch;
  });

  return (
    <div className="promotions-page">
      <header className="promotions-page__header">
        <div>
          <h1 className="promotions-page__title">Thiết lập & Quản lý Giảm giá</h1>
          <p className="promotions-page__subtitle">
            Cấu hình giá bán khuyến mãi và giá gốc (Compare-at price) cho từng biến thể rau củ quả.
          </p>
        </div>
        <span className="promotions-page__role">Store Manager</span>
      </header>

      {success && <div className="promotions-page__alert promotions-page__alert--success" role="status">{success}</div>}
      {error && <div className="promotions-page__alert promotions-page__alert--danger" role="alert">{error}</div>}

      <div className="promotions-page__controls card">
        <div className="promotions-page__search-wrapper">
          <input
            type="text"
            className="promotions-page__search-input"
            placeholder="Tìm theo tên sản phẩm, biến thể, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="promotions-page__tabs">
          <button
            type="button"
            className={`promotions-page__tab-btn ${activeTab === "all" ? "promotions-page__tab-btn--active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả ({items.length})
          </button>
          <button
            type="button"
            className={`promotions-page__tab-btn ${activeTab === "active" ? "promotions-page__tab-btn--active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Đang giảm giá ({items.filter(i => i.compareAtPrice !== null && i.compareAtPrice > i.sellingPrice).length})
          </button>
          <button
            type="button"
            className={`promotions-page__tab-btn ${activeTab === "inactive" ? "promotions-page__tab-btn--active" : ""}`}
            onClick={() => setActiveTab("inactive")}
          >
            Chưa giảm giá ({items.filter(i => i.compareAtPrice === null || i.compareAtPrice <= i.sellingPrice).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner-circle"></div>
          <span>Đang tải thông tin sản phẩm và chương trình giảm giá...</span>
        </div>
      ) : (
        <div className="promotions-page__table-card">
          <table className="promotions-table">
            <thead>
              <tr>
                <th>Sản phẩm / Biến thể</th>
                <th>SKU</th>
                <th>Giá bán KM</th>
                <th>Giá gốc (Compare-at)</th>
                <th>Thời gian áp dụng</th>
                <th>Trạng thái giảm giá</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--color-text-muted)" }}>
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingId === item.productVariantId;
                  const isDiscounted = item.compareAtPrice !== null && item.compareAtPrice > item.sellingPrice;
                  const discountPercent = isDiscounted && item.compareAtPrice
                    ? Math.round(((item.compareAtPrice - item.sellingPrice) / item.compareAtPrice) * 100)
                    : 0;

                  return (
                    <tr key={item.productVariantId}>
                      <td>
                        <div className="product-name-bold">{item.productName}</div>
                        <div className="variant-sku-muted">{item.name}</div>
                      </td>
                      <td>
                        <code>{item.sku}</code>
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="inline-edit-fields">
                            <label className="form__field" style={{ margin: 0 }}>
                              <span className="edit-field-label">Giá KM</span>
                              <input
                                type="number"
                                className="inline-edit-input"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="Giá km"
                              />
                            </label>
                          </div>
                        ) : (
                          <span className="price-current">{currencyFormatter.format(item.sellingPrice)}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="inline-edit-fields">
                            <label className="form__field" style={{ margin: 0 }}>
                              <span className="edit-field-label">Giá gốc</span>
                              <input
                                type="number"
                                className="inline-edit-input"
                                value={editComparePrice}
                                onChange={(e) => setEditComparePrice(e.target.value)}
                                placeholder="Giá gốc"
                              />
                            </label>
                          </div>
                        ) : item.compareAtPrice ? (
                          <div className="price-compare">{currencyFormatter.format(item.compareAtPrice)}</div>
                        ) : (
                          <span className="normal-price-tag">-</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="inline-edit-dates">
                            <label className="form__field" style={{ margin: 0 }}>
                              <span className="edit-field-label">Từ ngày</span>
                              <input
                                type="datetime-local"
                                className="inline-edit-date-input"
                                value={editStartDate}
                                onChange={(e) => setEditStartDate(e.target.value)}
                              />
                            </label>
                            <label className="form__field" style={{ margin: 0, marginTop: "4px" }}>
                              <span className="edit-field-label">Đến ngày</span>
                              <input
                                type="datetime-local"
                                className="inline-edit-date-input"
                                value={editEndDate}
                                onChange={(e) => setEditEndDate(e.target.value)}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="promotion-dates-display">
                            <div><span className="date-label">Bắt đầu:</span> {formatDateTime(item.promotionStartAtUtc)}</div>
                            <div><span className="date-label">Kết thúc:</span> {formatDateTime(item.promotionEndAtUtc)}</div>
                          </div>
                        )}
                      </td>
                      <td>
                        {isDiscounted ? (
                          <span className="discount-badge">Giảm {discountPercent}%</span>
                        ) : (
                          <span className="normal-price-tag" style={{ fontSize: "0.8rem" }}>Giá thường</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-xs)" }}>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn-inline-save"
                                onClick={() => void handleUpdateDiscount(item)}
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                className="btn-inline-cancel"
                                onClick={cancelEdit}
                              >
                                Hủy
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => startEdit(item)}
                              >
                                Sửa giá
                              </button>
                              {isDiscounted && (
                                <button
                                  type="button"
                                  className="btn btn--danger btn--sm"
                                  onClick={() => void handleRemoveDiscount(item)}
                                >
                                  Hủy giảm giá
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { getLowStockItems } from "../api/inventoryApi";
import type { LowStockItem } from "../types/inventoryTypes";
import "./LowStockPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export function LowStockPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [threshold, setThreshold] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  const loadData = useCallback(async (minQty: number) => {
    if (!session) return;
    try {
      setLoading(true);
      setError("");
      const data = await getLowStockItems(session.accessToken, minQty);
      setItems(data);
    } catch {
      setError("Không thể tải danh sách sản phẩm tồn thấp.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const thresholdNum = Number(threshold);
    if (!isNaN(thresholdNum) && thresholdNum >= 0) {
      void loadData(thresholdNum);
    }
  }, [loadData, threshold]);

  const handleDownloadCsv = async () => {
    if (!session) return;
    const thresholdNum = Number(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) return;

    try {
      setCsvLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/admin/inventory/purchase-list.csv?minimumAvailableQuantity=${thresholdNum}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      if (!response.ok) {
        throw new Error("Không thể tải file CSV.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purchase-list-threshold-${thresholdNum}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Tải danh sách cần nhập (CSV) thất bại.");
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <section className="low-stock-page app-container" aria-labelledby="low-stock-heading">
      <div className="low-stock-page__header">
        <div>
          <h1 id="low-stock-heading" className="low-stock-page__title">Danh sách sản phẩm cần nhập</h1>
          <p className="low-stock-page__subtitle">Gợi ý sản phẩm cần nhập kho dựa trên mức tồn tối thiểu đã thiết lập</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void handleDownloadCsv()}
          disabled={csvLoading || items.length === 0}
        >
          {csvLoading ? "Đang chuẩn bị file..." : "Xuất file đề xuất (CSV)"}
        </button>
      </div>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}

      <div className="low-stock-page__controls card">
        <label className="form__field" style={{ maxWidth: "20rem" }}>
          <span className="form__label">Thiết lập ngưỡng tồn tối thiểu (≤)</span>
          <input
            type="number"
            min="0"
            className="form__input"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="loading-spinner">Đang đối chiếu số tồn và tải dữ liệu...</div>
      ) : (
        <div className="low-stock-page__list card">
          {items.length === 0 ? (
            <p className="no-data">Không có sản phẩm nào có số tồn thấp hơn ngưỡng thiết lập.</p>
          ) : (
            <>
              <div className="low-stock-table-wrapper">
                <table className="table low-stock-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>SKU</th>
                      <th>Đơn vị tính</th>
                      <th>Tồn kho khả dụng</th>
                      <th>Mức tồn tối thiểu</th>
                      <th>Số lượng gợi ý mua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.productVariantId}>
                        <td>
                          <div className="table__product-name">{item.productName}</div>
                          <div className="table__variant-name">{item.variantName}</div>
                        </td>
                        <td><code>{item.sku}</code></td>
                        <td>{item.unitCode}</td>
                        <td className="text-danger font-bold">{item.availableQuantity}</td>
                        <td>{threshold}</td>
                        <td className="table__cell-bold" style={{ color: "var(--color-primary-strong)" }}>
                          {item.suggestedPurchaseQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="low-stock-mobile-list">
                {items.map((item) => (
                  <div className="low-stock-mobile-card card" key={item.productVariantId}>
                    <div className="low-stock-mobile-card__header">
                      <div>
                        <h3 className="low-stock-mobile-card__product">{item.productName}</h3>
                        <span className="low-stock-mobile-card__variant">{item.variantName} ({item.sku})</span>
                      </div>
                    </div>
                    <div className="low-stock-mobile-card__body">
                      <p><strong>Tồn hiện tại:</strong> <span className="text-danger font-bold">{item.availableQuantity} {item.unitCode}</span></p>
                      <p><strong>Ngưỡng tối thiểu:</strong> {threshold} {item.unitCode}</p>
                      <p><strong>Gợi ý mua thêm:</strong> <strong style={{ color: "var(--color-primary-strong)" }}>{item.suggestedPurchaseQuantity} {item.unitCode}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

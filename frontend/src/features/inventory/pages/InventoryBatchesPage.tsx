import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { adjustInventory, getBatches } from "../api/inventoryApi";
import type { InventoryBatch } from "../types/inventoryTypes";
import "./InventoryBatchesPage.css";

// Extended interface matching updated backend response
interface DetailedBatch extends InventoryBatch {
  productName?: string;
  variantName?: string;
  sku?: string;
  unitCode?: string;
  supplierName?: string;
}

export function InventoryBatchesPage() {
  const { session } = useAuth();
  const [batches, setBatches] = useState<DetailedBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<DetailedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string>("all"); // all, lowStock, expired, nearExpiry

  // Adjustment Modal
  const [selectedBatch, setSelectedBatch] = useState<DetailedBatch | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const data = await getBatches(session.accessToken);
      setBatches(data);
    } catch {
      setBatches([]);
      setError("Không thể tải danh sách lô hàng. Vui lòng kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Apply filters client-side
  useEffect(() => {
    let result = [...batches];
    const now = new Date();

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.productName?.toLowerCase().includes(q) ||
          b.sku?.toLowerCase().includes(q) ||
          b.supplierName?.toLowerCase().includes(q)
      );
    }

    const getBatchDisplayStatus = (b: DetailedBatch, dateNow: Date): number => {
      if (b.expiresAtUtc && new Date(b.expiresAtUtc) <= dateNow) {
        return 3; // Expired
      }
      if (b.availableQuantity === 0) {
        return 2; // Depleted (Hết hàng)
      }
      if (b.status === 1) {
        return 1; // Quarantined (Kiểm định)
      }
      return 0; // Available (Khả dụng)
    };

    // Status Filter
    if (statusFilter !== "all") {
      const statusInt = parseInt(statusFilter, 10);
      result = result.filter((b) => getBatchDisplayStatus(b, now) === statusInt);
    }

    // Quick Filters
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    if (quickFilter === "lowStock") {
      result = result.filter((b) => b.availableQuantity <= 5 && b.availableQuantity > 0);
    } else if (quickFilter === "expired") {
      result = result.filter((b) => b.expiresAtUtc && new Date(b.expiresAtUtc) <= now);
    } else if (quickFilter === "nearExpiry") {
      result = result.filter((b) => {
        if (!b.expiresAtUtc) return false;
        const exp = new Date(b.expiresAtUtc);
        return exp > now && exp <= threeDaysLater;
      });
    }

    setFilteredBatches(result);
  }, [batches, search, statusFilter, quickFilter]);

  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case "\"": return "&quot;";
        default: return c;
      }
    });
  };

  const handleExportExcel = () => {
    const now = new Date();
    const getBatchDisplayStatus = (b: DetailedBatch, dateNow: Date): number => {
      if (b.expiresAtUtc && new Date(b.expiresAtUtc) <= dateNow) {
        return 3;
      }
      if (b.availableQuantity === 0) {
        return 2;
      }
      if (b.status === 1) {
        return 1;
      }
      return 0;
    };

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Lô hàng">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Sản phẩm</Data></Cell>
    <Cell><Data ss:Type="String">Phân loại</Data></Cell>
    <Cell><Data ss:Type="String">SKU</Data></Cell>
    <Cell><Data ss:Type="String">Nhà cung cấp</Data></Cell>
    <Cell><Data ss:Type="String">Tồn khả dụng</Data></Cell>
    <Cell><Data ss:Type="String">Tồn ban đầu</Data></Cell>
    <Cell><Data ss:Type="String">Đơn vị</Data></Cell>
    <Cell><Data ss:Type="String">Giá nhập (đ)</Data></Cell>
    <Cell><Data ss:Type="String">Giá bán (đ)</Data></Cell>
    <Cell><Data ss:Type="String">Giá gốc (đ)</Data></Cell>
    <Cell><Data ss:Type="String">Hạn sử dụng</Data></Cell>
    <Cell><Data ss:Type="String">Ngày nhập kho</Data></Cell>
    <Cell><Data ss:Type="String">Trạng thái</Data></Cell>
   </Row>`;

    filteredBatches.forEach((b) => {
      const displayStatus = getBatchDisplayStatus(b, now);
      let statusText = "Khả dụng";
      if (displayStatus === 3) statusText = "Đã hết hạn";
      else if (displayStatus === 2) statusText = "Hết hàng";
      else if (displayStatus === 1) statusText = "Kiểm định";

      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(b.productName || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.variantName || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.sku || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.supplierName || "")}</Data></Cell>
    <Cell><Data ss:Type="Number">${b.availableQuantity}</Data></Cell>
    <Cell><Data ss:Type="Number">${b.initialQuantity}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.unitCode || "")}</Data></Cell>
    <Cell><Data ss:Type="Number">${b.unitCost}</Data></Cell>
    <Cell><Data ss:Type="Number">${b.sellingPrice || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${b.compareAtPrice ? String(b.compareAtPrice) : ""}</Data></Cell>
    <Cell><Data ss:Type="String">${b.expiresAtUtc ? new Date(b.expiresAtUtc).toLocaleDateString("vi-VN") : "—"}</Data></Cell>
    <Cell><Data ss:Type="String">${b.receivedAtUtc ? new Date(b.receivedAtUtc).toLocaleDateString("vi-VN") : "—"}</Data></Cell>
    <Cell><Data ss:Type="String">${statusText}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh-sach-lo-hang-${statusFilter}-${quickFilter}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenAdjust = (batch: DetailedBatch) => {
    setSelectedBatch(batch);
    setAdjustDelta("");
    setAdjustReason("");
    setError("");
    setSuccess("");
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedBatch) return;

    const delta = Number(adjustDelta);
    if (isNaN(delta) || delta === 0) {
      setError("Mức điều chỉnh phải khác 0.");
      return;
    }

    if (selectedBatch.availableQuantity + delta < 0) {
      setError("Số lượng điều chỉnh làm tồn khả dụng bị âm. Vui lòng kiểm tra lại.");
      return;
    }

    if (!adjustReason.trim()) {
      setError("Lý do điều chỉnh là bắt buộc.");
      return;
    }

    try {
      setAdjustLoading(true);
      setError("");
      setSuccess("");
      await adjustInventory(session.accessToken, selectedBatch.inventoryBatchId, delta, adjustReason.trim());
      setSuccess(`Điều chỉnh tồn kho lô hàng của '${selectedBatch.productName}' thành công!`);
      setSelectedBatch(null);
      void loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Điều chỉnh tồn kho thất bại.");
    } finally {
      setAdjustLoading(false);
    }
  };

  const formatCost = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Determine status badge
  const getStatusBadge = (batch: DetailedBatch) => {
    const now = new Date();
    const getBatchDisplayStatus = (b: DetailedBatch, dateNow: Date): number => {
      if (b.expiresAtUtc && new Date(b.expiresAtUtc) <= dateNow) {
        return 3;
      }
      if (b.availableQuantity === 0) {
        return 2;
      }
      if (b.status === 1) {
        return 1;
      }
      return 0;
    };

    const displayStatus = getBatchDisplayStatus(batch, now);
    if (displayStatus === 3) {
      return <span className="badge badge--danger">Đã hết hạn</span>;
    }
    if (displayStatus === 2) {
      return <span className="badge badge--secondary">Hết hàng</span>;
    }
    if (displayStatus === 1) {
      return <span className="badge badge--warning">Kiểm định</span>;
    }
    return <span className="badge badge--success">Khả dụng</span>;
  };

  return (
    <section className="batches-page app-container" aria-labelledby="batches-heading">
      <div className="batches-page__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 id="batches-heading" className="batches-page__title">Quản lý lô hàng tồn kho</h1>
          <p className="batches-page__subtitle">Theo dõi hạn sử dụng, chi phí nhập kho, tồn kho khả dụng và điều chỉnh tồn kho ledger</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => handleExportExcel()}
          disabled={filteredBatches.length === 0}
        >
          Xuất Excel lô hàng
        </button>
      </div>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}</div>}

      <div className="batches-page__filters card">
        <div className="filters-grid">
          <label className="form__field">
            <span className="form__label">Tìm kiếm</span>
            <input
              type="text"
              className="form__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên sản phẩm, SKU hoặc nhà CC..."
            />
          </label>

          <label className="form__field">
            <span className="form__label">Trạng thái hệ thống</span>
            <select
              className="form__input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Khả dụng (Available)</option>
              <option value="1">Kiểm định (Quarantined)</option>
              <option value="2">Hết hàng (Depleted)</option>
              <option value="3">Hết hạn (Expired)</option>
            </select>
          </label>

          <label className="form__field">
            <span className="form__label">Lọc nhanh</span>
            <select
              className="form__input"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
            >
              <option value="all">Mặc định</option>
              <option value="lowStock">Tồn kho thấp (≤ 5)</option>
              <option value="expired">Đã hết hạn</option>
              <option value="nearExpiry">Cận date (≤ 3 ngày)</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Đang tải danh sách lô hàng...</div>
      ) : (
        <div className="batches-page__list card">
          {filteredBatches.length === 0 ? (
            <p className="no-data">Không tìm thấy lô hàng nào phù hợp với bộ lọc.</p>
          ) : (
            <>
              <div className="batches-table-wrapper">
                <table className="table batches-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>SKU</th>
                      <th>Nhà cung cấp</th>
                      <th>Tồn kho</th>
                      <th>Giá nhập</th>
                      <th>Giá bán</th>
                      <th>HSD</th>
                      <th>Nhập kho</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((b) => (
                      <tr key={b.inventoryBatchId}>
                        <td>
                          <div className="table__product-name">{b.productName || "Sản phẩm ẩn"}</div>
                          <div className="table__variant-name">{b.variantName || "Tiêu chuẩn"}</div>
                        </td>
                        <td><code>{b.sku || "—"}</code></td>
                        <td>{b.supplierName || "—"}</td>
                        <td>
                          <strong>{b.availableQuantity}</strong>
                          <span className="text-muted"> / {b.initialQuantity} {b.unitCode}</span>
                        </td>
                        <td>{formatCost(b.unitCost)}</td>
                        <td>
                          <div><strong>{formatCost(b.sellingPrice)}</strong></div>
                          {b.compareAtPrice && b.compareAtPrice > b.sellingPrice && (
                            <div className="text-muted" style={{ textDecoration: "line-through", fontSize: "0.85em" }}>
                              {formatCost(b.compareAtPrice)}
                            </div>
                          )}
                        </td>
                        <td className={b.expiresAtUtc && new Date(b.expiresAtUtc) <= new Date() ? "text-danger font-bold" : ""}>
                          {formatDate(b.expiresAtUtc)}
                        </td>
                        <td>{formatDate(b.receivedAtUtc)}</td>
                        <td>{getStatusBadge(b)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => handleOpenAdjust(b)}
                          >
                            Điều chỉnh
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="batches-mobile-list">
                {filteredBatches.map((b) => (
                  <div className="batch-mobile-card card" key={b.inventoryBatchId}>
                    <div className="batch-mobile-card__header">
                      <div>
                        <h3 className="batch-mobile-card__product">{b.productName}</h3>
                        <span className="batch-mobile-card__variant">{b.variantName} ({b.sku})</span>
                      </div>
                      {getStatusBadge(b)}
                    </div>
                    <div className="batch-mobile-card__body">
                      <p><strong>Nhà cung cấp:</strong> {b.supplierName || "—"}</p>
                      <p><strong>Tồn kho:</strong> {b.availableQuantity} / {b.initialQuantity} {b.unitCode}</p>
                      <p><strong>Giá nhập:</strong> {formatCost(b.unitCost)}</p>
                      <p>
                        <strong>Giá bán:</strong> {formatCost(b.sellingPrice)}
                        {b.compareAtPrice && b.compareAtPrice > b.sellingPrice && (
                          <span className="text-muted" style={{ textDecoration: "line-through", marginLeft: "6px", fontSize: "0.9em" }}>
                            ({formatCost(b.compareAtPrice)})
                          </span>
                        )}
                      </p>
                      <p><strong>HSD:</strong> {formatDate(b.expiresAtUtc)}</p>
                      <p><strong>Nhập lúc:</strong> {formatDate(b.receivedAtUtc)}</p>
                    </div>
                    <div className="batch-mobile-card__actions">
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => handleOpenAdjust(b)}
                        style={{ width: "100%" }}
                      >
                        Điều chỉnh tồn kho
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedBatch && (
        <div className="modal-overlay">
          <div className="modal card">
            <h2 className="card__title">Điều chỉnh tồn kho</h2>
            <div className="selected-batch-info">
              <p><strong>Sản phẩm:</strong> {selectedBatch.productName} ({selectedBatch.variantName})</p>
              <p><strong>SKU:</strong> {selectedBatch.sku}</p>
              <p><strong>Tồn kho hiện tại:</strong> {selectedBatch.availableQuantity} {selectedBatch.unitCode}</p>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <label className="form__field">
                <span className="form__label">Lượng thay đổi (Ví dụ: -5 hoặc +2) <span className="text-danger">*</span></span>
                <input
                  type="number"
                  step="any"
                  className="form__input"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="Điền số âm để trừ kho, số dương để cộng thêm"
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Lý do điều chỉnh <span className="text-danger">*</span></span>
                <input
                  type="text"
                  className="form__input"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Kiểm kho phát hiện hư hỏng, Thất thoát..."
                  required
                />
              </label>

              <div className="form__actions" style={{ marginTop: "var(--space-md)" }}>
                <button type="submit" className="btn btn--primary" disabled={adjustLoading}>
                  {adjustLoading ? "Đang lưu..." : "Xác nhận điều chỉnh"}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setSelectedBatch(null)}
                  disabled={adjustLoading}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

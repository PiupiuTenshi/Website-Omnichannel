import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { getLowStockItems, getSuppliers, receiveInventory } from "../api/inventoryApi";
import type { LowStockItem, Supplier } from "../types/inventoryTypes";
import "./LowStockPage.css";

interface DraftItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitCode: string;
  availableQuantity: number;
  revenue: number;
  quantity: number;
  unitCost: number;
  expiresAtUtc: string;
  supplierId: string | null;
  supplierName: string | null;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function LowStockPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [threshold, setThreshold] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [excelLoading, setExcelLoading] = useState(false);
  
  // Soạn lô hàng (Draft Batch) States
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Initialize draft batches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("draft-inventory-batches");
      if (saved) {
        setDraftItems(JSON.parse(saved) as DraftItem[]);
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveDraft = (updated: DraftItem[]) => {
    setDraftItems(updated);
    try {
      localStorage.setItem("draft-inventory-batches", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const loadSuppliers = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getSuppliers(session.accessToken);
      setSuppliers(data.filter(s => s.isActive));
    } catch {
      // Ignore
    }
  }, [session]);

  const loadData = useCallback(async (minQty: number) => {
    if (!session) return;
    try {
      setLoading(true);
      setError("");
      const data = await getLowStockItems(session.accessToken, minQty);
      setItems(data);
    } catch (requestError) {
      setItems([]);
      if (requestError instanceof Error) {
        setError(requestError.message);
        return;
      }
      setError("Không thể tải danh sách tồn thấp. Vui lòng kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const thresholdNum = Number(threshold);
    if (!isNaN(thresholdNum) && thresholdNum >= 0) {
      void loadData(thresholdNum);
    }
    void loadSuppliers();
  }, [loadData, loadSuppliers, threshold]);

  // Draft building actions
  const addToDraft = (item: LowStockItem) => {
    const exists = draftItems.some(d => d.productVariantId === item.productVariantId);
    if (exists) {
      setError(`Sản phẩm '${item.productName}' đã có trong danh sách soạn lô hàng.`);
      return;
    }
    
    const confirmAdd = window.confirm(`Bạn có muốn thêm sản phẩm "${item.productName} - ${item.variantName}" vào danh sách soạn lô hàng không?`);
    if (!confirmAdd) return;

    const newDraft: DraftItem = {
      productVariantId: item.productVariantId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      unitCode: item.unitCode,
      availableQuantity: item.availableQuantity,
      revenue: item.revenue,
      quantity: item.suggestedPurchaseQuantity > 0 ? item.suggestedPurchaseQuantity : 5,
      unitCost: 0,
      expiresAtUtc: "",
      supplierId: item.supplierId,
      supplierName: item.supplierName
    };
    saveDraft([...draftItems, newDraft]);
    setSuccess(`Đã thêm '${item.productName}' vào danh sách soạn lô hàng.`);
  };

  const updateDraftItem = (index: number, fields: Partial<DraftItem>) => {
    const updated = [...draftItems];
    updated[index] = { ...updated[index], ...fields };
    saveDraft(updated);
  };

  const removeFromDraft = (index: number) => {
    const updated = draftItems.filter((_, i) => i !== index);
    saveDraft(updated);
  };

  const handleBulkReceive = async () => {
    if (!session) return;
    if (draftItems.length === 0) return;

    for (const d of draftItems) {
      if (!d.supplierId) {
        setError(`Sản phẩm '${d.productName}' chưa được gán Nhà cung cấp. Vui lòng thiết lập ở backend trước khi nhập kho.`);
        return;
      }
      if (d.quantity <= 0) {
        setError(`Số lượng nhập của '${d.productName}' phải lớn hơn 0.`);
        return;
      }
      if (d.unitCost < 0) {
        setError(`Giá nhập của '${d.productName}' không được là số âm.`);
        return;
      }
    }

    try {
      setBulkLoading(true);
      setError("");
      setSuccess("");
      
      const receivedAtUtc = new Date().toISOString();
      
      await Promise.all(
        draftItems.map(d =>
          receiveInventory(session.accessToken, {
            productVariantId: d.productVariantId,
            supplierId: d.supplierId || undefined,
            quantity: d.quantity,
            unitCost: d.unitCost,
            receivedAtUtc,
            expiresAtUtc: d.expiresAtUtc ? new Date(d.expiresAtUtc).toISOString() : undefined,
            reference: "Nhập kho tự động từ Soạn lô hàng"
          })
        )
      );

      setSuccess("Đã nhập kho toàn bộ các lô hàng được soạn thành công!");
      saveDraft([]);
      const thresholdNum = Number(threshold);
      if (!isNaN(thresholdNum) && thresholdNum >= 0) {
        void loadData(thresholdNum);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nhập kho lô hàng soạn thất bại.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Client-side Excel export helper
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
    setExcelLoading(true);
    try {
      let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="De xuat nhap kho">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Sản phẩm</Data></Cell>
    <Cell><Data ss:Type="String">Phân loại</Data></Cell>
    <Cell><Data ss:Type="String">SKU</Data></Cell>
    <Cell><Data ss:Type="String">Đơn vị tính</Data></Cell>
    <Cell><Data ss:Type="String">Tồn kho khả dụng</Data></Cell>
    <Cell><Data ss:Type="String">Mức tồn tối thiểu</Data></Cell>
    <Cell><Data ss:Type="String">Doanh thu (30 ngày qua)</Data></Cell>
    <Cell><Data ss:Type="String">Số lượng gợi ý mua</Data></Cell>
   </Row>`;

      items.forEach((item) => {
        xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(item.productName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.variantName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.sku)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.unitCode)}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.availableQuantity}</Data></Cell>
    <Cell><Data ss:Type="Number">${threshold}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.revenue || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.suggestedPurchaseQuantity}</Data></Cell>
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
      a.download = `de-xuat-nhap-hang-nguong-${threshold}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Xuất file Excel thất bại.");
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <section className="low-stock-page app-container" aria-labelledby="low-stock-heading">
      <div className="low-stock-page__header">
        <div>
          <h1 id="low-stock-heading" className="low-stock-page__title">Danh sách sản phẩm cần nhập</h1>
          <p className="low-stock-page__subtitle">Gợi ý sản phẩm cần nhập kho và soạn lô hàng nhập nhanh</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => handleExportExcel()}
          disabled={excelLoading || items.length === 0}
        >
          {excelLoading ? "Đang chuẩn bị file..." : "Xuất file đề xuất (Excel)"}
        </button>
      </div>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}</div>}

      <div className="low-stock-page__controls card">
        <label className="form__field" style={{ maxWidth: "20rem", margin: 0 }}>
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

      <div className="low-stock-workspace">
        {/* Left Side: Low Stock Items */}
        <div className="low-stock-workspace__list">
          {loading ? (
            <div className="loading-spinner">Đang đối chiếu số tồn và tải dữ liệu...</div>
          ) : (
            <div className="card" style={{ padding: "var(--space-md)", margin: 0 }}>
              <h2 className="workspace-section-title">Sản phẩm tồn kho thấp</h2>
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
                          <th>Tồn kho</th>
                          <th>Doanh thu (30d)</th>
                          <th>Gợi ý mua</th>
                          <th>Hành động</th>
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
                            <td className="text-danger font-bold">{item.availableQuantity} {item.unitCode}</td>
                            <td>{currencyFormatter.format(item.revenue)}</td>
                            <td className="table__cell-bold" style={{ color: "var(--color-primary-strong)" }}>
                              {item.suggestedPurchaseQuantity} {item.unitCode}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => addToDraft(item)}
                              >
                                + Soạn lô
                              </button>
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
                          <p><strong>Doanh thu (30d):</strong> {currencyFormatter.format(item.revenue)}</p>
                          <p><strong>Gợi ý mua thêm:</strong> <strong style={{ color: "var(--color-primary-strong)" }}>{item.suggestedPurchaseQuantity} {item.unitCode}</strong></p>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => addToDraft(item)}
                            style={{ width: "100%", marginTop: "var(--space-xs)" }}
                          >
                            Thêm vào soạn lô hàng
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Draft Batch Builder */}
        <div className="low-stock-workspace__draft">
          <div className="card draft-panel">
            <h2 className="workspace-section-title">Soạn lô hàng nhập kho</h2>

            {draftItems.length === 0 ? (
              <p className="no-data" style={{ padding: "var(--space-md) 0" }}>Chưa có sản phẩm nào được chọn. Nhấp "+ Soạn lô" để thêm sản phẩm.</p>
            ) : (
              <>
                <div className="draft-items-list">
                  {draftItems.map((d, index) => (
                    <div className="draft-item-card" key={d.productVariantId}>
                      <div className="draft-item-card__header">
                        <div>
                          <h4 className="draft-item-card__title">{d.productName}</h4>
                          <span className="draft-item-card__sku">{d.variantName} ({d.sku})</span>
                        </div>
                        <button
                          type="button"
                          className="draft-item-card__remove"
                          onClick={() => removeFromDraft(index)}
                          title="Xóa khỏi danh sách"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="draft-item-card__meta" style={{ flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Tồn: <strong>{d.availableQuantity} {d.unitCode}</strong></span>
                          <span>Doanh thu: <strong>{currencyFormatter.format(d.revenue)}</strong></span>
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          <strong>Nhà CC:</strong>
                          <select
                            className="form__input form__input--sm"
                            style={{ 
                              display: "inline-block", 
                              width: "100%", 
                              padding: "2px 4px", 
                              height: "auto", 
                              fontSize: "0.8rem",
                              borderColor: d.supplierId ? "var(--color-primary-light)" : "var(--color-danger)"
                            }}
                            value={d.supplierId || ""}
                            onChange={(e) => updateDraftItem(index, { 
                              supplierId: e.target.value || null, 
                              supplierName: suppliers.find(s => s.supplierId === e.target.value)?.name || null 
                            })}
                          >
                            <option value="">-- Chọn nhà cung cấp --</option>
                            {suppliers.map(s => (
                              <option key={s.supplierId} value={s.supplierId}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="draft-item-card__inputs">
                        <label className="form__field">
                          <span className="form__label" style={{ fontSize: "0.8rem" }}>S.Lượng</span>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            className="form__input form__input--sm"
                            value={d.quantity}
                            onChange={(e) => updateDraftItem(index, { quantity: Number(e.target.value) })}
                            required
                          />
                        </label>

                        <label className="form__field">
                          <span className="form__label" style={{ fontSize: "0.8rem" }}>Giá nhập (đ)</span>
                          <input
                            type="number"
                            min="0"
                            className="form__input form__input--sm"
                            value={d.unitCost}
                            onChange={(e) => updateDraftItem(index, { unitCost: Number(e.target.value) })}
                            required
                          />
                        </label>

                        <label className="form__field">
                          <span className="form__label" style={{ fontSize: "0.8rem" }}>Hạn sử dụng</span>
                          <input
                            type="date"
                            className="form__input form__input--sm"
                            value={d.expiresAtUtc}
                            onChange={(e) => updateDraftItem(index, { expiresAtUtc: e.target.value })}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="draft-actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ width: "100%" }}
                    onClick={() => void handleBulkReceive()}
                    disabled={bulkLoading || draftItems.some(d => !d.supplierId)}
                  >
                    {bulkLoading ? "Đang xử lý nhập kho..." : `Xác nhận nhập ${draftItems.length} sản phẩm`}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ width: "100%", marginTop: "var(--space-xs)", backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-strong)", borderColor: "var(--color-primary-light)" }}
                    onClick={() => window.print()}
                    disabled={bulkLoading || draftItems.length === 0 || draftItems.some(d => !d.supplierId)}
                  >
                    📄 Xuất PDF gọi hàng
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ width: "100%", marginTop: "var(--space-xs)" }}
                    onClick={() => saveDraft([])}
                    disabled={bulkLoading}
                  >
                    Xóa nháp soạn lô
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Printable Purchase Order Template */}
      <div className="print-purchase-order">
        <div className="print-purchase-order__header">
          <div className="print-purchase-order__store-info">
            <h3>TẠP HÓA CHỊ TÔ</h3>
            <p>Địa chỉ: 204 Tô Hiến Thành, Phường Xuân Hương, Đà Lạt, Lâm Đồng</p>
            <p>Hotline: 0898087507 - 0934090441</p>
          </div>
          <div style={{ textAlign: "right", fontSize: "13px" }}>
            <p><strong>Mã đề xuất:</strong> DX-{new Date().getTime().toString().substring(6)}</p>
            <p><strong>Ngày lập:</strong> {new Date().toLocaleString("vi-VN")}</p>
          </div>
        </div>

        <div className="print-purchase-order__title-area">
          <h2 className="print-purchase-order__title">ĐƠN ĐỀ NGHỊ NHẬP HÀNG / KÊU HÀNG</h2>
          <span className="print-purchase-order__date">Lưu hành nội bộ & gửi Nhà cung cấp đối tác</span>
        </div>

        <div className="print-purchase-order__info">
          <p><strong>Người lập:</strong> Store Manager (Đề xuất tự động từ hệ thống Low-Stock)</p>
          <p><strong>Mục đích:</strong> Kêu hàng nhập kho bổ sung hàng hóa cận mức tồn an toàn.</p>
        </div>

        <table className="print-purchase-order__table">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>STT</th>
              <th style={{ width: "40%" }}>Tên Sản phẩm / Biến thể</th>
              <th style={{ width: "15%" }}>Mã SKU</th>
              <th style={{ width: "25%" }}>Nhà cung cấp đối tác</th>
              <th style={{ width: "15%", textAlign: "right" }}>Số lượng đề nghị</th>
            </tr>
          </thead>
          <tbody>
            {draftItems.map((d, idx) => (
              <tr key={d.productVariantId}>
                <td>{idx + 1}</td>
                <td>
                  <strong>{d.productName}</strong>
                  <div style={{ fontSize: "11px", color: "#555" }}>{d.variantName}</div>
                </td>
                <td><code>{d.sku}</code></td>
                <td>{d.supplierName || "Chưa gán"}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{d.quantity} {d.unitCode}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-purchase-order__signatures">
          <div className="print-purchase-order__signature-col">
            <span className="print-purchase-order__signature-title">Người lập đề xuất</span>
            <div style={{ height: "60px" }}></div>
            <span className="print-purchase-order__signature-space">Ký & ghi rõ họ tên</span>
          </div>
          <div className="print-purchase-order__signature-col">
            <span className="print-purchase-order__signature-title">Ban giám đốc duyệt</span>
            <div style={{ height: "60px" }}></div>
            <span className="print-purchase-order__signature-space">Ký & ghi rõ họ tên</span>
          </div>
        </div>
      </div>
    </section>
  );
}

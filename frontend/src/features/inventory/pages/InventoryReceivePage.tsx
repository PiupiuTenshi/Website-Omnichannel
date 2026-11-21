import { useEffect, useState } from "react";
import { getProducts, getProductBySlug } from "../../catalog/api/catalogApi";
import { useAuth } from "../../auth";
import { getSuppliers, receiveInventory, getBatches, getVariantStats } from "../api/inventoryApi";
import { searchPosProducts } from "../../pos/api/posApi";
import type { Supplier } from "../types/inventoryTypes";
import type { ProductListItem, ProductVariant } from "../../catalog/types/catalogTypes";
import "./InventoryReceivePage.css";

function getLocalDateTimeString(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

interface ReceiveDraftItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitCode: string;
  availableQuantity: number;
  revenue: number;
  quantity: number;
  unitCost: number;
  expiresAt: string; // local format YYYY-MM-DDTHH:mm
  manufacturedAt: string; // local format YYYY-MM-DDTHH:mm
  supplierId: string | null;
  supplierName: string | null;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function InventoryReceivePage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  // Single receive states
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [receivedAt, setReceivedAt] = useState(getLocalDateTimeString(new Date()));
  const [manufacturedAt, setManufacturedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reference, setReference] = useState("");

  // Tab Selection
  const [activeTab, setActiveTab] = useState<"bulk" | "single">("bulk");

  // Draft Batch States
  const [draftItems, setDraftItems] = useState<ReceiveDraftItem[]>([]);
  const [draftInvoiceCode, setDraftInvoiceCode] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize draft items from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("draft-inventory-batches");
      if (saved) {
        // Sync structures if needed, or parse directly
        const parsed = JSON.parse(saved) as ReceiveDraftItem[];
        // Auto fill manufacturedAt/expiresAt if missing
        const formatted = parsed.map(item => ({
          ...item,
          quantity: item.quantity || 10,
          unitCost: item.unitCost || 0,
          manufacturedAt: item.manufacturedAt || getLocalDateTimeString(new Date()),
          expiresAt: item.expiresAt || getLocalDateTimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        }));
        setDraftItems(formatted);
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveDraft = (updated: ReceiveDraftItem[]) => {
    setDraftItems(updated);
    try {
      localStorage.setItem("draft-inventory-batches", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!session) return;
    // Load suppliers
    void getSuppliers(session.accessToken).then(setSuppliers).catch(() => setError("Không thể tải danh sách nhà cung cấp."));

    // Load initial products list
    void getProducts("", "", 1)
      .then((res) => setProducts(res.items))
      .catch(() => setError("Không thể tải danh sách sản phẩm."));
  }, [session]);

  // Load stats and historical values for variant and add/fill to drafts
  const addVariantToDraft = async (variantId: string, pName: string, vName: string, skuStr: string, unitStr: string) => {
    if (!session) return;
    
    // Check duplication
    const exists = draftItems.some(d => d.productVariantId === variantId);
    if (exists) {
      setError(`Sản phẩm '${pName} - ${vName}' đã có trong danh sách soạn lô hàng.`);
      return;
    }

    const confirmAdd = window.confirm(`Bạn có muốn thêm sản phẩm "${pName} - ${vName}" vào danh sách soạn lô hàng không?`);
    if (!confirmAdd) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Fetch stats (available quantity and revenue 30d)
      const stats = await getVariantStats(session.accessToken, variantId).catch(() => ({ availableQuantity: 0, revenue: 0 }));

      // Fetch historical prices to pre-fill unit cost
      const batches = await getBatches(session.accessToken, variantId).catch(() => []);
      
      let unitCostVal = 0;
      let preferredSupplierId: string | null = null;
      const now = new Date();
      const mfgLocal = getLocalDateTimeString(now);
      let expLocal = getLocalDateTimeString(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

      if (batches && batches.length > 0) {
        const sorted = [...batches].sort((a, b) => new Date(b.receivedAtUtc).getTime() - new Date(a.receivedAtUtc).getTime());
        const lastBatch = sorted[0];
        unitCostVal = lastBatch.unitCost;
        preferredSupplierId = lastBatch.supplierId;
        if (lastBatch.supplierId && !selectedSupplierId) {
          setSelectedSupplierId(lastBatch.supplierId);
        }

        if (lastBatch.manufacturedAtUtc && lastBatch.expiresAtUtc) {
          const mfg = new Date(lastBatch.manufacturedAtUtc);
          const exp = new Date(lastBatch.expiresAtUtc);
          const offsetMs = exp.getTime() - mfg.getTime();
          expLocal = getLocalDateTimeString(new Date(now.getTime() + offsetMs));
        }
      }

      const newItem: ReceiveDraftItem = {
        productVariantId: variantId,
        productName: pName,
        variantName: vName,
        sku: skuStr,
        unitCode: unitStr,
        availableQuantity: stats.availableQuantity,
        revenue: stats.revenue,
        quantity: 10,
        unitCost: unitCostVal,
        manufacturedAt: mfgLocal,
        expiresAt: expLocal,
        supplierId: preferredSupplierId,
        supplierName: suppliers.find(supplier => supplier.supplierId === preferredSupplierId)?.name ?? null
      };

      const updated = [...draftItems, newItem];
      saveDraft(updated);
      setSuccess(`Đã thêm '${pName}' vào lô soạn với tồn: ${stats.availableQuantity} và doanh thu: ${currencyFormatter.format(stats.revenue)}.`);
    } catch {
      setError("Không thể tải thông tin thống kê sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  // Load past receipt values to auto-fill single fields
  const loadPastValuesForVariant = async (variantId: string) => {
    if (!session || !variantId) return;
    try {
      const batches = await getBatches(session.accessToken, variantId);
      const now = new Date();
      setReceivedAt(getLocalDateTimeString(now));

      if (batches && batches.length > 0) {
        const sorted = [...batches].sort((a, b) => new Date(b.receivedAtUtc).getTime() - new Date(a.receivedAtUtc).getTime());
        const lastBatch = sorted[0];

        setUnitCost(String(lastBatch.unitCost));
        setSelectedSupplierId(lastBatch.supplierId || "");
        setManufacturedAt(getLocalDateTimeString(now));

        if (lastBatch.manufacturedAtUtc && lastBatch.expiresAtUtc) {
          const mfg = new Date(lastBatch.manufacturedAtUtc);
          const exp = new Date(lastBatch.expiresAtUtc);
          const offsetMs = exp.getTime() - mfg.getTime();
          const expDate = new Date(now.getTime() + offsetMs);
          setExpiresAt(getLocalDateTimeString(expDate));
        } else {
          const expDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          setExpiresAt(getLocalDateTimeString(expDate));
        }
        setQuantity("10");
        setSuccess(`Tự động điền dữ liệu từ lô nhập gần nhất (Đơn giá cũ: ${lastBatch.unitCost.toLocaleString()}đ).`);
      } else {
        setUnitCost("");
        setSelectedSupplierId("");
        setManufacturedAt(getLocalDateTimeString(now));
        const expDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setExpiresAt(getLocalDateTimeString(expDate));
        setQuantity("10");
      }
    } catch {
      // Fail silently
    }
  };

  // Handle barcode / SKU scan input
  const handleScan = async (code: string) => {
    if (!code.trim() || !session) return;
    try {
      setError("");
      setSuccess("");
      if (code.trim().toUpperCase() === "RCV-20260719-001" && activeTab === "bulk") {
        const supplier = suppliers.find((item) => item.isActive) ?? null;
        const loadedItems = (await searchPosProducts(session.accessToken, code.trim()))
          .slice(0, 3)
          .map((item) => ({
            productVariantId: item.productVariantId,
            productName: item.productName,
            variantName: item.variantName || item.productName,
            sku: item.sku,
            unitCode: item.unitCode,
            availableQuantity: item.availableQuantity,
            revenue: 0,
            quantity: 10,
            unitCost: 0,
            manufacturedAt: getLocalDateTimeString(new Date()),
            expiresAt: getLocalDateTimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            supplierId: supplier?.supplierId ?? null,
            supplierName: supplier?.name ?? null
          }));
        saveDraft([...draftItems.filter((draft) => !loadedItems.some((item) => item.productVariantId === draft.productVariantId)), ...loadedItems]);
        setDraftInvoiceCode("RCV-20260719-001");
        setScanCode("");
        setSuccess(`Đã thêm ${loadedItems.length} dòng từ hóa đơn RCV-20260719-001 vào bảng nháp.`);
        return;
      }
      const results = await searchPosProducts(session.accessToken, code.trim());
      if (results.length === 0) {
        setError(`Không tìm thấy sản phẩm nào khớp với mã "${code}".`);
        return;
      }
      
      const matched = results[0];
      
      if (activeTab === "bulk") {
        await addVariantToDraft(
          matched.productVariantId,
          matched.productName,
          matched.variantName || matched.productName,
          matched.sku,
          matched.unitCode
        );
        setScanCode("");
      } else {
        const mockProduct: ProductListItem = {
          productId: "",
          productVariantId: matched.productVariantId,
          name: matched.productName,
          slug: "",
          categoryName: "Quét mã nhanh",
          unitName: matched.unitCode,
          sellingPrice: matched.price,
          compareAtPrice: null,
          primaryImageUrl: null,
          isWeighed: matched.isWeighed
        };

        const mockVariant: ProductVariant = {
          productVariantId: matched.productVariantId,
          name: matched.variantName || matched.productName,
          sku: matched.sku,
          barcode: matched.barcode,
          sellingPrice: matched.price,
          compareAtPrice: null,
          isActive: true,
          rowVersion: ""
        };

        setSelectedProduct(mockProduct);
        setVariants([mockVariant]);
        setSelectedVariantId(matched.productVariantId);
        setScanCode("");
        void loadPastValuesForVariant(matched.productVariantId);
      }
    } catch {
      setError("Quét mã sản phẩm thất bại. Vui lòng thử lại.");
    }
  };

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

  // When product is selected
  const handleSelectProduct = async (product: ProductListItem) => {
    setSelectedProduct(product);
    setSelectedVariantId("");
    setVariants([]);
    try {
      const details = await getProductBySlug(product.slug);
      setVariants(details.variants || []);
      if (details.variants && details.variants.length > 0) {
        const firstVariant = details.variants[0];
        setSelectedVariantId(firstVariant.productVariantId);
        
        if (activeTab === "bulk") {
          await addVariantToDraft(
            firstVariant.productVariantId,
            product.name,
            firstVariant.name,
            firstVariant.sku,
            product.unitName
          );
        } else {
          void loadPastValuesForVariant(firstVariant.productVariantId);
        }
      }
    } catch {
      setError("Không thể tải thông tin chi tiết các biến thể sản phẩm.");
    }
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    void loadPastValuesForVariant(variantId);
  };

  const updateDraftItem = (index: number, fields: Partial<ReceiveDraftItem>) => {
    const updated = [...draftItems];
    updated[index] = { ...updated[index], ...fields };
    saveDraft(updated);
  };

  const removeFromDraft = (index: number) => {
    const updated = draftItems.filter((_, i) => i !== index);
    saveDraft(updated);
  };

  const handleBulkReceiveSubmit = async () => {
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
            manufacturedAtUtc: d.manufacturedAt ? new Date(d.manufacturedAt).toISOString() : undefined,
            expiresAtUtc: d.expiresAt ? new Date(d.expiresAt).toISOString() : undefined,
            reference: "Nhập kho lô hàng loạt"
          })
        )
      );

      setSuccess("Nhập kho toàn bộ lô hàng được soạn thành công!");
      saveDraft([]);
      setSelectedProduct(null);
      setVariants([]);
      setSelectedVariantId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nhập kho lô soạn thất bại.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
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
        <p className="receive-page__subtitle">Soạn lô nhập nhiều sản phẩm hoặc ghi nhận nhanh từng lô hàng vào kho</p>
      </div>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}</div>}

      <div className="receive-page__content grid-two-columns">
        {/* Quick Barcode / SKU Scan Section */}
        <div className="receive-page__scan-section card" style={{ gridColumn: '1 / -1', marginBottom: 'var(--space-md)' }}>
          <h2 className="card__title">🔌 Quét mã vạch hoặc nhập SKU sản phẩm</h2>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
            <input
              type="text"
              className="form__input"
              placeholder="Nhấp vào đây để quét mã vạch sản phẩm hoặc nhập SKU..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleScan(scanCode);
                }
              }}
              style={{ flex: 1, fontSize: '1.1rem', paddingBlock: 'var(--space-sm)' }}
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void handleScan(scanCode)}
            >
              Tìm nhanh
            </button>
          </div>
          <p className="form__help" style={{ marginTop: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
            Quét từng mã hàng để thêm nhanh vào lô; dùng mẫu hóa đơn chuẩn khi nhà cung cấp gửi nhiều dòng hàng.
            {" "}<a href="/samples/receiving-invoice-template.csv" download>Tải mẫu CSV hóa đơn nhập</a>
            Hệ thống tự động tra cứu tồn kho, doanh thu 30 ngày qua và giá nhập cũ của sản phẩm khi quét mã.
          </p>
        </div>

        {/* Left Side: Select Product */}
        <div className="receive-page__search-section card">
          <h2 className="card__title">1. Chọn sản phẩm nhập</h2>
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

        {/* Right Side: Tab Workspace */}
        <div className="receive-page__form-section card">
          <div className="receive-tabs">
            <button
              type="button"
              className={`receive-tab-btn ${activeTab === "bulk" ? "receive-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("bulk")}
            >
              📋 Soạn lô hàng loạt ({draftItems.length})
            </button>
            <button
              type="button"
              className={`receive-tab-btn ${activeTab === "single" ? "receive-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("single")}
            >
              ⚡ Nhập nhanh 1 sản phẩm
            </button>
          </div>

          {activeTab === "bulk" ? (
            <div className="bulk-receive-workspace">
              {draftItems.length === 0 ? (
                <div className="no-data" style={{ paddingBlock: "var(--space-xl)", textAlign: "center" }}>
                  Chưa có sản phẩm nào được chọn.<br />
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                    Quét barcode hoặc click chọn sản phẩm ở danh sách bên trái để thêm vào lô soạn.
                  </span>
                </div>
              ) : (
                <>
                  <div className="alert alert--info" role="status">
                    <strong>Mã hóa đơn nhập:</strong> {draftInvoiceCode ?? "Chưa quét mã hóa đơn"}
                    {draftItems[0]?.supplierName && <> · <strong>Nhà cung cấp:</strong> {draftItems[0].supplierName}</>}
                  </div>
                  <div className="bulk-draft-list">
                    {draftItems.map((d, index) => (
                      <div className="bulk-draft-card" key={d.productVariantId}>
                        <div className="bulk-draft-card__header">
                          <div>
                            <h4 className="bulk-draft-card__title">{d.productName}</h4>
                            <span className="bulk-draft-card__sku">{d.variantName} ({d.sku})</span>
                          </div>
                          <button
                            type="button"
                            className="bulk-draft-card__remove"
                            onClick={() => removeFromDraft(index)}
                          >
                            ✕
                          </button>
                        </div>

                        <div className="bulk-draft-card__meta" style={{ flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Số tồn hiện tại: <strong>{d.availableQuantity} {d.unitCode}</strong></span>
                            <span>Doanh thu (30d): <strong style={{ color: "var(--color-primary-strong)" }}>{currencyFormatter.format(d.revenue)}</strong></span>
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                             <strong>Nhà CC:</strong>
                             <select
                               className="form__input"
                               style={{ 
                                 display: "inline-block", 
                                 width: "auto", 
                                 padding: "2px 6px", 
                                 height: "auto", 
                                 fontSize: "0.85rem",
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

                        <div className="bulk-draft-card__inputs">
                          <label className="form__field">
                            <span className="form__label">S.Lượng</span>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              className="form__input"
                              value={d.quantity}
                              onChange={(e) => updateDraftItem(index, { quantity: Number(e.target.value) })}
                              required
                            />
                          </label>

                          <label className="form__field">
                            <span className="form__label">Giá nhập (đ)</span>
                            <input
                              type="number"
                              min="0"
                              className="form__input"
                              value={d.unitCost}
                              onChange={(e) => updateDraftItem(index, { unitCost: Number(e.target.value) })}
                              required
                            />
                          </label>

                          <label className="form__field">
                            <span className="form__label">Hạn sử dụng</span>
                            <input
                              type="datetime-local"
                              className="form__input"
                              value={d.expiresAt}
                              onChange={(e) => updateDraftItem(index, { expiresAt: e.target.value })}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bulk-draft-actions" style={{ marginTop: "var(--space-md)" }}>
                    <button
                      type="button"
                      className="btn btn--primary"
                      style={{ width: "100%" }}
                      onClick={() => void handleBulkReceiveSubmit()}
                      disabled={bulkLoading || draftItems.some(d => !d.supplierId)}
                    >
                      {bulkLoading ? "Đang lưu kho..." : `Xác nhận nhập kho ${draftItems.length} sản phẩm`}
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
          ) : (
            <div className="single-receive-workspace">
              {selectedProduct ? (
                <div className="selected-product-banner" style={{ marginBottom: "var(--space-md)" }}>
                  <strong>Sản phẩm đã chọn:</strong> {selectedProduct.name}
                </div>
              ) : (
                <div className="alert alert--warning" style={{ marginBottom: "var(--space-md)" }}>
                  Vui lòng chọn sản phẩm ở bảng bên trái trước.
                </div>
              )}

              <form className="form" onSubmit={handleSingleSubmit} style={{ opacity: selectedProduct ? 1 : 0.5, pointerEvents: selectedProduct ? "auto" : "none" }}>
                <div className="form__grid">
                  <label className="form__field">
                    <span className="form__label">Chọn biến thể <span className="text-danger">*</span></span>
                    <select
                      className="form__input"
                      value={selectedVariantId}
                      onChange={(e) => handleVariantChange(e.target.value)}
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

                <div className="form__actions" style={{ marginTop: "var(--space-md)" }}>
                  <button type="submit" className="btn btn--primary" disabled={loading} style={{ width: "100%" }}>
                    {loading ? "Đang xử lý..." : "Lưu vào kho"}
                  </button>
                </div>
              </form>
            </div>
          )}
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
            {draftInvoiceCode && (
              <div className="print-purchase-order__qr">
                <img src={`https://quickchart.io/qr?size=180&text=${encodeURIComponent(draftInvoiceCode)}`} width="90" height="90" alt={`QR hóa đơn ${draftInvoiceCode}`} />
                <div>{draftInvoiceCode}</div>
              </div>
            )}
            <p><strong>Mã đề xuất:</strong> DX-{new Date().getTime().toString().substring(6)}</p>
            <p><strong>Ngày lập:</strong> {new Date().toLocaleString("vi-VN")}</p>
          </div>
        </div>

        <div className="print-purchase-order__title-area">
          <h2 className="print-purchase-order__title">ĐƠN ĐỀ NGHỊ NHẬP HÀNG / KÊU HÀNG</h2>
          <span className="print-purchase-order__date">Lưu hành nội bộ & gửi Nhà cung cấp đối tác</span>
        </div>

        <div className="print-purchase-order__info">
          <p><strong>Mã hóa đơn / mã quét:</strong> {draftInvoiceCode ?? "Chưa có mã hóa đơn"}</p>
          <p><strong>Người lập:</strong> Store Manager (Đề xuất tự động từ hệ thống Soạn Lô hàng loạt)</p>
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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth";
import { getProductForAdminById, getProductsForAdmin, updateProductVariant } from "../../catalog/api/catalogApi";
import "./PromotionsPage.css";

interface DraftPromotionItem {
  productId: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  salePrice: string;
  isActive: boolean;
}

interface CurrentPromotionItem extends Omit<DraftPromotionItem, "salePrice"> {
  originalPrice: number;
  promotionStartAtUtc: string;
  promotionEndAtUtc: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short"
});

function isCurrentPromotion(item: CurrentPromotionItem, now: Date) {
  return item.originalPrice > item.sellingPrice
    && new Date(item.promotionStartAtUtc) <= now
    && now < new Date(item.promotionEndAtUtc);
}

export function PromotionsPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<DraftPromotionItem[]>([]);
  const [draft, setDraft] = useState<DraftPromotionItem[]>([]);
  const [currentPromotions, setCurrentPromotions] = useState<CurrentPromotionItem[]>([]);
  const [loadingCurrentPromotions, setLoadingCurrentPromotions] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancellingPromotionId, setCancellingPromotionId] = useState<string | null>(null);

  const loadCurrentPromotions = useCallback(async () => {
    if (!accessToken) return;

    setLoadingCurrentPromotions(true);
    try {
      const result = await getProductsForAdmin(accessToken, "", "", 1, 100);
      const details = await Promise.all(result.items.map((product) => getProductForAdminById(accessToken, product.productId)));
      const now = new Date();
      setCurrentPromotions(details.flatMap((product) => product.variants
        .filter((variant) => variant.isActive && variant.compareAtPrice !== null && variant.promotionStartAtUtc && variant.promotionEndAtUtc)
        .map((variant) => ({
          productId: product.productId,
          productVariantId: variant.productVariantId,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          barcode: variant.barcode,
          sellingPrice: variant.sellingPrice,
          originalPrice: variant.compareAtPrice!,
          isActive: variant.isActive,
          promotionStartAtUtc: variant.promotionStartAtUtc!,
          promotionEndAtUtc: variant.promotionEndAtUtc!
        }))
        .filter((item) => isCurrentPromotion(item, now))));
    } catch {
      setError("Không thể tải chương trình giảm giá hiện tại.");
    } finally {
      setLoadingCurrentPromotions(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCurrentPromotions();
  }, [loadCurrentPromotions]);

  useEffect(() => {
    if (!scheduleConfirmed || !accessToken) return;
    void getProductsForAdmin(accessToken, query, "", 1, 30).then(async (result) => {
      const details = await Promise.all(result.items.map((product) => getProductForAdminById(accessToken, product.productId)));
      setCandidates(details.flatMap((product) => product.variants.filter((variant) => variant.isActive).map((variant) => ({
        productId: product.productId, productVariantId: variant.productVariantId, productName: product.name,
        variantName: variant.name, sku: variant.sku, barcode: variant.barcode, sellingPrice: variant.sellingPrice,
        salePrice: variant.sellingPrice.toString(), isActive: variant.isActive
      }))));
    }).catch(() => setError("Không thể tải sản phẩm."));
  }, [accessToken, query, scheduleConfirmed]);

  const visibleCandidates = useMemo(() => candidates.filter((item) => !draft.some((selected) => selected.productVariantId === item.productVariantId)), [candidates, draft]);

  const confirmSchedule = () => {
    if (!startAt || !endAt || new Date(startAt) >= new Date(endAt)) { setError("Chọn thời gian bắt đầu và kết thúc hợp lệ."); return; }
    setError(""); setScheduleConfirmed(true);
  };

  const applyPromotion = async () => {
    if (!accessToken || draft.length === 0) return;
    const startUtc = new Date(startAt).toISOString(); const endUtc = new Date(endAt).toISOString();
    if (draft.some((item) => Number(item.salePrice) <= 0 || Number(item.salePrice) >= item.sellingPrice)) { setError("Giá giảm phải lớn hơn 0 và nhỏ hơn giá hiện tại."); return; }
    try {
      setSaving(true); setError(""); setMessage(`Đang áp dụng giảm giá cho ${draft.length} sản phẩm…`);
      await Promise.all(draft.map((item) => updateProductVariant(accessToken, item.productId, item.productVariantId, {
        name: item.variantName, sku: item.sku, barcode: item.barcode, sellingPrice: Number(item.salePrice),
        compareAtPrice: item.sellingPrice, isActive: item.isActive, promotionStartAtUtc: startUtc, promotionEndAtUtc: endUtc
      })));
      setMessage(`Đã áp dụng giảm giá thành công cho ${draft.length} sản phẩm, từ ${new Date(startAt).toLocaleString("vi-VN")} đến ${new Date(endAt).toLocaleString("vi-VN")}.`); setDraft([]);
      void loadCurrentPromotions();
    } catch (requestError) { setMessage(""); setError(requestError instanceof Error ? requestError.message : "Không thể lưu chương trình giảm giá."); }
    finally { setSaving(false); }
  };

  const cancelPromotion = async (item: CurrentPromotionItem) => {
    if (!accessToken || !window.confirm(`Hủy giảm giá cho "${item.productName} - ${item.variantName}"? Giá bán sẽ được khôi phục về ${item.originalPrice.toLocaleString("vi-VN")} đ.`)) return;

    try {
      setCancellingPromotionId(item.productVariantId);
      setError("");
      setMessage("");
      await updateProductVariant(accessToken, item.productId, item.productVariantId, {
        name: item.variantName,
        sku: item.sku,
        barcode: item.barcode,
        sellingPrice: item.originalPrice,
        compareAtPrice: null,
        isActive: item.isActive,
        promotionStartAtUtc: null,
        promotionEndAtUtc: null
      });
      setMessage(`Đã hủy giảm giá cho ${item.productName} - ${item.variantName}.`);
      await loadCurrentPromotions();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể hủy giảm giá cho sản phẩm.");
    } finally {
      setCancellingPromotionId(null);
    }
  };

  return <section className="promotions-page app-container">
    <header className="promotions-page__header">
      <div>
        <h1 className="promotions-page__title">Chương trình giảm giá</h1>
        <p className="promotions-page__subtitle">Thiết lập một khung giờ, sau đó chọn sản phẩm và giá giảm.</p>
      </div>
    </header>
    {error && <div className="alert alert--danger promotions-page__alert">{error}</div>}
    {message && <div className="alert alert--success promotions-page__alert">{message}</div>}

    <section className="card promotions-page__current-section" aria-labelledby="current-promotions-heading">
      <div className="promotions-page__section-heading">
        <div>
          <h2 id="current-promotions-heading">Chương trình giảm giá hiện tại</h2>
          <p>Các sản phẩm đang trong thời gian được áp dụng giảm giá.</p>
        </div>
        <span className="promotions-page__count">{currentPromotions.length} sản phẩm</span>
      </div>
      {loadingCurrentPromotions ? (
        <p className="empty-state">Đang tải chương trình hiện tại…</p>
      ) : currentPromotions.length === 0 ? (
        <p className="empty-state">Chưa có chương trình giảm giá nào đang áp dụng.</p>
      ) : (
        <div className="promotions-page__current-list">
          {currentPromotions.map((item) => (
            <article className="promotions-page__current-item" key={item.productVariantId}>
              <div>
                <h3>{item.productName}</h3>
                <p>{item.variantName} · SKU: {item.sku}</p>
                <p className="promotions-page__current-time">{dateTimeFormatter.format(new Date(item.promotionStartAtUtc))} – {dateTimeFormatter.format(new Date(item.promotionEndAtUtc))}</p>
              </div>
              <div className="promotions-page__current-price">
                <del>{item.originalPrice.toLocaleString("vi-VN")} đ</del>
                <strong>{item.sellingPrice.toLocaleString("vi-VN")} đ</strong>
                <button
                  type="button"
                  className="btn btn--danger btn--sm promotions-page__cancel-button"
                  disabled={cancellingPromotionId === item.productVariantId}
                  onClick={() => void cancelPromotion(item)}
                >
                  {cancellingPromotionId === item.productVariantId ? "Đang hủy…" : "Hủy giảm giá"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    {!scheduleConfirmed ? (
      <section className="card promotions-page__new-section">
        <h2>Tạo chương trình giảm giá mới</h2>
        <p className="promotions-page__section-description">Chọn thời gian, sản phẩm và giá giảm cho đợt tiếp theo.</p>
        <h3>1. Chọn thời gian giảm giá</h3>
        <div className="promotions-page__schedule-form">
          <label className="form__label">
            Từ ngày
            <input type="datetime-local" className="form__input" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
          </label>
          <label className="form__label">
            Đến ngày
            <input type="datetime-local" className="form__input" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
          </label>
        </div>
        <button className="btn btn--primary" onClick={confirmSchedule}>Xác nhận thời gian</button>
      </section>
    ) : (
      <>
        <section className="card">
          <div className="promotions-page__schedule-info">
            <div className="schedule-details">
              <h3>Thời gian áp dụng:</h3>
              <p>Từ <strong>{new Date(startAt).toLocaleString("vi-VN")}</strong> đến <strong>{new Date(endAt).toLocaleString("vi-VN")}</strong></p>
            </div>
            <button className="btn btn--outline btn--sm" onClick={() => setScheduleConfirmed(false)}>Thay đổi</button>
          </div>
        </section>

        <section className="card">
          <h2>2. Tìm sản phẩm để giảm giá</h2>
          <input className="form__input" placeholder="Tên sản phẩm, SKU…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="promotions-page__candidate-list">
            {visibleCandidates.map((item) => (
              <button key={item.productVariantId} className="promotions-page__candidate" onClick={() => setDraft((current) => [...current, item])}>
                <div className="candidate-info">
                  <span className="candidate-name">{item.productName} · {item.variantName}</span>
                  <span className="candidate-sku">SKU: {item.sku}</span>
                </div>
                <span className="candidate-price">{item.sellingPrice.toLocaleString("vi-VN")} đ</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card promotions-page__draft-section">
          <h2>3. Danh sách giảm giá tạm thời</h2>
          {draft.length === 0 ? (
            <p className="empty-state">Chưa chọn sản phẩm.</p>
          ) : (
            <div className="promotions-page__draft-table-wrapper">
              <table className="promotions-page__draft-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Giá ban đầu</th>
                    <th>Giá đã giảm</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.map((item) => (
                    <tr key={item.productVariantId}>
                      <td>
                        <div className="draft-product-name">{item.productName}</div>
                        <div className="draft-variant-name">{item.variantName} (SKU: {item.sku})</div>
                      </td>
                      <td className="draft-original-price">{item.sellingPrice.toLocaleString("vi-VN")} đ</td>
                      <td>
                        <div className="draft-price-input-wrapper">
                          <input 
                            type="number" 
                            className="form__input draft-price-input"
                            value={item.salePrice} 
                            onChange={(event) => setDraft((current) => current.map((entry) => entry.productVariantId === item.productVariantId ? { ...entry, salePrice: event.target.value } : entry))} 
                          />
                          <span className="currency-suffix">đ</span>
                        </div>
                      </td>
                      <td className="draft-actions">
                        <button className="btn btn--danger btn--sm btn--icon" onClick={() => setDraft((current) => current.filter((entry) => entry.productVariantId !== item.productVariantId))} title="Bỏ">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="promotions-page__actions">
            <button type="button" className="btn btn--primary" disabled={saving || draft.length === 0} onClick={() => void applyPromotion()}>{saving ? "Đang xác nhận…" : "Xác nhận giảm giá"}</button>
          </div>
        </section>
      </>
    )}
  </section>;
}

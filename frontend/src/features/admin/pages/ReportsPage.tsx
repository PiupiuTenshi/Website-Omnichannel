import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { getReportingDashboard, type ReportingDashboard } from "../api/reportsApi";
import "./ReportsPage.css";

const moneyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function ReportsPage() {
  const { session } = useAuth();
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportingDashboard | null>(null);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!session) return;
    setError("");
    try { setReport(await getReportingDashboard(session.accessToken, from, to)); } catch { setError("Không thể tải báo cáo."); }
  }, [from, session, to]);

  useEffect(() => { void loadReport(); }, [loadReport]);
  const totalRevenue = report?.revenue.reduce((total, row) => total + row.revenue, 0) ?? 0;

  return <section className="reports-page app-container" aria-labelledby="reports-heading"><header><h1 id="reports-heading">Báo cáo cửa hàng</h1><p>Doanh thu, sản phẩm bán chạy/chậm và cảnh báo tồn kho.</p></header><form className="reports-page__filters" onSubmit={(event) => { event.preventDefault(); void loadReport(); }}><label>Từ ngày<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label><label>Đến ngày<input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} /></label><button type="submit">Cập nhật</button></form>{error ? <p role="alert">{error}</p> : null}{report ? <div className="reports-page__content"><section className="reports-page__summary"><h2>Tổng doanh thu</h2><strong>{moneyFormatter.format(totalRevenue)}</strong></section><ReportTable title="Sản phẩm bán chạy" rows={report.bestSellers} /><ReportTable title="Sản phẩm bán chậm" rows={report.slowSellers} /><InventoryTable title="Tồn kho thấp" rows={report.lowStock} /><InventoryTable title="Sắp hết hạn" rows={report.expiringSoon} /></div> : <p>Đang tải báo cáo…</p>}</section>;
}

function ReportTable({ title, rows }: { title: string; rows: ReportingDashboard["bestSellers"] }) { return <section className="reports-page__table-card"><h2>{title}</h2><div className="reports-page__table-scroll"><table><thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={3}>Không có dữ liệu.</td></tr> : rows.map((row) => <tr key={row.productVariantId}><td>{row.productName} — {row.variantName}</td><td>{row.quantitySold}</td><td>{moneyFormatter.format(row.revenue)}</td></tr>)}</tbody></table></div></section>; }
function InventoryTable({ title, rows }: { title: string; rows: ReportingDashboard["lowStock"] }) { return <section className="reports-page__table-card"><h2>{title}</h2><div className="reports-page__table-scroll"><table><thead><tr><th>Sản phẩm</th><th>Tồn</th><th>Hạn dùng</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={3}>Không có dữ liệu.</td></tr> : rows.map((row) => <tr key={row.productVariantId}><td>{row.productName} — {row.variantName}</td><td>{row.availableQuantity}</td><td>{row.expiresAtUtc ? new Date(row.expiresAtUtc).toLocaleDateString("vi-VN") : "—"}</td></tr>)}</tbody></table></div></section>; }

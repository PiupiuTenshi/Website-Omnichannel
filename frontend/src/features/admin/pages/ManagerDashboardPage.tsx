import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { getBatches, getLowStockItems, getSuppliers } from "../../inventory/api/inventoryApi";
import type { InventoryBatch, LowStockItem, Supplier } from "../../inventory/types/inventoryTypes";
import "./ManagerDashboardPage.css";

export function ManagerDashboardPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      if (!accessToken) return;
      setIsLoading(true);
      setError("");
      try {
        const [loadedSuppliers, loadedBatches, loadedLowStock] = await Promise.all([
          getSuppliers(accessToken),
          getBatches(accessToken),
          getLowStockItems(accessToken)
        ]);
        setSuppliers(loadedSuppliers);
        setBatches(loadedBatches);
        setLowStockItems(loadedLowStock);
      } catch (requestError) {
        setSuppliers([]);
        setBatches([]);
        setLowStockItems([]);
        if (requestError instanceof Error) {
          setError(requestError.message);
          return;
        }
        setError("Không thể tải dữ liệu quản trị. Vui lòng kiểm tra kết nối rồi thử lại.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, [accessToken]);

  // Statistics calculations
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const totalBatches = batches.length;
  const depletedBatchesCount = batches.filter(b => b.status === 2 || b.availableQuantity === 0).length;
  
  // Calculate expired batches (status 3 or checking date comparison)
  const expiredBatchesCount = batches.filter(b => b.status === 3 || (b.expiresAtUtc && new Date(b.expiresAtUtc) < new Date())).length;
  const lowStockAlertCount = lowStockItems.length;
  const discountedBatchesCount = batches.filter(b => b.compareAtPrice !== null && b.compareAtPrice > b.sellingPrice).length;

  return (
    <div className="manager-dashboard">
      <header className="manager-dashboard__header-section">
        <div>
          <h1 className="manager-dashboard__title">Trang quản trị cửa hàng</h1>
          <p className="manager-dashboard__subtitle">Xem thống kê tồn kho nhanh, quản lý nhà cung cấp, kiểm tra lô hàng cận hạn và đề xuất nhập hàng.</p>
        </div>
        <span className="manager-dashboard__role-badge">Store Manager</span>
      </header>

      {error && <div className="manager-dashboard__error" role="alert">{error}</div>}

      {/* KPI Stats Grid */}
      <section className="manager-dashboard__stats-grid" aria-label="Store status metrics">
        <div className="manager-dashboard__stat-card">
          <div className="manager-dashboard__stat-header">
            <span className="manager-dashboard__stat-title">Sản phẩm cần nhập</span>
            <div className="manager-dashboard__stat-icon manager-dashboard__stat-icon--warning">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="manager-dashboard__stat-value">
            {isLoading ? "..." : lowStockAlertCount}
          </div>
          <p className="manager-dashboard__stat-desc">Sản phẩm có tồn kho khả dụng dưới mức tối thiểu.</p>
        </div>

        <div className="manager-dashboard__stat-card">
          <div className="manager-dashboard__stat-header">
            <span className="manager-dashboard__stat-title">Lô hàng hết hạn</span>
            <div className="manager-dashboard__stat-icon manager-dashboard__stat-icon--danger">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="manager-dashboard__stat-value">
            {isLoading ? "..." : expiredBatchesCount}
          </div>
          <p className="manager-dashboard__stat-desc">Các lô hàng đã quá hạn sử dụng cần hủy restock.</p>
        </div>

        <div className="manager-dashboard__stat-card">
          <div className="manager-dashboard__stat-header">
            <span className="manager-dashboard__stat-title">Nhà cung cấp</span>
            <div className="manager-dashboard__stat-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <div className="manager-dashboard__stat-value">
            {isLoading ? "..." : `${activeSuppliers}/${totalSuppliers}`}
          </div>
          <p className="manager-dashboard__stat-desc">Nhà cung cấp đang hoạt động trong hệ thống.</p>
        </div>

        <div className="manager-dashboard__stat-card">
          <div className="manager-dashboard__stat-header">
            <span className="manager-dashboard__stat-title">Lô hàng giảm giá</span>
            <div className="manager-dashboard__stat-icon" style={{ color: "var(--color-primary-strong)" }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className="manager-dashboard__stat-value">
            {isLoading ? "..." : discountedBatchesCount}
          </div>
          <p className="manager-dashboard__stat-desc">Các lô hàng hiện tại đang áp dụng ưu đãi giảm giá.</p>
        </div>

        <div className="manager-dashboard__stat-card">
          <div className="manager-dashboard__stat-header">
            <span className="manager-dashboard__stat-title">Tổng số lô hàng</span>
            <div className="manager-dashboard__stat-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <div className="manager-dashboard__stat-value">
            {isLoading ? "..." : totalBatches}
          </div>
          <p className="manager-dashboard__stat-desc">Tổng số lô đã nhập (Có {depletedBatchesCount} lô đã bán hết).</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="manager-dashboard__layout-grid">
        {/* Quick Action Grid */}
        <section className="manager-dashboard__card" aria-labelledby="quick-actions-heading">
          <header className="manager-dashboard__card-header">
            <h2 className="manager-dashboard__card-title" id="quick-actions-heading">Lối tắt thao tác nhanh</h2>
          </header>
          <div className="manager-dashboard__actions-grid">
            <Link to="/manager/products/new" className="manager-dashboard__action-button">
              <div className="manager-dashboard__action-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="manager-dashboard__action-text">
                <h3>Thêm sản phẩm</h3>
                <p>Thêm mới sản phẩm, cấu hình SKU và biến thể rau củ.</p>
              </div>
            </Link>

            <Link to="/manager/promotions" className="manager-dashboard__action-button">
              <div className="manager-dashboard__action-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="manager-dashboard__action-text">
                <h3>Thiết lập giảm giá</h3>
                <p>Điều chỉnh giá bán khuyến mãi và giá so sánh của sản phẩm.</p>
              </div>
            </Link>

            <Link to="/manager/inventory/receive" className="manager-dashboard__action-button">
              <div className="manager-dashboard__action-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="12" y1="14" x2="12.01" y2="14" />
                </svg>
              </div>
              <div className="manager-dashboard__action-text">
                <h3>Nhập kho hàng mới</h3>
                <p>Khai báo số lượng nhập, đơn giá và HSD theo lô (FEFO).</p>
              </div>
            </Link>

            <Link to="/manager/inventory/suppliers" className="manager-dashboard__action-button">
              <div className="manager-dashboard__action-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="manager-dashboard__action-text">
                <h3>Quản lý nhà cung cấp</h3>
                <p>Thiết lập thông tin liên hệ và đối tác nhập hàng hóa.</p>
              </div>
            </Link>

            <Link to="/manager/inventory/batches" className="manager-dashboard__action-button">
              <div className="manager-dashboard__action-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                </svg>
              </div>
              <div className="manager-dashboard__action-text">
                <h3>Tra cứu sổ cái lô</h3>
                <p>Theo dõi luồng xuất nhập kho và thời hạn sử dụng.</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Low Stock Listing Summary */}
        <section className="manager-dashboard__card" aria-labelledby="low-stock-heading">
          <header className="manager-dashboard__card-header">
            <h2 className="manager-dashboard__card-title" id="low-stock-heading">Danh sách cần nhập gấp</h2>
            <Link to="/manager/inventory/low-stock" className="manager-dashboard__card-link">Xem tất cả</Link>
          </header>
          
          {isLoading ? (
            <p className="manager-dashboard__loading">Đang tải danh sách hàng...</p>
          ) : lowStockItems.length === 0 ? (
            <div className="manager-dashboard__empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p>Mọi mặt hàng đều có đủ tồn kho an toàn!</p>
            </div>
          ) : (
            <div className="manager-dashboard__table-wrapper">
              <table className="manager-dashboard__table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Tồn kho</th>
                    <th>Cần nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.slice(0, 5).map((item) => (
                    <tr key={item.productVariantId}>
                      <td>
                        <div className="manager-dashboard__product-info">
                          <span className="manager-dashboard__product-name">{item.productName}</span>
                          <span className="manager-dashboard__product-variant">{item.variantName} (SKU: {item.sku})</span>
                        </div>
                      </td>
                      <td>
                        <span className="manager-dashboard__stock-qty">
                          {item.availableQuantity} {item.unitCode}
                        </span>
                      </td>
                      <td>
                        <span className="manager-dashboard__suggest-qty">
                          +{item.suggestedPurchaseQuantity} {item.unitCode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth";
import {
  getProductsForAdmin,
  getProductForAdminById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getCategories,
  getUnitsOfMeasure
} from "../api/catalogApi";
import type { Category, UnitOfMeasure, ProductListItem, ProductDetail, ProductVariant } from "../types/catalogTypes";
import "./AdminProductsPage.css";

export function AdminProductsPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";

  // Data lists
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);

  // Filter & paging states
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [managingVariantsProduct, setManagingVariantsProduct] = useState<ProductDetail | null>(null);

  // Form states (Add Product)
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newUnitId, setNewUnitId] = useState("");
  const [newVariantName, setNewVariantName] = useState("Tiêu chuẩn");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newComparePrice, setNewComparePrice] = useState("");

  // Form states (Edit Product)
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editUnitId, setEditUnitId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  // Form states (Add Variant)
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [varName, setVarName] = useState("");
  const [varSku, setVarSku] = useState("");
  const [varBarcode, setVarBarcode] = useState("");
  const [varPrice, setVarPrice] = useState("");
  const [varComparePrice, setVarComparePrice] = useState("");

  // Form states (Edit Variant)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVarName, setEditVarName] = useState("");
  const [editVarSku, setEditVarSku] = useState("");
  const [editVarBarcode, setEditVarBarcode] = useState("");
  const [editVarPrice, setEditVarPrice] = useState("");
  const [editVarComparePrice, setEditVarComparePrice] = useState("");
  const [editVarIsActive, setEditVarIsActive] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await getProductsForAdmin(accessToken, search, selectedCategoryId, page);
      setProducts(res.items);
      setTotalCount(res.totalCount);
    } catch {
      setErrorMessage("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, search, selectedCategoryId, page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    // Load metadata categories and units of measure
    void getCategories().then(setCategories).catch(() => {});
    void getUnitsOfMeasure().then(setUnits).catch(() => {});
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategoryId(val);
    setPage(1);
  };

  // Generate slug automatically from name
  const generateSlug = (nameStr: string): string => {
    return nameStr
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleAddProductNameChange = (val: string) => {
    setNewName(val);
    setNewSlug(generateSlug(val));
  };

  const handleEditProductNameChange = (val: string) => {
    setEditName(val);
    setEditSlug(generateSlug(val));
  };

  // Handle Add Product submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!newCategoryId || !newUnitId) {
      setErrorMessage("Vui lòng chọn danh mục và đơn vị tính.");
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");
      await createProduct(accessToken, {
        name: newName.trim(),
        slug: newSlug.trim(),
        description: newDescription.trim() || null,
        categoryId: newCategoryId,
        unitOfMeasureId: newUnitId,
        isActive: true,
        variants: [
          {
            name: newVariantName.trim(),
            sku: newSku.trim(),
            barcode: newBarcode.trim() || null,
            sellingPrice: Number(newPrice),
            compareAtPrice: newComparePrice ? Number(newComparePrice) : null,
            isActive: true
          }
        ]
      });

      setMessage(`Đã tạo sản phẩm "${newName}" thành công.`);
      setShowAddModal(false);
      // Reset form
      setNewName("");
      setNewSlug("");
      setNewDescription("");
      setNewCategoryId("");
      setNewUnitId("");
      setNewVariantName("Tiêu chuẩn");
      setNewSku("");
      setNewBarcode("");
      setNewPrice("");
      setNewComparePrice("");
      void loadProducts();
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Không thể lưu sản phẩm. Vui lòng kiểm tra SKU/Barcode trùng lặp.");
    }
  };

  // Start Edit Product details
  const startEditProduct = async (productId: string) => {
    if (!accessToken) return;
    try {
      setErrorMessage("");
      const details = await getProductForAdminById(accessToken, productId);
      setEditingProduct(details);
      setEditName(details.name);
      setEditSlug(details.slug);
      setEditDescription(details.description || "");
      setEditCategoryId(details.categoryId);
      setEditUnitId(details.unitOfMeasureId);
      setEditIsActive(details.isActive);
    } catch {
      setErrorMessage("Không thể lấy thông tin chi tiết sản phẩm.");
    }
  };

  // Handle Update Product details
  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editingProduct) return;

    try {
      setErrorMessage("");
      setMessage("");
      await updateProduct(accessToken, editingProduct.productId, {
        name: editName.trim(),
        slug: editSlug.trim(),
        description: editDescription.trim() || null,
        categoryId: editCategoryId,
        unitOfMeasureId: editUnitId,
        isActive: editIsActive
      });

      setMessage(`Đã cập nhật thông tin sản phẩm "${editName}" thành công.`);
      setEditingProduct(null);
      void loadProducts();
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Không thể cập nhật sản phẩm.");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!accessToken) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Thao tác này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống nếu không có ràng buộc dữ liệu.`)) {
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");
      await deleteProduct(accessToken, productId);
      setMessage(`Đã xóa sản phẩm "${name}" thành công.`);
      void loadProducts();
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Không thể xóa sản phẩm. Có thể có dữ liệu liên kết như lô hàng nhập hoặc hóa đơn.");
    }
  };

  // Variants management modal opener
  const openVariantsModal = async (productId: string) => {
    if (!accessToken) return;
    try {
      setErrorMessage("");
      const details = await getProductForAdminById(accessToken, productId);
      setManagingVariantsProduct(details);
      setShowAddVariantForm(false);
      setEditingVariantId(null);
    } catch {
      setErrorMessage("Không thể lấy thông tin biến thể.");
    }
  };

  const refreshVariants = async () => {
    if (!accessToken || !managingVariantsProduct) return;
    try {
      const details = await getProductForAdminById(accessToken, managingVariantsProduct.productId);
      setManagingVariantsProduct(details);
    } catch {}
  };

  // Add Product Variant
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !managingVariantsProduct) return;

    try {
      setErrorMessage("");
      await createProductVariant(accessToken, managingVariantsProduct.productId, {
        name: varName.trim(),
        sku: varSku.trim(),
        barcode: varBarcode.trim() || null,
        sellingPrice: Number(varPrice),
        compareAtPrice: varComparePrice ? Number(varComparePrice) : null,
        isActive: true
      });

      setVarName("");
      setVarSku("");
      setVarBarcode("");
      setVarPrice("");
      setVarComparePrice("");
      setShowAddVariantForm(false);
      void refreshVariants();
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Không thể tạo biến thể mới.");
    }
  };

  // Start Edit Variant
  const startEditVariant = (v: ProductVariant) => {
    setEditingVariantId(v.productVariantId);
    setEditVarName(v.name);
    setEditVarSku(v.sku);
    setEditVarBarcode(v.barcode || "");
    setEditVarPrice(String(v.sellingPrice));
    setEditVarComparePrice(v.compareAtPrice ? String(v.compareAtPrice) : "");
    setEditVarIsActive(v.isActive);
  };

  // Save Edit Variant
  const handleSaveEditVariant = async (variantId: string) => {
    if (!accessToken || !managingVariantsProduct) return;

    try {
      setErrorMessage("");
      await updateProductVariant(accessToken, managingVariantsProduct.productId, variantId, {
        name: editVarName.trim(),
        sku: editVarSku.trim(),
        barcode: editVarBarcode.trim() || null,
        sellingPrice: Number(editVarPrice),
        compareAtPrice: editVarComparePrice ? Number(editVarComparePrice) : null,
        isActive: editVarIsActive
      });

      setEditingVariantId(null);
      void refreshVariants();
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Không thể cập nhật biến thể.");
    }
  };

  // Delete Variant
  const handleDeleteVariant = async (variantId: string, name: string) => {
    if (!accessToken || !managingVariantsProduct) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa biến thể "${name}"?`)) return;

    try {
      setErrorMessage("");
      await deleteProductVariant(accessToken, managingVariantsProduct.productId, variantId);
      void refreshVariants();
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Không thể xóa biến thể. Biến thể có thể đang có lô hàng tồn kho.");
    }
  };

  return (
    <div className="admin-products-page app-container">
      <header className="admin-products-page__header">
        <div>
          <h1 className="admin-products-page__title">Quản lý sản phẩm</h1>
          <p className="admin-products-page__subtitle">
            Cấu hình danh mục sản phẩm, biến thể, mã vạch (Barcode), mã SKU và quản lý bán hàng.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setShowAddModal(true);
            setNewCategoryId(categories[0]?.categoryId ?? "");
            setNewUnitId(units[0]?.unitOfMeasureId ?? "");
          }}
        >
          ➕ Thêm sản phẩm mới
        </button>
      </header>

      {message && <div className="alert alert--success" role="status">{message}</div>}
      {errorMessage && <div className="alert alert--danger" role="alert">{errorMessage}</div>}

      {/* Search & Filter section */}
      <section className="admin-products-page__filters card" aria-label="Bộ lọc tìm kiếm">
        <div className="filter-group">
          <label htmlFor="search-input" className="sr-only">Tìm kiếm sản phẩm</label>
          <input
            id="search-input"
            type="search"
            className="form__input"
            placeholder="Tìm theo tên sản phẩm..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="category-select" className="sr-only">Phân loại danh mục</label>
          <select
            id="category-select"
            className="form__input"
            value={selectedCategoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Main product table */}
      <section className="admin-products-page__list card">
        {loading ? (
          <div className="loading-spinner" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            Đang tải danh sách sản phẩm...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Đơn vị tính</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                      Không tìm thấy sản phẩm nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.productId}>
                      <td className="table__cell-bold">{p.name}</td>
                      <td>{p.categoryName}</td>
                      <td>{p.unitName}</td>
                      <td>
                        <span className="badge badge--success">Đang hoạt động</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn--sm btn--primary"
                            onClick={() => void startEditProduct(p.productId)}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--secondary"
                            onClick={() => void openVariantsModal(p.productId)}
                          >
                            ⚙️ Biến thể
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--danger"
                            onClick={() => void handleDeleteProduct(p.productId, p.name)}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <footer className="admin-products-page__pagination">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page <= 1}
          >
            Trước
          </button>
          <span>Trang {page} / {Math.ceil(totalCount / 15) || 1}</span>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(totalCount / 15)}
          >
            Sau
          </button>
        </footer>
      </section>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card" style={{ maxWidth: '700px', width: '100%' }}>
            <h2 className="card__title">Thêm sản phẩm mới</h2>
            <form className="form" onSubmit={handleAddProduct}>
              <div className="form__grid">
                <label className="form__field">
                  <span className="form__label">Tên sản phẩm <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={newName}
                    onChange={(e) => handleAddProductNameChange(e.target.value)}
                    placeholder="Ví dụ: Táo đỏ Fuji"
                    required
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Slug <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Danh mục <span className="text-danger">*</span></span>
                  <select
                    className="form__input"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form__field">
                  <span className="form__label">Đơn vị tính <span className="text-danger">*</span></span>
                  <select
                    className="form__input"
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    required
                  >
                    {units.map((u) => (
                      <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form__field form__field--full-width">
                  <span className="form__label">Mô tả sản phẩm</span>
                  <textarea
                    className="form__input"
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Nhập mô tả sản phẩm..."
                  />
                </label>
              </div>

              <h3 className="section-subtitle" style={{ marginTop: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                Biến thể mặc định (Đầu tiên)
              </h3>

              <div className="form__grid" style={{ marginTop: '10px' }}>
                <label className="form__field">
                  <span className="form__label">Tên biến thể <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    required
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Mã SKU <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="Ví dụ: SP-TAODO-STD"
                    required
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Mã vạch (Barcode)</span>
                  <input
                    type="text"
                    className="form__input"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    placeholder="Mã vạch quét sản phẩm"
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Giá bán lẻ (VND) <span className="text-danger">*</span></span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="form__input"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Giá so sánh (VND)</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="form__input"
                    value={newComparePrice}
                    onChange={(e) => setNewComparePrice(e.target.value)}
                  />
                </label>
              </div>

              <div className="form__actions" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn--primary">Lưu sản phẩm</button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card" style={{ maxWidth: '650px', width: '100%' }}>
            <h2 className="card__title">Cập nhật sản phẩm</h2>
            <form className="form" onSubmit={handleUpdateProductSubmit}>
              <div className="form__grid">
                <label className="form__field">
                  <span className="form__label">Tên sản phẩm <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={editName}
                    onChange={(e) => handleEditProductNameChange(e.target.value)}
                    required
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Slug <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Danh mục <span className="text-danger">*</span></span>
                  <select
                    className="form__input"
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form__field">
                  <span className="form__label">Đơn vị tính <span className="text-danger">*</span></span>
                  <select
                    className="form__input"
                    value={editUnitId}
                    onChange={(e) => setEditUnitId(e.target.value)}
                    required
                  >
                    {units.map((u) => (
                      <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form__field form__field--full-width">
                  <span className="form__label">Mô tả sản phẩm</span>
                  <textarea
                    className="form__input"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </label>

                <label className="form__field" style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  <span className="form__label" style={{ marginBottom: 0 }}>Đang kinh doanh</span>
                </label>
              </div>

              <div className="form__actions" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn--primary">Lưu thay đổi</button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditingProduct(null)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variants Management Modal */}
      {managingVariantsProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="card__title" style={{ margin: 0 }}>
                Biến thể: {managingVariantsProduct.name}
              </h2>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  setShowAddVariantForm(true);
                  setEditingVariantId(null);
                }}
              >
                ➕ Thêm biến thể mới
              </button>
            </div>

            {/* Add Variant Form */}
            {showAddVariantForm && (
              <div className="card" style={{ background: 'var(--color-background)', marginBottom: '20px', padding: '15px' }}>
                <h3 className="section-subtitle" style={{ marginTop: 0 }}>Thêm biến thể mới</h3>
                <form className="form" onSubmit={handleAddVariant}>
                  <div className="form__grid">
                    <label className="form__field">
                      <span className="form__label">Tên biến thể <span className="text-danger">*</span></span>
                      <input
                        type="text"
                        className="form__input"
                        value={varName}
                        onChange={(e) => setVarName(e.target.value)}
                        placeholder="Ví dụ: Hộp 500g"
                        required
                      />
                    </label>
                    <label className="form__field">
                      <span className="form__label">Mã SKU <span className="text-danger">*</span></span>
                      <input
                        type="text"
                        className="form__input"
                        value={varSku}
                        onChange={(e) => setVarSku(e.target.value)}
                        placeholder="Ví dụ: SP-APPLE-500G"
                        required
                      />
                    </label>
                    <label className="form__field">
                      <span className="form__label">Barcode</span>
                      <input
                        type="text"
                        className="form__input"
                        value={varBarcode}
                        onChange={(e) => setVarBarcode(e.target.value)}
                      />
                    </label>
                    <label className="form__field">
                      <span className="form__label">Giá bán (VND) <span className="text-danger">*</span></span>
                      <input
                        type="number"
                        className="form__input"
                        value={varPrice}
                        onChange={(e) => setVarPrice(e.target.value)}
                        required
                      />
                    </label>
                    <label className="form__field">
                      <span className="form__label">Giá so sánh (VND)</span>
                      <input
                        type="number"
                        className="form__input"
                        value={varComparePrice}
                        onChange={(e) => setVarComparePrice(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form__actions" style={{ marginTop: '12px' }}>
                    <button type="submit" className="btn btn--primary btn--sm">Lưu biến thể</button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => setShowAddVariantForm(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Variants table */}
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tên biến thể</th>
                    <th>SKU</th>
                    <th>Barcode</th>
                    <th>Giá bán</th>
                    <th>Giá so sánh</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {managingVariantsProduct.variants.map((v) => (
                    <tr key={v.productVariantId}>
                      {editingVariantId === v.productVariantId ? (
                        // Edit Variant Row Inline Form
                        <>
                          <td>
                            <input
                              className="form__input form__input--sm"
                              value={editVarName}
                              onChange={(e) => setEditVarName(e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              className="form__input form__input--sm"
                              value={editVarSku}
                              onChange={(e) => setEditVarSku(e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              className="form__input form__input--sm"
                              value={editVarBarcode}
                              onChange={(e) => setEditVarBarcode(e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form__input form__input--sm"
                              value={editVarPrice}
                              onChange={(e) => setEditVarPrice(e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form__input form__input--sm"
                              value={editVarComparePrice}
                              onChange={(e) => setEditVarComparePrice(e.target.value)}
                            />
                          </td>
                          <td>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="checkbox"
                                checked={editVarIsActive}
                                onChange={(e) => setEditVarIsActive(e.target.checked)}
                              />
                              Mở
                            </label>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn--sm btn--primary"
                                onClick={() => void handleSaveEditVariant(v.productVariantId)}
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--secondary"
                                onClick={() => setEditingVariantId(null)}
                              >
                                Hủy
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // Normal Variant View Row
                        <>
                          <td className="table__cell-bold">{v.name}</td>
                          <td><code>{v.sku}</code></td>
                          <td>{v.barcode || "—"}</td>
                          <td>{v.sellingPrice.toLocaleString()}đ</td>
                          <td>{v.compareAtPrice ? `${v.compareAtPrice.toLocaleString()}đ` : "—"}</td>
                          <td>
                            <span className={`badge ${v.isActive ? 'badge--success' : 'badge--danger'}`}>
                              {v.isActive ? "Đang bán" : "Ẩn"}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn--sm btn--primary"
                                onClick={() => startEditVariant(v)}
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--danger"
                                onClick={() => void handleDeleteVariant(v.productVariantId, v.name)}
                              >
                                🗑️ Xóa
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setManagingVariantsProduct(null)}
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

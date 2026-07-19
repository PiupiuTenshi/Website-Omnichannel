import { useEffect, useState } from "react";
import { createProduct, getCategories, getUnitsOfMeasure } from "../api/catalogApi";
import { useAuth } from "../../auth";
import type { Category, UnitOfMeasure } from "../types/catalogTypes";
import "./ProductFormPage.css";

function getFormString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function ProductFormPage() {
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([getCategories(), getUnitsOfMeasure()])
      .then(([categoryItems, unitItems]) => {
        setCategories(categoryItems);
        setUnits(unitItems);
      })
      .catch(() => setMessage("Không thể tải dữ liệu form."));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    const form = new FormData(event.currentTarget);
    try {
      await createProduct(session.accessToken, {
        name: getFormString(form, "name"),
        slug: getFormString(form, "slug"),
        description: getFormString(form, "description") || null,
        categoryId: getFormString(form, "categoryId"),
        unitOfMeasureId: getFormString(form, "unitOfMeasureId"),
        isActive: true,
        variants: [{
          name: getFormString(form, "variantName"),
          sku: getFormString(form, "sku"),
          barcode: getFormString(form, "barcode") || null,
          sellingPrice: Number(getFormString(form, "sellingPrice")),
          compareAtPrice: getFormString(form, "compareAtPrice")
            ? Number(getFormString(form, "compareAtPrice"))
            : null,
          isActive: true
        }]
      });
      event.currentTarget.reset();
      setMessage("Đã tạo sản phẩm.");
    } catch {
      setMessage("Không thể lưu sản phẩm. Kiểm tra các trường bắt buộc và SKU/barcode.");
    }
  }

  return (
    <section className="product-form app-container" aria-labelledby="product-form-heading">
      <h1 id="product-form-heading">Thêm sản phẩm</h1>
      <form onSubmit={handleSubmit}>
        <label>Tên sản phẩm<input name="name" required /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
        <label>Mô tả<textarea name="description" rows={4} /></label>
        <label>Danh mục<select name="categoryId" required>{categories.map((item) => <option key={item.categoryId} value={item.categoryId}>{item.name}</option>)}</select></label>
        <label>Đơn vị tính<select name="unitOfMeasureId" required>{units.map((item) => <option key={item.unitOfMeasureId} value={item.unitOfMeasureId}>{item.name}</option>)}</select></label>
        <label>Tên biến thể<input name="variantName" defaultValue="Tiêu chuẩn" required /></label>
        <label>SKU<input name="sku" required /></label>
        <label>Barcode<input name="barcode" /></label>
        <label>Giá bán<input name="sellingPrice" type="number" min="1" step="1" inputMode="decimal" required /></label>
        <label>Giá so sánh<input name="compareAtPrice" type="number" min="1" step="1" inputMode="decimal" /></label>
        <button type="submit">Lưu sản phẩm</button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}

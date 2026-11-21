import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getProducts } from "../features/catalog/api/catalogApi";
import type { ProductListItem } from "../features/catalog/types/catalogTypes";
import { getImageUrl } from "../shared/api/apiClient";
import "../features/auth/pages/AuthPage.css";
import "./DemoPage.css";

const DEMO_EMAIL = "demo@omnichannel.example";
const DEMO_PASSWORD = "OmnichannelDemo2026!";
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export function DemoPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // These public credentials only unlock the browser simulation. They are never sent to the API.
    if (String(form.get("email")).trim().toLowerCase() !== DEMO_EMAIL || form.get("password") !== DEMO_PASSWORD) {
      setError("Email hoặc mật khẩu demo chưa đúng.");
      return;
    }
    setError("");
    setSignedIn(true);
  }

  if (signedIn) return <DemoShop onSignOut={() => setSignedIn(false)} />;

  return (
    <main className="auth-page app-container">
      <section className="auth-card" aria-labelledby="demo-title">
        <header className="auth-card__header">
          <h1 className="auth-card__title" id="demo-title">Dùng thử Omnichannel</h1>
          <p className="auth-card__description">Trải nghiệm mua hàng với vai trò khách hàng. Đơn thử chỉ tồn tại trong tab này.</p>
        </header>
        <dl className="demo-credentials">
          <div><dt>Email demo</dt><dd><code>{DEMO_EMAIL}</code></dd></div>
          <div><dt>Mật khẩu demo</dt><dd><code>{DEMO_PASSWORD}</code></dd></div>
        </dl>
        <form className="auth-form" onSubmit={signIn}>
          <label className="auth-form__field">Email demo<input className="auth-form__input" name="email" type="email" autoComplete="off" required /></label>
          <label className="auth-form__field">Mật khẩu demo<input className="auth-form__input" name="password" type="password" autoComplete="off" required /></label>
          {error && <p className="auth-form__message" role="alert">{error}</p>}
          <button className="auth-form__submit" type="submit">Đăng nhập demo</button>
        </form>
        <p className="auth-card__footer"><a href="/">Về cửa hàng</a></p>
      </section>
    </main>
  );
}

function DemoShop({ onSignOut }: { onSignOut: () => void }) {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [lastOrder, setLastOrder] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void getProducts("", "", 1, 12).then(page => {
      if (!mounted) return;
      setProducts(page.items);
      setCatalogStatus("ready");
    }).catch(() => {
      if (mounted) setCatalogStatus("error");
    });
    return () => { mounted = false; };
  }, []);

  const query = search.trim().toLocaleLowerCase("vi");
  const visibleProducts = products.filter(product => `${product.name} ${product.categoryName}`.toLocaleLowerCase("vi").includes(query));
  const cart = products.filter(product => (quantities[product.productId] ?? 0) > 0);
  const subtotal = cart.reduce((sum, product) => sum + product.sellingPrice * quantities[product.productId], 0);

  function changeQuantity(productId: string, change: number) {
    setQuantities(current => ({ ...current, [productId]: Math.max(0, (current[productId] ?? 0) + change) }));
  }

  function placeOrder() {
    if (!cart.length) return;
    setLastOrder(subtotal);
    setQuantities({});
  }

  return (
    <main className="demo-shop app-container">
      <header className="demo-shop__header">
        <div><h1>Omnichannel · Mua hàng thử</h1><p>Thêm sản phẩm vào giỏ và đặt đơn mẫu. Phiên thử sẽ kết thúc khi tải lại trang hoặc đăng xuất.</p></div>
        <button className="btn-outline" type="button" onClick={onSignOut}>Đăng xuất demo</button>
      </header>
      <div className="demo-shop__layout">
        <section aria-labelledby="demo-catalog">
          <h2 id="demo-catalog">Sản phẩm</h2>
          <label className="auth-form__field demo-shop__search">Tìm sản phẩm mẫu<input className="auth-form__input" type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
          {catalogStatus === "loading" && <p>Đang tải danh mục…</p>}
          {catalogStatus === "error" && <p role="alert">Không tải được danh mục. Hãy tải lại trang để thử lại.</p>}
          {catalogStatus === "ready" && !visibleProducts.length && <p>Không tìm thấy sản phẩm phù hợp.</p>}
          <div className="demo-shop__products">
            {visibleProducts.map(product => (
              <article className="demo-shop__card" key={product.productId}>
                {product.primaryImageUrl && <img src={getImageUrl(product.primaryImageUrl)} alt="" loading="lazy" />}
                <h3>{product.name}</h3>
                <p>{currency.format(product.sellingPrice)} / {product.unitName}</p>
                <button className="btn-outline" type="button" aria-label={`Thêm ${product.name} vào giỏ demo`} onClick={() => changeQuantity(product.productId, 1)}>Thêm vào giỏ</button>
              </article>
            ))}
          </div>
        </section>
        <section className="demo-shop__card demo-shop__cart" aria-labelledby="demo-cart">
          <h2 id="demo-cart">Giỏ hàng demo</h2>
          {cart.length ? (
            <ul className="demo-shop__items">
              {cart.map(product => (
                <li key={product.productId}>
                  <span>{product.name} × {quantities[product.productId]}</span>
                  <button className="btn-outline" type="button" aria-label={`Bớt ${product.name}`} onClick={() => changeQuantity(product.productId, -1)}>Bớt</button>
                </li>
              ))}
            </ul>
          ) : <p>Giỏ hàng trống.</p>}
          <p><strong>Tạm tính {currency.format(subtotal)}</strong></p>
          <button className="btn-primary" type="button" disabled={!cart.length} onClick={placeOrder}>Đặt đơn thử</button>
          {lastOrder !== null && <p className="auth-form__message auth-form__message--success" role="status">Đã tạo đơn mẫu {currency.format(lastOrder)}. Bạn sẽ không bị tính phí.</p>}
        </section>
      </div>
    </main>
  );
}

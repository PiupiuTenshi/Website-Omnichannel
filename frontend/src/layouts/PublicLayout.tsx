import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth";

export function PublicLayout() {
  const { session, logout } = useAuth();

  return (
    <div className="public-layout">
      <header className="public-layout__header">
        <div className="app-container public-layout__header-content">
          <Link className="public-layout__brand" to="/">Tạp hóa chị Tỏ</Link>
          <nav className="public-layout__navigation" aria-label="Account navigation">
            <Link to="/">Sản phẩm</Link>
            {session?.roles.some((role) => role === "Admin" || role === "Manager") ? <Link to="/admin/products/new">Thêm sản phẩm</Link> : null}
            {session === null ? <Link to="/login">Sign in</Link> : <button type="button" onClick={() => void logout()}>Sign out</button>}
          </nav>
        </div>
      </header>
      <main className="public-layout__main"><Outlet /></main>
      <footer className="public-layout__footer"><div className="app-container">Tạp hóa chị Tỏ</div></footer>
    </div>
  );
}

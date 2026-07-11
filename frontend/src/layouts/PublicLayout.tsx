import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="public-layout">
      <header className="public-layout__header">
        <div className="app-container public-layout__header-content">
          <a className="public-layout__brand" href="/">
            Tạp hóa chị Tỏ
          </a>
        </div>
      </header>
      <main className="public-layout__main">
        <Outlet />
      </main>
      <footer className="public-layout__footer">
        <div className="app-container">Tạp hóa chị Tỏ</div>
      </footer>
    </div>
  );
}

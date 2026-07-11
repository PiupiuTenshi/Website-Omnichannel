export function NotFoundPage() {
  return (
    <section className="app-container foundation-page" aria-labelledby="not-found-heading">
      <div className="foundation-page__content">
        <p className="foundation-page__eyebrow">404</p>
        <h1 id="not-found-heading">Không tìm thấy trang</h1>
        <a className="foundation-page__action" href="/">
          Về trang chủ
        </a>
      </div>
    </section>
  );
}

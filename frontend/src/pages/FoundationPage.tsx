import "./FoundationPage.css";

export function FoundationPage() {
  return (
    <section className="foundation-page app-container" aria-labelledby="foundation-heading">
      <div className="foundation-page__content">
        <p className="foundation-page__eyebrow">Nền tảng hệ thống</p>
        <h1 id="foundation-heading">Tạp hóa chị Tỏ</h1>
        <p className="foundation-page__description">
          Ứng dụng đang sẵn sàng để phát triển trải nghiệm mua sắm online và bán hàng tại quầy.
        </p>
        <a className="foundation-page__action" href="#foundation-status">
          Xem trạng thái nền tảng
        </a>
      </div>
      <section className="foundation-page__status" id="foundation-status" aria-label="Trạng thái nền tảng">
        <h2>Smoke check</h2>
        <p>Giao diện React, router và API health endpoint đã được kết nối trong Phase 0.</p>
      </section>
    </section>
  );
}

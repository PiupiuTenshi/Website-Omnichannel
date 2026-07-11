# Tạp hóa chị Tỏ

Website bán rau củ, thực phẩm và nhu yếu phẩm cho một cửa hàng, hỗ trợ bán online và bán trực tiếp tại quầy.

## Công nghệ

### Backend

- ASP.NET Core API.
- Application, Domain, Infrastructure và Persistence tách riêng.
- Entity Framework Core + SQL Server.
- Cloudflare R2, SMTP, SMS OTP và Goong Maps.

### Frontend

- React + TypeScript + Vite.
- Feature-based architecture.
- Semantic HTML qua JSX/TSX.
- CSS thường (`.css`) theo BEM và CSS custom properties.
- TypeScript được compile thành JavaScript cho trình duyệt.
- Không sử dụng Tailwind hoặc CSS-in-JS.
- Responsive cho mobile, tablet và PC.

## Kiến trúc

```text
Cloudflare Pages
React + TypeScript + plain CSS
        |
        | HTTPS/JSON
        v
GroceryStore.Api
        |
        v
GroceryStore.Application
        |
        v
GroceryStore.Domain

GroceryStore.Api -> Infrastructure + Persistence
Infrastructure   -> Application + Domain
Persistence      -> Application + Domain
Application      -> Domain
Domain           -> không phụ thuộc project nào
```

## Cấu trúc chính

```text
backend/
  src/
    GroceryStore.Api/
    GroceryStore.Application/
    GroceryStore.Domain/
    GroceryStore.Infrastructure/
    GroceryStore.Persistence/
  tests/
frontend/
  src/
    app/
    features/
    shared/
    layouts/
    pages/
database/
  seed.sql
docs/
  system-design.md
  architecture.md
  naming-convention.md
  phases.md
  git-phases.md
  AGENT.md
  rule.md
  skill.md
```

## Git theo phase

Mỗi phase có branch và checklist riêng:

```text
foundation
identity-store-settings
catalog-media
inventory-procurement
pos
online-ordering
reviews-returns-reporting
hardening-release
```

Feature branch phải chứa mã phase, ví dụ:

```text
feature/p02-product-crud
feature/p04-cash-checkout
fix/p05-reservation-timeout
```

## Lưu ý về tài liệu Markdown

Theo yêu cầu repository, mọi file Markdown ngoài `README.md` được đặt trong `docs/` và bị `.gitignore`. Các tài liệu này có trong gói scaffold local nhưng sẽ không được push lên GitHub nếu giữ nguyên `.gitignore`.

## Lưu ý seed

`database/seed.sql` chỉ dùng cho dữ liệu tham chiếu/demo trước release. Tài khoản ASP.NET Identity phải được tạo bằng `UserManager`; không chèn mật khẩu rõ bằng SQL.

## Hướng dẫn dùng Codex

Không nên chỉ giao `docs/phases.md` và `docs/git-phases.md`. Hai file này chỉ mô tả kế hoạch và quy trình Git; Codex còn phải tuân theo kiến trúc, rule và naming convention.

Điểm bắt đầu:

```text
README.md
→ docs/AGENT.md
→ docs/codex-execution-guide.md
→ tài liệu kiến trúc/rule
→ docs/phases.md
→ docs/git-phases.md
```

Do `docs/*.md` đang bị `.gitignore`, Codex chạy từ repository GitHub sẽ không thấy chúng. Cấu hình này chỉ phù hợp khi Codex chạy local hoặc khi bạn cung cấp riêng thư mục `docs/` vào workspace.

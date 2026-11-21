# 🛒 Tạp hóa Chị Tỏ (Website-Omnichannel)

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat&logo=dotnet)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat&logo=vite)
![SQL Server](https://img.shields.io/badge/SQL_Server-2022+-CC292B?style=flat&logo=microsoftsqlserver)
![Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-green)

Hệ thống quản lý bán hàng Omnichannel toàn diện dành cho cửa hàng tạp hóa, tích hợp 3 phân hệ chính: **Website bán hàng E-Commerce**, **Phân hệ bán quầy POS**, và **Hệ thống Quản trị & Vận hành (Store Management)**.

## Xem bản demo trực tuyến

**[Mở website Omnichannel](https://website-omnichannel.pages.dev/)**

**[Đăng nhập bản demo dành cho nhà tuyển dụng](https://website-omnichannel.pages.dev/demo)**

| Tài khoản demo | Thông tin đăng nhập |
| --- | --- |
| Email | `demo@omnichannel.example` |
| Mật khẩu | `OmnichannelDemo2026!` |

Sau khi đăng nhập, bạn có thể tìm sản phẩm, thêm vào giỏ và đặt một đơn mẫu. Giỏ hàng và đơn thử chỉ tồn tại trong tab hiện tại. Để thử các vai trò nhân viên bán hàng, quản lý và quản trị viên, chạy dự án với database test theo hướng dẫn bên dưới.

---

## 🌟 Chức năng nổi bật

### 1. 🛍️ Khách hàng (E-Commerce Storefront)
- **Duyệt & Tìm kiếm**: Xem danh mục sản phẩm, biến thể, lọc theo giá/danh mục, tìm kiếm nhanh.
- **Khuyến mãi**: Hiển thị tự động các chương trình giảm giá/ưu đãi còn hiệu lực.
- **Giỏ hàng & Checkout**: Hỗ trợ giỏ hàng khách vô danh (Guest) và đồng bộ khi đăng nhập (Member), đặt hàng trực tuyến.
- **Vận chuyển & Phí giao hàng**: Tích hợp Goong Maps API tính khoảng cách thực tế và chi phí giao hàng theo địa chỉ.
- **Theo dõi đơn hàng**: Cập nhật trạng thái đơn hàng thời gian thực (Chờ xác nhận ➔ Đang chuẩn bị ➔ Đang giao ➔ Hoàn tất).
- **Tài khoản cá nhân**: Quản lý hồ sơ, sổ địa chỉ nhận hàng, lịch sử đơn hàng, đánh giá sản phẩm, đổi mật khẩu.

### 2. 🖥️ Nhân viên quầy (Seller / POS - Point of Sale)
- **Giao diện POS tối ưu**: Tối ưu thao tác màn hình cảm ứng & phím tắt, tìm kiếm sản phẩm / quét mã vạch siêu nhanh.
- **Tạo hóa đơn & Thanh toán**: Xử lý đơn tại quầy, tính tiền thừa, áp dụng mã giảm giá.
- **In ấn chuyên nghiệp**:
  - In hóa đơn nhiệt khổ 58mm tức thì.
  - In nhãn giá (Price Tags) hàng loạt khổ 60 × 40 mm dàn trang chuẩn A4.

### 3. ⚙️ Quản lý & Vận hành (Manager / Admin Dashboard)
- **Quản lý Catalogue**: Thêm/sửa danh mục, sản phẩm, biến thể, đơn vị tính (Unit), hình ảnh sản phẩm.
- **Quản lý Tồn kho & Nhà cung cấp**: Nhập kho theo lô (Batch), quản lý hạn sử dụng, nhà cung cấp (Suppliers), cảnh báo tồn kho sắp hết/hết hạn.
- **Quản lý Khuyến mãi**: Thiết lập chương trình giảm giá theo khoảng thời gian hoặc theo dòng sản phẩm.
- **Quản lý Xử lý Đơn hàng**: Tiếp nhận đơn online, duyệt báo giá giao hàng, điều phối giao hàng và hoàn tất.
- **Quản lý Trả hàng (Returns)**: Xử lý quy trình đổi trả hàng từ khách.
- **Báo cáo & Audit Logs**: Thống kê doanh thu, lịch sử thao tác hệ thống (Audit Logs) đảm bảo tính minh bạch.
- **Cấu hình Cửa hàng**: Thiết lập thông tin cửa hàng, phí giao hàng cơ sở, tham số hệ thống.

### 4. 🔐 Xác thực & Phân quyền (Auth & Security)
- **Xác thực JWT**: Bảo mật API với JSON Web Token, phân quyền theo vai trò (Customer, Seller, Manager/Admin).
- **Đăng ký & Kích hoạt**: Đăng ký qua Email/SMS, xác minh liên kết 1 lần.
- **Tài khoản Nhân viên**: Quản lý tạo tài khoản nhân viên (Pending activation ➔ Đặt mật khẩu lần đầu để kích hoạt).
- **Quên / Đặt lại mật khẩu**: Gửi email reset password với token dùng 1 lần (SMTP Gmail/Provider).

---

## 🏗️ Kiến trúc Hệ thống

### Mô hình tổng quan

```text
               ┌──────────────────────────────────────────────┐
               │    Frontend UI (React 19 + TypeScript)       │
               │   • E-Commerce Store  • POS  • Admin Dash   │
               └──────────────────────┬───────────────────────┘
                                      │  HTTPS / REST JSON
                                      ▼
               ┌──────────────────────────────────────────────┐
               │          ASP.NET Core 10 Web API             │
               │     (Clean Architecture / RESTful APIs)      │
               └──────┬───────────────┬───────────────┬───────┘
                      │               │               │
                      ▼               ▼               ▼
               ┌────────────┐   ┌────────────┐   ┌────────────┐
               │ SQL Server │   │ SMTP Mail  │   │ Goong Maps │
               │ (EF Core)  │   │ / Services │   │   (Geoc)   │
               └────────────┘   └────────────┘   └────────────┘
```

### Cấu trúc Thư mục

Backend tuân thủ nghiêm ngặt nguyên lý **Clean Architecture**:

```text
webShop/
├── backend/                              # .NET 10 Solution
│   ├── src/
│   │   ├── GroceryStore.Api/             # Controllers, Middlewares, Dependency Injection, Swagger
│   │   ├── GroceryStore.Application/     # Use Cases, DTOs, Commands/Queries, Interface Contracts
│   │   ├── GroceryStore.Domain/          # Core Business Entities, Enums, Value Objects, Domain Rules
│   │   ├── GroceryStore.Infrastructure/  # External Services (SMTP Email, Goong Maps, Image Storage)
│   │   └── GroceryStore.Persistence/     # EF Core DbContext, Migrations, Repositories, Configurations
│   └── tests/
│       ├── GroceryStore.UnitTests/       # Unit tests cho Domain & Application logic
│       ├── GroceryStore.IntegrationTests/# Integration tests cho API & Persistence
│       └── GroceryStore.ArchitectureTests/# Test kiểm tra ràng buộc kiến trúc Clean Architecture
├── frontend/                             # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── app/                          # App Providers, Router, CSS Tokens & Global Styles
│   │   ├── features/                     # Functional Modules (auth, catalog, cart, checkout, pos, admin, etc.)
│   │   ├── layouts/                      # Layouts (Public, Admin, Seller POS)
│   │   └── shared/                       # Shared UI components, hooks, utilities, API clients
├── database/                             # Script database seed & schema initialization
├── deploy/                               # Mẫu cấu hình deployment (Render, Docker, Cloudflare)
└── project-documents/                    # Sơ đồ kiến trúc và dữ liệu (PNG)
```

---

## 🛠️ Môi trường & Yêu cầu Hệ thống

- **.NET SDK**: 10.0+
- **Node.js**: 22.12+ & **npm**: 10+
- **Database**: SQL Server (SQL Express, LocalDB, Docker SQL Server hoặc Azure SQL)
- **Dịch vụ tích hợp (Tùy chọn cho Dev)**:
  - Tài khoản **Goong Maps API Key** (dùng để tính khoảng cách và phí ship).
  - Gmail App Password hoặc SMTP Server (dùng để gửi Email xác minh/quên mật khẩu).

---

## 🚀 Hướng dẫn Chạy Local (Development)

### Bước 1. Cấu hình database test và biến môi trường

Trong PowerShell tại thư mục gốc, sao chép `.env.example` thành `.env.local` nếu chưa có file này.

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Mẫu `.env.example` dùng database SQL Server cục bộ **`WebsiteOmnichannelDemo`** và gửi email mô phỏng. Nếu dùng SQL Server Express hoặc instance khác, thay `Server=localhost` bằng tên instance của bạn. Đặt `Jwt__Key` riêng dài ít nhất 32 ký tự. Nếu muốn thử đăng nhập theo vai trò, đặt mật khẩu riêng cho từng `DemoIdentity__Accounts__*__Password` trong `.env.local`. Dùng các tài khoản mẫu này trong database test trên máy của bạn.

### Bước 2. Tạo schema và nạp dữ liệu mẫu

Đặt biến môi trường cho EF Core bằng cùng chuỗi kết nối database test trong `.env.local`, rồi chạy migration trước khi seed. Các lệnh dưới đây dùng SQL Server local và xác thực Windows.

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=localhost;Database=WebsiteOmnichannelDemo;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False'
dotnet tool restore
dotnet tool run dotnet-ef database update --project backend/src/GroceryStore.Persistence --startup-project backend/src/GroceryStore.Api

dotnet run --project backend/src/GroceryStore.Api -- --seed-demo-catalog
dotnet run --project backend/src/GroceryStore.Api -- --seed-demo-images
dotnet run --project backend/src/GroceryStore.Api -- --verify-demo-catalog
```

Nếu cần thử các màn hình theo vai trò, chạy thêm `dotnet run --project backend/src/GroceryStore.Api -- --seed-demo-identities` sau khi đặt mật khẩu trong `.env.local`.

### Bước 3. Khởi chạy API

```powershell
dotnet run --project backend/src/GroceryStore.Api
```

Mở [Swagger](http://localhost:5261/swagger) để xem API hoặc [kiểm tra kết nối database](http://localhost:5261/health/ready).

### Bước 4. Khởi chạy giao diện

Để chạy giao diện React như bản demo trực tuyến, mở một terminal khác.

```powershell
cd frontend
npm ci
npm run dev
```

Mở [giao diện React](http://localhost:5173). Nếu muốn thử Angular, chạy `npm ci` và `npm start` trong `angular-client` rồi mở [giao diện Angular](http://localhost:4200).

---

## 🧪 Chạy Kiểm thử (Testing & Quality Assurance)

### Kiểm thử Backend (.NET Solution)
```powershell
# Kiểm thử toàn bộ Unit Tests, Integration Tests & Architecture Tests
dotnet test backend/GroceryStore.sln

# Build kiểm tra Backend
dotnet build backend/GroceryStore.sln --no-restore
```

### Kiểm thử Frontend (React App)
```powershell
cd frontend

# Chạy Unit / Component tests với Vitest
npm test

# Kiểm tra TypeScript typecheck
npm run typecheck

# Kiểm tra Linter rules
npm run lint

# Build thử sản phẩm production
npm run build
```

---

## 📧 Cấu hình Gửi Email (SMTP)

Để tính năng gửi Email xác minh tài khoản & quên mật khẩu hoạt động thật, cấu hình trong `.env.local`:

```env
Smtp__Provider=Smtp
Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__UserName=your-email@gmail.com
Smtp__Password=your-gmail-app-password
Smtp__FromEmail=your-email@gmail.com
Smtp__FromName=Tap hoa Chi To
```

*Lưu ý:* Khi phát triển local, nếu để `Smtp__Provider=Mock`, hệ thống sẽ ghi nội dung email ra Console log thay vì gửi thật.

---

## 🌐 Hướng dẫn Deployment (Production)

### 1. Backend Web API (Render / Docker)
Repository đã có sẵn `Dockerfile` ở thư mục gốc:
1. Tạo một **Web Service** mới trên Render từ Repository này (chọn Docker build).
2. Thiết lập Environment Variables theo mẫu `deploy/render.env.example`.
3. Dùng `/health` để kiểm tra tiến trình và `/health/ready` để kiểm tra kết nối cơ sở dữ liệu. `/health/ready` trả `503` khi kết nối thất bại.
4. Nếu lưu ảnh bằng filesystem, sao lưu ảnh hiện có trước khi đổi `ImageStorage__LocalRootPath`. Gắn ổ đĩa lưu trữ vào `/var/data`, chép ảnh cũ sang `/var/data/product-images`, rồi kiểm tra cả ảnh cũ và ảnh mới sau khi triển khai.

### 2. Frontend Angular (Cloudflare Workers)

Tên Worker là `omnichannel`. Wrangler in ra địa chỉ theo dạng `omnichannel.<subdomain-tài-khoản>.workers.dev` sau khi triển khai.

Từ thư mục gốc của repo, chạy các lệnh sau với Node.js 22.12 trở lên và tài khoản Cloudflare đã đăng nhập Wrangler.

```sh
cd angular-client
npm ci
npm run build:worker
npx wrangler deploy --dry-run
npx wrangler deploy
```

Worker phục vụ Angular SPA và chuyển `/api/*`, `/health` tới API ASP.NET Core chạy trên Render. Đổi `vars.API_ORIGIN` trong `angular-client/wrangler.jsonc` nếu dùng môi trường API khác. Bản `build:worker` dùng đường dẫn tương đối `/api`, vì vậy trình duyệt gọi cùng origin với SPA và không cần thêm domain Worker vào CORS của API.

Khi triển khai backend đã cập nhật, thêm origin chính xác của Worker vào `Auth__PasswordResetAllowedOrigins__0` trên Render để API chấp nhận yêu cầu gửi liên kết đặt lại mật khẩu. Kiểm tra SMTP bằng tài khoản thử. Backend hiện chỉ có nhà cung cấp SMS mô phỏng, nên xác minh qua email là kênh dùng cho bản Angular production.

### 3. Frontend React (Cloudflare Pages)
1. Thêm Web Project trên Cloudflare Pages liên kết với nhánh `main`.
2. Build Settings:
   - **Framework Preset**: Vite / None
   - **Build command**: `cd frontend && npm ci && npm run build`
   - **Output directory**: `frontend/dist`
   - **Environment Variable (Build-time)**: `VITE_API_BASE_URL=https://<your-api-domain>/api`
3. Sau khi deploy xong, nhớ cập nhật biến `Cors__AllowedOrigins__0` trên Render Backend khớp với URL domain của Cloudflare Pages.

---

## 🛡️ Bảo mật & Khuyên dùng

- Không commit các file chứa secret bí mật như `.env`, `.env.local`, JWT Key, SMTP App Password hay Database connection string lên Git.
- Khóa JWT Key phải đạt độ dài tối thiểu 256 bits (32+ ký tự ngẫu nhiên).
- Môi trường Production phải bắt buộc bật HTTPS và giới hạn danh sách Domain CORS được phép truy cập.

# Tạp hóa chị Tỏ / Sister Tỏ's Grocery Store

Website bán rau củ, thực phẩm và nhu yếu phẩm cho một cửa hàng, hỗ trợ bán online và bán trực tiếp tại quầy.
A grocery store website for fresh produce, foods, and daily essentials, supporting both online sales and in-store point of sale (POS).

---

## Table of Contents / Mục lục
- [English Version](#english-version)
  - [1. Context / Background](#1-context--background)
  - [2. System Actors](#2-system-actors)
  - [3. System Modules](#3-system-modules)
  - [4. Critical Business Rules](#4-critical-business-rules)
  - [5. Technology & Deployment Architecture](#5-technology--deployment-architecture)
  - [6. Directory Structure](#6-directory-structure)
  - [7. Git Flow & Development Phases](#7-git-flow--development-phases)
- [Bản Tiếng Việt](#bản-tiếng-việt)
  - [1. Bối cảnh](#1-bối-cảnh)
  - [2. Vai trò (Actor)](#2-vai-trò-actor)
  - [3. Các Phân hệ (Module)](#3-các-phân-hệ-module)
  - [4. Quy tắc nghiệp vụ trọng yếu](#4-quy-tắc-nghiệp-vụ-trọng-yếu)
  - [5. Công nghệ & Kiến trúc triển khai](#5-công-nghệ--kiến-trúc-triển-khai)
  - [6. Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
  - [7. Quy trình Git & Các Phase phát triển](#7-quy-trình-git--các-phase-phát-triển)

---

# English Version

## 1. Context / Background
The system is designed to serve a single physical grocery store: **Tạp hóa chị Tỏ**, located at 204 To Hien Thanh, Xuan Huong Ward, Lam Dong Province.

It supports two main sales channels:
- **Online Sales**: Buyers can browse products, manage their cart, place orders, reserve inventory during checkout for 10 minutes, calculate shipping distance and fees using Goong Maps API, and pay via cash on delivery (COD).
- **In-Store Sales (POS)**: Sellers can scan barcodes or search by name, weigh fresh produce in decimal quantities, process cash or bank transfer payments, and print standard 58 mm thermal receipts.

## 2. System Actors
- **Admin**: Manages system accounts, user roles, system configurations, and audits.
- **Manager**: Manages products, pricing, stock inventory, supplier connections, orders, and business reports. (Currently also acts as a Seller).
- **Seller**: Operates the in-store POS checkout and processes online/in-store orders.
- **Buyer**: Shops online, tracks order status, and submits product reviews.
- **Guest**: Browse products online, manages a session-based cart, and makes quick in-store purchases without needing an account.

## 3. System Modules
1. **Identity & Access**: Manage registrations, logins, verification, and role guards.
2. **Store Settings**: Basic configurations, hotline management, and online store status toggle.
3. **Catalog**: Manage categories, units of measure, products, variants, SKU, and barcode.
4. **Supplier & Purchase Suggestions**: Manage supplier connections and generate purchase listings for low-stock items.
5. **Inventory & Expiry**: Track inventory batch lot, FEFO allocation, and expiry warnings.
6. **POS (Point of Sale)**: Quick search, cart operations, cash calculations, and thermal receipts.
7. **Cart & Checkout**: Manage session cart for guests and account cart for buyers.
8. **Online Orders & Shipping Quote**: Geocoding, shipping fees calculation, and manager manual quote approvals.
9. **Payments**: Record cash transactions and verify manual QR bank transfers.
10. **Reviews & Returns**: Post-purchase buyer reviews, store replies, returns policy, and validation.
11. **Audit & Reporting**: Access logs, daily/monthly revenue reports, and inventory status.
12. **Image Storage**: Handle product images compression and storage provider implementations.

## 4. Critical Business Rules
- **Registration**: At least one email address or phone number must be provided. Unverified accounts are blocked from logging in.
- **Produce Weighing**: Fresh vegetables are sold and weighed in steps of 0.1 kg.
- **Cash Rounding**: Cash transactions are rounded up to the nearest 1,000 VND. Bank transfers process the exact payment amount.
- **Vegetable Expiry**: Fresh vegetables trigger warnings at 06:00 and are blocked from sale starting at 18:00 on the day after procurement.
- **Order Reservation**: Items checked out online are reserved for 10 minutes. A background worker automatically releases expired reservations back to their specific batch.
- **Shipping Fees**: Deliveries within a 5 km radius use a flat basic fee. Distances greater than 5 km go to a "pending quote" status, requiring Manager approval and Buyer acceptance.
- **Returns Policy**: Perishable goods cannot be returned due to a change of mind. Product returns require verification.
- **Stock Movements**: Every inventory adjustment must create an immutable ledger entry. History cannot be deleted.

## 5. Technology & Deployment Architecture
The application is built on a decoupled, modern architecture:

```text
Cloudflare Pages (Frontend React SPA)
        |
        | HTTPS / JSON
        v
MonsterASP.NET (ASP.NET Core Web API)
        |-- SQL Server Database (Local / Production)
        |-- SMTP (Email verification) & SMS OTP Abstraction
        |-- Goong REST API (Geocoding & Directions)
        `-- Cloudflare R2 / Local Storage (Product Images)
```

### Stack Details
- **Backend**: ASP.NET Core API, structured in a 5-layer Clean Architecture (Api, Application, Domain, Infrastructure, Persistence). Database access uses Entity Framework Core.
- **Frontend**: React + TypeScript + Vite. Styling uses Vanilla CSS following BEM naming conventions. No TailwindCSS or CSS-in-JS is used. Fully responsive supporting layouts from 360 px to 1920 px.

## 6. Directory Structure
```text
backend/
  src/
    GroceryStore.Api/             # Web API controllers, filters, and configuration
    GroceryStore.Application/     # Use cases, commands, queries, and behaviors
    GroceryStore.Domain/          # Core domain models, rules, and logic
    GroceryStore.Infrastructure/  # External integrations (SMTP, Goong, R2)
    GroceryStore.Persistence/     # Entity Framework Core, migrations, and seeds
  tests/
    GroceryStore.UnitTests/       # Domain and application business rules tests
    GroceryStore.ArchitectureTests/# Project reference layer compliance tests
    GroceryStore.IntegrationTests/# API and DbContext integration tests
frontend/
  src/
    app/                          # Global CSS, routes, and providers
    features/                     # Feature-based folders (catalog, POS, etc.)
    shared/                       # Reusable hooks, layout, and UI components
    layouts/                      # Page layout templates
    pages/                        # Main router pages
database/
  seed.sql                        # Idempotent reference/demo data seed script
docs/                             # Local development guidelines (ignored by Git)
```

## 7. Git Flow & Development Phases
The project is built step-by-step through 8 distinct implementation phases:

| Phase | Branch | Checkpoint Tag | Description |
|---|---|---|---|
| 0 | `phase/00-foundation` | `v0.1.0` | Initial solution, projects setup, CI, and smoke test |
| 1 | `phase/01-identity-store-settings` | `v0.2.0` | Authentication, roles, and shop configuration |
| 2 | `phase/02-catalog-media` | `v0.3.0` | Catalog, products, pricing, and images upload |
| 3 | `phase/03-inventory-procurement` | `v0.4.0` | Procurement batch, FEFO ledger, and low-stock list |
| 4 | `phase/04-pos` | `v0.5.0` | POS search, cash rounding, thermal receipt, and tag templates |
| 5 | `phase/05-online-ordering` | `v0.6.0` | Shopping cart, Goong maps shipping quote, and reservation |
| 6 | `phase/06-reviews-returns-reporting` | `v0.7.0` | Buyer reviews, perishable returns, and management reports |
| 7 | `phase/07-hardening-release` | `v1.0.0` | Security audits, backup/restore, Pages deploy, and RC MVP |

### Git Rules
- Do not commit directly on `main` or `develop`.
- Phase branches must be named `phase/<number>-<slug>`.
- Feature and fix branches must branch off their respective phase branch and include the phase code, for example: `feature/p02-product-crud` or `fix/p04-cash-rounding`.
- Conventional Commits format is strictly required.

---

# Bản Tiếng Việt

## 1. Bối cảnh
Hệ thống phục vụ một cửa hàng vật lý duy nhất: **Tạp hóa chị Tỏ**, tại 204 Tô Hiến Thành, Phường Xuân Hương, tỉnh Lâm Đồng.

Hỗ trợ hai kênh bán hàng:
- **Kênh Online**: Buyer (Khách mua online) xem sản phẩm, quản lý giỏ hàng, đặt hàng, giữ tồn 10 phút khi checkout, tự động tính khoảng cách và phí ship qua Goong Maps, và thanh toán COD.
- **Kênh Tại Quầy (POS)**: Seller (Nhân viên bán hàng) quét barcode hoặc tìm kiếm sản phẩm theo tên, cân trọng lượng rau củ thực tế ở định dạng số thập phân (bước 0,1 kg), nhận thanh toán bằng tiền mặt/chuyển khoản và in hóa đơn 58 mm.

## 2. Vai trò (Actor)
- **Admin**: Quản lý tài khoản, phân vai trò, cấu hình hệ thống và xem nhật ký hoạt động (audit log).
- **Manager**: Quản lý danh mục sản phẩm, giá bán, tồn kho, nhà cung cấp, đơn hàng và báo cáo doanh thu. (Hiện tại kiêm luôn vai trò Seller).
- **Seller**: Thao tác bán hàng trực tiếp tại quầy POS và xử lý các đơn hàng online.
- **Buyer**: Đặt hàng online, theo dõi hành trình đơn hàng và viết đánh giá sản phẩm.
- **Guest**: Khách truy cập online chưa đăng nhập (giữ giỏ hàng bằng session) hoặc khách mua tại quầy không cần tạo tài khoản.

## 3. Các Phân hệ (Module)
1. **Identity & Access**: Đăng ký, đăng nhập, xác minh tài khoản và phân quyền người dùng.
2. **Store Settings**: Thiết lập hotline, tên cửa hàng, địa chỉ gốc và nút tạm tắt đặt hàng online.
3. **Catalog**: Quản lý danh mục (dạng cây không chu kỳ), đơn vị tính, sản phẩm, biến thể, mã SKU và Barcode.
4. **Supplier & Purchase Suggestions**: Quản lý liên hệ nhà cung cấp và tự động đề xuất danh sách hàng cần nhập khi tồn kho thấp.
5. **Inventory & Expiry**: Quản lý nhập lô hàng (đơn giá nhập, HSD), phân bổ kho theo FEFO (hết hạn trước - xuất trước) và cảnh báo hạn sử dụng.
6. **POS**: Tìm kiếm nhanh sản phẩm, quản lý giỏ hàng tại quầy, tính tiền thừa và in hóa đơn nhiệt.
7. **Cart & Checkout**: Quản lý giỏ hàng và thanh toán cho khách vãng lai và thành viên.
8. **Online Orders & Shipping Quote**: Xác định tọa độ địa lý, tính khoảng cách, tự động áp phí ship hoặc chuyển trạng thái chờ Manager báo giá khi khoảng cách > 5 km.
9. **Payments**: Ghi nhận doanh thu tiền mặt hoặc xác nhận chuyển khoản ngân hàng thủ công qua mã QR.
10. **Reviews & Returns**: Người mua đánh giá đơn hàng đã hoàn tất, cửa hàng trả lời đánh giá; tiếp nhận yêu cầu đổi trả theo chính sách.
11. **Audit & Reporting**: Truy xuất nhật ký hệ thống và lập báo cáo doanh thu, sản phẩm bán chạy/chậm theo ngày/tháng.
12. **Image Storage**: Tải lên, nén, resize và lưu trữ ảnh sản phẩm (hỗ trợ lưu local hoặc Cloudflare R2).

## 4. Quy tắc nghiệp vụ trọng yếu
- **Đăng ký tài khoản**: Phải cung cấp ít nhất Email hoặc Số điện thoại. Tài khoản chưa xác minh (qua email hoặc SMS OTP) sẽ bị khóa đăng nhập.
- **Đơn vị cân đo**: Các mặt hàng rau tươi hỗ trợ khối lượng ở định dạng số thập phân, bán theo bước chia nhỏ nhất là 0,1 kg.
- **Làm tròn tiền mặt**: Thanh toán bằng tiền mặt được làm tròn lên mốc 1.000 đồng gần nhất. Thanh toán chuyển khoản giữ nguyên số tiền chính xác.
- **Chính sách rau tươi**: Rau tươi nhập kho sẽ kích hoạt cảnh báo cận hạn từ 06:00 ngày hôm sau và bị hệ thống chặn bán từ 18:00 cùng ngày hôm sau.
- **Giữ tồn kho**: Đơn hàng online khi bước vào trang checkout sẽ được giữ tồn kho trong vòng 10 phút. Quá 10 phút không hoàn tất thanh toán, hệ thống tự động giải phóng tồn kho về đúng lô hàng ban đầu.
- **Phí giao hàng**: Khoảng cách dưới hoặc bằng 5 km áp dụng phí ship đồng giá (10.000đ). Khoảng cách trên 5 km sẽ chuyển sang trạng thái chờ Manager duyệt báo giá ship; Buyer phải chấp thuận báo giá mới được xử lý tiếp.
- **Chính sách đổi trả**: Không hỗ trợ đổi trả hàng dễ hỏng vì lý do đổi ý. Mọi yêu cầu đổi trả do lỗi chất lượng phải được Manager kiểm tra và phân loại (Restock/Damaged/Expired).
- **Nhật ký tồn kho**: Mọi hành động xuất, nhập, điều chỉnh kho đều phải ghi nhận vào sổ cái (inventory ledger) bất biến. Không cho phép xóa lịch sử cũ.

## 5. Công nghệ & Kiến trúc triển khai
Hệ thống được thiết kế theo mô hình tách biệt Frontend và Backend:

```text
Cloudflare Pages (Frontend React SPA)
        |
        | HTTPS / JSON
        v
MonsterASP.NET (ASP.NET Core Web API)
        |-- SQL Server Database (Local / Production)
        |-- SMTP (Gửi mail xác thực) & SMS OTP Mock
        |-- Goong REST API (Tìm đường và khoảng cách ship)
        `-- Cloudflare R2 / Local Storage (Lưu trữ ảnh sản phẩm)
```

### Chi tiết Công nghệ
- **Backend**: ASP.NET Core API thiết kế theo mô hình Clean Architecture gồm 5 lớp (Api, Application, Domain, Infrastructure, Persistence). Truy cập database qua Entity Framework Core.
- **Frontend**: React + TypeScript + Vite. Giao diện được xây dựng bằng CSS thường theo chuẩn đặt tên BEM. Dự án không sử dụng Tailwind hoặc các thư viện CSS-in-JS. Giao diện responsive hoàn chỉnh từ 360 px đến 1920 px.

## 6. Cấu trúc thư mục
Vui lòng tham khảo phần [Directory Structure](#6-directory-structure) ở phiên bản tiếng Anh để xem chi tiết cách tổ chức các thư mục của dự án.

## 7. Quy trình Git & Các Phase phát triển
Dự án được xây dựng tuần tự qua 8 phase phát triển:

| Phase | Nhánh Git | Checkpoint Tag | Mục tiêu |
|---|---|---|---|
| 0 | `phase/00-foundation` | `v0.1.0` | Khởi tạo solution, các dự án clean architecture, CI/CD và smoke test |
| 1 | `phase/01-identity-store-settings` | `v0.2.0` | Identity, role, xác thực tài khoản và cấu hình cửa hàng |
| 2 | `phase/02-catalog-media` | `v0.3.0` | Danh mục sản phẩm, biến thể, giá bán và upload ảnh R2 |
| 3 | `phase/03-inventory-procurement` | `v0.4.0` | Quản lý nhập lô hàng, FEFO ledger và danh sách hàng cần nhập |
| 4 | `phase/04-pos` | `v0.5.0` | Giao diện POS, làm tròn tiền mặt, template bill 58 mm và tag giá |
| 5 | `phase/05-online-ordering` | `v0.6.0` | Giỏ hàng guest/member, tính khoảng cách Goong, giữ tồn 10 phút |
| 6 | `phase/06-reviews-returns-reporting` | `v0.7.0` | Đánh giá sản phẩm, chính sách đổi trả hàng dễ hỏng và báo cáo doanh thu |
| 7 | `phase/07-hardening-release` | `v1.0.0` | Đánh giá bảo mật, backup/restore, deploy và release MVP chính thức |

### Quy tắc Git bắt buộc
- Tuyệt đối không commit trực tiếp trên nhánh `main` hoặc `develop`.
- Nhánh tích hợp của phase phải đặt tên theo mẫu `phase/<number>-<slug>`.
- Các nhánh chức năng hoặc sửa lỗi phải rẽ nhánh từ nhánh phase tương ứng và chứa mã phase, ví dụ: `feature/p02-product-crud` hoặc `fix/p04-cash-rounding`.
- Tin nhắn commit bắt buộc tuân thủ định dạng Conventional Commits.

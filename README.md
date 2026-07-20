# Tạp hóa Chị Tỏ

Ứng dụng quản lý cửa hàng tạp hóa gồm website bán hàng, quản trị vận hành, bán hàng tại quầy POS và quản lý đơn online.

## Chức năng hiện có

- Khách hàng: xem sản phẩm, giỏ hàng, checkout, theo dõi trạng thái đơn, xác nhận báo giá giao hàng, tài khoản và đổi mật khẩu.
- Xác thực: đăng ký, xác minh liên hệ, đăng nhập, quên mật khẩu qua email/SMS và đặt lại mật khẩu bằng liên kết một lần.
- Manager: quản lý sản phẩm, kho, nhà cung cấp, khuyến mãi, đơn online, báo cáo và cấu hình cửa hàng.
- Seller: POS toàn màn hình, hóa đơn nhiệt 58 mm, trang in nhiều tag giá 60 × 40 mm trên A4.
- Đơn online: giữ tồn kho, báo giá giao hàng, luồng chuẩn bị → giao hàng → hoàn tất và cập nhật tiến trình cho khách.
- Khuyến mãi: Manager thiết lập thời gian/giá giảm; trang chủ chỉ hiển thị khuyến mãi còn hiệu lực.

## Kiến trúc

```text
React + Vite (frontend)
        │ HTTPS / JSON
        ▼
ASP.NET Core 10 API
        ├── SQL Server
        ├── SMTP (xác minh và quên mật khẩu)
        ├── Goong API (khoảng cách và phí giao hàng)
        └── lưu ảnh local / persistent disk
```

Backend theo Clean Architecture:

```text
backend/src/
  GroceryStore.Api/            Controllers, cấu hình và middleware
  GroceryStore.Application/    Use cases và contracts
  GroceryStore.Domain/         Quy tắc nghiệp vụ và entity
  GroceryStore.Infrastructure/ SMTP, Identity, dịch vụ ngoài
  GroceryStore.Persistence/    EF Core, migrations và repositories
frontend/src/
  app/                         Router và styles toàn cục
  features/                    Modules theo chức năng
  layouts/                     Public/Dashboard layout
deploy/                        Mẫu biến môi trường Render
```

## Yêu cầu

- .NET SDK 10
- Node.js 20+
- SQL Server (LocalDB, SQL Server hoặc Azure SQL)
- Tài khoản Goong nếu cần tính phí giao hàng theo địa chỉ
- Gmail App Password hoặc SMTP provider để gửi email thật

## Chạy local

1. Tạo file `.env.local` ở thư mục gốc từ `.env.example`.
2. Điền kết nối database, JWT, Goong và SMTP. Không commit `.env.local`.
3. Khởi chạy API:

```powershell
dotnet run --project backend/src/GroceryStore.Api
```

API local mặc định dùng `http://localhost:5261` (theo `backend/src/GroceryStore.Api/Properties/launchSettings.json`).

4. Khởi chạy frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend mặc định dùng `http://localhost:5173`. Khi chạy local, đặt `VITE_API_BASE_URL=http://localhost:5261/api` trong `.env.local`.

## Cấu hình email quên mật khẩu

Quên mật khẩu gửi liên kết đến email đã xác minh. Với Gmail, tạo **App Password** rồi cấu hình trong `.env.local`:

```env
Smtp__Provider=Smtp
Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__UserName=your-store@gmail.com
Smtp__Password=your-gmail-app-password
Smtp__FromEmail=your-store@gmail.com
Smtp__FromName=Tap hoa chi To
```

Khởi động lại API sau khi thay đổi biến môi trường. `Smtp__Provider=Mock` chỉ dùng khi phát triển; email sẽ chỉ được ghi vào log.

SMS hiện vẫn là mock; không nên bật SMS production cho đến khi tích hợp nhà cung cấp có thương hiệu gửi tin đã đăng ký.

## Deploy thử nghiệm trên Render

Dockerfile ở gốc repository build và chạy API. Dùng `deploy/render.env.example` làm danh sách biến môi trường cho Render.

1. Tạo SQL Server có thể truy cập từ Render.
2. Tạo Render Web Service từ repository này, chọn Dockerfile ở thư mục gốc.
3. Trong **Environment**, nhập các biến từ `deploy/render.env.example` và thay mọi giá trị `REPLACE_*`.
4. Bắt buộc thay các biến sau bằng dữ liệu thật:

```env
ConnectionStrings__DefaultConnection=...
Jwt__Key=<chuỗi ngẫu nhiên từ 32 ký tự trở lên>
Cors__AllowedOrigins__0=https://<frontend-domain>
Goong__ApiKey=...
Smtp__Provider=Smtp
Smtp__Password=<Gmail App Password hoặc SMTP password>
Smtp__FromEmail=<email gửi>
```

5. Sau khi deploy, kiểm tra `https://<api-domain>/health` phải trả HTTP 200.
6. Deploy frontend và đặt biến build:

```env
VITE_API_BASE_URL=https://<api-domain>/api
```

7. Cập nhật lại `Cors__AllowedOrigins__0` bằng domain frontend chính xác rồi redeploy API.

### Cloudflare Pages

`VITE_*` là biến **build-time**: sau khi thêm hoặc sửa `VITE_API_BASE_URL`, phải vào **Deployments → Retry deployment** (hoặc tạo deployment mới). Thay đổi biến không cập nhật các file JavaScript đã deploy.

- Nếu **Root directory** là `frontend`: Build command `npm run build`, Output directory `dist`.
- Nếu build từ gốc repository: Build command `cd frontend && npm ci && npm run build`, Output directory `frontend/dist`.
- Đặt `VITE_API_BASE_URL=https://<api-domain>/api` cho đúng môi trường đang deploy (Production/Preview).

Với API Render, cấu hình CORS ở Render Environment rồi redeploy API:

```env
Cors__AllowedOrigins__0=https://website-omnichannel.pages.dev
Cors__AllowedOrigins__1=https://<deployment-preview>.website-omnichannel.pages.dev
```

Chỉ thêm domain preview khi cần test; ưu tiên domain Pages chính thức hoặc custom domain cho production.

> Lưu ý: `ImageStorage__Provider=Local` cần persistent disk khi deploy. Nếu không có persistent disk, ảnh sản phẩm có thể mất sau khi service được tạo lại.

## Checklist test sau deploy

- Mở `/health` của API.
- Đăng ký/xác minh một tài khoản, sau đó đăng nhập.
- Vào `/forgot-password`, gửi liên kết reset và kiểm tra email.
- Thêm sản phẩm vào giỏ, checkout và theo dõi đơn.
- Manager đổi trạng thái đơn; khách mở trang chi tiết đơn để thấy tiến trình mới.
- Seller tạo hóa đơn POS, in hóa đơn 58 mm và in tag giá tại `/seller/price-tags`.
- Tạo khuyến mãi Manager và kiểm tra mục sản phẩm giảm giá ở trang chủ.

## Các lệnh kiểm tra

```powershell
cd frontend
npm run build

cd ../backend
dotnet build GroceryStore.sln --no-restore
```

## Seed dữ liệu demo

Lệnh seed có thể chạy lặp lại: chỉ thêm danh mục, đơn vị tính, sản phẩm, biến thể, tồn kho và nhà cung cấp còn thiếu; không nhân đôi dữ liệu theo slug/mã.

```powershell
dotnet run --project backend/src/GroceryStore.Api -- --seed-demo-identities --seed-demo-catalog
dotnet run --project backend/src/GroceryStore.Api -- --verify-demo-catalog
```

Khi seed database deploy, đặt `ConnectionStrings__DefaultConnection` qua biến môi trường của hosting hoặc nạp từ file `.env` riêng tư. Không commit file này.

## Bảo mật

- Không commit `.env`, `.env.local`, app password, JWT key hoặc connection string.
- Dùng SMTP App Password, không dùng mật khẩu Gmail chính.
- Chỉ dùng HTTPS và CORS domain thật khi deploy production.
- Thay đổi JWT key nếu khóa từng xuất hiện trong log hoặc repository.

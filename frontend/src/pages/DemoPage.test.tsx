import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DemoPage } from "./DemoPage";

afterEach(() => vi.unstubAllGlobals());

it("lets a demo buyer add an item and place a simulated order without writing to the API", async () => {
  const fetchCatalog = vi.fn().mockResolvedValue(Response.json({ items: [
    { productId: "apple", name: "Táo", categoryName: "Trái cây", sellingPrice: 25000, unitName: "kg" },
    { productId: "rice", name: "Gạo", categoryName: "Thực phẩm", sellingPrice: 20000, unitName: "kg" }
  ] }));
  vi.stubGlobal("fetch", fetchCatalog);
  render(<DemoPage />);

  fireEvent.change(screen.getByLabelText("Email demo"), { target: { value: "demo@omnichannel.example" } });
  fireEvent.change(screen.getByLabelText("Mật khẩu demo"), { target: { value: "wrong-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Đăng nhập demo" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Email hoặc mật khẩu demo chưa đúng");
  expect(fetchCatalog).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Mật khẩu demo"), { target: { value: "OmnichannelDemo2026!" } });
  fireEvent.click(screen.getByRole("button", { name: "Đăng nhập demo" }));
  const apple = await screen.findByRole("button", { name: "Thêm Táo vào giỏ demo" });
  fireEvent.change(screen.getByLabelText("Tìm sản phẩm mẫu"), { target: { value: "Táo" } });
  expect(screen.queryByRole("button", { name: "Thêm Gạo vào giỏ demo" })).not.toBeInTheDocument();
  fireEvent.click(apple);
  fireEvent.click(screen.getByRole("button", { name: "Đặt đơn thử" }));
  expect(screen.getByRole("status")).toHaveTextContent("Đã tạo đơn mẫu");

  fireEvent.click(screen.getByRole("button", { name: "Đăng xuất demo" }));
  expect(screen.getByRole("button", { name: "Đăng nhập demo" })).toBeInTheDocument();
  await waitFor(() => expect(fetchCatalog).toHaveBeenCalledTimes(1));
  const [url, options] = fetchCatalog.mock.calls[0];
  expect(url).toContain("/products?");
  expect(options.method ?? "GET").toBe("GET");
  expect(options.headers.has("Authorization")).toBe(false);
});

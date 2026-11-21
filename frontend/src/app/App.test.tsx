import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the catalog smoke page", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const pathname = new URL(url, window.location.origin).pathname;
      const payloads: Record<string, unknown> = {
        "/api/products": {
          items: [{ productId: "apples", name: "Táo", slug: "tao", categoryName: "Trái cây", unitName: "kg", sellingPrice: 10000, compareAtPrice: null, primaryImageUrl: null }],
          page: 1,
          pageSize: 12,
          totalCount: 1,
        },
        "/api/cart": { shoppingCartId: "test-cart", items: [], subtotal: 0 },
      };
      const payload = payloads[pathname] ?? [];
      return Promise.resolve(new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } }));
    }));

    render(<App />);

    expect(screen.getByRole("link", { name: "🥬 Chợ Xanh" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Táo" })).toHaveAttribute("href", "/products/tao");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the catalog smoke page", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const payload = url.includes("/products?")
        ? { items: [], page: 1, pageSize: 12, totalCount: 0 }
        : [];
      return Promise.resolve(new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } }));
    }));

    render(<App />);

    expect(screen.getByRole("link", { name: "🥬 Chợ Xanh" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày" })).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
  });
});

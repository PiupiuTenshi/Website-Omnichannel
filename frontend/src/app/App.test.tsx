import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the foundation smoke page", async () => {
    render(<App />);

    expect(await screen.findByRole("link", { name: "Tạp hóa chị Tỏ" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the foundation smoke page", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Tạp hóa chị Tỏ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày" })).toBeInTheDocument();
  });
});

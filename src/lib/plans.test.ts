import { describe, expect, it } from "vitest";
import { PRODUCTS } from "./plans";

describe("plans", () => {
  it("offers a ₹1 demo plan", () => {
    expect(PRODUCTS.find((p) => p.name === "Demo Plan")?.price).toBe(1);
  });
});

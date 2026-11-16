import { describe, expect, it } from "vitest";
import {
  buildUpiUrl,
  effectiveStatus,
  extractTransactionNote,
  makeTransactionNote,
  orderExpiry,
  resolveAmount,
  resolvePagination,
  safeEqual,
} from "./payment-rules";

describe("payment rules", () => {
  it("defaults a missing amount to ₹200", () => {
    expect(resolveAmount(undefined)).toBe(200);
  });

  it("rejects amounts below ₹1", () => {
    expect(() => resolveAmount(0.5)).toThrow("Invalid amount");
    expect(() => resolveAmount(-10)).toThrow("Invalid amount");
  });

  it("accepts the ₹1 demo plan amount", () => {
    expect(resolveAmount(1)).toBe(1);
  });

  it("accepts the plan prices as-is", () => {
    expect(resolveAmount(199)).toBe(199);
    expect(resolveAmount(999)).toBe(999);
  });

  it("expires orders 10 minutes after creation", () => {
    expect(orderExpiry(0).getTime()).toBe(600_000);
  });

  it("reports a pending order past its expiry as expired", () => {
    const now = new Date("2026-01-01T00:10:01Z");
    expect(effectiveStatus("pending", "2026-01-01T00:10:00Z", now)).toBe("expired");
    expect(effectiveStatus("pending", "2026-01-01T00:11:00Z", now)).toBe("pending");
    expect(effectiveStatus("completed", "2026-01-01T00:10:00Z", now)).toBe("completed");
  });

  it("builds transaction notes as FP_<user>_<time>_<8 chars>", () => {
    expect(makeTransactionNote("u1", 1700000000000, "abcdef123456")).toBe(
      "FP_u1_1700000000000_abcdef12",
    );
  });

  it("finds the transaction note in a webhook tn or free-text note", () => {
    expect(extractTransactionNote("FP_a_1_b", null)).toBe("FP_a_1_b");
    expect(
      extractTransactionNote(undefined, "Received Rs.199 for FP_u1_17_ab12cd34 via GPay"),
    ).toBe("FP_u1_17_ab12cd34");
    expect(extractTransactionNote(undefined, "no reference here")).toBeNull();
  });

  it("builds a personal-account INR UPI link with the note as tn", () => {
    expect(
      buildUpiUrl({ upiVpa: "irfan@okaxis", upiName: "Irfan T", amount: 199, tn: "FP_x" }),
    ).toBe("upi://pay?pa=irfan%40okaxis&pn=Irfan%20T&am=199&cu=INR&tn=FP_x");
  });

  it("never adds merchant-only params for a personal UPI ID", () => {
    const url = buildUpiUrl({ upiVpa: "a@upi", upiName: "A", amount: 1, tn: "FP_y" });
    expect(url).not.toMatch(/[?&](tr|mc|mode|orgid)=/);
  });

  it("paginates 20 per page by default and caps pages at 100 rows", () => {
    expect(resolvePagination(undefined, undefined)).toEqual({
      page: 1,
      limit: 20,
      from: 0,
      to: 19,
    });
    expect(resolvePagination(3, 10)).toEqual({ page: 3, limit: 10, from: 20, to: 29 });
    expect(resolvePagination(1, 5000).limit).toBe(100);
  });

  it("compares webhook secrets exactly", () => {
    expect(safeEqual("secret", "secret")).toBe(true);
    expect(safeEqual("secret", "Secret")).toBe(false);
    expect(safeEqual("secret", "secret1")).toBe(false);
  });
});

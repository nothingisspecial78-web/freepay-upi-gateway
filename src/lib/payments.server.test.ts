import { describe, expect, it } from "vitest";
import {
  confirmPayment,
  createPaymentOrder,
  getPaymentStatus,
  listTransactions,
} from "./payments.server";

describe("payments.server resilience and operations", () => {
  it("creates a payment order cleanly without throwing when service role key is not configured", async () => {
    const order = await createPaymentOrder(199);
    expect(order.success).toBe(true);
    expect(order.amount).toBe(199);
    expect(order.tn).toMatch(/^FP_/);
    expect(order.upiVpa).toBe("abdullaarimbra786@oksbi");
    expect(order.upiName).toBe("Abdulla Arimbra");
    expect(order.expiresAt).toBeTruthy();
  });

  it("retrieves status for a newly created order as pending", async () => {
    const order = await createPaymentOrder(99);
    const status = await getPaymentStatus(order.tn);

    expect(status.success).toBe(true);
    if (status.success) {
      expect(status.tn).toBe(order.tn);
      expect(status.amount).toBe(99);
      expect(status.status).toBe("pending");
      expect(status.completedAt).toBeNull();
    }
  });

  it("confirms a pending order and updates status to completed", async () => {
    const order = await createPaymentOrder(1);
    const confirmed = await confirmPayment(order.tn);

    expect(confirmed).not.toBeNull();
    expect(confirmed?.tn).toBe(order.tn);
    expect(confirmed?.amount).toBe(1);

    const statusAfter = await getPaymentStatus(order.tn);
    expect(statusAfter.success).toBe(true);
    if (statusAfter.success) {
      expect(statusAfter.status).toBe("completed");
      expect(statusAfter.completedAt).not.toBeNull();
    }
  });

  it("returns null idempotently when attempting to re-confirm an already completed order", async () => {
    const order = await createPaymentOrder(50);
    await confirmPayment(order.tn);

    const reconfirm = await confirmPayment(order.tn);
    expect(reconfirm).toBeNull();
  });

  it("lists created transactions with pagination", async () => {
    const order = await createPaymentOrder(250);
    const page = await listTransactions(1, 10);

    expect(page.success).toBe(true);
    expect(page.data.length).toBeGreaterThanOrEqual(1);
    const found = page.data.find((tx) => tx.tn === order.tn);
    expect(found).toBeDefined();
    expect(found?.amount).toBe(250);
  });
});

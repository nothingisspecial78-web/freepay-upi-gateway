import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  confirmPayment,
  createPaymentOrder,
  getPaymentStatus,
  listTransactions,
} from "./payments.server";

export const createQrOrderFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ amount: z.number().positive().max(10_000_000) }).parse(input),
  )
  .handler(async ({ data }) => createPaymentOrder(data.amount));

export const getPaymentStatusFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ tn: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => getPaymentStatus(data.tn));

export const listTransactionsFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
      })
      .parse(input),
  )
  .handler(async ({ data }) => listTransactions(data.page, data.limit));

/** Dev/test helper carried over from the original app: marks a pending order as paid. */
export const simulatePaymentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ tn: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const result = await confirmPayment(data.tn);
    return result
      ? { success: true as const, message: "Simulated payment successful" }
      : { success: false as const, message: "Pending transaction not found" };
  });

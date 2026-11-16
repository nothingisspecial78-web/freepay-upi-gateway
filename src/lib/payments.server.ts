// Server-only payment operations backed by Lovable Cloud. Never import from client code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_USER_REF,
  effectiveStatus,
  makeTransactionNote,
  orderExpiry,
  resolveAmount,
  resolvePagination,
  type TransactionStatus,
} from "./payment-rules";

export type PaymentOrder = {
  success: true;
  tn: string;
  amount: number;
  upiVpa: string;
  upiName: string;
  expiresAt: string;
};

export type PaymentStatusResult =
  | {
      success: true;
      tn: string;
      amount: number;
      status: TransactionStatus;
      expiresAt: string;
      completedAt: string | null;
    }
  | { success: false; message: string };

export type TransactionRow = {
  id: string;
  tn: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  completedAt: string | null;
};

export type TransactionPage = {
  success: true;
  data: TransactionRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function publicClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("Missing Supabase configuration: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
  }
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function createPaymentOrder(rawAmount: unknown): Promise<PaymentOrder> {
  const amount = resolveAmount(rawAmount);
  // Personal (non-merchant) UPI ID that receives the money.
  const upiVpa = process.env["UPI_ID"] || "yourname@upi";
  const upiName = process.env["UPI_NAME"] || "FreePay";
  const now = Date.now();
  const tn = makeTransactionNote(DEFAULT_USER_REF, now, crypto.randomUUID().replace(/-/g, ""));
  const expiresAt = orderExpiry(now).toISOString();

  const db = await adminClient();
  const { data, error } = await db
    .from("transactions")
    .insert({
      user_ref: DEFAULT_USER_REF,
      amount,
      tn,
      upi_vpa: upiVpa,
      upi_name: upiName,
      expires_at: expiresAt,
    })
    .select("tn, amount, upi_vpa, upi_name, expires_at")
    .single();
  if (error || !data) {
    console.error("Error creating QR order:", error);
    throw new Error("Failed to initialize payment");
  }
  return {
    success: true,
    tn: data.tn,
    amount: Number(data.amount),
    upiVpa: data.upi_vpa,
    upiName: data.upi_name,
    expiresAt: data.expires_at,
  };
}

export async function getPaymentStatus(tn: string): Promise<PaymentStatusResult> {
  const { data, error } = await publicClient()
    .from("transactions")
    .select("tn, amount, status, expires_at, completed_at")
    .eq("tn", tn)
    .maybeSingle();
  if (error) {
    console.error("Error fetching transaction status:", error);
    throw new Error("Failed to fetch transaction status");
  }
  if (!data) return { success: false, message: "Transaction not found" };
  return {
    success: true,
    tn: data.tn,
    amount: Number(data.amount),
    status: effectiveStatus(data.status as TransactionStatus, data.expires_at),
    expiresAt: data.expires_at,
    completedAt: data.completed_at,
  };
}

export async function listTransactions(page: unknown, limit: unknown): Promise<TransactionPage> {
  const p = resolvePagination(page, limit);
  const { data, error, count } = await publicClient()
    .from("transactions")
    .select("id, tn, amount, status, expires_at, created_at, completed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(p.from, p.to);
  if (error) {
    console.error("Error listing transactions:", error);
    throw new Error("Failed to fetch transactions");
  }
  const total = count ?? 0;
  return {
    success: true,
    data: (data ?? []).map((r) => ({
      id: r.id,
      tn: r.tn,
      amount: Number(r.amount),
      status: effectiveStatus(r.status as TransactionStatus, r.expires_at),
      createdAt: r.created_at,
      completedAt: r.completed_at,
    })),
    pagination: {
      page: p.page,
      limit: p.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / p.limit)),
    },
  };
}

/**
 * Atomically marks a still-pending, unexpired order as completed.
 * Returns null when it was already processed, expired, or not found (idempotent).
 */
export async function confirmPayment(tn: string) {
  const nowIso = new Date().toISOString();
  const db = await adminClient();
  const { data, error } = await db
    .from("transactions")
    .update({ status: "completed", completed_at: nowIso, webhook_received_at: nowIso })
    .eq("tn", tn)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .select("tn, amount")
    .maybeSingle();
  if (error) {
    console.error("Error confirming payment:", error);
    throw new Error("Payment confirmation failed");
  }
  return data ? { tn: data.tn, amount: Number(data.amount) } : null;
}

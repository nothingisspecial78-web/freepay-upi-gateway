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

interface LocalTransaction {
  id: string;
  user_ref: string;
  amount: number;
  tn: string;
  upi_vpa: string;
  upi_name: string;
  status: TransactionStatus;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
  webhook_received_at: string | null;
}

// In-memory transaction store for local development and fallback resilience
const localOrders = new Map<string, LocalTransaction>();

function publicClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    return null;
  }
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        return fetch(input, {
          ...init,
          headers: h,
          signal: init?.signal ?? controller.signal,
        }).finally(() => clearTimeout(timer));
      },
    },
  });
}

function hasServiceRoleKey(): boolean {
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] && process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"]) {
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"];
  }
  return Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function createPaymentOrder(rawAmount: unknown): Promise<PaymentOrder> {
  const amount = resolveAmount(rawAmount);
  // Personal (non-merchant) UPI ID that receives the money.
  const upiVpa = process.env["UPI_ID"] || "abdullaarimbra786@oksbi";
  const upiName = process.env["UPI_NAME"] || "Abdulla Arimbra";
  const now = Date.now();
  const tn = makeTransactionNote(DEFAULT_USER_REF, now, crypto.randomUUID().replace(/-/g, ""));
  const expiresAt = orderExpiry(now).toISOString();
  const createdAt = new Date(now).toISOString();

  // If service role key is present, attempt remote database creation
  if (hasServiceRoleKey()) {
    try {
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

      if (!error && data) {
        return {
          success: true,
          tn: data.tn,
          amount: Number(data.amount),
          upiVpa: data.upi_vpa,
          upiName: data.upi_name,
          expiresAt: data.expires_at,
        };
      }
      console.warn(
        "[payments.server] Remote DB order creation failed, falling back to local memory store:",
        error?.message,
      );
    } catch (err) {
      console.warn(
        "[payments.server] Supabase admin client unavailable, using local memory store:",
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.info(
      "[payments.server] SUPABASE_SERVICE_ROLE_KEY not configured. Operating in local order mode.",
    );
  }

  // Graceful local order fallback (used in local dev or when remote DB write is unavailable)
  localOrders.set(tn, {
    id: crypto.randomUUID(),
    user_ref: DEFAULT_USER_REF,
    amount,
    tn,
    upi_vpa: upiVpa,
    upi_name: upiName,
    status: "pending",
    expires_at: expiresAt,
    created_at: createdAt,
    completed_at: null,
    webhook_received_at: null,
  });

  return {
    success: true,
    tn,
    amount,
    upiVpa,
    upiName,
    expiresAt,
  };
}

export async function getPaymentStatus(tn: string): Promise<PaymentStatusResult> {
  // Check local order store first
  const local = localOrders.get(tn);
  if (local) {
    return {
      success: true,
      tn: local.tn,
      amount: local.amount,
      status: effectiveStatus(local.status, local.expires_at),
      expiresAt: local.expires_at,
      completedAt: local.completed_at,
    };
  }

  // Check remote Supabase database
  try {
    const client = publicClient();
    if (client) {
      const { data, error } = await client
        .from("transactions")
        .select("tn, amount, status, expires_at, completed_at")
        .eq("tn", tn)
        .maybeSingle();

      if (error) {
        console.error("Error fetching transaction status from Supabase:", error);
      } else if (data) {
        return {
          success: true,
          tn: data.tn,
          amount: Number(data.amount),
          status: effectiveStatus(data.status as TransactionStatus, data.expires_at),
          expiresAt: data.expires_at,
          completedAt: data.completed_at,
        };
      }
    }
  } catch (err) {
    console.warn("[payments.server] Failed to query Supabase for status:", err);
  }

  return { success: false, message: "Transaction not found" };
}

export async function listTransactions(page: unknown, limit: unknown): Promise<TransactionPage> {
  const p = resolvePagination(page, limit);
  let remoteRows: TransactionRow[] = [];
  let remoteTotal = 0;

  try {
    const client = publicClient();
    if (client) {
      const { data, error, count } = await client
        .from("transactions")
        .select("id, tn, amount, status, expires_at, created_at, completed_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(p.from, p.to);

      if (!error && data) {
        remoteRows = data.map((r) => ({
          id: r.id,
          tn: r.tn,
          amount: Number(r.amount),
          status: effectiveStatus(r.status as TransactionStatus, r.expires_at),
          createdAt: r.created_at,
          completedAt: r.completed_at,
        }));
        remoteTotal = count ?? remoteRows.length;
      }
    }
  } catch (err) {
    console.warn("[payments.server] Remote listTransactions query failed:", err);
  }

  // Merge local transactions
  const localList: TransactionRow[] = Array.from(localOrders.values()).map((r) => ({
    id: r.id,
    tn: r.tn,
    amount: r.amount,
    status: effectiveStatus(r.status, r.expires_at),
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));

  const seen = new Set(remoteRows.map((r) => r.tn));
  const combined = [...remoteRows];
  for (const item of localList) {
    if (!seen.has(item.tn)) {
      combined.push(item);
    }
  }

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = Math.max(remoteTotal, combined.length);
  const pagedData = combined.slice(p.from, p.to + 1);

  return {
    success: true,
    data: pagedData,
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
  const now = new Date();
  const nowIso = now.toISOString();

  // If order is in local storage, update it
  const local = localOrders.get(tn);
  if (local) {
    const isUnexpired = new Date(local.expires_at).getTime() > now.getTime();
    if (local.status === "pending" && isUnexpired) {
      local.status = "completed";
      local.completed_at = nowIso;
      local.webhook_received_at = nowIso;
      return { tn: local.tn, amount: local.amount };
    }
    return null;
  }

  // Attempt database update via adminClient if service role key is present
  if (hasServiceRoleKey()) {
    try {
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
        console.error("Error confirming payment in DB:", error);
      } else if (data) {
        return { tn: data.tn, amount: Number(data.amount) };
      }
    } catch (err) {
      console.error("Error executing adminClient in confirmPayment:", err);
    }
  }

  return null;
}

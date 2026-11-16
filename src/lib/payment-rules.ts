// Pure, isomorphic payment rules shared by the UI, server functions and public API routes.

export const DEFAULT_AMOUNT = 200;
export const MIN_AMOUNT = 1;
export const ORDER_TTL_MS = 10 * 60 * 1000; // QR orders expire after 10 minutes
export const POLL_INTERVAL_MS = 3000;
export const DEFAULT_USER_REF = "60d0fe4f5311236168a109ca";
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type TransactionStatus = "pending" | "completed" | "failed" | "expired";

export class InvalidAmountError extends Error {
  constructor() {
    super("Invalid amount");
  }
}

/** Mirrors the original server: missing/zero/non-numeric amounts fall back to ₹200; below ₹1 is rejected. */
export function resolveAmount(input: unknown): number {
  const amount = Number(input) || DEFAULT_AMOUNT;
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) throw new InvalidAmountError();
  return Math.round(amount * 100) / 100;
}

export function makeTransactionNote(userRef: string, nowMs: number, random8: string): string {
  return `FP_${userRef}_${nowMs}_${random8.slice(0, 8)}`;
}

export function orderExpiry(nowMs: number): Date {
  return new Date(nowMs + ORDER_TTL_MS);
}

/** A pending order past its expiry is reported as expired. */
export function effectiveStatus(
  status: TransactionStatus,
  expiresAt: string | Date,
  now: Date = new Date(),
): TransactionStatus {
  if (status === "pending" && now.getTime() > new Date(expiresAt).getTime()) return "expired";
  return status;
}

/** Webhook payloads carry `tn` directly, or only a free-text `note` containing it. */
export function extractTransactionNote(tn: unknown, note: unknown): string | null {
  if (typeof tn === "string" && tn.trim()) return tn.trim();
  if (typeof note === "string") {
    const match = note.match(/FP_[a-zA-Z0-9_-]+/);
    if (match) return match[0];
  }
  return null;
}

/**
 * Pay-to-person UPI link for a personal (non-merchant) UPI ID.
 * Only personal-safe params: merchant-only params (tr, mc) make UPI apps reject personal payees.
 */
export function buildUpiUrl(p: { upiVpa: string; upiName: string; amount: number; tn: string }) {
  return (
    `upi://pay?pa=${encodeURIComponent(p.upiVpa)}&pn=${encodeURIComponent(p.upiName)}` +
    `&am=${p.amount}&cu=INR&tn=${encodeURIComponent(p.tn)}`
  );
}

export function resolvePagination(page: unknown, limit: unknown) {
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  const l = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(limit)) || DEFAULT_PAGE_SIZE));
  return { page: p, limit: l, from: (p - 1) * l, to: p * l - 1 };
}

/** Constant-time string comparison for shared secrets. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

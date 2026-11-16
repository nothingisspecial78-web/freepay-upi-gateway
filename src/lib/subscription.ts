// Client-side and isomorphic subscription state management for FreePay.

export interface UserSubscription {
  planId?: string;
  planName: string;
  amount: number;
  transactionRef: string;
  subscribedAt: string;
  expiresAt: string;
  upiId: string;
  status: "active" | "expired";
}

const STORAGE_KEY = "freepay_active_subscription";

export function getSubscription(): UserSubscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const sub: UserSubscription = JSON.parse(raw);
    if (!sub || typeof sub !== "object") return null;

    // Check if subscription has expired
    if (new Date(sub.expiresAt).getTime() < Date.now()) {
      return { ...sub, status: "expired" };
    }
    return { ...sub, status: "active" };
  } catch {
    return null;
  }
}

export function saveSubscription(
  sub: Omit<UserSubscription, "status" | "subscribedAt" | "expiresAt"> & {
    subscribedAt?: string;
    expiresAt?: string;
  },
): UserSubscription {
  const now = Date.now();
  const subscribedAt = sub.subscribedAt || new Date(now).toISOString();
  // 30 days default subscription validity
  const expiresAt = sub.expiresAt || new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

  const record: UserSubscription = {
    ...sub,
    subscribedAt,
    expiresAt,
    status: "active",
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent("freepay_subscription_changed", { detail: record }));
    } catch (e) {
      console.warn("Failed to store subscription in localStorage:", e);
    }
  }

  return record;
}

export function clearSubscription(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("freepay_subscription_changed", { detail: null }));
    } catch (e) {
      console.warn("Failed to clear subscription:", e);
    }
  }
}

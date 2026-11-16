import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createQrOrderFn, getPaymentStatusFn } from "@/lib/payments.functions";
import { ORDER_TTL_MS, POLL_INTERVAL_MS } from "@/lib/payment-rules";

export interface PaymentData {
  tn: string;
  amount: number;
  upiVpa: string;
  upiName: string;
  expiresAt: string;
}

export type PaymentStatus =
  "idle" | "loading" | "pending" | "completed" | "failed" | "expired" | "timeout";

export function usePayment(amount: number) {
  const createOrder = useServerFn(createQrOrderFn);
  const fetchStatus = useServerFn(getPaymentStatusFn);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(ORDER_TTL_MS / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const initPayment = useCallback(async () => {
    clearAllTimers();
    setStatus("loading");
    setError(null);
    try {
      const data = await createOrder({ data: { amount } });
      setPaymentData(data);
      setStatus("pending");
      setTimeLeft(ORDER_TTL_MS / 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
      setStatus("failed");
    }
  }, [amount, clearAllTimers, createOrder]);

  useEffect(() => {
    if (status !== "pending" || !paymentData) return;

    countdownRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);

    timeoutRef.current = setTimeout(() => {
      clearAllTimers();
      setStatus("timeout");
    }, ORDER_TTL_MS);

    intervalRef.current = setInterval(async () => {
      try {
        const data = await fetchStatus({ data: { tn: paymentData.tn } });
        if (!data.success) return;
        if (data.status === "completed") {
          clearAllTimers();
          setStatus("completed");
        } else if (data.status === "failed" || data.status === "expired") {
          clearAllTimers();
          setStatus(data.status);
        }
      } catch {
        // keep polling silently
      }
    }, POLL_INTERVAL_MS);

    return clearAllTimers;
  }, [status, paymentData, clearAllTimers, fetchStatus]);

  const reset = useCallback(() => {
    clearAllTimers();
    setPaymentData(null);
    setStatus("idle");
    setError(null);
    setTimeLeft(ORDER_TTL_MS / 1000);
  }, [clearAllTimers]);

  return { paymentData, status, error, timeLeft, initPayment, reset };
}

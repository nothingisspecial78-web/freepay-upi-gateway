import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Shield,
  Smartphone,
  Sparkles,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { usePayment } from "@/hooks/use-payment";
import { simulatePaymentFn } from "@/lib/payments.functions";
import { buildUpiUrl, ORDER_TTL_MS } from "@/lib/payment-rules";
import { saveSubscription } from "@/lib/subscription";

interface PaymentModalProps {
  amount: number;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_TIMEOUT_SECONDS = ORDER_TTL_MS / 1000;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const STEPS = [
  { icon: Smartphone, text: "Open GPay, PhonePe, Paytm, or any UPI app" },
  { icon: Shield, text: "Scan the QR code or use UPI ID above" },
  { icon: CheckCircle, text: "Do NOT modify the transaction note/reference" },
];

export function PaymentModal({ amount, productName, onClose, onSuccess }: PaymentModalProps) {
  const { paymentData, status, error, timeLeft, initPayment, reset } = usePayment(amount);
  const simulate = useServerFn(simulatePaymentFn);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);

  const started = useRef(false);
  useEffect(() => {
    // Create exactly one order per modal open (guards against double-run effects in dev).
    if (started.current) return;
    started.current = true;
    void initPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "completed" && paymentData) {
      saveSubscription({
        planName: productName,
        amount: paymentData.amount,
        transactionRef: paymentData.tn,
        upiId: paymentData.upiVpa,
      });
      const timer = setTimeout(onSuccess, 3500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, paymentData, productName, onSuccess]);

  const handleSimulatePayment = async () => {
    if (!paymentData || isSimulating) return;
    setIsSimulating(true);
    try {
      await simulate({ data: { tn: paymentData.tn } });
    } catch (err) {
      console.error("Error simulating payment:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const upiUrl = paymentData ? buildUpiUrl(paymentData) : "";
  const progressPct = ((MAX_TIMEOUT_SECONDS - timeLeft) / MAX_TIMEOUT_SECONDS) * 100;
  const urgent = timeLeft < 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={status === "pending" ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="UPI payment"
        className="relative w-full max-w-md surface-card overflow-hidden animate-slide-up max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-sm">FreePay</h2>
              <p className="text-muted-foreground text-xs">Secure UPI Payment</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {(status === "loading" || status === "idle") && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent spinner" />
              <p className="text-muted-foreground text-sm">Generating secure payment QR...</p>
            </div>
          )}

          {status === "failed" && error && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle size={32} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-foreground font-bold mb-1">Payment Failed</h3>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void initPayment()}
                className="btn-primary text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "pending" && paymentData && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-full bg-secondary/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Paying for
                  </p>
                  <p className="text-foreground font-semibold">{productName}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Amount</p>
                  <p className="text-2xl font-bold text-primary-soft">₹{paymentData.amount}</p>
                </div>
              </div>

              <div className="bg-qr-surface p-4 rounded-2xl qr-glow">
                <QRCodeSVG value={upiUrl} size={200} level="M" marginSize={0} />
              </div>

              <div className="w-full">
                <a
                  href={upiUrl}
                  className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} />
                  Open UPI App (GPay / PhonePe / Paytm)
                </a>
              </div>

              <div className="text-center w-full">
                <p className="text-muted-foreground text-xs mb-1">Or pay directly to UPI ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-foreground font-mono font-semibold text-sm bg-secondary/60 px-3 py-1.5 rounded-lg select-all">
                    {paymentData.upiVpa}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(paymentData.upiVpa);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-secondary hover:bg-secondary-hover text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy UPI ID"
                    aria-label="Copy UPI ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {copied && <p className="text-success text-xs mt-1">UPI ID copied!</p>}
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Clock size={12} />
                    <span>Expires in</span>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${urgent ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${100 - progressPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Waiting for payment confirmation...
              </div>

              <div className="w-full bg-secondary/30 rounded-xl p-4 space-y-2">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  How to pay
                </p>
                {STEPS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={11} className="text-primary-soft" />
                    </div>
                    <p className="text-muted-foreground text-xs">{text}</p>
                  </div>
                ))}
              </div>

              <div className="w-full pt-1">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="w-full py-2.5 px-3 rounded-xl bg-success/15 hover:bg-success/30 border border-success/40 text-success hover:text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {isSimulating
                    ? "Simulating UPI Payment..."
                    : "Simulate UPI Payment Success (Dev Test)"}
                </button>
              </div>

              <p className="text-faint-foreground text-xs font-mono break-all text-center">
                Ref: {paymentData.tn}
              </p>
            </div>
          )}

          {status === "completed" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center animate-bounce-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-success/20 border-2 border-success/40 flex items-center justify-center text-success shadow-lg">
                  <CheckCircle size={36} className="animate-scale-in" />
                </div>
                <div className="absolute inset-0 rounded-full bg-success/15 animate-ping" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 text-success text-xs font-bold border border-success/30 mb-2">
                  <Sparkles size={12} />
                  <span>Subscribed Successfully</span>
                </div>
                <h3 className="text-foreground font-black text-2xl mb-1">Payment Successful!</h3>
                <p className="text-muted-foreground text-sm">
                  ₹{paymentData?.amount} received via UPI ({paymentData?.upiVpa})
                </p>
              </div>

              {/* Subscription details card */}
              <div className="w-full bg-gradient-to-br from-success/15 via-secondary/40 to-primary/10 border border-success/30 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-muted-foreground text-xs uppercase font-semibold">
                    Website Subscription
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Active Plan
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-bold text-base">{productName}</p>
                    <p className="text-muted-foreground text-xs">Full access to FreePay platform</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">₹{paymentData?.amount}</p>
                    <p className="text-xs text-success font-semibold">Paid</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Transaction Ref:</span>
                  <span className="font-mono text-foreground font-semibold select-all text-[11px]">
                    {paymentData?.tn}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2 pt-1">
                <button
                  type="button"
                  onClick={onSuccess}
                  className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 font-bold"
                >
                  <CheckCircle size={15} />
                  Continue to Subscribed Website
                </button>
                <p className="text-subtle-foreground text-xs">
                  Your subscription is now active for this website.
                </p>
              </div>
            </div>
          )}

          {(status === "timeout" || status === "expired") && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock size={32} className="text-warning" />
              </div>
              <div>
                <h3 className="text-foreground font-bold mb-1">Payment Timed Out</h3>
                <p className="text-muted-foreground text-sm">
                  The QR code has expired. Please try again.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    void initPayment();
                  }}
                  className="btn-primary text-sm"
                >
                  Try Again
                </button>
                <button type="button" onClick={onClose} className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border bg-muted/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-subtle-foreground text-xs">
            <Shield size={11} />
            <span>256-bit encrypted • Zero gateway fees</span>
          </div>
          <span className="text-faint-foreground text-xs">FreePay v1.0</span>
        </div>
      </div>
    </div>
  );
}

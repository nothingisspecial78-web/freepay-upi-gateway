import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Clock, Shield, Sparkles, TrendingUp, Zap } from "lucide-react";
import { PaymentModal } from "@/components/freepay/PaymentModal";
import { ProductCard } from "@/components/freepay/ProductCard";
import { PRODUCTS, type Product } from "@/lib/plans";
import { useSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreePay – Zero-Fee UPI Payment Gateway" },
      {
        name: "description",
        content:
          "FreePay: Real-time UPI payments with zero gateway fees. Instant settlements directly to your bank account.",
      },
      { property: "og:title", content: "FreePay – Zero-Fee UPI Payment Gateway" },
      {
        property: "og:description",
        content:
          "Pay directly with UPI. Zero fees, instant settlement straight to your bank account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Store,
});

const STATS = [
  { icon: Shield, label: "0% Gateway Fees", sub: "vs 2–3% on Razorpay/Stripe" },
  { icon: Clock, label: "Instant Settlement", sub: "Real-time to your bank" },
  { icon: TrendingUp, label: "Race-Condition Safe", sub: "Atomic database updates" },
];

function Store() {
  const [payingProduct, setPayingProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isSubscribed, subscription } = useSubscription();

  const handleSuccess = useCallback(() => {
    setPayingProduct(null);
    setShowSuccess(true);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 7000);
    return () => clearTimeout(t);
  }, [showSuccess]);

  return (
    <>
      {showSuccess && (
        <div
          className="fixed top-20 right-4 z-50 animate-slide-up max-w-md w-full px-4"
          role="status"
        >
          <div className="bg-success text-success-foreground p-4 rounded-2xl shadow-2xl flex items-start gap-3 border border-success-foreground/20">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Payment Successful!</p>
              <p className="text-xs text-success-foreground/90 mt-0.5">
                You are now subscribed to this web ({subscription?.planName || "Active Plan"}).
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary-soft text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
            <Zap size={13} />
            Zero-Fee UPI Payment Gateway
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
            Pay directly with UPI.
            <br />
            <span className="text-gradient-brand">Zero fees. Instant settlement.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            FreePay bypasses traditional payment gateways entirely. Payments flow from your customer
            straight to your bank account via UPI.
          </p>
        </div>

        {/* Active Subscription Banner */}
        {isSubscribed && subscription && (
          <div className="mb-10 surface-card p-6 border-success/40 bg-gradient-to-r from-success/15 via-background to-success/10 rounded-2xl animate-slide-up shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 border border-success/40 flex items-center justify-center text-success shrink-0">
                  <CheckCircle size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/20 text-success text-xs font-bold border border-success/30">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      Active Website Subscription
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Ref: {subscription.transactionRef}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    You are Subscribed to {subscription.planName}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Your subscription is active with zero gateway fees, instant UPI settlements, and
                    full platform access.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  to="/dashboard"
                  search={{ page: 1 }}
                  className="btn-primary text-xs py-2.5 px-4 whitespace-nowrap w-full sm:w-auto text-center"
                >
                  View Transactions
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-12">
          {STATS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="surface-card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-primary-soft" />
              </div>
              <p className="text-foreground font-bold text-sm">{label}</p>
              <p className="text-subtle-foreground text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-foreground font-bold text-xl mb-1">Choose a Plan</h2>
          <p className="text-muted-foreground text-sm">
            Select a plan and pay instantly via UPI scan
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onBuy={setPayingProduct}
              isCurrentPlan={isSubscribed && subscription?.planName === p.name}
            />
          ))}
        </div>
      </main>

      {payingProduct && (
        <PaymentModal
          amount={payingProduct.price}
          productName={payingProduct.name}
          onClose={() => setPayingProduct(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

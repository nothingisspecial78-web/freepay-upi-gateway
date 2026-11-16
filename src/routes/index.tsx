import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Shield, TrendingUp, Zap } from "lucide-react";
import { PaymentModal } from "@/components/freepay/PaymentModal";
import { ProductCard } from "@/components/freepay/ProductCard";
import { PRODUCTS, type Product } from "@/lib/plans";

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

  const handleSuccess = useCallback(() => {
    setPayingProduct(null);
    setShowSuccess(true);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(t);
  }, [showSuccess]);

  return (
    <>
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up" role="status">
          <div className="bg-success text-success-foreground px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-semibold">
            <span className="text-lg">✓</span>
            Payment confirmed! Your order is placed.
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-14 animate-fade-in">
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
            <ProductCard key={p.id} product={p} onBuy={setPayingProduct} />
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

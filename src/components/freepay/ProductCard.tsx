import { CheckCircle, ShoppingCart, Star, Zap } from "lucide-react";
import type { Product } from "@/lib/plans";

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
  isCurrentPlan?: boolean;
}

export function ProductCard({ product, onBuy, isCurrentPlan }: ProductCardProps) {
  return (
    <div
      className={`surface-card p-5 flex flex-col gap-4 transition-all duration-300 group ${
        isCurrentPlan
          ? "border-success/60 ring-2 ring-success/30 shadow-brand-glow bg-success/5"
          : "hover:border-primary/40 hover:shadow-brand-glow"
      }`}
    >
      <div className="w-full h-36 bg-gradient-product rounded-xl flex items-center justify-center relative overflow-hidden">
        <Zap
          size={48}
          className={`${
            isCurrentPlan ? "text-success" : "text-primary/40 group-hover:text-primary/60"
          } transition-colors`}
        />
        {isCurrentPlan ? (
          <span className="absolute top-2 right-2 bg-success text-success-foreground text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
            <CheckCircle size={11} />
            Active Plan
          </span>
        ) : (
          product.badge && (
            <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {product.badge}
            </span>
          )
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-bold">{product.name}</h3>
          {isCurrentPlan && (
            <span className="text-[11px] font-semibold text-success bg-success/15 px-2 py-0.5 rounded-full">
              Subscribed
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
        {product.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star size={12} className="text-rating fill-rating" />
            <span className="text-muted-foreground text-xs">{product.rating.toFixed(1)} / 5.0</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <div>
          <p className="text-subtle-foreground text-xs uppercase tracking-wide">Price</p>
          <p className="text-2xl font-bold text-foreground">₹{product.price}</p>
        </div>
        {isCurrentPlan ? (
          <button
            type="button"
            disabled
            className="btn-secondary text-sm border-success/40 text-success bg-success/15 font-semibold cursor-default flex items-center gap-1.5"
          >
            <CheckCircle size={15} />
            Subscribed
          </button>
        ) : (
          <button type="button" onClick={() => onBuy(product)} className="btn-primary text-sm">
            <ShoppingCart size={15} />
            Pay Now
          </button>
        )}
      </div>
    </div>
  );
}

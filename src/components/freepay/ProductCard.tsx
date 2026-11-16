import { ShoppingCart, Star, Zap } from "lucide-react";
import type { Product } from "@/lib/plans";

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  return (
    <div className="surface-card p-5 flex flex-col gap-4 hover:border-primary/40 transition-all duration-300 hover:shadow-brand-glow group">
      <div className="w-full h-36 bg-gradient-product rounded-xl flex items-center justify-center relative overflow-hidden">
        <Zap size={48} className="text-primary/40 group-hover:text-primary/60 transition-colors" />
        {product.badge && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {product.badge}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-foreground font-bold">{product.name}</h3>
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
        <button type="button" onClick={() => onBuy(product)} className="btn-primary text-sm">
          <ShoppingCart size={15} />
          Pay Now
        </button>
      </div>
    </div>
  );
}

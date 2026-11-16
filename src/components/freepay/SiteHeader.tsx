import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Menu, X, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

const NAV = [
  { to: "/", label: "Store" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

const base = "px-4 py-2 rounded-lg text-sm font-medium transition-colors";
const active = "bg-primary/20 text-primary-soft border border-primary/30";
const inactive =
  "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isSubscribed, subscription } = useSubscription();

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={16} className="text-primary-foreground" />
          </div>
          <span className="text-foreground font-bold text-lg">FreePay</span>
          <span className="hidden sm:block text-subtle-foreground text-xs bg-muted px-2 py-0.5 rounded-full border border-secondary">
            v1.0 • Zero Gateway Fees
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className={base}
                activeProps={{ className: active }}
                inactiveProps={{ className: inactive }}
              >
                {n.label}
              </Link>
            ))}
          </div>

          {isSubscribed && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold shadow-sm animate-fade-in">
              <CheckCircle size={12} className="text-success" />
              <span>Subscribed: {subscription?.planName}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X size={16} className="text-foreground" />
          ) : (
            <Menu size={16} className="text-foreground" />
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-2">
          {isSubscribed && (
            <div className="px-4 py-2.5 rounded-lg bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={13} />
                <span>Subscribed Plan</span>
              </div>
              <span className="font-bold">{subscription?.planName}</span>
            </div>
          )}

          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors"
              activeProps={{ className: "bg-primary/20 text-primary-soft" }}
              inactiveProps={{ className: "text-muted-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

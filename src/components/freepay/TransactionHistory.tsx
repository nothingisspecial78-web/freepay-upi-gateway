import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Clock, RefreshCw, TrendingUp, XCircle } from "lucide-react";
import { transactionsQueryOptions } from "@/lib/transactions.queries";

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Completed" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Failed" },
  expired: {
    icon: XCircle,
    color: "text-muted-foreground",
    bg: "bg-secondary/40",
    label: "Expired",
  },
} as const;

export function TransactionHistory({ page }: { page: number }) {
  const { data, refetch, isFetching } = useSuspenseQuery(transactionsQueryOptions(page));
  const transactions = data.data;
  const { total, totalPages } = data.pagination;
  const completedTotal = transactions
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-foreground font-bold text-lg">Transaction History</h2>
          <p className="text-muted-foreground text-sm">{total} total transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-lg text-sm font-semibold">
            <TrendingUp size={14} />₹{completedTotal.toLocaleString("en-IN")} received on this page
          </div>
          <button
            type="button"
            aria-label="Refresh"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary-hover flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={`text-muted-foreground ${isFetching ? "spinner" : ""}`}
            />
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={40} className="text-faint-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No transactions yet</p>
          <p className="text-faint-foreground text-sm">Start accepting payments to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const cfg =
              statusConfig[tx.status as keyof typeof statusConfig] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 p-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 shrink-0 rounded-lg ${cfg.bg} flex items-center justify-center`}
                  >
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-semibold font-mono truncate">
                      {tx.tn.slice(0, 24)}...
                    </p>
                    <p className="text-subtle-foreground text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`font-bold text-sm ${tx.status === "completed" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {tx.status === "completed" ? "+" : ""}₹{tx.amount}
                  </p>
                  <span className={`status-badge ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link
            to="/dashboard"
            search={{ page: Math.max(1, page - 1) }}
            disabled={page === 1}
            className={`btn-secondary text-xs py-2 px-4 ${page === 1 ? "opacity-40 pointer-events-none" : ""}`}
          >
            Previous
          </Link>
          <span className="text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          <Link
            to="/dashboard"
            search={{ page: Math.min(totalPages, page + 1) }}
            disabled={page === totalPages}
            className={`btn-secondary text-xs py-2 px-4 ${page === totalPages ? "opacity-40 pointer-events-none" : ""}`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}

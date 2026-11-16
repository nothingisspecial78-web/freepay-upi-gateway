import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TransactionHistory } from "@/components/freepay/TransactionHistory";
import { transactionsQueryOptions } from "@/lib/transactions.queries";

const searchSchema = z.object({ page: z.coerce.number().int().min(1).catch(1).default(1) });

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(transactionsQueryOptions(deps.page)),
  head: () => ({
    meta: [
      { title: "Payment Dashboard – FreePay" },
      {
        name: "description",
        content: "Monitor every FreePay UPI transaction and the total received in real time.",
      },
      { property: "og:title", content: "Payment Dashboard – FreePay" },
      {
        property: "og:description",
        content: "Monitor every FreePay UPI transaction and the total received in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent spinner" />
    </div>
  ),
  errorComponent: () => (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="surface-card p-6 text-center text-muted-foreground">
        Couldn't load transactions. Please refresh.
      </div>
    </main>
  ),
  component: Dashboard,
});

function Dashboard() {
  const { page } = Route.useSearch();
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-foreground font-black text-2xl">Payment Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor all transactions in real-time</p>
      </div>
      <TransactionHistory page={page} />
    </main>
  );
}

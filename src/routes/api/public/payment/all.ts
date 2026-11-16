import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payment/all")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { listTransactions } = await import("@/lib/payments.server");
        const url = new URL(request.url);
        try {
          return Response.json(
            await listTransactions(url.searchParams.get("page"), url.searchParams.get("limit")),
          );
        } catch {
          return Response.json(
            { success: false, message: "Failed to fetch transactions" },
            { status: 500 },
          );
        }
      },
    },
  },
});

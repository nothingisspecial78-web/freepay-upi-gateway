import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payment/status/$tn")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getPaymentStatus } = await import("@/lib/payments.server");
        try {
          const result = await getPaymentStatus(params.tn);
          return Response.json(result, { status: result.success ? 200 : 404 });
        } catch {
          return Response.json(
            { success: false, message: "Failed to fetch transaction status" },
            { status: 500 },
          );
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payment/simulate/$tn")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { confirmPayment } = await import("@/lib/payments.server");
        try {
          const result = await confirmPayment(params.tn);
          if (!result) {
            return Response.json(
              { success: false, message: "Pending transaction not found" },
              { status: 404 },
            );
          }
          return Response.json({
            success: true,
            message: "Simulated payment successful",
            transaction: result,
          });
        } catch {
          return Response.json(
            { success: false, message: "Failed to simulate payment" },
            { status: 500 },
          );
        }
      },
    },
  },
});

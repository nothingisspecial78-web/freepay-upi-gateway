import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payment/create-qr")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createPaymentOrder } = await import("@/lib/payments.server");
        const { InvalidAmountError } = await import("@/lib/payment-rules");
        let amount: unknown;
        try {
          amount = ((await request.json()) as { amount?: unknown })?.amount;
        } catch {
          amount = undefined;
        }
        try {
          return Response.json(await createPaymentOrder(amount));
        } catch (e) {
          if (e instanceof InvalidAmountError) {
            return Response.json({ success: false, message: "Invalid amount" }, { status: 400 });
          }
          return Response.json(
            { success: false, message: "Failed to initialize payment" },
            { status: 500 },
          );
        }
      },
    },
  },
});

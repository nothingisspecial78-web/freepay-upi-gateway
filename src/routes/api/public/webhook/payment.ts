import { createFileRoute } from "@tanstack/react-router";

// Secret sent in the x-webhook-secret header.
export const Route = createFileRoute("/api/public/webhook/payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePaymentWebhook } = await import("@/lib/payment-webhook.server");
        return handlePaymentWebhook(request, request.headers.get("x-webhook-secret"));
      },
    },
  },
});

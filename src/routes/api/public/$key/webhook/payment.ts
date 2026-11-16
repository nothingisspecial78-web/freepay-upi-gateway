import { createFileRoute } from "@tanstack/react-router";

// Secret embedded in the path so an unmodified listener can use
// BACKEND_URL = https://<site>/api/public/<WEBHOOK_SECRET> (it appends /webhook/payment).
export const Route = createFileRoute("/api/public/$key/webhook/payment")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { handlePaymentWebhook } = await import("@/lib/payment-webhook.server");
        return handlePaymentWebhook(request, params.key);
      },
    },
  },
});

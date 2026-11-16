// Handles payment confirmations from the Android UPI notification listener.
import { extractTransactionNote, safeEqual } from "./payment-rules";
import { confirmPayment } from "./payments.server";

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function handlePaymentWebhook(request: Request, providedSecret: string | null) {
  const expected = process.env["WEBHOOK_SECRET"];
  if (!expected) return json({ success: false, message: "Webhook secret not configured" }, 503);
  if (!providedSecret || !safeEqual(providedSecret, expected)) {
    return json({ success: false, message: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.length > 20_000) return json({ success: false, message: "Payload too large" }, 413);
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return json({ success: false, message: "Invalid JSON" }, 400);
  }

  const freeText = body["note"] ?? body["text"] ?? body["message"] ?? body["notification"];
  const tn = extractTransactionNote(body["tn"], freeText);
  if (!tn || tn.length > 200)
    return json({ success: false, message: "No transaction ID found" }, 400);

  try {
    const result = await confirmPayment(tn);
    if (!result) return json({ success: true, message: "Already processed or not found" });
    console.log(`Payment confirmed: tn=${tn}, amount=₹${result.amount}`);
    return json({ success: true, message: "Payment confirmed", tn });
  } catch {
    return json({ success: false, message: "Webhook processing failed" }, 500);
  }
}

<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

## Project rules

- Payment rules (amount defaults/limits, 10-minute order expiry, UPI link format, transaction-note parsing) live only in `src/lib/payment-rules.ts` and are covered by `src/lib/payment-rules.test.ts`; why: UI, server functions and public API routes must agree.
- All database access for payments goes through `src/lib/payments.server.ts`: reads use a publishable client against the public SELECT policy, writes (create order, confirm payment) use the admin client; why: `transactions` has no client write policies so status can only change server-side.
- Expired status is derived at read time from `expires_at` (no cron); why: replaces the original Mongo TTL index without recurring jobs.
- The UPI listener webhook lives at `/api/public/webhook/payment` (secret in `x-webhook-secret`) and `/api/public/$key/webhook/payment` (secret in path, for listeners that only take a base URL); both require `WEBHOOK_SECRET` and only complete pending, unexpired orders; why: payment confirmation must not be forgeable.
- Payments go to a personal UPI ID (`UPI_ID`, `UPI_NAME` secrets); `buildUpiUrl` emits only pay-to-person params; why: merchant-only params make UPI apps reject personal payees.
- `/api/public/payment/*` mirrors the original Express REST API for external callers; the app itself uses server functions in `src/lib/payments.functions.ts`.

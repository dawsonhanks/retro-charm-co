# Square payment webhook

`api/square-webhook.js` is the only source of truth for "a purchase actually
happened." It receives Square's `payment.created` / `payment.updated`
notifications, verifies them, fulfills the order (email + inventory), and —
only for payments that pass every check below — fires the `purchase_completed`
analytics event defined in [`docs/analytics.md`](./analytics.md).

This document covers configuration, storage, and operational verification.
For what the code does and why, the comments in
[`api/square-webhook.js`](../api/square-webhook.js) and
[`api/_lib/webhookStore.js`](../api/_lib/webhookStore.js) are the primary
reference — this file is the runbook.

## Square Developer Console subscription settings

Developer Dashboard → your application → **Webhooks** → **Subscriptions**:

1. **Notification URL** (must match `SQUARE_WEBHOOK_NOTIFICATION_URL` exactly,
   including scheme and no trailing slash):
   ```
   https://www.theretrocharmco.com/api/square-webhook
   ```
2. **API version**: match the version this codebase calls elsewhere
   (`2024-07-17` — see `Square-Version` header in `api/square-webhook.js` and
   `api/create-checkout.js`).
3. **Event types** — subscribe to exactly:
   - `payment.created`
   - `payment.updated`

   Do not subscribe to unrelated event types (refunds, disputes, orders,
   catalog, etc.) for this endpoint. `EXPECTED_PAYMENT_EVENT_TYPES` in
   `api/square-webhook.js` ignores (200, no-op) anything else, but keeping
   the subscription itself scoped avoids noise and unnecessary retries.
4. Copy the **Signature Key** shown for this subscription into
   `SQUARE_WEBHOOK_SIGNATURE_KEY` (see below). Regenerating the key in the
   dashboard invalidates the old one immediately — update the env var in the
   same change.

## Required server-side environment variables

Set these in the Vercel project's **server** environment (Project Settings →
Environment Variables). None of them may use a `VITE_*` prefix — that prefix
is inlined into client bundles by Vite and would leak secrets to the browser.

| Variable | Purpose |
|---|---|
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | HMAC key for this subscription, from the Developer Dashboard. |
| `SQUARE_WEBHOOK_NOTIFICATION_URL` | The exact production notification URL registered above. Must match byte-for-byte — Square signs over `notificationUrl + rawBody`. |
| `SQUARE_ACCESS_TOKEN` | Used to fetch order details (recipient, metadata, line items) for the fulfillment email. Already required by `api/create-checkout.js`. |
| `NOTIFICATION_EMAIL` | Where completed-order fulfillment emails are sent. |
| `RESEND_API_KEY` | Sends the fulfillment email via Resend. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Durable storage for website-order correlation and idempotency (see below). Same Supabase project already used for inventory and email signups. |
| `FULFILLMENT_LEASE_SECONDS` *(optional)* | How long a fulfillment-email processing claim is honored before it's considered abandoned and reclaimable — see "Fulfillment email: a lease, not a claim" below. Defaults to `120` (2 minutes) if unset or invalid. |

If `SQUARE_WEBHOOK_SIGNATURE_KEY` or `SQUARE_WEBHOOK_NOTIFICATION_URL` is
missing, the handler **fails closed**: every request gets `500` and nothing
is processed, logged as `square-webhook: rejected — missing required
production configuration`. This is intentional — an unconfigured webhook
must never silently accept unverified requests.

## Durable storage setup

Production service: **Supabase Postgres** (project already used by
`api/email-signup.js` and the `orders` / `order_items` tables). Schema:
[`supabase/migrations/20260808000000_webhook_durability.sql`](../supabase/migrations/20260808000000_webhook_durability.sql),
[`supabase/migrations/20260808010000_webhook_failure_recovery.sql`](../supabase/migrations/20260808010000_webhook_failure_recovery.sql),
and
[`supabase/migrations/20260808020000_webhook_crash_safety.sql`](../supabase/migrations/20260808020000_webhook_crash_safety.sql),
applied via `supabase db push` (or already live if you're pointed at the
project this was authored against).

Four tables plus two Postgres functions, all RLS-enabled with **no public
policies** — every read/write goes through server code using
`SUPABASE_SERVICE_ROLE_KEY`, via
[`api/_lib/webhookStore.js`](../api/_lib/webhookStore.js):

| Table | Written by | Read by | Purpose |
|---|---|---|---|
| `checkout_sessions` | `api/create-checkout.js`, right after Square returns a Payment Link | `api/square-webhook.js` | **Website-order correlation.** One row per Square `order_id` that our own checkout created. A completed payment whose `order_id` is *not* in this table is a POS sale, market-booth sale, invoice, or a payment entered manually in the Square Dashboard — never a website purchase. `api/create-checkout.js` refuses to return a checkout URL to the customer unless this write is confirmed (fails closed, 503, retryable) — see "Checkout-session durability" below. |
| `webhook_events` | `api/square-webhook.js` | — (audit only) | **Delivery audit log.** One row per Square `event_id`, logged for observability ("how many times was this delivered"). **Not used to gate processing** — see "The state model" below for why. |
| `purchase_completions` | `api/square-webhook.js` | `api/square-webhook.js` | **Entire-purchase failure-recovery state.** One row per Square `payment_id`. `order_logged_at`, `inventory_updated_at`, `analytics_recorded_at`, `completed_at` are nullable timestamps; fulfillment email instead uses `fulfillment_state` (`pending`/`processing`/`sent`), `fulfillment_claimed_at`, and `fulfillment_sent_at` — see below for why it needs more than a timestamp. Plus a `last_error` diagnostic. |
| `purchase_inventory_decrements` | `claim_and_decrement_charm_stock` (Postgres function, called by `api/square-webhook.js`) | `api/square-webhook.js` | **Per-item inventory ledger.** One row per (payment_id, item) — see below for why this is written by a *function*, not application code. |

| Function | Purpose |
|---|---|
| `claim_and_decrement_charm_stock(payment_id, item_key, name, metal, qty)` | Atomically claims the ledger row **and** applies the stock decrement in one transaction. |
| `claim_fulfillment_lease(payment_id, lease_seconds)` | Atomically claims (or reclaims, if the existing lease is stale) the right to send the fulfillment email. |

Why not memory / browser storage / the filesystem: this handler runs as a
Vercel serverless function. Each invocation may be a cold start with no
memory shared from the last one, there is no browser involved, and the
filesystem is ephemeral and not shared across instances — none of those
survive the redelivery window Square uses for retries (**Square documents
retry attempts for up to 24 hours** — see
[Square's webhooks retry docs](https://developer.squareup.com/docs/webhooks/step4receive#retry-notifications)).
Postgres is the only store here durable across invocations and across that
whole window.

If you ever migrate off Supabase, replace the exported functions in
`api/_lib/webhookStore.js` — including the two Postgres functions above,
which would need equivalent atomic operations in the new store — with
equivalents backed by the new store. Nothing outside that file needs to
change.

### The state model

`purchase_completions` is not a single irreversible claim; each required
side effect has its own durable state, and the mechanism differs by effect
because each has a different crash-safety requirement:

```
              ┌─────────────┐
  webhook  →  │  row exists │  (created on first sight of this payment_id;
  delivery    │  all pending│   getOrCreatePurchaseState — race-safe insert)
              └──────┬──────┘
        ┌─────────────┼──────────────┬─────────────────────┐
        ▼             ▼              ▼                      ▼
 order_logged_at  inventory_    fulfillment_          analytics_recorded_at
  (orders table    updated_at    state: pending →       (claim + attempt in
   unique          (claim +      processing → sent       one step, at-most-
   constraint is   decrement     — see "Fulfillment       once — see below)
   itself the      ARE ONE       email: a lease, not
   idempotency     atomic call   a claim" below)
   guard)          — see below)
        │             │              │
        └─────────────┴──────────────┘
                      │  all three required, in any order
                      ▼
              completed_at set (markEffectDone)
              → response 200 { processed: true }
```

Every delivery for a completed, qualifying payment re-fetches this row and
attempts **only whatever is still incomplete**. That's the whole
resumability mechanism — it works identically whether the retry carries the
same `event_id`, a different `event_id`, or arrives as a later, independent
`payment.updated` for an already-fulfilled payment.

**Why `webhook_events` (event_id) doesn't gate processing.** An earlier
design claimed `event_id` up front and treated that as "fully processed,
never look at this again." That has a failure window: if the process
crashed after the claim but before fulfillment finished, a Square retry of
that *exact* event would be discarded as a false duplicate and the
incomplete work would never resume. `event_id` is now purely an audit log;
all real gating happens on the `payment_id`-keyed state below.

**Order logging** — naturally idempotent via `orders.square_payment_id`'s
existing unique constraint. A conflicting insert (from a previous attempt
that succeeded but crashed before confirming) is treated as already-logged
success. `order_items` are only inserted if none exist yet for that order.
The `order_logged_at` marker itself is only trusted once its own DB write is
confirmed — if that write fails after a successful log, the delivery stays
incomplete and a retry safely re-checks (never a duplicate order row,
thanks to the constraint).

**Inventory decrement: claim and decrement are one atomic call, not two.**
An earlier design inserted the ledger row, then called the decrement RPC as
a second, separate round trip — a process killed in between left a
permanent ledger row for a decrement that never happened (a false "done").
`claim_and_decrement_charm_stock` closes that window entirely: the ledger
insert and the `qty_in_stock` update happen inside the SAME Postgres
function call, which PostgREST wraps in one transaction. There is no
request/response gap in between where a crash could leave one without the
other — a ledger row can only exist if the decrement actually committed
alongside it. `newly_applied: false` means another call already completed
this exact (payment, item); the caller treats that as success without
decrementing again. If the call itself errors, nothing is applied — the
item stays fully retryable, no cleanup needed. Same SKU appearing more than
once in a build, across multiple builds, or as a paid quantity > 1 all sum
into one tally entry per SKU — one claim, one decrement, for the total
quantity.

**Fulfillment email: a lease, not a claim.** A plain "set before sending,
unset on failure" claim (as used for order logging) has a real gap: a
process killed *between* claiming and calling Resend, or *during* the
Resend call itself, leaves the claim permanently set with no way to know
whether an email actually went out — unsetting it risks a duplicate send,
leaving it set risks losing the notification forever. `purchase_completions`
instead tracks `fulfillment_state` (`pending` → `processing` → `sent`) with
a `fulfillment_claimed_at` lease:

1. `claim_fulfillment_lease` atomically transitions `pending` → `processing`
   (or reclaims a `processing` row whose `fulfillment_claimed_at` is older
   than `FULFILLMENT_LEASE_SECONDS`, i.e. abandoned). Only the caller that
   wins this claim may call Resend.
2. Resend is called with `Idempotency-Key: fulfillment_email:{paymentId}` —
   stable across every retry of this notification. Resend honors this for
   24h: even if we call it more than once for the same payment, at most one
   email is ever actually sent.
3. `sendOrderEmail` distinguishes a **definitive** failure (Resend responded
   with an explicit error — we know for certain nothing was sent) from an
   **ambiguous** one (a network error/timeout — Resend's own state is
   unknown). A definitive failure releases the lease immediately (`pending`)
   so the very next delivery can retry without waiting. An ambiguous
   failure does NOT release the lease — releasing it could let a second
   attempt race one that might still be in flight at Resend. The lease is
   left to expire naturally; the eventual retry reuses the same
   idempotency key regardless.
4. `fulfillment_notified_at` (and `fulfillment_state = 'sent'`) is set ONLY
   after Resend's HTTP response confirms acceptance — never merely after
   "we called Resend." If that recording write itself fails (Resend
   accepted the email, but we couldn't durably save that fact), the lease
   is again left to expire rather than released — the email really was
   sent, so a fresh attempt must never be allowed to race in. The eventual
   retry calls Resend again with the same key (which returns the cached
   "already sent" result instead of sending again) and retries recording it.

**`purchase_completed` analytics** — deliberately different from all three
above: claimed and attempted in the same step, **never released on
failure** ("at-most-once, not guaranteed-delivery"). An external analytics
provider gives no reliable way to check "did that actually land," so
retrying risks a duplicate count more than a permanent miss costs us.
Analytics is also **not required** for `completed_at` / the 200 response —
an analytics outage must never hold up fulfillment or cause Square to keep
retrying an otherwise-fulfilled purchase.

**Response codes reflect completion, not just receipt.** If any of the
three required effects (order log, inventory, fulfillment email) is still
incomplete when a delivery finishes, the handler returns `500 { retryable:
true, incomplete: [...] }` — a deliberate signal for Square to redeliver.
Only once all three are confirmed does it return `200 { processed: true }`.
Ignored/malformed/unauthorized requests keep their original codes (200
ignored, 400, 401, 405).

### Checkout-session durability

`api/create-checkout.js` must not hand the customer a Square checkout URL
unless `recordCheckoutSession`'s write to `checkout_sessions` is confirmed.
If that write fails, the endpoint fails closed: `503`, a generic
"please try again" message, and a privacy-safe log line — never the
checkout URL. Square has already created the Payment Link at that point,
but it's simply left orphaned/unused; the customer retries, which creates a
fresh, correctly-correlated Payment Link.

## How to send a Square test notification

1. Developer Dashboard → **Webhooks** → your subscription → **Send test
   notification**, choose `payment.updated`.
2. Square test notifications are signed with the real signature key but
   carry a synthetic payment (fake `payment_id` / `order_id`, often
   `status: COMPLETED`). Expect the handler to:
   - Return `200`.
   - Log `purchase_completed skipped — order not correlated to a
     theretrocharmco.com checkout` (the synthetic order was never created by
     `create-checkout`) — **this is correct**, not a failure.
   - Still attempt the fulfillment email/inventory path if
     `payment.status === COMPLETED`; expect a fulfillment email with
     placeholder-looking data, or check logs if `NOTIFICATION_EMAIL` /
     `RESEND_API_KEY` are unset in that environment.
3. To test the full correlated path (including `purchase_completed`
   actually firing), you need a real order: run a **real Square Payment
   Link checkout** (a real card in sandbox, or the eventual real paid test
   order this hardening pass exists to unblock) rather than the dashboard's
   synthetic test notification.

## How to inspect webhook logs

Vercel dashboard → project → **Logs** (or `vercel logs <deployment-url>` /
`vercel logs --follow` from the CLI), filter for `square-webhook`. Every
outcome is logged with a privacy-safe reason and never the raw payload:

- `square-webhook: rejected — missing required production configuration`
- `square-webhook: rejected — missing signature header`
- `square-webhook: rejected — invalid signature`
- `square-webhook: rejected — malformed JSON payload`
- `square-webhook: rejected — signed payload missing event_id`
- `square-webhook: redelivery observed for event_id (informational only)`
- `square-webhook: ignored — unexpected event type`
- `square-webhook: ignored — payment not completed`
- `square-webhook: ignored — completed payment missing payment id or order id`
- `square-webhook: durable store not configured — cannot safely process, requesting retry`
- `square-webhook: could not establish durable purchase state — requesting retry`
- `square-webhook: order logged but could not be durably recorded — leaving retryable`
- `square-webhook: inventory decremented but could not be durably recorded — leaving retryable`
- `square-webhook: fulfillment email failed definitively, releasing lease for immediate retry`
- `square-webhook: fulfillment email failed ambiguously, leaving lease to expire`
- `square-webhook: fulfillment email sent but could not be durably recorded — will retry after lease expiry`
- `square-webhook: fulfillment lease held by another in-flight delivery`
- `square-webhook: purchase_completed skipped — order not correlated to a theretrocharmco.com checkout`
- `square-webhook: purchase_completed skipped — already attempted for this payment`
- `square-webhook: purchase_completed fired`
- `square-webhook: required work incomplete, requesting Square retry` (with the specific `incomplete` columns)

Logged fields are always scalars — `eventId`, `eventType`, `paymentId`,
`orderId`, `status`, `incomplete` (a list of column names) — never the full
`payment`/`order` object, never buyer name/email/phone/address, never card
data. `scripts/verify-webhook.mjs` (scenario `pii-absent-from-analytics-and-logs`)
asserts this by planting a fake buyer email + card suffix in a synthetic
payment and proving neither appears in any log line or analytics payload.

## How to confirm one payment produces exactly one `purchase_completed`

1. **Before** the real paid test order, in Vercel logs, search for the
   payment's Square payment ID (visible in the Square Dashboard →
   **Transactions** after the sale) once it exists — you should find:
   - Exactly one `square-webhook: purchase_completed fired` line for that
     `paymentId`.
   - Any additional deliveries for the same payment (redelivered event_id,
     a different event_id, or a later `payment.updated`) show
     `alreadyCompleted: true` in the response and, if analytics had already
     fired, `purchase_completed skipped — already attempted for this payment`.
2. **In Supabase**:
   - `select * from purchase_completions where square_payment_id = '<id>'`
     should return exactly one row, with `completed_at`, `fulfillment_state
     = 'sent'`, and `analytics_recorded_at` all set (assuming the order was
     website-correlated) and `last_error` null.
   - `select count(*) from orders where square_payment_id = '<id>'` should
     be exactly 1.
   - `select * from purchase_inventory_decrements where square_payment_id =
     '<id>'` should have exactly one row per distinct charm/base actually
     purchased — never a duplicate, never a filler.
3. **In Vercel Analytics** → Custom Events → `purchase_completed`, the event
   count attributable to that time window should match 1 (cross-reference
   `cart_value` against the actual charged amount).
4. To rehearse duplicate-safety without a second real charge, redeliver the
   same notification from the Developer Dashboard's webhook event log
   ("Resend") — the response should show `alreadyCompleted: true` and none
   of the counts above should increase.

## Website-order correlation, in one paragraph

`api/create-checkout.js` is the only code path that creates Square Payment
Links for this store. The instant Square returns a Payment Link, its
`order_id` is written to `checkout_sessions` (durable, server-side) and also
stamped onto the Square order itself as `metadata.checkout_source =
"theretrocharmco.com"` (a secondary, human-inspectable signal visible in the
Square Dashboard). The webhook's correlation check queries
`checkout_sessions` — not the metadata — because it's authoritative
first-party data written by our own server, immune to whatever Square (or a
staff member editing the order later) might do to order metadata. A
completed payment whose order was never created this way — a Square POS
sale, a market-booth sale rung up in person, an invoice, or a payment keyed
in manually from the Square Dashboard — fails this check and is correctly
excluded from `purchase_completed`.

## Analytics payload contract

See [`docs/analytics.md`](./analytics.md) for the full privacy rules. The
webhook only ever sends: `cart_value`, `currency`, `item_count`,
`has_bracelet_builds`, `verified: true`, `source: 'square_webhook'`. It never
sends buyer name, email, phone, address, payment/card details, or the raw
webhook payload — enforced by `buildPurchaseAnalyticsProps` in
`api/square-webhook.js`, which only reads `amount_money`/`currency` and
computed line-item counts off the payment, never the shipping recipient.

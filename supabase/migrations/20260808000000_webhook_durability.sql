-- Durable storage for Square webhook hardening: website-order correlation,
-- webhook delivery idempotency, and purchase-level idempotency.
--
-- All three tables are written/read exclusively by server code using the
-- Supabase service role key (api/create-checkout.js and api/square-webhook.js
-- via api/_lib/webhookStore.js) — no anon/public policies are defined, so
-- row level security blocks all client access by default.

-- Recorded the moment api/create-checkout.js successfully creates a Square
-- Payment Link. The webhook checks this table to confirm a completed payment
-- actually originated from a theretrocharmco.com checkout — not Square POS,
-- an in-person market-booth sale, an invoice, or a payment entered manually
-- in the Square Dashboard, all of which produce completed payments on the
-- same Square account but were never created by this table.
create table if not exists public.checkout_sessions (
  square_order_id text primary key,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create index if not exists checkout_sessions_created_at_idx
  on public.checkout_sessions (created_at desc);

alter table public.checkout_sessions enable row level security;

-- One row per Square `event_id`. Lets the webhook detect redelivered/retried
-- notifications (Square retries on any non-2xx or slow response) so a retry
-- of the exact same event never re-sends fulfillment email, re-decrements
-- inventory, or re-fires purchase_completed.
create table if not exists public.webhook_events (
  event_id text primary key,
  event_type text,
  received_at timestamptz not null default now()
);

create index if not exists webhook_events_received_at_idx
  on public.webhook_events (received_at desc);

alter table public.webhook_events enable row level security;

-- One row per Square `payment_id`, claimed immediately before firing
-- purchase_completed. Independent of event_id so that two *different* Square
-- events referencing the same payment (e.g. payment.created followed by
-- payment.updated, or a retry that Square redelivers under a new event_id)
-- can never count the same purchase twice. The unique constraint makes the
-- claim race-safe across concurrent webhook deliveries.
create table if not exists public.purchase_completions (
  square_payment_id text primary key,
  square_order_id text,
  created_at timestamptz not null default now()
);

create index if not exists purchase_completions_order_id_idx
  on public.purchase_completions (square_order_id);

alter table public.purchase_completions enable row level security;

-- No public read/write policies on any of the three tables above: all access
-- goes through server code using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

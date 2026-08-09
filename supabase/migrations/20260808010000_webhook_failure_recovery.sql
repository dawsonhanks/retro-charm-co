-- Failure-recovery hardening for the Square webhook.
--
-- `purchase_completions` previously had a single irreversible claim
-- (square_payment_id primary key) that only protected analytics. That meant
-- a partial failure (e.g. inventory decrement succeeds, fulfillment email
-- fails) had no durable record of *which* side effects actually finished —
-- a retry could only either redo everything or skip everything.
--
-- This migration turns that one claim into a durable per-effect state
-- record: one nullable timestamp column per required side effect, plus a
-- `completed_at` marker and a privacy-safe `last_error` diagnostic. Every
-- column is set via a conditional `UPDATE ... WHERE column IS NULL`, which
-- Postgres serializes safely even under real concurrency — no extra locking
-- needed.

alter table public.purchase_completions
  add column if not exists order_logged_at timestamptz,
  add column if not exists inventory_updated_at timestamptz,
  add column if not exists fulfillment_notified_at timestamptz,
  add column if not exists analytics_recorded_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists last_error text;

comment on table public.purchase_completions is
  'One row per Square payment_id for a completed, qualifying payment. Created the first time the webhook sees the payment; each *_at column is set exactly once (via UPDATE ... WHERE col IS NULL) as its corresponding side effect is confirmed done. A retry only re-attempts columns still NULL — see api/_lib/webhookStore.js and docs/webhook.md.';

-- Per-item inventory decrement ledger. Inventory decrement is NOT naturally
-- idempotent (calling the RPC twice decrements twice), unlike order logging
-- (protected by orders.square_payment_id's existing unique constraint). One
-- row per (payment, item) claimed via unique constraint BEFORE the RPC call
-- and released (deleted) if the RPC call fails, so a retry only re-attempts
-- items that never actually succeeded — never an item that already did.
create table if not exists public.purchase_inventory_decrements (
  square_payment_id text not null,
  item_key text not null,
  quantity integer not null,
  decremented_at timestamptz not null default now(),
  primary key (square_payment_id, item_key)
);

alter table public.purchase_inventory_decrements enable row level security;

-- No public read/write policies: all access goes through server code using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

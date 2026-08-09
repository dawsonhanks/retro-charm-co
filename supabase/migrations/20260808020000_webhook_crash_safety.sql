-- Closes the remaining crash-after-claim windows identified in the failure-
-- recovery audit:
--
--   1. Inventory: the ledger insert and the actual stock decrement used to
--      be two separate round-trips (insert-then-RPC). A process killed
--      between them left a permanent ledger row for a decrement that never
--      happened. Fixed by making both happen in ONE atomic function call —
--      see claim_and_decrement_charm_stock below.
--
--   2. Fulfillment email: fulfillment_notified_at used to be set BEFORE
--      calling Resend, as a pre-send claim. A process killed after the
--      claim but before (or during) the Resend call left the payment
--      permanently marked "notified" with no email ever sent. Fixed by a
--      durable pending/processing/sent state machine with a reclaimable
--      lease — see claim_fulfillment_lease below. fulfillment_notified_at
--      is now set ONLY after Resend confirms acceptance
--      (api/_lib/webhookStore.js markFulfillmentSent).

alter table public.purchase_completions
  add column if not exists fulfillment_state text not null default 'pending',
  add constraint purchase_completions_fulfillment_state_check
    check (fulfillment_state in ('pending', 'processing', 'sent')),
  add column if not exists fulfillment_claimed_at timestamptz,
  add column if not exists fulfillment_sent_at timestamptz;

-- Atomically claims (or reclaims, if the current processing lease is older
-- than p_lease_seconds) the fulfillment notification for a payment.
-- claimed=true means THIS call won the claim — only then may the caller
-- call Resend. already_sent=true means another delivery already confirmed
-- the send; the caller should not attempt anything.
create or replace function public.claim_fulfillment_lease(
  p_payment_id text,
  p_lease_seconds double precision default 120
) returns table(claimed boolean, already_sent boolean) as $$
declare
  v_updated integer;
  v_already_sent boolean := false;
begin
  update public.purchase_completions
  set fulfillment_state = 'processing',
      fulfillment_claimed_at = now()
  where square_payment_id = p_payment_id
    and fulfillment_notified_at is null
    and (
      fulfillment_state = 'pending'
      or (
        fulfillment_state = 'processing'
        and fulfillment_claimed_at < now() - make_interval(secs => p_lease_seconds)
      )
    );

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    select (fulfillment_notified_at is not null) into v_already_sent
    from public.purchase_completions
    where square_payment_id = p_payment_id;
  end if;

  return query select (v_updated > 0), coalesce(v_already_sent, false);
end;
$$ language plpgsql security definer;

-- Atomically claims (payment_id, item_key) AND applies the inventory
-- decrement in the SAME transaction (a single function call = one
-- PostgREST-managed transaction). A ledger row can therefore only ever
-- exist if the decrement actually committed alongside it — there is no
-- window in which a process can be killed leaving a claim with no
-- decrement, or a decrement with no claim. newly_applied=false means
-- another call already completed this exact (payment, item) — safe no-op,
-- the item is guaranteed decremented exactly once either way. If the
-- function call itself fails/errors, nothing is applied (fully rolled
-- back) and the item remains retryable.
create or replace function public.claim_and_decrement_charm_stock(
  p_payment_id text,
  p_item_key text,
  p_name text,
  p_metal text,
  p_qty integer
) returns table(newly_applied boolean) as $$
declare
  v_inserted integer;
begin
  insert into public.purchase_inventory_decrements (square_payment_id, item_key, quantity)
  values (p_payment_id, p_item_key, p_qty)
  on conflict (square_payment_id, item_key) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.inventory
    set qty_in_stock = greatest(qty_in_stock - p_qty, 0)
    where name = p_name and metal = p_metal;
  end if;

  return query select (v_inserted > 0);
end;
$$ language plpgsql security definer;

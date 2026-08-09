/**
 * Durable server-side storage adapter for Square webhook hardening.
 *
 * Backs four concerns, each documented at length in docs/webhook.md:
 *  - Website-order correlation                         (checkout_sessions)
 *  - Webhook delivery audit log, by Square `event_id`   (webhook_events)
 *  - Entire-purchase failure-recovery state, by `payment_id` (purchase_completions)
 *  - Per-item inventory decrement ledger                (purchase_inventory_decrements)
 *
 * Production service: Supabase Postgres (same project already used for
 * inventory, email signups, and order logging). Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * Schema:
 *   supabase/migrations/20260808000000_webhook_durability.sql
 *   supabase/migrations/20260808010000_webhook_failure_recovery.sql
 *   supabase/migrations/20260808020000_webhook_crash_safety.sql
 *
 * Deliberately NOT backed by module-level memory, browser storage, or the
 * filesystem — none of those survive across invocations of a serverless
 * function, so they cannot provide real idempotency or resumability.
 *
 * If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are unset, every function below
 * returns an `unavailable: true` result instead of throwing. Callers must
 * treat `unavailable` as "cannot prove correlation/idempotency/state right
 * now" and fail closed (see api/square-webhook.js and api/create-checkout.js)
 * rather than silently assuming success.
 *
 * ## The purchase_completions state model
 *
 * One row per Square `payment_id`, created the first time a completed,
 * qualifying payment is seen (`getOrCreatePurchaseState`). Order logging,
 * inventory, and analytics each have one nullable timestamp column
 * (`order_logged_at`, `inventory_updated_at`, `analytics_recorded_at`),
 * set via a conditional `UPDATE ... WHERE column IS NULL` (`markEffectDone`)
 * — Postgres serializes concurrent UPDATEs to the same row, so this is a
 * correct atomic claim even under real concurrency without extra locking.
 * `completed_at` is set the same way once order log, inventory, and
 * fulfillment email are all done; analytics is intentionally NOT required
 * for `completed_at` (see docs/webhook.md — analytics uses "attempt once,
 * at-most-once" semantics and must never hold up fulfillment).
 *
 * Fulfillment email and inventory decrement are NOT plain claim-then-act
 * columns, because each has its own crash-safety requirement a single
 * timestamp can't satisfy — see their sections below.
 *
 * Every webhook delivery for a completed, qualifying payment re-checks all
 * state and only attempts whatever is still incomplete — that's how a
 * Square retry safely resumes exactly the work that didn't finish, whether
 * the retry carries the same event_id or a different one.
 */
import { createClient } from '@supabase/supabase-js'

const POSTGRES_UNIQUE_VIOLATION = '23505'

/** Default fulfillment processing-lease duration — see claimFulfillmentLease. */
const DEFAULT_FULFILLMENT_LEASE_SECONDS = 120

/** Column names on purchase_completions — pass one of these to markEffectDone. */
export const PURCHASE_EFFECT = Object.freeze({
  ORDER_LOGGED: 'order_logged_at',
  INVENTORY_UPDATED: 'inventory_updated_at',
  ANALYTICS_RECORDED: 'analytics_recorded_at',
  COMPLETED: 'completed_at',
})

let cachedClient // undefined = not yet resolved, null = not configured

function getClient() {
  if (cachedClient !== undefined) return cachedClient

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  cachedClient =
    url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null

  return cachedClient
}

/** Test-only: inject a fake Supabase client (or null) instead of the real one. */
export function __setWebhookStoreClientForTests(client) {
  cachedClient = client
}

export function isDurableStoreConfigured() {
  return getClient() !== null
}

/**
 * The single Supabase client shared by every durable-storage concern in the
 * webhook, including the inventory-decrement RPC call and order/order_items
 * writes in api/square-webhook.js. Kept as one client (rather than a second,
 * separately-configured instance) so there is exactly one place to
 * configure and one place to inject a fake client for tests.
 */
export function getSupabaseClientForWebhook() {
  return getClient()
}

// ── Website-order correlation ───────────────────────────────────────────────

/**
 * Record that a Square order originated from a theretrocharmco.com checkout.
 * Called by api/create-checkout.js immediately after Square returns a
 * Payment Link. api/create-checkout.js must not hand the checkout URL to the
 * customer unless this returns { ok: true } — see docs/webhook.md
 * "Checkout-session durability".
 */
export async function recordCheckoutSession(squareOrderId, idempotencyKey) {
  const supabase = getClient()
  if (!supabase) return { ok: false, reason: 'not_configured' }
  if (!squareOrderId) return { ok: false, reason: 'missing_order_id' }

  const { error } = await supabase
    .from('checkout_sessions')
    .upsert(
      { square_order_id: squareOrderId, idempotency_key: idempotencyKey ?? null },
      { onConflict: 'square_order_id' },
    )

  if (error) {
    console.error('[webhookStore] recordCheckoutSession failed:', error.message ?? error)
    return { ok: false, reason: 'write_failed' }
  }
  return { ok: true }
}

/**
 * True only if `squareOrderId` was recorded by recordCheckoutSession — i.e.
 * this order was created by our own /api/create-checkout, not Square POS, a
 * market-booth sale, an invoice, or a payment entered manually in the Square
 * Dashboard.
 */
export async function isWebsiteCheckoutOrder(squareOrderId) {
  const supabase = getClient()
  if (!supabase || !squareOrderId) return false

  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('square_order_id')
    .eq('square_order_id', squareOrderId)
    .maybeSingle()

  if (error) {
    console.error('[webhookStore] isWebsiteCheckoutOrder lookup failed:', error.message ?? error)
    return false
  }
  return Boolean(data)
}

// ── Webhook delivery audit log (event_id) ───────────────────────────────────

/**
 * Best-effort audit log of every Square event_id seen. NOT used to gate
 * processing — a valid event must be able to resume incomplete work even if
 * its own event_id (or a different event_id for the same payment) was seen
 * before. See getOrCreatePurchaseState / markEffectDone for the mechanism
 * that actually protects against repeating side effects.
 */
export async function claimWebhookEventId(eventId, eventType) {
  const supabase = getClient()
  if (!supabase) return { claimed: false, unavailable: true }
  if (!eventId) return { claimed: false, unavailable: true }

  const { error } = await supabase
    .from('webhook_events')
    .insert({ event_id: eventId, event_type: eventType ?? null })

  if (!error) return { claimed: true, unavailable: false }
  if (error.code === POSTGRES_UNIQUE_VIOLATION) return { claimed: false, unavailable: false }

  console.error('[webhookStore] claimWebhookEventId failed:', error.message ?? error)
  return { claimed: false, unavailable: true }
}

// ── Entire-purchase failure-recovery state (purchase_completions) ──────────

/**
 * Fetch the durable per-payment state row, creating it (all effect columns
 * NULL) if this is the first time this payment_id has been seen. Race-safe:
 * if two deliveries call this concurrently, exactly one INSERT wins and the
 * other transparently fetches the row the winner created.
 * @returns {Promise<{ row: object | null, unavailable: boolean }>}
 */
export async function getOrCreatePurchaseState(paymentId, orderId) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { row: null, unavailable: true }

  const { data: inserted, error: insertError } = await supabase
    .from('purchase_completions')
    .insert({
      square_payment_id: paymentId,
      square_order_id: orderId ?? null,
      order_logged_at: null,
      inventory_updated_at: null,
      fulfillment_notified_at: null,
      fulfillment_state: 'pending',
      fulfillment_claimed_at: null,
      fulfillment_sent_at: null,
      analytics_recorded_at: null,
      completed_at: null,
      last_error: null,
    })
    .select('*')
    .single()

  if (!insertError) return { row: inserted, unavailable: false }

  if (insertError.code === POSTGRES_UNIQUE_VIOLATION) {
    const { data: existing, error: fetchError } = await supabase
      .from('purchase_completions')
      .select('*')
      .eq('square_payment_id', paymentId)
      .maybeSingle()
    if (fetchError || !existing) {
      console.error(
        '[webhookStore] getOrCreatePurchaseState fetch-after-conflict failed:',
        fetchError?.message ?? fetchError,
      )
      return { row: null, unavailable: true }
    }
    return { row: existing, unavailable: false }
  }

  console.error('[webhookStore] getOrCreatePurchaseState insert failed:', insertError.message ?? insertError)
  return { row: null, unavailable: true }
}

/**
 * Atomically claim one effect column (see PURCHASE_EFFECT) for this payment:
 * `UPDATE purchase_completions SET [column] = now() WHERE square_payment_id
 * = paymentId AND [column] IS NULL`. Postgres serializes concurrent UPDATEs
 * to the same row, so under real concurrency exactly one caller ever wins.
 * @returns {Promise<{ claimed: boolean, unavailable: boolean }>}
 *   claimed=true  → this call just set the column (first to do so — proceed).
 *   claimed=false → already set (by a previous delivery or a concurrent
 *                   winner) — skip re-running that effect.
 *   unavailable   → could not determine either way — treat as incomplete/retryable.
 */
export async function markEffectDone(paymentId, column) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { claimed: false, unavailable: true }

  const { data, error } = await supabase
    .from('purchase_completions')
    .update({ [column]: new Date().toISOString() })
    .eq('square_payment_id', paymentId)
    .is(column, null)
    .select('square_payment_id')

  if (error) {
    console.error(`[webhookStore] markEffectDone(${column}) failed:`, error.message ?? error)
    return { claimed: false, unavailable: true }
  }
  return { claimed: Array.isArray(data) && data.length > 0, unavailable: false }
}

/**
 * Compensating action: clear a previously-claimed effect column back to NULL
 * so a future delivery retries it. Only ever called by the same request that
 * won the claim (immediately after its own side effect failed), so this
 * never races with another claimant — the claim itself already prevented
 * anyone else from touching this column while we held it.
 */
export async function unmarkEffect(paymentId, column) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { ok: false }

  const { error } = await supabase
    .from('purchase_completions')
    .update({ [column]: null })
    .eq('square_payment_id', paymentId)

  if (error) {
    console.error(`[webhookStore] unmarkEffect(${column}) failed:`, error.message ?? error)
    return { ok: false }
  }
  return { ok: true }
}

/** Best-effort privacy-safe diagnostic (no PII, no raw payloads) for the last failure on this payment. */
export async function recordLastError(paymentId, message) {
  const supabase = getClient()
  if (!supabase || !paymentId) return
  const safeMessage = (typeof message === 'string' ? message : String(message)).slice(0, 500)

  const { error } = await supabase
    .from('purchase_completions')
    .update({ last_error: safeMessage })
    .eq('square_payment_id', paymentId)

  if (error) {
    console.error('[webhookStore] recordLastError failed:', error.message ?? error)
  }
}

// ── Per-item inventory decrement (atomic claim + apply) ─────────────────────

/**
 * Atomically claims (payment_id, item_key) AND applies the inventory
 * decrement, via the `claim_and_decrement_charm_stock` Postgres function —
 * see supabase/migrations/20260808020000_webhook_crash_safety.sql. Both the
 * ledger insert and the stock UPDATE happen inside that single function
 * call's transaction: either both commit or neither does. There is no
 * request/response round trip in between where a process could be killed
 * and leave a ledger row with no matching decrement (or vice versa).
 *
 * `ok: true` means the item is now guaranteed decremented exactly once —
 * either this call just did it (`newlyApplied: true`) or a previous call
 * already did (`newlyApplied: false`, safe no-op). `ok: false` means the
 * call itself failed/couldn't be confirmed — nothing was applied, and the
 * item remains fully retryable (there is no partial state to clean up).
 * @returns {Promise<{ ok: boolean, newlyApplied: boolean, unavailable: boolean }>}
 */
export async function claimAndDecrementInventoryItem(paymentId, itemKey, name, metal, quantity) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { ok: false, newlyApplied: false, unavailable: true }

  const { data, error } = await supabase.rpc('claim_and_decrement_charm_stock', {
    p_payment_id: paymentId,
    p_item_key: itemKey,
    p_name: name,
    p_metal: metal,
    p_qty: quantity,
  })

  if (error) {
    console.error('[webhookStore] claimAndDecrementInventoryItem failed:', error.message ?? error)
    return { ok: false, newlyApplied: false, unavailable: true }
  }

  const row = Array.isArray(data) ? data[0] : data
  return { ok: true, newlyApplied: Boolean(row?.newly_applied), unavailable: false }
}

// ── Fulfillment notification: pending / processing / sent, with a lease ────

/**
 * Atomically claims (or reclaims, if the current processing lease has
 * expired) the fulfillment notification for a payment, via the
 * `claim_fulfillment_lease` Postgres function. Only when `claimed: true`
 * may the caller call Resend — this is what serializes concurrent senders
 * AND what lets an abandoned claim (process killed after claiming but
 * before/during the Resend call) be safely retried once its lease expires,
 * instead of being stuck "processing" forever.
 * @returns {Promise<{ claimed: boolean, alreadySent: boolean, unavailable: boolean }>}
 */
export async function claimFulfillmentLease(paymentId, leaseSeconds = DEFAULT_FULFILLMENT_LEASE_SECONDS) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { claimed: false, alreadySent: false, unavailable: true }

  const { data, error } = await supabase.rpc('claim_fulfillment_lease', {
    p_payment_id: paymentId,
    p_lease_seconds: leaseSeconds,
  })

  if (error) {
    console.error('[webhookStore] claimFulfillmentLease failed:', error.message ?? error)
    return { claimed: false, alreadySent: false, unavailable: true }
  }

  const row = Array.isArray(data) ? data[0] : data
  return { claimed: Boolean(row?.claimed), alreadySent: Boolean(row?.already_sent), unavailable: false }
}

/**
 * Release a claimed lease back to 'pending' after a DEFINITIVE send failure
 * (Resend responded with an explicit non-ok result — we know for certain no
 * email went out). Only call this for definitive failures: if the failure
 * was ambiguous (a network error/timeout where Resend's own state is
 * unknown), do NOT release — leave the lease to expire naturally, so the
 * eventual retry reuses the same idempotency key instead of racing a
 * possibly-still-in-flight send.
 */
export async function releaseFulfillmentLease(paymentId) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { ok: false }

  const { error } = await supabase
    .from('purchase_completions')
    .update({ fulfillment_state: 'pending', fulfillment_claimed_at: null })
    .eq('square_payment_id', paymentId)

  if (error) {
    console.error('[webhookStore] releaseFulfillmentLease failed:', error.message ?? error)
    return { ok: false }
  }
  return { ok: true }
}

/**
 * Mark the fulfillment email as sent — the ONLY place fulfillment_notified_at
 * is set, and only ever called after Resend's HTTP response confirms
 * acceptance (never merely after "we called Resend").
 */
export async function markFulfillmentSent(paymentId) {
  const supabase = getClient()
  if (!supabase || !paymentId) return { ok: false }

  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from('purchase_completions')
    .update({ fulfillment_notified_at: nowIso, fulfillment_state: 'sent', fulfillment_sent_at: nowIso })
    .eq('square_payment_id', paymentId)

  if (error) {
    console.error('[webhookStore] markFulfillmentSent failed:', error.message ?? error)
    return { ok: false }
  }
  return { ok: true }
}

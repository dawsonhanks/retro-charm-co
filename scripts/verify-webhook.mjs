/**
 * Square webhook hardening + failure-recovery regression suite.
 * Run: npx vite-node scripts/verify-webhook.mjs
 *
 * Part A exercises signature verification, event qualification, and
 * website-order correlation (api/square-webhook.js, api/create-checkout.js).
 *
 * Part B exercises entire-purchase idempotency and failure recovery: a
 * generic in-memory Postgres-like fake (with per-operation failure
 * injection) proves that order logging, inventory decrement, fulfillment
 * email, and purchase_completed analytics each resume correctly after a
 * partial failure, never repeat once confirmed done, and stay correct
 * under concurrent/duplicate/redelivered webhook requests. See
 * docs/webhook.md for the state model this proves out.
 */
import crypto from 'node:crypto'
import {
  __setWebhookStoreClientForTests,
  isWebsiteCheckoutOrder,
} from '../api/_lib/webhookStore.js'
import { __setPurchaseTrackerForTests } from '../api/_lib/trackPurchase.js'
import { charms, isFillerCharm } from '../src/data/charms.js'
import webhookHandler from '../api/square-webhook.js'
import createCheckoutHandler from '../api/create-checkout.js'

/** Real, non-filler catalog items — fillers must never be decremented (see B4b). */
const realCharms = charms.filter((c) => !isFillerCharm(c))

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

// ── Env ──────────────────────────────────────────────────────────────────
const SIGNATURE_KEY = 'test-signature-key-do-not-use-in-prod'
const NOTIFICATION_URL = 'https://www.theretrocharmco.com/api/square-webhook'
process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = SIGNATURE_KEY
process.env.SQUARE_WEBHOOK_NOTIFICATION_URL = NOTIFICATION_URL
process.env.SQUARE_ACCESS_TOKEN = 'test-access-token' // so fetchOrderDetails actually calls (mocked) fetch
process.env.NOTIFICATION_EMAIL = 'owner@theretrocharmco.com'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.SQUARE_LOCATION_ID = 'test-location'
process.env.VITE_SITE_URL = 'https://www.theretrocharmco.com'
// Inventory revalidation for create-checkout (fail-safe). Webhook store still uses the fake client.
process.env.VITE_SUPABASE_URL = 'https://inventory-test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
delete process.env.SUPABASE_URL
delete process.env.SUPABASE_SERVICE_ROLE_KEY
delete process.env.INVENTORY_EMERGENCY_FAIL_OPEN
delete process.env.VITE_INVENTORY_EMERGENCY_FAIL_OPEN
delete process.env.VITE_INVENTORY_MODE

// ── Console capture ──────────────────────────────────────────────────────
/** @type {string[]} */
const consoleLines = []
const realConsole = { log: console.log, warn: console.warn, error: console.error }
for (const level of ['log', 'warn', 'error']) {
  console[level] = (...args) => {
    consoleLines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
  }
}
function restoreConsole() {
  console.log = realConsole.log
  console.warn = realConsole.warn
  console.error = realConsole.error
}
function consoleText() {
  return consoleLines.join('\n')
}
function clearConsole() {
  consoleLines.length = 0
}

// ════════════════════════════════════════════════════════════════════════
// Generic in-memory Postgres-like fake, with per-operation failure injection
// ════════════════════════════════════════════════════════════════════════
const PK_FIELDS = {
  checkout_sessions: ['square_order_id'],
  webhook_events: ['event_id'],
  purchase_completions: ['square_payment_id'],
  purchase_inventory_decrements: ['square_payment_id', 'item_key'],
  orders: ['square_payment_id'],
}

function createFakeSupabase() {
  const tables = {
    checkout_sessions: [],
    webhook_events: [],
    purchase_completions: [],
    purchase_inventory_decrements: [],
    orders: [],
    order_items: [],
  }
  /** Successful RPC calls, for exact-count assertions. */
  const inventoryDecrementCalls = []

  let globalOutage = false
  /** key -> 'error' | 'throw' | (ctx) => 'error'|'throw'|null|undefined */
  const failInjection = new Map()

  function setFailure(key, mode) {
    if (mode == null) failInjection.delete(key)
    else failInjection.set(key, mode)
  }
  function setGlobalOutage(on) {
    globalOutage = on
  }
  function shouldFail(key, ctx) {
    if (globalOutage) return 'error'
    const cfg = failInjection.get(key)
    if (!cfg) return null
    return typeof cfg === 'function' ? cfg(ctx) : cfg
  }

  function matchFilters(row, filters) {
    return filters.every(([type, col, val]) => {
      if (type === 'eq') return row[col] === val
      if (type === 'is') return val === null ? row[col] === null || row[col] === undefined : row[col] === val
      return true
    })
  }

  function findByPk(tableName, row) {
    const pk = PK_FIELDS[tableName]
    if (!pk) return null
    return tables[tableName].find((r) => pk.every((f) => r[f] === row[f])) ?? null
  }

  let orderIdSeq = 0

  function makeBuilder(tableName) {
    const table = tables[tableName]
    const filters = []
    let insertRows = null
    let updatePatch = null
    let upsertRow = null
    let upsertOpts = null
    let deleteMode = false
    let singleMode = null

    async function exec() {
      const opType = insertRows
        ? 'insert'
        : upsertRow
          ? 'upsert'
          : updatePatch
            ? 'update'
            : deleteMode
              ? 'delete'
              : 'select'
      const failKey = `${tableName}.${opType}`
      const ctx = { row: insertRows?.[0] ?? upsertRow, filters, patch: updatePatch }
      const injected = shouldFail(failKey, ctx)
      if (injected === 'error') return finalize(null, { message: `injected failure: ${failKey}`, code: 'INJECTED' })
      if (injected === 'throw') throw new Error(`injected throw: ${failKey}`)

      if (opType === 'insert') {
        const results = []
        for (const row of insertRows) {
          if (findByPk(tableName, row)) return finalize(null, { code: '23505', message: 'duplicate key value violates unique constraint' })
          const stored = { ...row }
          if (tableName === 'orders' && !stored.id) {
            orderIdSeq += 1
            stored.id = `order-row-${orderIdSeq}`
          }
          table.push(stored)
          results.push(stored)
        }
        return finalize(results, null)
      }

      if (opType === 'upsert') {
        const existing = findByPk(tableName, upsertRow)
        if (existing) Object.assign(existing, upsertRow)
        else table.push({ ...upsertRow })
        return finalize([existing ?? upsertRow], null)
      }

      if (opType === 'update') {
        const matched = table.filter((r) => matchFilters(r, filters))
        for (const row of matched) Object.assign(row, updatePatch)
        return finalize(matched, null)
      }

      if (opType === 'delete') {
        const toRemove = table.filter((r) => matchFilters(r, filters))
        for (const row of toRemove) {
          const idx = table.indexOf(row)
          if (idx !== -1) table.splice(idx, 1)
        }
        return finalize(toRemove, null)
      }

      // select
      return finalize(table.filter((r) => matchFilters(r, filters)), null)
    }

    function finalize(data, error) {
      if (error) return { data: null, error }
      if (singleMode === 'single') {
        return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { message: 'not found or not unique' } }
      }
      if (singleMode === 'maybeSingle') {
        return { data: data[0] ?? null, error: null }
      }
      return { data, error: null }
    }

    const builder = {
      insert(rowOrRows) {
        insertRows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows]
        return builder
      },
      upsert(row, opts) {
        upsertRow = row
        upsertOpts = opts
        return builder
      },
      update(patch) {
        updatePatch = patch
        return builder
      },
      delete() {
        deleteMode = true
        return builder
      },
      select() {
        return builder
      },
      eq(col, val) {
        filters.push(['eq', col, val])
        return builder
      },
      is(col, val) {
        filters.push(['is', col, val])
        return builder
      },
      single() {
        singleMode = 'single'
        return exec()
      },
      maybeSingle() {
        singleMode = 'maybeSingle'
        return exec()
      },
      then(resolve, reject) {
        return exec().then(resolve, reject)
      },
    }
    void upsertOpts
    return builder
  }

  return {
    tables,
    inventoryDecrementCalls,
    setFailure,
    setGlobalOutage,
    from(tableName) {
      return makeBuilder(tableName)
    },
    async rpc(fnName, args) {
      const failKey = `rpc.${fnName}`
      const injected = shouldFail(failKey, { args })
      if (injected === 'error') return { error: { message: `injected rpc failure: ${failKey}` } }
      if (injected === 'throw') throw new Error(`injected rpc throw: ${failKey}`)

      // Mirrors supabase/migrations/20260808020000_webhook_crash_safety.sql
      // claim_and_decrement_charm_stock: the ledger insert and the stock
      // decrement happen together, synchronously, within this one call —
      // exactly modeling "one atomic transaction, no request in between
      // where a crash could leave a partial state."
      if (fnName === 'claim_and_decrement_charm_stock') {
        const { p_payment_id, p_item_key, p_name, p_metal, p_qty } = args
        const alreadyClaimed = tables.purchase_inventory_decrements.some(
          (r) => r.square_payment_id === p_payment_id && r.item_key === p_item_key,
        )
        if (alreadyClaimed) {
          return { data: [{ newly_applied: false }], error: null }
        }
        tables.purchase_inventory_decrements.push({
          square_payment_id: p_payment_id,
          item_key: p_item_key,
          quantity: p_qty,
        })
        inventoryDecrementCalls.push({ p_name, p_metal, p_qty })
        return { data: [{ newly_applied: true }], error: null }
      }

      // Mirrors claim_fulfillment_lease: claims 'pending', or reclaims a
      // 'processing' row whose claimed_at is older than p_lease_seconds.
      if (fnName === 'claim_fulfillment_lease') {
        const { p_payment_id, p_lease_seconds } = args
        const row = tables.purchase_completions.find((r) => r.square_payment_id === p_payment_id)
        if (!row) return { data: [{ claimed: false, already_sent: false }], error: null }
        if (row.fulfillment_notified_at) return { data: [{ claimed: false, already_sent: true }], error: null }

        const claimedAtMs = row.fulfillment_claimed_at ? new Date(row.fulfillment_claimed_at).getTime() : null
        const leaseExpired = claimedAtMs != null && Date.now() - claimedAtMs > p_lease_seconds * 1000
        const canClaim =
          row.fulfillment_state === 'pending' ||
          row.fulfillment_state == null ||
          (row.fulfillment_state === 'processing' && leaseExpired)

        if (!canClaim) return { data: [{ claimed: false, already_sent: false }], error: null }

        row.fulfillment_state = 'processing'
        row.fulfillment_claimed_at = new Date().toISOString()
        return { data: [{ claimed: true, already_sent: false }], error: null }
      }

      throw new Error(`Unexpected rpc call in test: ${fnName}`)
    },
  }
}

let fakeSupabase = createFakeSupabase()
__setWebhookStoreClientForTests(fakeSupabase)

function resetFakeSupabase() {
  fakeSupabase = createFakeSupabase()
  __setWebhookStoreClientForTests(fakeSupabase)
}

// ── Analytics sink under test control ───────────────────────────────────────
/** @type {{ event: string, props: Record<string, unknown> }[]} */
let trackCalls = []
let trackShouldFail = false
__setPurchaseTrackerForTests(async (event, props) => {
  trackCalls.push({ event, props })
  if (trackShouldFail) throw new Error('simulated analytics provider outage')
})
function clearTrackCalls() {
  trackCalls = []
  trackShouldFail = false
}

// ── fetch mock: Square Orders API, Square Payment Links API, Resend ────────
let fetchConfig = { orderMetadata: {}, orderLineItems: [], resendMode: 'ok' }
/** @type {{ idempotencyKey: string | undefined, from: string }[]} */
let resendCallLog = []
/**
 * Mirrors real Resend: a repeat request with an Idempotency-Key that
 * already produced a successful response returns that SAME cached response
 * instead of sending again — modeled here as a Map from key -> the ok
 * response object. Only successful responses are cached (matches our own
 * code's assumption that a definitive error is safe to retry fresh).
 * @type {Map<string, object>}
 */
let resendIdempotencyCache = new Map()
/** Settable per test for the create-checkout Payment Links flow. */
let squareLinkFetchHandler = null

function resetFetchState() {
  fetchConfig = { orderMetadata: {}, orderLineItems: [], resendMode: 'ok' }
  resendCallLog = []
  resendIdempotencyCache = new Map()
  squareLinkFetchHandler = null
}

/** Count of distinct idempotency keys that ever received a successful Resend response — "how many emails actually sent." */
function uniqueSuccessfulSendCount() {
  return resendIdempotencyCache.size
}

globalThis.fetch = async (url, opts) => {
  const u = String(url)
  if (u.includes('/rest/v1/inventory')) {
    // Authoritative inventory for create-checkout revalidation in this suite.
    const rows = realCharms.map((c) => ({
      name: c.name,
      metal: c.metal,
      qty_in_stock: 25,
    }))
    // Include base bracelet labels used as paid cart lines.
    rows.push(
      { name: 'Silver Bracelet', metal: 'silver', qty_in_stock: 25 },
      { name: 'Gold Bracelet', metal: 'gold', qty_in_stock: 25 },
      { name: 'Silver Watch Band', metal: 'silver', qty_in_stock: 25 },
      { name: 'Gold Watch Band', metal: 'gold', qty_in_stock: 25 },
    )
    return { ok: true, json: async () => rows }
  }
  if (u.includes('/v2/orders/')) {
    return {
      ok: true,
      json: async () => ({
        order: { fulfillments: [], metadata: fetchConfig.orderMetadata, line_items: fetchConfig.orderLineItems },
      }),
    }
  }
  if (u.includes('api.resend.com/emails')) {
    const parsedBody = JSON.parse(opts.body)
    const idempotencyKey = opts.headers?.['Idempotency-Key']
    resendCallLog.push({ idempotencyKey, from: parsedBody.from })

    if (idempotencyKey && resendIdempotencyCache.has(idempotencyKey)) {
      return resendIdempotencyCache.get(idempotencyKey)
    }

    if (fetchConfig.resendMode === 'error') {
      return { ok: false, status: 500, text: async () => 'simulated resend outage' }
    }
    if (fetchConfig.resendMode === 'throw') {
      // Network-level failure: Resend's own idempotency store never saw
      // this request, so nothing is cached — a retry gets a fresh attempt.
      throw new Error('simulated network failure calling Resend')
    }

    const response = { ok: true, json: async () => ({ id: `email_${resendCallLog.length}` }) }
    if (idempotencyKey) resendIdempotencyCache.set(idempotencyKey, response)
    return response
  }
  if (u.includes('online-checkout/payment-links')) {
    if (!squareLinkFetchHandler) throw new Error('no payment-links handler configured for this test')
    return squareLinkFetchHandler(url, opts)
  }
  throw new Error(`Unexpected fetch in test: ${u}`)
}

// ── req/res + signing helpers ───────────────────────────────────────────────
function signBody(rawBody, key = SIGNATURE_KEY, url = NOTIFICATION_URL) {
  return crypto.createHmac('sha256', key).update(url + rawBody).digest('base64')
}

function makeReq(rawBody, headers = {}) {
  const buf = Buffer.from(rawBody, 'utf8')
  return {
    method: 'POST',
    headers,
    async *[Symbol.asyncIterator]() {
      yield buf
    },
  }
}

function makeRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.body = data
      return this
    },
  }
}

async function callWebhook(rawBody, { signature, signed = true } = {}) {
  const sig = signature !== undefined ? signature : signed ? signBody(rawBody) : undefined
  const headers = sig !== undefined ? { 'x-square-hmacsha256-signature': sig } : {}
  const req = makeReq(rawBody, headers)
  const res = makeRes()
  await webhookHandler(req, res)
  return res
}

let seq = 0
function nextId(prefix) {
  seq += 1
  return `${prefix}-${seq}-${Math.random().toString(16).slice(2, 8)}`
}

function buildEventBody({
  eventId,
  type = 'payment.updated',
  paymentId,
  orderId,
  status = 'COMPLETED',
  amountCents = 4270,
  currency = 'USD',
  extraPaymentFields = {},
}) {
  return JSON.stringify({
    merchant_id: 'MERCHANT_TEST',
    type,
    event_id: eventId,
    created_at: new Date().toISOString(),
    data: {
      type: 'payment',
      id: paymentId,
      object: {
        payment: {
          id: paymentId,
          order_id: orderId,
          status,
          amount_money: { amount: amountCents, currency },
          updated_at: new Date().toISOString(),
          ...extraPaymentFields,
        },
      },
    },
  })
}

async function registerWebsiteOrder(orderId, idempotencyKey = 'cart-abc123') {
  const { recordCheckoutSession } = await import('../api/_lib/webhookStore.js')
  const result = await recordCheckoutSession(orderId, idempotencyKey)
  assert(result.ok, `recordCheckoutSession should succeed for ${orderId}`)
}

function purchaseRow(paymentId) {
  return fakeSupabase.tables.purchase_completions.find((r) => r.square_payment_id === paymentId)
}
function orderRows(paymentId) {
  return fakeSupabase.tables.orders.filter((r) => r.square_payment_id === paymentId)
}
function decrementCallsFor(name) {
  return fakeSupabase.inventoryDecrementCalls.filter((c) => c.p_name === name)
}

function freshTestSetup() {
  clearConsole()
  clearTrackCalls()
  resetFetchState()
}

// ═══════════════════════════════════════════════════════════════════════
// PART A — signature, event qualification, website correlation, PII
// ═══════════════════════════════════════════════════════════════════════

// 1. Valid signature → processed
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body)

  assert(res.statusCode === 200, `valid signature should return 200, got ${res.statusCode}`)
  assert(res.body.processed === true, 'valid completed website order should be marked processed')
  assert(trackCalls.length === 1, `purchase_completed should fire once, fired ${trackCalls.length}`)
  pass('valid-signature-processed')
}

// 2. Invalid signature → 401
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body, { signature: signBody(body, 'wrong-key') })

  assert(res.statusCode === 401, `invalid signature should return 401, got ${res.statusCode}`)
  assert(trackCalls.length === 0, 'invalid signature must not fire analytics')
  assert(orderRows(paymentId).length === 0, 'invalid signature must not log an order')
  pass('invalid-signature-rejected')
}

// 3. Missing signature → 401
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body, { signed: false })

  assert(res.statusCode === 401, `missing signature should return 401, got ${res.statusCode}`)
  assert(trackCalls.length === 0, 'missing signature must not fire analytics')
  pass('missing-signature-rejected')
}

// 4. Missing production configuration → 500, fail closed
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const savedKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  const resNoKey = await callWebhook(body)
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = savedKey

  assert(resNoKey.statusCode === 500, `missing signature key should fail closed with 500, got ${resNoKey.statusCode}`)
  assert(trackCalls.length === 0, 'missing config must not fire analytics')
  pass('missing-production-config-fails-closed')
}

// 5. Raw-body verification: signature over body A must reject a re-serialized body B
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const eventId = nextId('evt')
  const bodyA = buildEventBody({ eventId, paymentId, orderId })
  const parsed = JSON.parse(bodyA)
  const bodyB = JSON.stringify(parsed, Object.keys(parsed).sort(), 2)
  assert(bodyA !== bodyB, 'test fixture sanity: bodies must differ byte-for-byte')

  const res = await callWebhook(bodyB, { signature: signBody(bodyA) })

  assert(res.statusCode === 401, `signature computed for a different raw body must fail, got ${res.statusCode}`)
  pass('raw-body-verification-rejects-reserialized-payload')
}

// 6. Malformed JSON → 400
{
  freshTestSetup()
  const res = await callWebhook('{ this is not valid json')
  assert(res.statusCode === 400, `malformed JSON should return 400, got ${res.statusCode}`)
  pass('malformed-json-rejected')
}

// 7. Non-payment event → ignored, 200, no analytics
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), type: 'refund.updated', paymentId, orderId })

  const res = await callWebhook(body)

  assert(res.statusCode === 200 && res.body.ignored === 'unexpected_event_type', 'non-payment event safely ignored')
  assert(trackCalls.length === 0, 'non-payment event must not fire analytics')
  pass('non-payment-event-ignored')
}

// 8. Pending payment → ignored
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId, status: 'APPROVED' })

  const res = await callWebhook(body)

  assert(res.statusCode === 200 && res.body.ignored === 'not_completed', 'pending payment safely ignored')
  assert(trackCalls.length === 0, 'pending payment must not fire analytics')
  pass('pending-payment-ignored')
}

// 9. Failed payment → ignored
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId, status: 'FAILED' })

  const res = await callWebhook(body)

  assert(res.statusCode === 200 && res.body.ignored === 'not_completed', 'failed payment safely ignored')
  assert(trackCalls.length === 0, 'failed payment must not fire analytics')
  pass('failed-payment-ignored')
}

// 10. Completed POS / unrelated Square payment → fulfilled, but never counted as a website purchase
{
  freshTestSetup()
  const orderId = nextId('pos-order') // never registered via recordCheckoutSession
  const paymentId = nextId('payment')
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body)

  assert(res.statusCode === 200 && res.body.processed === true, 'POS payment is still fulfilled (email/inventory/log)')
  assert(trackCalls.length === 0, 'POS/market-booth/invoice/manual payment must never count as a website purchase')
  assert(!(await isWebsiteCheckoutOrder(orderId)), 'sanity: order was never registered as a website checkout')
  assert(orderRows(paymentId).length === 1, 'POS payment still gets exactly one order log row')
  pass('completed-pos-payment-fulfilled-not-counted')
}

// 11. Website Payment Link order — full create-checkout → webhook wiring
{
  freshTestSetup()
  const fakeOrderId = nextId('order')
  const fakePaymentId = nextId('payment')
  let capturedSquareRequestBody = null

  squareLinkFetchHandler = async (url, opts) => {
    capturedSquareRequestBody = JSON.parse(opts.body)
    return { ok: true, json: async () => ({ payment_link: { id: 'link_1', order_id: fakeOrderId, url: 'https://square.link/u/abc123' } }) }
  }

  const checkoutRes = makeRes()
  await createCheckoutHandler(
    { method: 'POST', body: { items: [{ id: charms[0].id, quantity: 1 }], idempotencyKey: 'cart-website-test' } },
    checkoutRes,
  )

  assert(checkoutRes.statusCode === 200, `create-checkout should succeed, got ${checkoutRes.statusCode} ${JSON.stringify(checkoutRes.body)}`)
  assert(capturedSquareRequestBody.order.metadata.checkout_source === 'theretrocharmco.com', 'order stamped with checkout_source metadata')
  assert(await isWebsiteCheckoutOrder(fakeOrderId), 'create-checkout durably recorded the order as a website checkout')

  const body = buildEventBody({ eventId: nextId('evt'), paymentId: fakePaymentId, orderId: fakeOrderId })
  const res = await callWebhook(body)
  assert(res.body.processed === true, 'payment for a real Payment Link order is processed')
  assert(trackCalls.length === 1, 'purchase_completed fires for the website Payment Link order')
  pass('website-payment-link-order-correlated-end-to-end')
}

// 12. PII absent from analytics props and webhook logs
{
  freshTestSetup()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)

  const PII_MARKER = 'pii-should-never-leak+buyer@example.com'
  const body = buildEventBody({
    eventId: nextId('evt'),
    paymentId,
    orderId,
    extraPaymentFields: {
      buyer_email_address: PII_MARKER,
      note: `Ship to Jane Doe, 123 Main St, Springfield — ${PII_MARKER}`,
      card_details: { card: { card_number_suffix: '4242' } },
    },
  })

  const res = await callWebhook(body)
  assert(res.body.processed === true, 'sanity: this delivery was processed')

  const analyticsText = JSON.stringify(trackCalls)
  assert(!analyticsText.includes(PII_MARKER), 'analytics props must not contain buyer PII')
  assert(!analyticsText.includes('4242'), 'analytics props must not contain card details')

  const allowedKeys = new Set(['cart_value', 'currency', 'item_count', 'has_bracelet_builds', 'verified', 'source'])
  for (const call of trackCalls) {
    for (const key of Object.keys(call.props)) {
      assert(allowedKeys.has(key), `unexpected analytics prop key leaked: ${key}`)
    }
  }

  assert(!consoleText().includes(PII_MARKER), 'webhook console logs must not contain buyer PII')
  assert(!consoleText().includes('4242'), 'webhook console logs must not contain card details')
  pass('pii-absent-from-analytics-and-logs')
}

// ═══════════════════════════════════════════════════════════════════════
// PART B — entire-purchase idempotency + failure-injection matrix
// ═══════════════════════════════════════════════════════════════════════

// B1. Checkout session database write fails after Square creates the Payment Link
{
  freshTestSetup()
  resetFakeSupabase()
  const fakeOrderId = nextId('order')

  squareLinkFetchHandler = async () => ({
    ok: true,
    json: async () => ({ payment_link: { id: 'link_x', order_id: fakeOrderId, url: 'https://square.link/u/xyz' } }),
  })
  fakeSupabase.setFailure('checkout_sessions.upsert', 'error')

  const checkoutRes = makeRes()
  await createCheckoutHandler(
    { method: 'POST', body: { items: [{ id: charms[0].id, quantity: 1 }], idempotencyKey: 'cart-db-fail' } },
    checkoutRes,
  )

  assert(checkoutRes.statusCode >= 500 && checkoutRes.statusCode < 600, `db write failure must fail closed with 5xx, got ${checkoutRes.statusCode}`)
  assert(!checkoutRes.body.checkoutUrl, 'must never hand out an uncorrelated checkout URL')
  assert(/failed to durably record checkout session/i.test(consoleText()), 'privacy-safe diagnostic logged')
  assert(!(await isWebsiteCheckoutOrder(fakeOrderId)), 'no correlation record exists for the orphaned Payment Link')
  fakeSupabase.setFailure('checkout_sessions.upsert', null)
  pass('checkout-session-write-failure-fails-closed')
}

// B2. Order logging fails, then a retry resumes it without repeating inventory/email
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fakeSupabase.setFailure('orders.insert', 'error')
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.retryable === true, `order-log failure must request a retry, got ${first.statusCode}`)
  assert(first.body.incomplete.includes('order_logged'), 'incomplete list names order_logged')
  assert(orderRows(paymentId).length === 0, 'no order row yet')
  const invAfterFirst = fakeSupabase.inventoryDecrementCalls.length
  const emailAfterFirst = resendCallLog.length

  fakeSupabase.setFailure('orders.insert', null)
  const retry = await callWebhook(body) // Square redelivers the same event
  assert(retry.statusCode === 200 && retry.body.processed === true, 'retry completes successfully')
  assert(orderRows(paymentId).length === 1, 'exactly one order record after retry')
  assert(fakeSupabase.inventoryDecrementCalls.length === invAfterFirst, 'inventory not re-decremented by the retry (already done on the first attempt)')
  assert(resendCallLog.length === emailAfterFirst, 'fulfillment email not re-sent by the retry (already sent on the first attempt)')
  assert(trackCalls.length === 1, 'analytics fires exactly once across the failure + retry')
  pass('order-logging-failure-then-retry-resumes-only-that-effect')
}

// B3. Termination after the inventory claim but before the decrement is
// impossible by construction: claim + decrement are ONE atomic Postgres
// function call (see supabase/migrations/20260808020000_webhook_crash_safety.sql).
// Any interruption of that call — modeled here as the RPC call itself
// erroring — must leave NEITHER a ledger row NOR a stock decrement, never a
// dangling claim. A retry then performs both together exactly once.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const itemName = realCharms[0].name
  fetchConfig.orderMetadata = { bracelet_1: `silver:${realCharms[0].id}` }
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fakeSupabase.setFailure('rpc.claim_and_decrement_charm_stock', 'error')
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.incomplete.includes('inventory_updated'), 'inventory failure requests a retry')
  assert(decrementCallsFor(itemName).length === 0, 'zero decrements applied when the atomic call fails')
  assert(
    !fakeSupabase.tables.purchase_inventory_decrements.some((r) => r.square_payment_id === paymentId),
    'no dangling ledger claim exists when the atomic call fails — claim and decrement are all-or-nothing',
  )

  fakeSupabase.setFailure('rpc.claim_and_decrement_charm_stock', null)
  const retry = await callWebhook(body)
  assert(retry.statusCode === 200 && retry.body.processed === true, 'retry completes successfully')
  assert(decrementCallsFor(itemName).length === 1, 'exactly one decrement for the item after retry')
  pass('inventory-claim-and-decrement-are-atomic-no-partial-state')
}

// B3b. Termination after the decrement but before completion recording:
// the atomic RPC call fully succeeds (stock actually decremented, ledger
// row committed), but marking inventory_updated_at on purchase_completions
// then fails. A retry must NOT re-decrement (the ledger already covers
// every item) and must successfully record completion this time.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const itemName = realCharms[0].name
  fetchConfig.orderMetadata = { bracelet_1: `silver:${realCharms[0].id}` }
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fakeSupabase.setFailure('purchase_completions.update', (ctx) => (ctx.patch?.inventory_updated_at ? 'error' : null))
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.incomplete.includes('inventory_updated'), 'completion-recording failure requests a retry')
  assert(decrementCallsFor(itemName).length === 1, 'the decrement itself already happened on the first attempt')
  assert(purchaseRow(paymentId).inventory_updated_at == null, 'inventory_updated_at was not recorded on the first attempt')

  fakeSupabase.setFailure('purchase_completions.update', null)
  const retry = await callWebhook(body)
  assert(retry.statusCode === 200 && retry.body.processed === true, 'retry completes successfully')
  assert(decrementCallsFor(itemName).length === 1, 'the item is NEVER decremented a second time — the ledger already covered it')
  assert(purchaseRow(paymentId).inventory_updated_at != null, 'inventory_updated_at now recorded')
  pass('inventory-decrement-succeeds-completion-recording-fails-then-retries-without-redecrementing')
}

// B4. Inventory update partially succeeds — retry only redoes the failed item, never the succeeded one
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const okItem = realCharms[0]
  const failItem = realCharms[1]
  fetchConfig.orderMetadata = { bracelet_1: `silver:${okItem.id},${failItem.id}` }
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fakeSupabase.setFailure('rpc.claim_and_decrement_charm_stock', (ctx) => (ctx.args.p_name === failItem.name ? 'error' : null))
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.incomplete.includes('inventory_updated'), 'partial inventory failure requests a retry')
  assert(decrementCallsFor(okItem.name).length === 1, 'the succeeding item decremented exactly once on the first attempt')
  assert(decrementCallsFor(failItem.name).length === 0, 'the failing item was not decremented on the first attempt')

  fakeSupabase.setFailure('rpc.claim_and_decrement_charm_stock', null)
  const retry = await callWebhook(body)
  assert(retry.statusCode === 200 && retry.body.processed === true, 'retry completes successfully')
  assert(decrementCallsFor(okItem.name).length === 1, 'the already-succeeded item is NEVER decremented again on retry')
  assert(decrementCallsFor(failItem.name).length === 1, 'the previously-failing item is decremented exactly once on retry')
  pass('inventory-partial-success-retry-redoes-only-the-failed-item')
}

// B4b. No inventory decrement for filler links
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  fetchConfig.orderMetadata = { bracelet_1: `silver:${realCharms[0].id},b,b,${realCharms[1].id}` } // 'b' = filler token
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body)
  assert(res.statusCode === 200 && res.body.processed === true, 'order with fillers processes successfully')
  assert(fakeSupabase.inventoryDecrementCalls.length === 2, 'exactly two decrements (the two real charms) — fillers excluded entirely')
  assert(!fakeSupabase.inventoryDecrementCalls.some((c) => /filler/i.test(c.p_name)), 'no decrement call ever references a filler')
  pass('no-inventory-decrement-for-filler-links')
}

// B4c. Same SKU with quantity greater than one (paid as a base bracelet
// line item quantity) — one claim, one decrement, for the FULL quantity.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  fetchConfig.orderLineItems = [{ name: 'Silver Bracelet', quantity: '3', base_price_money: { amount: 1000 } }]
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body)
  assert(res.statusCode === 200 && res.body.processed === true, 'order with quantity > 1 processes successfully')
  const calls = decrementCallsFor('Silver Bracelet')
  assert(calls.length === 1, `exactly one decrement call for the SKU, got ${calls.length}`)
  assert(calls[0].p_qty === 3, `decrement call carries the full summed quantity, got ${calls[0]?.p_qty}`)
  const ledgerRows = fakeSupabase.tables.purchase_inventory_decrements.filter((r) => r.square_payment_id === paymentId)
  assert(ledgerRows.length === 1 && ledgerRows[0].quantity === 3, 'exactly one ledger row recording the full quantity')
  pass('same-sku-quantity-greater-than-one-decremented-once-with-full-qty')
}

// B4d. Same SKU appearing across multiple bracelet builds — sums into one claim/decrement.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const item = realCharms[0]
  // Two separate builds, each containing the same charm once (plus one in
  // the second build twice), for a total of three occurrences.
  fetchConfig.orderMetadata = {
    bracelet_1: `silver:${item.id}`,
    bracelet_2: `silver:${item.id},${item.id}`,
  }
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const res = await callWebhook(body)
  assert(res.statusCode === 200 && res.body.processed === true, 'multi-build order processes successfully')
  const calls = decrementCallsFor(item.name)
  assert(calls.length === 1, `exactly one decrement call across both builds, got ${calls.length}`)
  assert(calls[0].p_qty === 3, `decrement call carries the summed quantity across builds, got ${calls[0]?.p_qty}`)
  pass('same-sku-across-multiple-builds-decremented-once-with-summed-qty')
}

// ── Fulfillment crash-boundary matrix ───────────────────────────────────
// A short lease (read per-request by api/square-webhook.js, not cached at
// import time) lets "stale lease" scenarios below be proven with a real,
// short sleep rather than mocking time.
process.env.FULFILLMENT_LEASE_SECONDS = '1'
const STALE_LEASE_WAIT_MS = 1200

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// B5. Fulfillment email fails with a DEFINITIVE Resend error response — safe
// to release the lease immediately; the very next delivery retries without
// waiting for the lease to expire.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fetchConfig.resendMode = 'error'
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.incomplete.includes('fulfillment_notified'), 'definitive email failure requests a retry')
  assert(purchaseRow(paymentId).fulfillment_notified_at == null, 'not marked sent after a definitive failure')
  assert(purchaseRow(paymentId).fulfillment_state === 'pending', 'lease released immediately after a definitive failure')

  fetchConfig.resendMode = 'ok'
  const retry = await callWebhook(body) // immediate retry — no sleep needed, lease was released
  assert(retry.statusCode === 200 && retry.body.processed === true, 'immediate retry succeeds without waiting for lease expiry')
  assert(uniqueSuccessfulSendCount() === 1, 'exactly one email actually sent')
  pass('fulfillment-definitive-failure-releases-lease-for-immediate-retry')
}

// B5b. Termination after the fulfillment claim but before calling Resend
// ("abandoned worker") — the lease was claimed and nothing else happened.
// A normal delivery must reclaim it once the lease expires and complete
// the send.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)

  const { getOrCreatePurchaseState, claimFulfillmentLease } = await import('../api/_lib/webhookStore.js')
  await getOrCreatePurchaseState(paymentId, orderId)
  const abandonedClaim = await claimFulfillmentLease(paymentId, 1)
  assert(abandonedClaim.claimed === true, 'sanity: the abandoned worker successfully claimed the lease')
  assert(resendCallLog.length === 0, 'sanity: the abandoned worker never called Resend')

  await sleep(STALE_LEASE_WAIT_MS)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })
  const res = await callWebhook(body)

  assert(res.statusCode === 200 && res.body.processed === true, 'a fresh delivery reclaims the abandoned lease and completes')
  assert(uniqueSuccessfulSendCount() === 1, 'exactly one email sent despite the abandoned claim')
  assert(purchaseRow(paymentId).fulfillment_notified_at != null, 'fulfillment_notified now recorded')
  pass('retry-reclaims-an-abandoned-fulfillment-lease-after-expiry')
}

// B5c. Timeout / ambiguous network failure calling Resend — the lease must
// NOT be released (we don't know whether Resend received the request), so
// an immediate retry must be refused; only after the lease expires does a
// retry reclaim and complete, reusing the same idempotency key.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fetchConfig.resendMode = 'throw' // simulated timeout / network drop
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.incomplete.includes('fulfillment_notified'), 'ambiguous failure requests a retry')
  assert(purchaseRow(paymentId).fulfillment_state === 'processing', 'lease is NOT released after an ambiguous failure')
  const capturedIdempotencyKey = resendCallLog.at(-1)?.idempotencyKey
  assert(capturedIdempotencyKey, 'sanity: the attempt carried an idempotency key')

  fetchConfig.resendMode = 'ok'
  const immediateRetry = await callWebhook(body)
  assert(immediateRetry.statusCode === 500, 'an immediate retry must NOT reclaim a live lease')
  assert(uniqueSuccessfulSendCount() === 0, 'no email sent yet — the live lease correctly blocked the immediate retry')

  await sleep(STALE_LEASE_WAIT_MS)
  const staleRetry = await callWebhook(body)
  assert(staleRetry.statusCode === 200 && staleRetry.body.processed === true, 'retry after lease expiry completes successfully')
  assert(resendCallLog.at(-1)?.idempotencyKey === capturedIdempotencyKey, 'the retry reused the SAME idempotency key')
  assert(uniqueSuccessfulSendCount() === 1, 'exactly one email actually sent')
  pass('timeout-during-processing-lease-held-then-reclaimed-after-expiry')
}

// B5d. Termination after Resend accepts the email but before we durably
// record success — Resend actually sent it (and would dedupe a retry via
// the idempotency key), but our own "mark sent" write fails. Must not
// re-send on retry; must eventually record sent once the DB write succeeds.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  fakeSupabase.setFailure('purchase_completions.update', (ctx) => (ctx.patch?.fulfillment_state === 'sent' ? 'error' : null))
  const first = await callWebhook(body)
  assert(first.statusCode === 500 && first.body.incomplete.includes('fulfillment_notified'), 'unrecorded-send failure requests a retry')
  assert(uniqueSuccessfulSendCount() === 1, 'Resend DID accept the email on the first attempt')
  assert(purchaseRow(paymentId).fulfillment_notified_at == null, 'but our own record of that was not durably saved')
  assert(purchaseRow(paymentId).fulfillment_state === 'processing', 'lease is left processing, not released — the email really was sent')

  const immediateRetry = await callWebhook(body)
  assert(immediateRetry.statusCode === 500, 'an immediate retry must not reclaim the live lease and must not re-send')
  assert(uniqueSuccessfulSendCount() === 1, 'still exactly one email sent — no duplicate from the immediate retry attempt')

  fakeSupabase.setFailure('purchase_completions.update', null)
  await sleep(STALE_LEASE_WAIT_MS)
  const staleRetry = await callWebhook(body)
  assert(staleRetry.statusCode === 200 && staleRetry.body.processed === true, 'retry after lease expiry succeeds')
  assert(uniqueSuccessfulSendCount() === 1, 'Resend idempotency ensured the reclaimed retry never actually sent a second email')
  assert(purchaseRow(paymentId).fulfillment_notified_at != null, 'fulfillment_notified now durably recorded')
  pass('crash-after-resend-accepts-but-before-recording-success-no-duplicate-email')
}

// B6. Analytics fails — claimed at-most-once, never blocks fulfillment or retries
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const eventId = nextId('evt')
  const body = buildEventBody({ eventId, paymentId, orderId })

  trackShouldFail = true
  const first = await callWebhook(body)
  trackShouldFail = false

  assert(first.statusCode === 200 && first.body.processed === true, 'fulfillment still completes even though analytics failed')
  assert(trackCalls.length === 1, 'analytics attempted exactly once')
  assert(/analytics.*failed/i.test(consoleText()), 'analytics failure logged without crashing the handler')

  const retry = await callWebhook(body)
  assert(retry.statusCode === 200, 'retry acknowledged')
  assert(trackCalls.length === 1, 'analytics never retried after a failed attempt (at-most-once)')
  pass('analytics-failure-at-most-once-does-not-block-fulfillment')
}

// B7. Supabase temporarily becomes unavailable, then recovers
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  fakeSupabase.setGlobalOutage(true)
  const registerAttempt = await (async () => {
    const { recordCheckoutSession } = await import('../api/_lib/webhookStore.js')
    return recordCheckoutSession(orderId, 'cart-outage')
  })()
  assert(registerAttempt.ok === false, 'checkout session write fails during outage (sanity)')

  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })
  const duringOutage = await callWebhook(body)
  assert(duringOutage.statusCode === 500 && duringOutage.body.error === 'durable_store_unavailable', 'fails closed during total outage')
  assert(orderRows(paymentId).length === 0, 'no order logged during outage')
  assert(fakeSupabase.inventoryDecrementCalls.length === 0, 'no inventory touched during outage')
  assert(resendCallLog.length === 0, 'no email sent during outage')
  assert(trackCalls.length === 0, 'no analytics fired during outage')

  fakeSupabase.setGlobalOutage(false)
  await registerWebsiteOrder(orderId)
  const afterRecovery = await callWebhook(body)
  assert(afterRecovery.statusCode === 200 && afterRecovery.body.processed === true, 'delivery succeeds once Supabase recovers')
  assert(orderRows(paymentId).length === 1, 'exactly one order record after recovery')
  assert(trackCalls.length === 1, 'exactly one purchase_completed after recovery')
  pass('supabase-outage-then-recovery-fails-closed-and-resumes')
}

// B8. The same event_id is delivered again
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const eventId = nextId('evt')
  const body = buildEventBody({ eventId, paymentId, orderId })

  const first = await callWebhook(body)
  const second = await callWebhook(body) // exact redelivery

  assert(first.statusCode === 200 && first.body.processed === true, 'first delivery processed')
  assert(second.statusCode === 200 && second.body.alreadyCompleted === true, 'redelivery recognized as already complete')
  assert(orderRows(paymentId).length === 1, 'one order record')
  assert(fakeSupabase.inventoryDecrementCalls.length === 0, 'sanity: this order has no charm line items to decrement')
  assert(resendCallLog.length === 1, 'exactly one fulfillment email')
  assert(trackCalls.length === 1, 'exactly one purchase_completed')
  pass('same-event-id-redelivered-is-idempotent')
}

// B9 + B10. A different event_id for the same payment, and a later payment.updated
// for an already-fulfilled payment — neither repeats any side effect.
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)

  const bodyA = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })
  const bodyB = buildEventBody({ eventId: nextId('evt'), paymentId, orderId }) // different event_id, same payment
  const bodyC = buildEventBody({ eventId: nextId('evt'), paymentId, orderId }) // a later payment.updated, same payment

  const resA = await callWebhook(bodyA)
  const resB = await callWebhook(bodyB)
  const resC = await callWebhook(bodyC)

  assert(resA.body.processed === true, 'first event for this payment processed')
  assert(resB.statusCode === 200 && resB.body.alreadyCompleted === true, 'different event_id for the same payment is recognized as already complete')
  assert(resC.statusCode === 200 && resC.body.alreadyCompleted === true, 'a later event for an already-fulfilled payment repeats nothing')
  assert(orderRows(paymentId).length === 1, 'exactly one order record across all three deliveries')
  assert(resendCallLog.length === 1, 'exactly one fulfillment email across all three deliveries')
  assert(trackCalls.length === 1, 'exactly one purchase_completed across all three deliveries')
  pass('different-event-ids-and-later-updates-for-one-payment-counted-once')
}

// B11. Two identical webhook requests execute concurrently
{
  freshTestSetup()
  resetFakeSupabase()
  const orderId = nextId('order')
  const paymentId = nextId('payment')
  await registerWebsiteOrder(orderId)
  const body = buildEventBody({ eventId: nextId('evt'), paymentId, orderId })

  const [resX, resY] = await Promise.all([callWebhook(body), callWebhook(body)])

  // Exactly one of the two concurrent deliveries wins the fulfillment
  // lease and actually calls Resend; the loser correctly reports
  // "incomplete, retry" (500) for ITS OWN delivery rather than falsely
  // claiming success on work a sibling request is doing — Square would
  // simply redeliver it later, by which point it resolves to 200 via the
  // usual already-complete fast path (proven by the follow-up call below).
  const statusCodes = [resX.statusCode, resY.statusCode].sort((a, b) => a - b)
  assert(
    (statusCodes[0] === 200 && statusCodes[1] === 200) || (statusCodes[0] === 200 && statusCodes[1] === 500),
    `expected one winner (200) and at most one legitimately-incomplete loser (500), got ${resX.statusCode}/${resY.statusCode}`,
  )
  assert(orderRows(paymentId).length === 1, 'exactly one order record despite concurrent execution')
  assert(uniqueSuccessfulSendCount() === 1, 'exactly one fulfillment email despite concurrent execution')
  assert(trackCalls.length === 1, 'at most one purchase_completed despite concurrent execution')

  // A follow-up delivery (standing in for Square's redelivery of the loser,
  // if there was one) must converge cleanly with no additional side effects.
  const followUp = await callWebhook(buildEventBody({ eventId: nextId('evt'), paymentId, orderId }))
  assert(followUp.statusCode === 200 && followUp.body.processed === true, 'follow-up delivery converges to processed')
  assert(orderRows(paymentId).length === 1, 'still exactly one order record after convergence')
  assert(uniqueSuccessfulSendCount() === 1, 'still exactly one fulfillment email after convergence')
  assert(trackCalls.length === 1, 'still at most one purchase_completed after convergence')
  assert(purchaseRow(paymentId).completed_at != null, 'purchase state reaches completed')
  pass('concurrent-identical-requests-converge-to-one-of-everything')
}

restoreConsole()

console.log(
  JSON.stringify(
    {
      ok: true,
      note: 'Square webhook hardening + failure-recovery suite passed: signature verification, event qualification, website-order correlation, entire-purchase idempotency, and resumable failure recovery all proven with no network calls.',
      results,
    },
    null,
    2,
  ),
)

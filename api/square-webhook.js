import { WebhooksHelper } from 'square'
import { charms, BASE_OPTIONS } from '../src/data/charms.js'
import { ACCESSORY_PRODUCTS } from '../src/data/sellableProducts.js'
import { trackPurchaseCompleted } from './_lib/trackPurchase.js'
import {
  claimAndDecrementInventoryItem,
  claimFulfillmentLease,
  claimWebhookEventId,
  getOrCreatePurchaseState,
  getSupabaseClientForWebhook,
  isDurableStoreConfigured,
  isWebsiteCheckoutOrder,
  markEffectDone,
  markFulfillmentSent,
  PURCHASE_EFFECT,
  recordLastError,
  releaseFulfillmentLease,
} from './_lib/webhookStore.js'

const DEFAULT_SITE_URL = 'https://www.theretrocharmco.com'

/**
 * Square event types this handler is willing to act on. Anything else
 * (refunds, disputes, catalog changes, etc.) is acknowledged with 200 and
 * ignored — see the EXPECTED_PAYMENT_EVENT_TYPES check in the handler.
 */
const EXPECTED_PAYMENT_EVENT_TYPES = new Set(['payment.created', 'payment.updated'])

/**
 * Notification-type component of the Resend Idempotency-Key
 * (`${FULFILLMENT_NOTIFICATION_TYPE}:${paymentId}`) — stable across every
 * retry of the fulfillment email for a given payment. See sendOrderEmail.
 */
const FULFILLMENT_NOTIFICATION_TYPE = 'fulfillment_email'

/**
 * How long a fulfillment-notification processing claim is honored before
 * it's considered abandoned and reclaimable — see claimFulfillmentLease.
 * Read per-request (not cached at module load) so it can be tuned via env
 * without a redeploy, and so tests can use a short lease. Defaults to 120s.
 */
function getFulfillmentLeaseSeconds() {
  const configured = Number(process.env.FULFILLMENT_LEASE_SECONDS)
  return Number.isFinite(configured) && configured > 0 ? configured : 120
}
const FROM_EMAIL = 'RetroCharm Co <orders@theretrocharmco.com>'
const FALLBACK_FROM_EMAIL = 'RetroCharm Co <onboarding@resend.dev>'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const CATALOG_NAMES = new Map()
const CATALOG_IMAGES = new Map()
const WATCH_PRODUCT_IDS = new Set()
const WATCH_PRODUCT_NAMES = new Set()

for (const charm of charms) {
  CATALOG_NAMES.set(charm.id, charm.name)
  if (charm.image) CATALOG_IMAGES.set(charm.id, charm.image)
  if (charm.id.includes('watch') || /\bwatch\b/i.test(charm.name)) {
    WATCH_PRODUCT_IDS.add(charm.id)
    WATCH_PRODUCT_NAMES.add(charm.name)
  }
}
for (const base of BASE_OPTIONS) {
  CATALOG_NAMES.set(base.id, base.label)
  if (base.image) CATALOG_IMAGES.set(base.id, base.image)
  if (base.id.includes('watch') || /\bwatch\b/i.test(base.label)) {
    WATCH_PRODUCT_IDS.add(base.id)
    WATCH_PRODUCT_NAMES.add(base.label)
  }
}
for (const a of ACCESSORY_PRODUCTS) {
  CATALOG_NAMES.set(a.id, a.name)
  if (a.image) CATALOG_IMAGES.set(a.id, a.image)
}

// Line-item display name → metal for base bracelets / watch bands, so we can
// decrement the base itself (charms come from the parsed bracelet builds). Covers
// both the builder base labels (e.g. "Silver Bracelet") and the catalog starter
// bracelet names (e.g. "Silver Base", "Gold Apple Watch").
const BASE_NAME_TO_METAL = {
  'Silver Bracelet': 'silver',
  'Gold Bracelet': 'gold',
  'Silver Watch Band': 'silver',
  'Gold Watch Band': 'gold',
}

/**
 * Public site origin for email <img> src. Always https:// — never localhost,
 * relative hosts, or protocol-relative URLs (email clients cannot load those).
 */
function getSiteUrl() {
  const configured = process.env.VITE_SITE_URL
  const candidates = [
    typeof configured === 'string' ? configured.trim() : '',
    DEFAULT_SITE_URL,
  ]

  for (const raw of candidates) {
    if (!raw) continue
    try {
      const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      const url = new URL(withProtocol)
      if (url.protocol !== 'https:') continue
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') continue
      return `${url.protocol}//${url.host}`.replace(/\/$/, '')
    } catch {
      // try next candidate
    }
  }

  return DEFAULT_SITE_URL
}

/**
 * Absolute https URL for a public asset. Catalog paths are `/images/...webp`;
 * email uses sibling `.png` files (email clients often break on WebP).
 */
function absolutePublicImageUrl(siteUrl, relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath || typeof relativeOrAbsolutePath !== 'string') {
    return null
  }

  let path = relativeOrAbsolutePath.trim()
  if (!path) return null

  // Already absolute — still normalize to our public https origin when possible.
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path)
      path = parsed.pathname
    } catch {
      return null
    }
  }

  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  // Prefer PNG for email clients (Outlook etc. often show blank boxes for WebP).
  if (path.toLowerCase().endsWith('.webp')) {
    path = `${path.slice(0, -5)}.png`
  }

  const origin = (siteUrl || getSiteUrl()).replace(/\/$/, '')
  return `${origin}${path}`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function textToHtmlParagraphs(text) {
  if (!text) return ''
  return escapeHtml(text)
    .split('\n')
    .map((line) => (line.length === 0 ? '<br>' : line))
    .join('<br>\n')
}

const FILLER_METADATA_TOKEN = 'b'

function formatMetalLabel(metal) {
  if (metal === 'silver') return 'Silver'
  if (metal === 'gold') return 'Gold'
  return metal
}

function isWatchProductId(id) {
  return typeof id === 'string' && WATCH_PRODUCT_IDS.has(id)
}

function isWatchProductName(name) {
  return typeof name === 'string' && (WATCH_PRODUCT_NAMES.has(name) || /\bwatch\b/i.test(name))
}

function resolveBaseFromMetadataKey(baseKey) {
  const base = BASE_OPTIONS.find((b) => b.id === baseKey)
  if (base) {
    return {
      baseId: base.id,
      metal: base.metal,
      label: base.label,
      isWatch: isWatchProductId(base.id),
    }
  }

  // Legacy metadata used only metal (`silver` / `gold`) as the prefix.
  const metal = baseKey === 'gold' || baseKey.startsWith('gold') ? 'gold' : 'silver'
  return {
    baseId: baseKey,
    metal,
    label: formatMetalLabel(metal),
    isWatch: isWatchProductId(baseKey) || /\bwatch\b/i.test(baseKey),
  }
}

function isFillerSlotToken(id) {
  return (
    id === FILLER_METADATA_TOKEN ||
    id === 's-plain-filler' ||
    id === 'g-plain-filler' ||
    id === 'plain' ||
    id === '_'
  )
}

/** Human-readable label for a slot id in order emails (includes blank fillers). */
function charmDisplayName(id, metal) {
  if (isFillerSlotToken(id)) {
    return metal === 'gold'
      ? 'Plain filler (blank gold spacer)'
      : 'Plain filler (blank silver spacer)'
  }
  return CATALOG_NAMES.get(id) ?? id
}

/** Relative catalog image path for a slot id (catalog or filler). */
function charmImagePath(id, metal) {
  if (isFillerSlotToken(id)) {
    return metal === 'gold'
      ? '/images/charms/plain-gold-link.webp'
      : '/images/charms/plain-silver-link.webp'
  }
  return CATALOG_IMAGES.get(id) ?? null
}

/** Absolute https:// PNG URL for an email <img> tag (null if unknown). */
function charmEmailImageUrl(id, metal, siteUrl) {
  return absolutePublicImageUrl(siteUrl, charmImagePath(id, metal))
}

function parseBraceletBuilds(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return []
  }

  const braceletEntries = Object.entries(metadata)
    .filter(([key]) => /^bracelet_\d+$/.test(key))
    .sort(([keyA], [keyB]) => {
      const numA = Number(keyA.replace('bracelet_', ''))
      const numB = Number(keyB.replace('bracelet_', ''))
      return numA - numB
    })

  const builds = []

  for (const [key, value] of braceletEntries) {
    if (typeof value !== 'string') continue

    const colonIndex = value.indexOf(':')
    if (colonIndex === -1) continue

    const baseKey = value.slice(0, colonIndex)
    const { metal, label, isWatch } = resolveBaseFromMetadataKey(baseKey)
    const idsPart = value.slice(colonIndex + 1)
    const ids = idsPart ? idsPart.split(',').filter((id) => id.length > 0) : []

    builds.push({
      num: key.replace('bracelet_', ''),
      metal,
      label,
      isWatch,
      ids,
    })
  }

  return builds
}

function formatLineItemsSection(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return ''
  }

  const lines = []

  for (const item of lineItems) {
    if (!item || typeof item !== 'object') continue

    const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Unknown item'
    const quantity = item.quantity ?? '1'
    const unitAmount = formatAmount(item.base_price_money)
    const watchTag = isWatchProductName(name) ? ' [Watch]' : ''

    lines.push(`- ${quantity} × ${name}${watchTag} — ${unitAmount} each`)
  }

  if (lines.length === 0) {
    return ''
  }

  return lines.join('\n')
}

/**
 * Fulfillment guide: every slot in saved builder order, including plain fillers.
 * Do not sort, group, or de-duplicate — positions must match the bracelet.
 */
function formatBraceletBuilds(builds) {
  if (!Array.isArray(builds) || builds.length === 0) {
    return ''
  }

  const lines = [
    'Assemble left → right (exact builder sequence, including plain fillers):',
  ]

  for (const build of builds) {
    const kind = build.isWatch ? 'Watch' : 'Bracelet'
    lines.push('')
    lines.push(`${kind} ${build.num} — ${build.label} — ${build.ids.length} positions:`)
    build.ids.forEach((id, index) => {
      lines.push(`Position ${index + 1}: ${charmDisplayName(id, build.metal)}`)
    })
  }

  return lines.join('\n')
}

/** HTML charm-strip preview matching the builder layout (for fulfillment emails). */
function formatBraceletBuildsHtml(builds, siteUrl) {
  if (!Array.isArray(builds) || builds.length === 0) {
    return ''
  }

  const sections = builds.map((build) => {
    const kind = build.isWatch ? 'Watch' : 'Bracelet'
    const heading = `${kind} ${build.num} — ${build.label} — ${build.ids.length} positions`

    const positionCells = build.ids
      .map((_, index) => {
        return `<td style="padding:0 2px 4px;text-align:center;font-size:10px;font-weight:600;color:#666;vertical-align:bottom;">${index + 1}</td>`
      })
      .join('\n')

    const cells = build.ids
      .map((id) => {
        const name = charmDisplayName(id, build.metal)
        const src = charmEmailImageUrl(id, build.metal, siteUrl)
        if (!src) {
          return `<td style="padding:2px;border:1px solid #d4c4a8;background:#fff;vertical-align:middle;text-align:center;width:44px;height:44px;font-size:10px;color:#666;">${escapeHtml(name)}</td>`
        }
        // Absolute https PNG — email clients cannot load relative/app-bundled/WebP assets reliably.
        return `<td style="padding:2px;border:1px solid #d4c4a8;background:#fff;vertical-align:middle;width:44px;height:44px;">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(name)}" width="40" height="40" border="0" style="display:block;width:40px;height:40px;border:0;outline:none;text-decoration:none;" />
</td>`
      })
      .join('\n')

    const listItems = build.ids
      .map((id, index) => {
        const name = charmDisplayName(id, build.metal)
        const fillerNote = isFillerSlotToken(id)
          ? ' <span style="color:#888;">← blank spacer</span>'
          : ''
        return `<li style="margin:0 0 4px;">Position ${index + 1}: ${escapeHtml(name)}${fillerNote}</li>`
      })
      .join('\n')

    return `<div style="margin:16px 0 24px;">
  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a1a;">${escapeHtml(heading)}</p>
  <p style="margin:0 0 10px;font-size:12px;color:#666;">Left → right as arranged in the builder (plain fillers included)</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:2px;">
    <tr>
${positionCells}
    </tr>
    <tr>
${cells}
    </tr>
  </table>
  <ol style="margin:12px 0 0;padding-left:0;list-style:none;font-size:13px;color:#333;line-height:1.45;">
${listItems}
  </ol>
</div>`
  })

  return `<h2 style="margin:24px 0 4px;font-size:16px;color:#1a1a1a;">Assemble left → right</h2>
<p style="margin:0 0 8px;font-size:13px;color:#555;">Use this sequence to build each bracelet. Positions match the customer&rsquo;s layout, including auto-added plain fillers.</p>
${sections.join('\n')}`
}

function formatAmount(amountMoney) {
  if (!amountMoney || typeof amountMoney.amount !== 'number') {
    return 'Unknown'
  }

  const dollars = (amountMoney.amount / 100).toFixed(2)
  const currency = amountMoney.currency || 'USD'
  return `${currency} ${dollars}`
}

function formatShippingSection(recipient) {
  if (!recipient) {
    return 'Shipping address not found'
  }

  const { display_name, phone_number, address } = recipient
  const lines = []

  if (display_name) lines.push(`Recipient name: ${display_name}`)
  if (phone_number) lines.push(`Phone: ${phone_number}`)

  if (address) {
    if (address.address_line_1) lines.push(`Address line 1: ${address.address_line_1}`)
    if (address.address_line_2) lines.push(`Address line 2: ${address.address_line_2}`)
    if (address.locality) lines.push(`City: ${address.locality}`)
    if (address.administrative_district_level_1) {
      lines.push(`State: ${address.administrative_district_level_1}`)
    }
    if (address.postal_code) lines.push(`Postal code: ${address.postal_code}`)
  }

  return lines.length > 0 ? lines.join('\n') : 'Shipping address not found'
}

async function fetchOrderDetails(orderId, accessToken) {
  if (!orderId || !accessToken) {
    return { recipient: null, metadata: null, lineItems: [] }
  }

  try {
    const res = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-07-17',
      },
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`Square order lookup failed (${res.status}):`, errorBody)
      return { recipient: null, metadata: null, lineItems: [] }
    }

    const data = await res.json()
    const order = data.order

    return {
      recipient: order?.fulfillments?.[0]?.shipment_details?.recipient ?? null,
      metadata: order?.metadata ?? null,
      lineItems: Array.isArray(order?.line_items) ? order.line_items : [],
    }
  } catch (error) {
    console.error('Square order lookup error:', error)
    return { recipient: null, metadata: null, lineItems: [] }
  }
}

/**
 * Send the fulfillment email via Resend and report exactly what happened —
 * never throws, so the caller can tell a DEFINITIVE failure (Resend gave us
 * an explicit answer; safe to release the fulfillment lease immediately)
 * apart from an AMBIGUOUS one (a network-level error/timeout; Resend's own
 * state is unknown, so the lease must be left to expire naturally rather
 * than risk a second send racing a possibly-still-in-flight first one).
 *
 * `idempotencyKey` must be stable across retries for the same notification
 * (derived from the Square payment ID + notification type by the caller) —
 * Resend honors `Idempotency-Key` for 24h, so any retry that reaches this
 * function again — whether because our own claim expired after an ambiguous
 * failure, or a completely different process reclaimed it — is safe even if
 * the first attempt actually reached Resend.
 *
 * @returns {Promise<{ ok: boolean, definitive?: boolean, reason?: string }>}
 */
async function sendOrderEmail({
  to,
  payment,
  timestamp,
  lineItemsSection,
  braceletBuilds,
  shippingSection,
  idempotencyKey,
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return { ok: false, definitive: true, reason: 'RESEND_API_KEY is not configured' }
  }

  const paymentId = payment?.id ?? 'Unknown'
  const orderId = payment?.order_id ?? 'Unknown'
  const amount = formatAmount(payment?.amount_money)
  const siteUrl = getSiteUrl()
  const braceletSection = formatBraceletBuilds(braceletBuilds)
  const braceletHtml = formatBraceletBuildsHtml(braceletBuilds, siteUrl)

  const textParts = [
    'A new order has been completed on RetroCharm Co.',
    '',
    `Payment amount: ${amount}`,
    `Payment ID: ${paymentId}`,
    `Order ID: ${orderId}`,
    `Timestamp: ${timestamp}`,
  ]

  if (braceletSection) {
    textParts.push('', braceletSection)
  }

  if (lineItemsSection) {
    textParts.push(
      '',
      'Paid cart items (inventory / quantities — not left-to-right build order):',
      lineItemsSection,
    )
  }

  textParts.push('', shippingSection)

  const text = textParts.join('\n')

  const headerHtml = `<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">A new order has been completed on RetroCharm Co.</p>
<p style="margin:0 0 4px;font-size:14px;color:#333;"><strong>Payment amount:</strong> ${escapeHtml(amount)}</p>
<p style="margin:0 0 4px;font-size:14px;color:#333;"><strong>Payment ID:</strong> ${escapeHtml(paymentId)}</p>
<p style="margin:0 0 4px;font-size:14px;color:#333;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#333;"><strong>Timestamp:</strong> ${escapeHtml(timestamp)}</p>`

  const lineItemsHtml = lineItemsSection
    ? `<div style="margin:24px 0 0;font-size:14px;color:#333;line-height:1.5;">
  <h2 style="margin:0 0 8px;font-size:16px;color:#1a1a1a;">Paid cart items</h2>
  <p style="margin:0 0 8px;font-size:12px;color:#666;">Quantities for inventory — not the left-to-right charm order.</p>
  ${textToHtmlParagraphs(lineItemsSection)}
</div>`
    : ''

  const shippingHtml = `<div style="margin:24px 0 0;font-size:14px;color:#333;line-height:1.5;">
  <h2 style="margin:0 0 8px;font-size:16px;color:#1a1a1a;">Shipping</h2>
  ${textToHtmlParagraphs(shippingSection)}
</div>`

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#faf7f2;color:#1a1a1a;">
  <div style="max-width:960px;margin:0 auto;background:#ffffff;border:1px solid #e8dcc8;border-radius:12px;padding:24px;">
    ${headerHtml}
    ${braceletHtml}
    ${lineItemsHtml}
    ${shippingHtml}
  </div>
</body>
</html>`

  const payload = {
    from: FROM_EMAIL,
    to: [to],
    subject: 'New RetroCharm Co Order',
    text,
    html,
  }

  const idempotencyHeaders = {
    Authorization: `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  }

  let res
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: idempotencyHeaders,
      body: JSON.stringify(payload),
    })
  } catch (networkError) {
    return { ok: false, definitive: false, reason: `network error: ${networkError?.message ?? networkError}` }
  }

  if (!res.ok) {
    const errorBody = await res.text()
    const shouldRetryWithFallback =
      payload.from === FROM_EMAIL &&
      (res.status === 403 || errorBody.toLowerCase().includes('domain'))

    if (shouldRetryWithFallback) {
      console.warn('Primary sender failed; retrying with Resend onboarding address')
      payload.from = FALLBACK_FROM_EMAIL
      try {
        res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: idempotencyHeaders,
          body: JSON.stringify(payload),
        })
      } catch (networkError) {
        return { ok: false, definitive: false, reason: `network error on fallback: ${networkError?.message ?? networkError}` }
      }
    }

    if (!res.ok) {
      const retryErrorBody = await res.text()
      return { ok: false, definitive: true, reason: `Resend API error (${res.status}): ${retryErrorBody}` }
    }
  }

  return { ok: true }
}

/**
 * Inventory row name for a build slot id (real charm catalog name), or null
 * for a slot that must never be inventoried. Plain fillers are free blank
 * spacers auto-added by the builder to fill unused links — they are not a
 * stocked product, so they must never generate a decrement attempt.
 */
function inventoryNameForBuildId(id) {
  if (isFillerSlotToken(id)) return null
  return CATALOG_NAMES.get(id) ?? null
}

/**
 * Decrement Supabase stock for everything in a completed order, resuming
 * safely across retries via claimAndDecrementInventoryItem — each distinct
 * (name, metal) tally's ledger claim AND its actual stock decrement happen
 * together in one atomic Postgres function call (see
 * supabase/migrations/20260808020000_webhook_crash_safety.sql), so there is
 * no crash window between "claimed" and "applied" to protect against: the
 * item is either fully decremented (ledger row + stock update both
 * committed) or not decremented at all (nothing committed). A repeat call
 * for an item that already succeeded is a safe, explicit no-op.
 *
 * Same SKU appearing multiple times in one build, or across multiple
 * builds, or as a paid quantity > 1, all correctly sum into a single tally
 * entry — one claim, one decrement, for the total quantity — never one
 * claim per occurrence.
 *
 * @param {string} paymentId
 * @param {ReturnType<typeof parseBraceletBuilds>} braceletBuilds
 * @param {any[]} lineItems
 * @returns {Promise<{ allSucceeded: boolean, attempted: number, succeeded: number, failed: string[] }>}
 */
async function decrementInventoryForOrder(paymentId, braceletBuilds, lineItems) {
  if (!getSupabaseClientForWebhook()) {
    console.warn('Inventory decrement skipped: Supabase is not configured')
    return { allSucceeded: false, attempted: 0, succeeded: 0, failed: ['supabase_not_configured'] }
  }

  /** @type {Map<string, { name: string, metal: string, qty: number }>} */
  const tally = new Map()

  const addTally = (name, metal, qty) => {
    if (!name || !metal || !Number.isFinite(qty) || qty <= 0) return
    const key = `${name}|||${metal}`
    const existing = tally.get(key)
    if (existing) {
      existing.qty += qty
    } else {
      tally.set(key, { name, metal, qty })
    }
  }

  // Charms: every non-filler position in every parsed bracelet build.
  if (Array.isArray(braceletBuilds)) {
    for (const build of braceletBuilds) {
      if (!build || !Array.isArray(build.ids)) continue
      for (const id of build.ids) {
        addTally(inventoryNameForBuildId(id), build.metal, 1)
      }
    }
  }

  // Base bracelet / watch band: match paid line items against known base names.
  if (Array.isArray(lineItems)) {
    for (const item of lineItems) {
      if (!item || typeof item !== 'object') continue
      const name = typeof item.name === 'string' ? item.name.trim() : ''
      const metal = BASE_NAME_TO_METAL[name]
      if (!metal) continue
      const parsedQty = Number.parseInt(item.quantity, 10)
      addTally(name, metal, Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1)
    }
  }

  const items = [...tally.values()]

  if (items.length === 0) {
    console.log('Inventory decrement: nothing to decrement for this order')
    return { allSucceeded: true, attempted: 0, succeeded: 0, failed: [] }
  }

  let succeeded = 0
  const failed = []

  for (const { name, metal, qty } of items) {
    const itemKey = `${name}|||${metal}`
    const result = await claimAndDecrementInventoryItem(paymentId, itemKey, name, metal, qty)

    if (result.ok) {
      succeeded += 1
    } else {
      console.error(`Inventory decrement: could not confirm "${name}" (${metal}) x${qty} — leaving retryable`)
      failed.push(itemKey)
    }
  }

  const allSucceeded = failed.length === 0
  console.log('Inventory decrement summary:', { attempted: items.length, succeeded, failed })
  return { allSucceeded, attempted: items.length, succeeded, failed }
}

/**
 * Log a completed order to Supabase for reporting (independent of Square's
 * dashboard). Idempotent and resumable: `orders.square_payment_id` has a
 * unique constraint, so a conflicting insert (from a previous attempt that
 * succeeded but crashed before this function returned) is treated as
 * already-logged success, not a failure — and order_items are only inserted
 * if none exist yet for that order, so a retry never duplicates line items.
 * @returns {Promise<{ ok: boolean, reason?: string, orderRowId?: string }>}
 */
async function logOrderToSupabase({ payment, recipient, lineItems, braceletBuilds }) {
  const supabase = getSupabaseClientForWebhook()
  if (!supabase) {
    console.warn('Order log skipped: Supabase is not configured')
    return { ok: false, reason: 'supabase_not_configured' }
  }

  const amountCents = payment?.amount_money?.amount
  if (!Number.isFinite(amountCents)) {
    console.warn('Order log skipped: missing payment amount')
    return { ok: false, reason: 'missing_amount' }
  }

  let orderRowId = null

  const { data: inserted, error: insertError } = await supabase
    .from('orders')
    .insert({
      square_payment_id: payment?.id,
      square_order_id: payment?.order_id ?? null,
      channel: recipient ? 'online' : 'in_person',
      status: 'completed',
      amount_cents: amountCents,
      currency: payment?.amount_money?.currency ?? 'USD',
      customer_name: recipient?.display_name ?? null,
      customer_phone: recipient?.phone_number ?? null,
      shipping_address: recipient?.address ?? null,
      bracelet_builds:
        Array.isArray(braceletBuilds) && braceletBuilds.length > 0 ? braceletBuilds : null,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      // Already logged by a previous attempt (possibly one that crashed
      // before confirming success back to the orchestrator) — idempotent,
      // not a failure.
      const { data: existing, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('square_payment_id', payment?.id)
        .single()
      if (fetchError || !existing) {
        console.error('Order log: conflict on insert but could not fetch existing row:', fetchError?.message ?? fetchError)
        return { ok: false, reason: 'conflict_fetch_failed' }
      }
      orderRowId = existing.id
    } else {
      console.error('Order log failed (orders insert):', insertError.message ?? insertError)
      return { ok: false, reason: 'orders_insert_failed' }
    }
  } else {
    orderRowId = inserted?.id ?? null
  }

  if (!orderRowId) {
    return { ok: false, reason: 'missing_order_row_id' }
  }

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const { data: existingItems, error: existingItemsError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderRowId)

    if (existingItemsError) {
      console.error('Order log: could not check existing order_items:', existingItemsError.message ?? existingItemsError)
      return { ok: false, reason: 'order_items_check_failed' }
    }

    if (!existingItems || existingItems.length === 0) {
      const itemRows = lineItems
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          order_id: orderRowId,
          name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Unknown item',
          quantity: Number.parseInt(item.quantity, 10) || 1,
          unit_amount_cents: item.base_price_money?.amount ?? null,
        }))

      const { error: itemsError } = await supabase.from('order_items').insert(itemRows)
      if (itemsError) {
        console.error('Order log failed (order_items insert):', itemsError.message ?? itemsError)
        return { ok: false, reason: 'order_items_insert_failed' }
      }
    }
  }

  console.log('Order logged:', { paymentId: payment?.id, orderId: orderRowId })
  return { ok: true, orderRowId }
}

/**
 * Build the non-sensitive purchase_completed payload. Never include buyer
 * name, email, phone, address, payment details/card data, or the raw
 * webhook payload — only anonymous order reference, value, currency,
 * product/build category signal, and (future) campaign attribution already
 * associated with the checkout.
 */
function buildPurchaseAnalyticsProps({ payment, lineItems, braceletBuilds }) {
  return {
    amountCents: payment?.amount_money?.amount ?? null,
    currency: payment?.amount_money?.currency ?? 'USD',
    itemCount: Array.isArray(lineItems)
      ? lineItems.reduce((sum, item) => sum + (Number.parseInt(item.quantity, 10) || 1), 0)
      : null,
    hasBraceletBuilds: Array.isArray(braceletBuilds) && braceletBuilds.length > 0,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── 1. Signature verification (fail closed on missing production config) ──
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL

  if (!signatureKey || !notificationUrl) {
    console.error(
      'square-webhook: rejected — missing required production configuration',
      { hasSignatureKey: Boolean(signatureKey), hasNotificationUrl: Boolean(notificationUrl) },
    )
    return res.status(500).json({ error: 'Webhook is not configured' })
  }

  const signatureHeader = req.headers['x-square-hmacsha256-signature']
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    console.warn('square-webhook: rejected — missing signature header')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Raw, untouched body — read before any JSON parsing so verification runs
  // against exactly the bytes Square signed.
  const rawBody = await readRawBody(req)

  let signatureValid
  try {
    // Square's official SDK helper: timing-safe, HMAC-SHA256 over
    // (notificationUrl + rawBody), keyed by the signature key. Never
    // reimplemented by hand.
    signatureValid = await WebhooksHelper.verifySignature({
      requestBody: rawBody,
      signatureHeader,
      signatureKey,
      notificationUrl,
    })
  } catch (error) {
    console.error('square-webhook: signature verification threw:', error?.message ?? error)
    signatureValid = false
  }

  if (!signatureValid) {
    console.warn('square-webhook: rejected — invalid signature')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // ── 2. Parse (only after verifying the raw bytes) ──────────────────────
  let event
  try {
    event = JSON.parse(rawBody)
  } catch (parseError) {
    console.warn('square-webhook: rejected — malformed JSON payload:', parseError?.message ?? parseError)
    return res.status(400).json({ error: 'Malformed payload' })
  }

  const eventId = typeof event?.event_id === 'string' && event.event_id ? event.event_id : null
  const eventType = typeof event?.type === 'string' ? event.type : null

  if (!eventId) {
    console.warn('square-webhook: rejected — signed payload missing event_id')
    return res.status(400).json({ error: 'Malformed payload' })
  }

  // ── 3. Webhook delivery audit log (Square event_id) ─────────────────────
  // Best-effort, non-gating: logged purely for observability ("how many
  // times was this delivered"). Processing itself is never skipped based on
  // event_id alone — see step 6, which resumes strictly from durable
  // per-effect state instead. Gating on event_id was the original design's
  // failure window: an event claimed-but-not-finished (e.g. the process
  // crashed mid-fulfillment) would look "seen" forever and a Square retry
  // of that exact event would be discarded instead of resuming the
  // incomplete work.
  const eventLog = await claimWebhookEventId(eventId, eventType)
  if (!eventLog.unavailable && !eventLog.claimed) {
    console.log('square-webhook: redelivery observed for event_id (informational only)', { eventId, eventType })
  }

  // ── 4. Event qualification ──────────────────────────────────────────────
  if (!eventType || !EXPECTED_PAYMENT_EVENT_TYPES.has(eventType)) {
    console.log('square-webhook: ignored — unexpected event type', { eventId, eventType })
    return res.status(200).json({ received: true, ignored: 'unexpected_event_type' })
  }

  const payment = event.data?.object?.payment
  const status = payment?.status

  if (status !== 'COMPLETED') {
    console.log('square-webhook: ignored — payment not completed', {
      eventId,
      eventType,
      status: status ?? 'unknown',
    })
    return res.status(200).json({ received: true, ignored: 'not_completed' })
  }

  const paymentId = typeof payment?.id === 'string' && payment.id ? payment.id : null
  const orderId = typeof payment?.order_id === 'string' && payment.order_id ? payment.order_id : null

  if (!paymentId || !orderId) {
    console.warn('square-webhook: ignored — completed payment missing payment id or order id', { eventId })
    return res.status(200).json({ received: true, ignored: 'missing_ids' })
  }

  // ── 5. Establish durable per-payment state (entire-purchase idempotency) ─
  // Every required side effect below (order log, inventory, fulfillment
  // email) is gated by this SAME row, keyed by payment_id — not by
  // event_id. That is what makes two different events for one payment
  // (a redelivery under a new event_id, payment.created + payment.updated,
  // etc.) share one durable outcome instead of each re-running fulfillment
  // independently. If the durable store can't be reached at all, fail
  // closed: attempting side effects with no way to record what happened
  // risks exactly the duplication this table exists to prevent.
  if (!isDurableStoreConfigured()) {
    console.error('square-webhook: durable store not configured — cannot safely process, requesting retry', { eventId, paymentId })
    return res.status(500).json({ received: true, retryable: true, error: 'durable_store_unavailable' })
  }

  const { row, unavailable: stateUnavailable } = await getOrCreatePurchaseState(paymentId, orderId)
  if (stateUnavailable || !row) {
    console.error('square-webhook: could not establish durable purchase state — requesting retry', { eventId, paymentId })
    return res.status(500).json({ received: true, retryable: true, error: 'durable_store_unavailable' })
  }

  const wasAlreadyCompleted = Boolean(row.completed_at)

  // Order details are read-only and safe to re-fetch on every delivery —
  // needed by whichever effects below are still incomplete.
  let recipient = null
  let lineItems = []
  let braceletBuilds = []

  try {
    const details = await fetchOrderDetails(orderId, process.env.SQUARE_ACCESS_TOKEN)
    recipient = details.recipient
    lineItems = details.lineItems
    braceletBuilds = parseBraceletBuilds(details.metadata)
  } catch (detailsError) {
    console.error('Failed to fetch Square order details (non-blocking):', detailsError)
  }

  // ── 6. Resume exactly the required side effects that are still incomplete ─
  // Each block only runs when its column is still NULL on `row` — a repeat
  // delivery for an already-completed payment does none of this work.
  // Runs for every completed payment on this Square account (POS,
  // market-booth, and website alike) — this is order fulfillment, not
  // purchase analytics, and the owner needs it regardless of channel.

  if (!row.order_logged_at) {
    const logResult = await logOrderToSupabase({ payment, recipient, lineItems, braceletBuilds })
    if (logResult.ok) {
      // The order log itself is confirmed — but only trust it "done" for
      // this delivery's response once the durable marker also commits. If
      // the marker write fails, a retry safely re-runs logOrderToSupabase
      // (idempotent via orders.square_payment_id's unique constraint) and
      // tries the marker again — never a duplicate order row.
      const markResult = await markEffectDone(paymentId, PURCHASE_EFFECT.ORDER_LOGGED)
      if (markResult.claimed) {
        row.order_logged_at = new Date().toISOString()
      } else {
        console.error('square-webhook: order logged but could not be durably recorded — leaving retryable', { eventId, paymentId })
        await recordLastError(paymentId, 'order_logged: succeeded but not recorded')
      }
    } else {
      console.error('square-webhook: order_logged incomplete, leaving retryable', { eventId, paymentId, reason: logResult.reason })
      await recordLastError(paymentId, `order_logged: ${logResult.reason}`)
    }
  }

  if (!row.inventory_updated_at) {
    const invResult = await decrementInventoryForOrder(paymentId, braceletBuilds, lineItems)
    if (invResult.allSucceeded) {
      // Same reasoning as order logging: every item is already durably
      // decremented (ledger-protected, safe to re-check on retry), but this
      // delivery only counts it "done" once the marker itself commits.
      const markResult = await markEffectDone(paymentId, PURCHASE_EFFECT.INVENTORY_UPDATED)
      if (markResult.claimed) {
        row.inventory_updated_at = new Date().toISOString()
      } else {
        console.error('square-webhook: inventory decremented but could not be durably recorded — leaving retryable', { eventId, paymentId })
        await recordLastError(paymentId, 'inventory_updated: succeeded but not recorded')
      }
    } else {
      console.error('square-webhook: inventory_updated incomplete, leaving retryable', { eventId, paymentId, failed: invResult.failed })
      await recordLastError(paymentId, `inventory_updated: failed=${invResult.failed?.join(',') ?? 'unknown'}`)
    }
  }

  if (!row.fulfillment_notified_at) {
    const notificationEmail = process.env.NOTIFICATION_EMAIL
    if (!notificationEmail) {
      console.error('NOTIFICATION_EMAIL is not configured — fulfillment_notified left retryable', { eventId, paymentId })
      await recordLastError(paymentId, 'fulfillment_notified: NOTIFICATION_EMAIL not configured')
    } else {
      // Claim (or reclaim, if a previous processing lease expired) BEFORE
      // calling Resend — see claimFulfillmentLease. A process killed after
      // this claim but before/during the Resend call leaves the lease to
      // expire naturally rather than getting stuck "notified" forever.
      const lease = await claimFulfillmentLease(paymentId, getFulfillmentLeaseSeconds())
      if (lease.alreadySent) {
        row.fulfillment_notified_at = new Date().toISOString()
      } else if (lease.claimed) {
        const timestamp = event.created_at ?? payment?.updated_at ?? new Date().toISOString()
        const lineItemsSection = formatLineItemsSection(lineItems)
        const shippingSection = formatShippingSection(recipient)
        // Stable across every retry of this notification — same payment,
        // same notification type — so Resend's own 24h idempotency window
        // guarantees at most one email even if we call it more than once.
        const idempotencyKey = `${FULFILLMENT_NOTIFICATION_TYPE}:${paymentId}`
        const sendResult = await sendOrderEmail({
          to: notificationEmail,
          payment,
          timestamp,
          lineItemsSection,
          braceletBuilds,
          shippingSection,
          idempotencyKey,
        })

        if (sendResult.ok) {
          // Only ever marked sent AFTER Resend confirms acceptance.
          const markResult = await markFulfillmentSent(paymentId)
          if (markResult.ok) {
            row.fulfillment_notified_at = new Date().toISOString()
            console.log('Order notification sent', { paymentId, orderId })
          } else {
            // Resend confirmed the send, but we could not durably record
            // it. Do NOT release the lease — the email really was sent, so
            // a fresh attempt must never be allowed to race in and send a
            // second one. Leave fulfillment_state 'processing': once the
            // lease expires, a retry reclaims it, calls Resend again with
            // the SAME idempotency key (Resend returns its cached result
            // instead of sending again), and retries recording sent.
            console.error('square-webhook: fulfillment email sent but could not be durably recorded — will retry after lease expiry', {
              eventId,
              paymentId,
            })
            await recordLastError(paymentId, 'fulfillment_notified: sent but not recorded')
          }
        } else if (sendResult.definitive) {
          // Resend gave a definitive answer: no email went out. Safe to
          // release the lease immediately so the very next delivery can
          // retry without waiting out the full lease window.
          console.error('square-webhook: fulfillment email failed definitively, releasing lease for immediate retry', {
            eventId,
            paymentId,
            reason: sendResult.reason,
          })
          await releaseFulfillmentLease(paymentId)
          await recordLastError(paymentId, `fulfillment_notified: ${sendResult.reason}`)
        } else {
          // Ambiguous (network error/timeout): we don't know whether Resend
          // received the request. Do NOT release — releasing here could let
          // a second attempt race one that's still in flight. Leave the
          // lease to expire; the eventual retry reuses idempotencyKey, so
          // at most one email goes out either way.
          console.error('square-webhook: fulfillment email failed ambiguously, leaving lease to expire', {
            eventId,
            paymentId,
            reason: sendResult.reason,
          })
          await recordLastError(paymentId, `fulfillment_notified: ${sendResult.reason}`)
        }
      } else if (lease.unavailable) {
        console.error('square-webhook: fulfillment lease unavailable, leaving retryable', { eventId, paymentId })
        await recordLastError(paymentId, 'fulfillment_notified: durable lease unavailable')
      } else {
        // Not claimed, not already sent: another delivery holds a live
        // (non-expired) lease right now — not our job this round.
        console.log('square-webhook: fulfillment lease held by another in-flight delivery', { eventId, paymentId })
      }
    }
  }

  const requiredComplete = Boolean(row.order_logged_at && row.inventory_updated_at && row.fulfillment_notified_at)
  if (requiredComplete && !wasAlreadyCompleted) {
    await markEffectDone(paymentId, PURCHASE_EFFECT.COMPLETED)
  }

  // ── 7. Website-order correlation + at-most-once purchase_completed ──────
  // purchase_completed fires only when this order was created by our own
  // /api/create-checkout (not Square POS, a market-booth sale, an invoice,
  // or a manually entered payment) AND analytics hasn't already been
  // attempted for this payment_id — independent of event_id, so two
  // different Square events for the same payment can't double-count.
  // Deliberately NOT required for `completed_at` / the required-work gate
  // above: an external analytics outage must never hold up fulfillment or
  // cause endless Square retries on its own.
  if (!row.analytics_recorded_at) {
    const isWebsiteOrder = await isWebsiteCheckoutOrder(orderId)
    if (!isWebsiteOrder) {
      console.log('square-webhook: purchase_completed skipped — order not correlated to a theretrocharmco.com checkout', { eventId, orderId })
    } else {
      const claim = await markEffectDone(paymentId, PURCHASE_EFFECT.ANALYTICS_RECORDED)
      if (claim.claimed) {
        // Claim is durable and NOT rolled back on failure: if the analytics
        // call itself fails, we accept a missed event over risking a
        // duplicate count on a later retry of this or a different event_id
        // for the same payment (at-most-once, not guaranteed-delivery).
        try {
          await trackPurchaseCompleted(buildPurchaseAnalyticsProps({ payment, lineItems, braceletBuilds }))
          console.log('square-webhook: purchase_completed fired', { eventId, paymentId, orderId })
        } catch (analyticsError) {
          console.error(
            'square-webhook: purchase_completed analytics call failed (claimed; not retried, to avoid a duplicate count):',
            analyticsError?.message ?? analyticsError,
          )
        }
      } else {
        console.log('square-webhook: purchase_completed skipped — already attempted for this payment', { eventId, paymentId })
      }
    }
  }

  // ── 8. Response: 2xx only once required work is actually done ───────────
  // A non-2xx here is a deliberate signal for Square to retry — the next
  // delivery (same or different event_id) will resume exactly the columns
  // still NULL, per step 6, and skip everything already confirmed done.
  if (requiredComplete) {
    return res.status(200).json({ received: true, processed: true, alreadyCompleted: wasAlreadyCompleted })
  }

  const incomplete = []
  if (!row.order_logged_at) incomplete.push('order_logged')
  if (!row.inventory_updated_at) incomplete.push('inventory_updated')
  if (!row.fulfillment_notified_at) incomplete.push('fulfillment_notified')
  console.error('square-webhook: required work incomplete, requesting Square retry', { eventId, paymentId, incomplete })
  return res.status(500).json({ received: true, retryable: true, incomplete })
}

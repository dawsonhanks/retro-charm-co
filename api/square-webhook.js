import crypto from 'node:crypto'
import { charms, BASE_OPTIONS } from '../src/data/charms.js'

const NOTIFICATION_URL = 'https://www.theretrocharmco.com/api/square-webhook'
const DEFAULT_SITE_URL = 'https://www.theretrocharmco.com'
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

function verifySquareSignature(signature, rawBody, signatureKey) {
  const expected = crypto
    .createHmac('sha256', signatureKey)
    .update(NOTIFICATION_URL + rawBody)
    .digest('base64')

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
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

async function sendOrderEmail({
  to,
  payment,
  timestamp,
  lineItemsSection,
  braceletBuilds,
  shippingSection,
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
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

  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    const shouldRetryWithFallback =
      payload.from === FROM_EMAIL &&
      (res.status === 403 || errorBody.toLowerCase().includes('domain'))

    if (shouldRetryWithFallback) {
      console.warn('Primary sender failed; retrying with Resend onboarding address')
      payload.from = FALLBACK_FROM_EMAIL
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    }

    if (!res.ok) {
      const retryErrorBody = await res.text()
      throw new Error(`Resend API error (${res.status}): ${retryErrorBody}`)
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
    if (!signatureKey) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY is not configured')
      return res.status(500).json({ error: 'Webhook is not configured' })
    }

    const signature = req.headers['x-square-hmacsha256-signature']
    if (!signature) {
      console.error('Missing x-square-hmacsha256-signature header')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rawBody = await readRawBody(req)

    if (!verifySquareSignature(signature, rawBody, signatureKey)) {
      console.error('Square webhook signature verification failed')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const event = JSON.parse(rawBody)

    if (event.type === 'payment.updated') {
      const payment = event.data?.object?.payment
      const status = payment?.status

      if (status === 'COMPLETED') {
        const notificationEmail = process.env.NOTIFICATION_EMAIL
        if (!notificationEmail) {
          console.error('NOTIFICATION_EMAIL is not configured')
        } else {
          try {
            const timestamp = event.created_at ?? payment?.updated_at ?? new Date().toISOString()
            const { recipient, metadata, lineItems } = await fetchOrderDetails(
              payment?.order_id,
              process.env.SQUARE_ACCESS_TOKEN,
            )
            const lineItemsSection = formatLineItemsSection(lineItems)
            const braceletBuilds = parseBraceletBuilds(metadata)
            const shippingSection = formatShippingSection(recipient)
            await sendOrderEmail({
              to: notificationEmail,
              payment,
              timestamp,
              lineItemsSection,
              braceletBuilds,
              shippingSection,
            })
            console.log('Order notification sent', {
              paymentId: payment?.id,
              orderId: payment?.order_id,
            })
          } catch (emailError) {
            console.error('Failed to send order notification email:', emailError)
          }
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Square webhook handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

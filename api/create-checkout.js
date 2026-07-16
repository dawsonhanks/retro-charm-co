import { randomUUID } from 'crypto'
import { charms, BASE_OPTIONS, isFillerCharm } from '../src/data/charms.js'
import { FLAT_RATE_SHIPPING, SHIPPING_LINE_ITEM_NAME } from '../src/data/shipping.js'

/** Compact token for filler slots in Square order metadata (keeps values under size limits). */
const FILLER_METADATA_TOKEN = 'b'

// Single source of truth for what something is allowed to cost. The client
// tells us which items (by id) and how many, but never gets to dictate the
// price or name that actually gets charged.
const CANONICAL_ITEMS = new Map()
for (const c of charms) {
  CANONICAL_ITEMS.set(c.id, { name: c.name, price: c.price })
}
for (const b of BASE_OPTIONS) {
  CANONICAL_ITEMS.set(b.id, { name: b.label, price: b.price })
}

const MAX_QUANTITY_PER_LINE_ITEM = 50
const MAX_BRACELET_BUILDS_METADATA = 10
const MAX_METADATA_VALUE_LENGTH = 450

function resolveBuildBaseId(build) {
  if (typeof build?.baseId === 'string' && BASE_OPTIONS.some((b) => b.id === build.baseId)) {
    return build.baseId
  }
  // Legacy builds may only send metal; map to the classic (non-watch) base.
  if (build?.metal === 'silver' || build?.metal === 'gold') {
    return build.metal
  }
  return null
}

function isValidBraceletBuild(build) {
  if (!build || typeof build !== 'object') return false
  if (!resolveBuildBaseId(build)) return false
  if (!Array.isArray(build.charms)) return false

  for (const charm of build.charms) {
    if (!charm || typeof charm.id !== 'string' || !CANONICAL_ITEMS.has(charm.id)) {
      return false
    }
  }

  return true
}

function encodeCharmIdForMetadata(charm) {
  if (!charm?.id) return FILLER_METADATA_TOKEN
  if (isFillerCharm(charm)) return FILLER_METADATA_TOKEN
  return charm.id
}

/** Metadata value: `baseId:id,id,...` in exact builder order (fillers → compact `b` token). */
function buildBraceletMetadataValue(baseId, charms) {
  // Preserve every slot in array order — never sort, group, or drop fillers.
  const ids = charms.map((charm) => encodeCharmIdForMetadata(charm))
  const prefix = `${baseId}:`
  let value = prefix + ids.join(',')

  if (value.length <= MAX_METADATA_VALUE_LENGTH) {
    return value
  }

  console.warn(
    `Bracelet metadata value exceeds ${MAX_METADATA_VALUE_LENGTH} characters; truncating charm list`,
  )

  const truncatedIds = []
  for (const id of ids) {
    const candidate = prefix + [...truncatedIds, id].join(',')
    if (candidate.length > MAX_METADATA_VALUE_LENGTH) break
    truncatedIds.push(id)
  }

  return prefix + truncatedIds.join(',')
}

function buildOrderBraceletMetadata(braceletBuilds) {
  if (!Array.isArray(braceletBuilds) || braceletBuilds.length === 0) {
    return null
  }

  const builds = braceletBuilds.slice(0, MAX_BRACELET_BUILDS_METADATA)
  const metadata = {}
  let written = 0

  builds.forEach((build) => {
    if (!isValidBraceletBuild(build)) {
      console.warn('Skipping invalid bracelet build for order metadata', {
        baseId: build?.baseId,
        metal: build?.metal,
        charmCount: Array.isArray(build?.charms) ? build.charms.length : 0,
      })
      return
    }

    const baseId = resolveBuildBaseId(build)
    // build.charms is the full left-to-right slot array from the builder (includes fillers).
    metadata[`bracelet_${written + 1}`] = buildBraceletMetadataValue(baseId, build.charms)
    written += 1
  })

  return written > 0 ? metadata : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID
  const siteUrl = process.env.VITE_SITE_URL

  if (!accessToken || !locationId) {
    return res.status(500).json({ error: 'Square is not configured' })
  }

  if (!siteUrl) {
    return res.status(500).json({ error: 'Site URL is not configured' })
  }

  const { items, idempotencyKey, braceletBuilds } = req.body ?? {}

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items are required' })
  }

  const lineItems = []

  for (const item of items) {
    const { id, quantity } = item ?? {}

    const canonical = typeof id === 'string' ? CANONICAL_ITEMS.get(id) : undefined

    if (!canonical) {
      return res.status(400).json({ error: 'One of the items in your cart is not recognized. Please refresh and try again.' })
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_QUANTITY_PER_LINE_ITEM) {
      return res.status(400).json({ error: 'Each item must include a valid quantity' })
    }

    // Name and price always come from our own catalog, never from the request body.
    lineItems.push({
      name: canonical.name,
      quantity: String(quantity),
      base_price_money: {
        amount: Math.round(canonical.price * 100),
        currency: 'USD',
      },
    })
  }

  // Square expects integer cents (e.g. $6.00 → 600), never a float dollar amount.
  const shippingAmountCents = Math.round(Number(FLAT_RATE_SHIPPING) * 100)
  if (!Number.isInteger(shippingAmountCents) || shippingAmountCents <= 0) {
    console.error('Invalid FLAT_RATE_SHIPPING config:', FLAT_RATE_SHIPPING)
    return res.status(500).json({ error: 'Shipping is misconfigured' })
  }

  // Do NOT add shipping as a line_item — that shows as a product and still leaves
  // Square's native "Shipping method" section as Free. Use checkout_options.shipping_fee
  // so Payment Links puts $6 in the Shipping method UI and adds it as a service charge.
  // https://developer.squareup.com/docs/checkout-api/optional-checkout-configurations
  const shippingFee = {
    name: SHIPPING_LINE_ITEM_NAME,
    charge: {
      amount: shippingAmountCents,
      currency: 'USD',
    },
  }

  console.log('create-checkout payload:', {
    lineItems: lineItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      amount: item.base_price_money.amount,
    })),
    shippingFee,
  })

  // Reuse a client-supplied idempotency key when it looks sane so that retries of the
  // exact same cart don't create duplicate Square payment links. Fall back to a fresh
  // random key (unique request) if it's missing or malformed.
  const safeIdempotencyKey =
    typeof idempotencyKey === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(idempotencyKey)
      ? idempotencyKey
      : randomUUID()

  const braceletMetadata = buildOrderBraceletMetadata(braceletBuilds)

  try {
    const order = {
      location_id: locationId,
      line_items: lineItems,
    }

    if (braceletMetadata) {
      order.metadata = braceletMetadata
    }

    const squareRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-07-17',
      },
      body: JSON.stringify({
        idempotency_key: safeIdempotencyKey,
        checkout_options: {
          redirect_url: `${siteUrl}/order-confirmation?order=${encodeURIComponent(safeIdempotencyKey)}`,
          ask_for_shipping_address: true,
          shipping_fee: shippingFee,
        },
        order,
      }),
    })

    const data = await squareRes.json()

    if (!squareRes.ok) {
      console.error('Square payment-links error:', data)
      const message = data.errors?.[0]?.detail || data.errors?.[0]?.code || 'Failed to create checkout'
      return res.status(squareRes.status).json({ error: message })
    }

    const checkoutUrl = data.payment_link?.url || data.payment_link?.long_url

    if (!checkoutUrl) {
      return res.status(500).json({ error: 'No checkout URL returned from Square' })
    }

    return res.status(200).json({ checkoutUrl })
  } catch (error) {
    console.error('create-checkout unexpected error:', error)
    return res.status(500).json({ error: 'Failed to create checkout' })
  }
}

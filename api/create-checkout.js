import { randomUUID } from 'crypto'
import { charms, BASE_OPTIONS } from '../src/data/charms.js'

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
const SHIPPING_CHARGE = 5.0

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

  const { items, idempotencyKey } = req.body ?? {}

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

  lineItems.push({
    name: 'Shipping',
    quantity: '1',
    base_price_money: {
      amount: Math.round(SHIPPING_CHARGE * 100),
      currency: 'USD',
    },
  })

  // Reuse a client-supplied idempotency key when it looks sane so that retries of the
  // exact same cart don't create duplicate Square payment links. Fall back to a fresh
  // random key (unique request) if it's missing or malformed.
  const safeIdempotencyKey =
    typeof idempotencyKey === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(idempotencyKey)
      ? idempotencyKey
      : randomUUID()

  try {
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
        },
        order: {
          location_id: locationId,
          line_items: lineItems,
        },
      }),
    })

    const data = await squareRes.json()

    if (!squareRes.ok) {
      const message = data.errors?.[0]?.detail || data.errors?.[0]?.code || 'Failed to create checkout'
      return res.status(squareRes.status).json({ error: message })
    }

    const checkoutUrl = data.payment_link?.url || data.payment_link?.long_url

    if (!checkoutUrl) {
      return res.status(500).json({ error: 'No checkout URL returned from Square' })
    }

    return res.status(200).json({ checkoutUrl })
  } catch {
    return res.status(500).json({ error: 'Failed to create checkout' })
  }
}

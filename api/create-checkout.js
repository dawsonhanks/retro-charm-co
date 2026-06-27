import { randomUUID } from 'crypto'

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

  const { items } = req.body ?? {}

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items are required' })
  }

  const lineItems = []

  for (const item of items) {
    const { name, price, quantity } = item

    if (!name || typeof price !== 'number' || price <= 0 || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Each item must include a valid name, price, and quantity' })
    }

    lineItems.push({
      name: String(name),
      quantity: String(quantity),
      base_price_money: {
        amount: Math.round(price * 100),
        currency: 'USD',
      },
    })
  }

  try {
    const squareRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-07-17',
      },
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        checkout_options: {
          redirect_url: `${siteUrl}/order-confirmation`,
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

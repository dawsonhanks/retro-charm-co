import crypto from 'node:crypto'

const NOTIFICATION_URL = 'https://www.theretrocharmco.com/api/square-webhook'
const FROM_EMAIL = 'Retro Charm Co <orders@theretrocharmco.com>'
const FALLBACK_FROM_EMAIL = 'Retro Charm Co <onboarding@resend.dev>'

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

async function fetchOrderRecipient(orderId, accessToken) {
  if (!orderId || !accessToken) {
    return null
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
      return null
    }

    const data = await res.json()
    return data.order?.fulfillments?.[0]?.shipment_details?.recipient ?? null
  } catch (error) {
    console.error('Square order lookup error:', error)
    return null
  }
}

async function sendOrderEmail({ to, payment, timestamp, shippingSection }) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const paymentId = payment?.id ?? 'Unknown'
  const orderId = payment?.order_id ?? 'Unknown'
  const amount = formatAmount(payment?.amount_money)

  const text = [
    'A new order has been completed on Retro Charm Co.',
    '',
    `Payment amount: ${amount}`,
    `Payment ID: ${paymentId}`,
    `Order ID: ${orderId}`,
    `Timestamp: ${timestamp}`,
    '',
    shippingSection,
  ].join('\n')

  const payload = {
    from: FROM_EMAIL,
    to: [to],
    subject: 'New Retro Charm Co Order',
    text,
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
            const recipient = await fetchOrderRecipient(
              payment?.order_id,
              process.env.SQUARE_ACCESS_TOKEN,
            )
            const shippingSection = formatShippingSection(recipient)
            await sendOrderEmail({
              to: notificationEmail,
              payment,
              timestamp,
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

/**
 * Call /api/create-checkout and safely parse JSON (empty/non-JSON bodies included).
 * @param {{ items: unknown[], idempotencyKey?: string, braceletBuilds?: unknown }} body
 */
export async function createCheckoutSession(body) {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(
        res.ok
          ? 'Checkout returned an invalid response. Please try again.'
          : `Checkout failed (${res.status}). Please try again.`,
      )
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `Checkout failed (${res.status}). Please try again.`)
  }

  if (!data?.checkoutUrl) {
    throw new Error(data?.error || 'No checkout URL returned. Please try again.')
  }

  return data
}

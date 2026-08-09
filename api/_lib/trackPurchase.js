/**
 * Server-side purchase analytics (Vercel Analytics).
 * Only call after Square webhook signature verification + payment.status === COMPLETED.
 *
 * Never include buyer email, name, or shipping address.
 */
import { track } from '@vercel/analytics/server'
import { AnalyticsEvent } from '../../src/lib/analyticsEvents.js'

let trackFn = track

/**
 * Test-only: replace the underlying analytics sink (e.g. to assert call
 * count/props, or to simulate an analytics-provider failure). Pass a
 * falsy value to restore the real `@vercel/analytics/server` track().
 */
export function __setPurchaseTrackerForTests(fn) {
  trackFn = fn || track
}

/**
 * @param {{
 *   amountCents?: number | null
 *   currency?: string | null
 *   itemCount?: number | null
 *   hasBraceletBuilds?: boolean
 * }} props
 */
export async function trackPurchaseCompleted(props = {}) {
  const amountCents = Number(props.amountCents)
  const cartValue =
    Number.isFinite(amountCents) && amountCents >= 0 ? Math.round(amountCents) / 100 : null
  const itemCount =
    typeof props.itemCount === 'number' && Number.isFinite(props.itemCount)
      ? props.itemCount
      : null

  try {
    await trackFn(AnalyticsEvent.PURCHASE_COMPLETED, {
      cart_value: cartValue,
      currency: typeof props.currency === 'string' ? props.currency.toUpperCase() : 'USD',
      item_count: itemCount,
      has_bracelet_builds: Boolean(props.hasBraceletBuilds),
      verified: true,
      source: 'square_webhook',
    })
  } catch (error) {
    console.error('purchase_completed analytics failed (non-blocking):', error)
  }
}

/** Flat-rate shipping charged on every online checkout order (USD). */
export const FLAT_RATE_SHIPPING = 6.0

/** Line-item name sent to Square Payment Links and shown in cart summaries. */
export const SHIPPING_LINE_ITEM_NAME = 'Shipping'

/**
 * Sentinel that must never appear in customer-facing UI.
 * Built at runtime so the contiguous placeholder string is not shipped as copy.
 */
export const FULFILLMENT_PLACEHOLDER_TOKEN = ['SET', 'FULFILLMENT', 'TIMEFRAME'].join('_')

/**
 * Customer-facing order processing / shipping timeframe.
 * Shown on the homepage hero and cart/trust surfaces when set.
 * @type {string | null}
 */
export const ORDER_FULFILLMENT_TIMEFRAME = 'Ships in 3–5 business days'

/**
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isFulfillmentPlaceholder(value) {
  if (value == null) return true
  const trimmed = String(value).trim()
  if (!trimmed) return true
  const upper = trimmed.toUpperCase()
  return (
    upper === FULFILLMENT_PLACEHOLDER_TOKEN ||
    upper.includes('SET_FULFILLMENT') ||
    upper.includes('UPDATE_ME') ||
    upper.startsWith('TODO')
  )
}

/**
 * Safe customer-facing copy, or null when unset / placeholder.
 * @param {string | null | undefined} [value]
 * @returns {string | null}
 */
export function getCustomerFacingFulfillmentCopy(value = ORDER_FULFILLMENT_TIMEFRAME) {
  if (isFulfillmentPlaceholder(value)) return null
  return String(value).trim()
}

/** Formatted flat-rate shipping label for trust/marketing copy. */
export function formatFlatRateShippingLabel(amount = FLAT_RATE_SHIPPING) {
  const rounded = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.00$/, '')
  return `$${rounded} flat-rate shipping`
}

import { isFillerCharm } from '../data/charms'
import { FLAT_RATE_SHIPPING } from '../data/shipping'

/**
 * @typedef {Object} OrderEstimate
 * @property {number} basePrice
 * @property {string} baseLabel
 * @property {number} standardCount
 * @property {number} dangleCount
 * @property {number} standardSubtotal
 * @property {number} dangleSubtotal
 * @property {number} paidCharmCount
 * @property {number} productSubtotal
 * @property {number} plainLinkCount
 * @property {number} shipping
 * @property {number} estimatedTotalBeforeTax
 */

/**
 * Build a transparent, catalog-driven estimate for Charm Studio / cart summaries.
 * Plain fillers are never charged. Shipping comes only from shipping.js.
 *
 * @param {{
 *   base: { id: string, label: string, price: number } | null | undefined,
 *   charms?: Array<{ price?: number, category?: string } | null | undefined>,
 *   plainLinkCount?: number,
 * }} input
 * @returns {OrderEstimate | null}
 */
export function buildOrderEstimate({ base, charms = [], plainLinkCount = 0 }) {
  if (!base) return null

  const paid = charms.filter((charm) => charm && !isFillerCharm(charm))
  const standard = paid.filter((charm) => charm.category !== 'dangles')
  const dangles = paid.filter((charm) => charm.category === 'dangles')

  const standardSubtotal = standard.reduce((sum, charm) => sum + Number(charm.price ?? 0), 0)
  const dangleSubtotal = dangles.reduce((sum, charm) => sum + Number(charm.price ?? 0), 0)
  const productSubtotal = Number(base.price) + standardSubtotal + dangleSubtotal
  const shipping = FLAT_RATE_SHIPPING

  return {
    basePrice: Number(base.price),
    baseLabel: base.label,
    standardCount: standard.length,
    dangleCount: dangles.length,
    standardSubtotal: roundMoney(standardSubtotal),
    dangleSubtotal: roundMoney(dangleSubtotal),
    paidCharmCount: paid.length,
    productSubtotal: roundMoney(productSubtotal),
    plainLinkCount: Math.max(0, plainLinkCount),
    shipping,
    estimatedTotalBeforeTax: roundMoney(productSubtotal + shipping),
  }
}

/**
 * Dynamic pre-build example: silver base + N standard charms + shipping.
 * @param {{ base: { label: string, price: number }, standardCharmPrice: number, standardCount?: number }} input
 */
export function formatPricingExample({ base, standardCharmPrice, standardCount = 7 }) {
  const charmsTotal = roundMoney(standardCharmPrice * standardCount)
  const total = roundMoney(Number(base.price) + charmsTotal + FLAT_RATE_SHIPPING)
  return `Example: ${base.label} + ${standardCount} standard charms + shipping = $${total.toFixed(2)} before tax.`
}

export function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

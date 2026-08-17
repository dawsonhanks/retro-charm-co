import {
  BASE_OPTIONS,
  getCharmById,
  getCharmCapacity,
  getFillerCharmForMetal,
  isFillerCharm,
} from './charms'
import { isCharmOutOfStock } from '../utils/inventory'

/**
 * Ready-made best-seller bracelet bundles.
 *
 * Edit this file to change names, photos, bases, sizes, included charms,
 * or out-of-stock substitutions. Every `baseId` and charm id must exist in
 * `src/data/charms.js` (Square checkout rejects unknown ids).
 *
 * Prices are always calculated from live catalog data — never hard-code totals.
 *
 * @typedef {Object} BundleDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} image
 * @property {string} imageAlt
 * @property {boolean} imageIsInspiration
 *   True when the card photo is lifestyle/inspiration, not the exact configured bracelet.
 * @property {string} baseId
 * @property {number} charmCount
 * @property {string[]} charmIds
 * @property {Record<string, string[]>} [substitutions]
 */

/** @type {BundleDefinition[]} */
export const BEST_SELLER_BUNDLES = [
  {
    id: 'silver-best-sellers',
    name: 'Silver Best Sellers',
    description: 'Our best-selling silver bracelet — American flag, pink flower, black star, "I Love You," a red-and-pink double heart, and a checkerboard.',
    image: '/images/bundles/silver-best-sellers.webp',
    imageAlt: 'Silver Italian charm bracelet with American flag, pink flower, black star, I Love You, double heart, and checkerboard charms',
    imageIsInspiration: false,
    baseId: 'silver',
    charmCount: 18,
    charmIds: [
      's-american-flag',
      's-flower-pink',
      's-star-black',
      's-i-love-you',
      's-double-heart-red-pink',
      's-checkered-flag-silver',
    ],
    substitutions: {
      's-flower-pink': ['s-flower-turquoise'],
      's-star-black': ['s-star-gold'],
    },
  },
  {
    id: 'cherry-cola',
    name: 'Cherry Cola',
    description: 'Silver bracelet with cherries, a gold star, Diet Coke, pink checkerboard, a gold cherry dangle, and a gold heart.',
    image: '/images/bundles/cherry-cola.webp',
    imageAlt: 'Silver Italian charm bracelet with cherries, gold star, Diet Coke, pink checkerboard, gold cherry dangle, and gold heart charms',
    imageIsInspiration: false,
    baseId: 'silver',
    charmCount: 18,
    charmIds: [
      's-cherries',
      's-star-gold',
      's-diet-coke',
      's-checkered-pink',
      'g-cherries-dangle',
      's-raised-heart',
    ],
    substitutions: {
      's-diet-coke': ['g-diet-coke-can'],
      'g-cherries-dangle': ['s-cherry-dangle'],
    },
  },
  {
    id: 'gold-best-sellers',
    name: 'Gold Best Sellers',
    description: 'Our best-selling gold bracelet — checkered flag, red heart, American flag, pink flower, black star, and cherries.',
    image: '/images/bundles/gold-best-sellers.webp',
    imageAlt: 'Gold Italian charm bracelet with checkered flag, red heart, American flag, pink flower, black star, and cherry charms',
    imageIsInspiration: false,
    baseId: 'gold',
    charmCount: 18,
    charmIds: [
      'g-checkered-flag-gold',
      'g-heart-red',
      'g-american-flag',
      'g-flower-pink',
      'g-black-star',
      'g-cherries-pink-background',
    ],
    substitutions: {
      'g-cherries-pink-background': ['g-cherries-dangle'],
      'g-heart-red': ['g-heart-red-and-gold'],
    },
  },
  {
    id: 'two-tone',
    name: 'Two-Tone',
    description: 'Two-tone gold-and-silver bracelet with a cherry heart, pearl, red bow, gold star, red flower, and a blue-gem heart.',
    image: '/images/bundles/two-tone.webp',
    imageAlt: 'Two-tone gold and silver Italian charm bracelet with cherry heart, pearl, red bow, gold star, red flower, and blue gem heart charms',
    imageIsInspiration: false,
    baseId: 'gold',
    charmCount: 18,
    charmIds: [
      'g-cherry-heart-checkered',
      's-pearl-white',
      'g-bow-red-with-pearl',
      's-star-gold',
      'g-flower-red',
      's-blue-heart-gem',
    ],
    substitutions: {
      's-pearl-white': ['g-pearl-gold'],
      'g-flower-red': ['g-flower-pink'],
    },
  },
]

/**
 * @param {BundleDefinition} bundle
 */
export function getBundleBase(bundle) {
  return BASE_OPTIONS.find((b) => b.id === bundle.baseId) ?? null
}

/**
 * Catalog list price for the configured charm ids (before substitutions).
 * @param {BundleDefinition} bundle
 */
export function getBundleConfiguredListPrice(bundle) {
  const base = getBundleBase(bundle)
  if (!base) return 0
  const charmsTotal = bundle.charmIds.reduce((sum, id) => {
    const charm = getCharmById(id)
    return sum + Number(charm?.price ?? 0)
  }, 0)
  return roundMoney(Number(base.price) + charmsTotal)
}

/**
 * Resolve a single charm id, applying disclosed substitutions when stock is known.
 * @param {string} charmId
 * @param {Record<string, string[]> | undefined} substitutions
 * @param {Record<string, { inStock: boolean }> | null | undefined} inventoryMap
 */
export function resolveBundleCharmId(charmId, substitutions, inventoryMap, stockOpts = {}) {
  const primary = getCharmById(charmId)
  if (!primary || isFillerCharm(primary)) {
    return { charm: null, substitutedFrom: null, unavailable: true }
  }

  const primaryBlocked = isCharmOutOfStock(primary.name, primary.metal, inventoryMap, {
    ...stockOpts,
    productId: primary.id,
  })
  if (!primaryBlocked) {
    return { charm: primary, substitutedFrom: null, unavailable: false }
  }

  const fallbacks = substitutions?.[charmId] ?? []
  for (const fallbackId of fallbacks) {
    const fallback = getCharmById(fallbackId)
    if (!fallback || isFillerCharm(fallback)) continue
    if (
      !isCharmOutOfStock(fallback.name, fallback.metal, inventoryMap, {
        ...stockOpts,
        productId: fallback.id,
      })
    ) {
      return { charm: fallback, substitutedFrom: primary, unavailable: false }
    }
  }

  return { charm: primary, substitutedFrom: null, unavailable: true }
}

/**
 * @param {BundleDefinition} bundle
 * @param {Record<string, { inStock: boolean, qty?: number }> | null | undefined} inventoryMap
 * @param {{ status?: string | null, emergencyFailOpen?: boolean }} [stockOpts]
 */
export function resolveBundle(bundle, inventoryMap, stockOpts = {}) {
  const base = getBundleBase(bundle)
  const capacity = getCharmCapacity(bundle.charmCount, bundle.baseId)
  const substitutionsApplied = []
  const unavailableCharms = []
  const resolvedCharms = []
  const configuredListPrice = getBundleConfiguredListPrice(bundle)

  if (!base || capacity == null) {
    return {
      bundle,
      base: null,
      available: false,
      capacity: null,
      resolvedCharms: [],
      substitutionsApplied: [],
      unavailableCharms: [],
      slotSequence: [],
      plainLinkCount: 0,
      configuredListPrice,
      price: 0,
      priceDeltaFromConfigured: 0,
      error: !base ? `Unknown baseId: ${bundle.baseId}` : 'Invalid charmCount',
    }
  }

  if (
    isCharmOutOfStock(base.label, base.metal, inventoryMap, {
      ...stockOpts,
      productId: base.id,
    })
  ) {
    return {
      bundle,
      base,
      available: false,
      capacity,
      resolvedCharms: [],
      substitutionsApplied: [],
      unavailableCharms: [{ id: base.id, name: base.label, metal: base.metal, price: base.price }],
      slotSequence: [],
      plainLinkCount: 0,
      configuredListPrice,
      price: configuredListPrice,
      priceDeltaFromConfigured: 0,
      error: null,
    }
  }

  if (bundle.charmIds.length > capacity) {
    return {
      bundle,
      base,
      available: false,
      capacity,
      resolvedCharms: [],
      substitutionsApplied: [],
      unavailableCharms: [],
      slotSequence: [],
      plainLinkCount: 0,
      configuredListPrice,
      price: 0,
      priceDeltaFromConfigured: 0,
      error: `Bundle "${bundle.name}" lists ${bundle.charmIds.length} charms but size ${bundle.charmCount} only holds ${capacity}.`,
    }
  }

  for (const charmId of bundle.charmIds) {
    const result = resolveBundleCharmId(charmId, bundle.substitutions, inventoryMap, stockOpts)
    if (result.unavailable || !result.charm) {
      const missing = getCharmById(charmId)
      unavailableCharms.push(missing ?? { id: charmId, name: charmId, metal: 'silver', price: 0 })
      continue
    }
    if (result.substitutedFrom) {
      const fromPrice = Number(result.substitutedFrom.price ?? 0)
      const toPrice = Number(result.charm.price ?? 0)
      substitutionsApplied.push({
        from: result.substitutedFrom,
        to: result.charm,
        priceDelta: roundMoney(toPrice - fromPrice),
      })
    }
    resolvedCharms.push(result.charm)
  }

  const filler = getFillerCharmForMetal(base.metal)
  const plainLinkCount = Math.max(0, capacity - resolvedCharms.length)
  const slotSequence = Array.from({ length: capacity }, (_, index) => {
    const charm = resolvedCharms[index] ?? filler
    return {
      id: charm.id,
      image: charm.image,
      name: charm.name,
    }
  })

  const price = roundMoney(
    Number(base.price) + resolvedCharms.reduce((sum, charm) => sum + Number(charm.price ?? 0), 0),
  )

  return {
    bundle,
    base,
    available: unavailableCharms.length === 0,
    capacity,
    resolvedCharms,
    substitutionsApplied,
    unavailableCharms,
    slotSequence,
    plainLinkCount,
    configuredListPrice,
    price,
    priceDeltaFromConfigured: roundMoney(price - configuredListPrice),
    error: null,
  }
}

/**
 * Line items + build payload matching CharmBuilder.addToCart (no fake SKUs).
 * Fillers are present on the build for layout only — never as paid line items.
 * @param {ReturnType<typeof resolveBundle>} resolved
 */
export function buildBundleCartPayload(resolved) {
  if (!resolved.available || !resolved.base) {
    throw new Error(resolved.error || `Bundle "${resolved.bundle.name}" is unavailable`)
  }

  const items = [
    {
      id: resolved.base.id,
      name: resolved.base.label,
      price: resolved.base.price,
      metal: resolved.base.metal,
      image: resolved.base.image,
      quantity: 1,
    },
    ...resolved.resolvedCharms.map((charm) => ({
      id: charm.id,
      name: charm.name,
      price: charm.price,
      metal: charm.metal,
      image: charm.image,
      quantity: 1,
    })),
  ]

  if (items.some((item) => isFillerCharm(item))) {
    throw new Error('Plain filler links must never become paid cart line items')
  }

  const build = {
    label: resolved.bundle.name,
    baseId: resolved.base.id,
    metal: resolved.base.metal,
    charmCount: resolved.bundle.charmCount,
    charms: resolved.slotSequence,
  }

  return { items, build, subtotal: resolved.price }
}

export function formatBundlePrice(value) {
  return `$${Number(value).toFixed(2)}`
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

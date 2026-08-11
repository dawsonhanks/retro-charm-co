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
    id: 'retro-starter',
    name: 'Retro Starter',
    description: 'A silver classic with smiley, heart, dice, checkerboard, flag, and eight ball.',
    image: '/images/customer-photos/customer-photo-2.webp',
    imageAlt: 'Customer wearing stacked bracelets including a silver Italian charm bracelet',
    imageIsInspiration: true,
    baseId: 'silver',
    charmCount: 18,
    charmIds: [
      's-smiley-face',
      's-heart-red',
      's-dice',
      's-checkered-pink',
      's-american-flag',
      's-eight-ball',
    ],
    substitutions: {
      's-dice': ['g-dice'],
      's-smiley-face': ['s-smiley-face-yellow'],
    },
  },
  {
    id: 'cherry-cola',
    name: 'Cherry Cola',
    description: 'Cherries, Diet Coke, checkerboard, and a cherry dangle on a silver base.',
    image: '/images/customer-photos/customer-photo-8.webp',
    imageAlt: 'Customer wearing stacked Italian charm bracelets with cherries and Diet Coke charms',
    imageIsInspiration: true,
    baseId: 'silver',
    charmCount: 18,
    charmIds: [
      's-cherries',
      's-diet-coke',
      's-cherry-dangle',
      's-checkered-flag-silver',
      's-heart-red',
      's-american-flag',
    ],
    substitutions: {
      's-diet-coke': ['g-diet-coke-can'],
      's-cherries': ['g-cherries-pink-background', 'g-cherries-dangle'],
      's-cherry-dangle': ['g-cherries-dangle'],
    },
  },
  {
    id: 'gold-best-sellers',
    name: 'Gold Best Sellers',
    description: 'Gold bracelet with strawberry, dice, WWJD, music note, heart, and pink flower.',
    image: '/images/customer-photos/customer-photo-8.webp',
    imageAlt: 'Wrist wearing stacked gold and silver Italian charm bracelets with cherries, Diet Coke, American flag, and checkerboard charms',
    imageIsInspiration: true,
    baseId: 'gold',
    charmCount: 18,
    charmIds: [
      'g-strawberry',
      'g-dice',
      'g-wwjd',
      'g-music-note',
      'g-heart-red',
      'g-flower-pink',
    ],
    substitutions: {
      'g-strawberry': ['g-strawberry-dangle'],
      'g-wwjd': ['g-cross-black'],
      'g-heart-red': ['g-heart-red-and-gold'],
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

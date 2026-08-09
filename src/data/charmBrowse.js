/**
 * Browse taxonomy for catalog filtering.
 * Does not change Square/inventory IDs — thematic tags only.
 */

import { charms } from './charms'
import { BEST_SELLER_BUNDLES } from './bundles'

/** @typedef {'letters' | 'food-drinks' | 'symbols' | 'sports' | 'states' | 'dangles'} BrowseTheme */

/**
 * Catalog tabs shared by Charm Studio picker and Create gallery.
 * Metal tabs filter by `metal`; theme tabs use `getCharmBrowseThemes`.
 */
export const CHARM_BROWSE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'best-sellers', label: 'Best Sellers' },
  { id: 'letters', label: 'Letters' },
  { id: 'food-drinks', label: 'Food & Drinks' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'sports', label: 'Sports' },
  { id: 'states', label: 'States' },
  { id: 'dangles', label: 'Dangles' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'favorites', label: 'Favorites' },
]

/** Explicit sports SKUs (folder mixes sports + symbols). */
const SPORTS_IDS = new Set([
  's-basketball',
  's-byu',
  's-pickleball-paddle',
  's-soccer-ball',
  's-yankees',
])

/** State / place SKUs. */
const STATES_IDS = new Set(['s-utah', 's-montana'])

/** Food-themed dangles that live outside `/food-drink/`. */
const FOOD_EXTRA_IDS = new Set([
  's-cherry-dangle',
  'g-cherries-dangle',
  'g-strawberry-dangle',
  's-strawberry-dangle-2',
])

/**
 * Charm IDs featured on best-seller bracelet bundles (configured list, not substitutions).
 * @returns {Set<string>}
 */
export function getBestSellerCharmIds() {
  const ids = new Set()
  for (const bundle of BEST_SELLER_BUNDLES) {
    for (const id of bundle.charmIds) ids.add(id)
  }
  return ids
}

export const BEST_SELLER_CHARM_IDS = getBestSellerCharmIds()

/**
 * Thematic browse groups for a catalog charm (may be empty for fillers/starters).
 * @param {{ id: string, category?: string, image?: string, name?: string }} charm
 * @returns {BrowseTheme[]}
 */
export function getCharmBrowseThemes(charm) {
  /** @type {Set<BrowseTheme>} */
  const themes = new Set()
  const image = String(charm.image ?? '')
  const id = charm.id

  if (charm.category === 'dangles' || image.includes('/dangle-charms/') || image.includes('/birthstone-dangles/')) {
    themes.add('dangles')
  }
  if (image.includes('/letter-charms/') || id.includes('letter-')) {
    themes.add('letters')
  }
  if (image.includes('/food-drink/') || FOOD_EXTRA_IDS.has(id)) {
    themes.add('food-drinks')
  }
  if (SPORTS_IDS.has(id)) {
    themes.add('sports')
  }
  if (STATES_IDS.has(id)) {
    themes.add('states')
  }

  const isSymbolSource =
    image.includes('/symbols-sports/') ||
    image.includes('/travel-places/') ||
    image.includes('/hearts/') ||
    image.includes('/stars/') ||
    image.includes('/flowers/') ||
    image.includes('/faith/') ||
    image.includes('/fashion/') ||
    image.includes('/bows/') ||
    image.includes('/gemstones/') ||
    image.includes('/animals-characters/') ||
    image.includes('/words-phrases/')

  if (
    isSymbolSource &&
    !SPORTS_IDS.has(id) &&
    !STATES_IDS.has(id) &&
    !FOOD_EXTRA_IDS.has(id) &&
    !themes.has('dangles')
  ) {
    themes.add('symbols')
  }

  return [...themes]
}

/**
 * Human-readable metal label for UI.
 * @param {'silver' | 'gold' | string} metal
 */
export function formatMetalLabel(metal) {
  if (metal === 'gold') return 'Gold'
  if (metal === 'silver') return 'Silver'
  return String(metal ?? '')
}

/**
 * Distinguish similar names (same title, different metal/design) without changing SKU ids.
 * @param {{ name: string, metal: string, id: string }} charm
 */
export function formatCharmSubtitle(charm) {
  const metal = formatMetalLabel(charm.metal)
  const designHints = []
  if (/\(\d+\)/.test(charm.name)) designHints.push('alternate design')
  if (/dangle/i.test(charm.name) || charm.id.includes('dangle')) designHints.push('dangle')
  if (designHints.length) return `${metal} · ${designHints.join(' · ')}`
  return metal
}

/**
 * Pickable catalog charms for browsing (excludes fillers; starters optional).
 * @param {{ includeStarters?: boolean }} [opts]
 */
export function getBrowsableCharms({ includeStarters = true } = {}) {
  return charms.filter((c) => {
    if (c.id === 's-plain-filler' || c.id === 'g-plain-filler') return false
    if (!includeStarters && c.category === 'Starter Bracelets') return false
    return true
  })
}

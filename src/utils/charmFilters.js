/**
 * Compose metal/theme tab filtering, search, stock visibility, and sort.
 */
import {
  BEST_SELLER_CHARM_IDS,
  getCharmBrowseThemes,
} from '../data/charmBrowse'

/**
 * @param {Array<{ id: string, name: string, metal: string, category?: string, image?: string }>} list
 * @param {string} filter
 * @param {{ favoriteIds?: string[] }} [opts]
 */
export function applyCharmTabFilter(list, filter, { favoriteIds = [] } = {}) {
  if (!filter || filter === 'all') return list
  if (filter === 'silver') return list.filter((c) => c.metal === 'silver')
  if (filter === 'gold') return list.filter((c) => c.metal === 'gold')
  if (filter === 'best-sellers') {
    return list.filter((c) => BEST_SELLER_CHARM_IDS.has(c.id))
  }
  if (filter === 'favorites') {
    const set = new Set(favoriteIds)
    return list.filter((c) => set.has(c.id))
  }

  // Legacy catalog category ids
  if (filter === 'charms' || filter === 'Charms') {
    return list.filter((c) => c.category === 'charms' || c.category === 'Charms')
  }
  if (filter === 'Starter Bracelets') {
    return list.filter((c) => c.category === 'Starter Bracelets')
  }
  if (filter === 'dangles' || filter === 'Dangle Charms') {
    return list.filter(
      (c) => c.category === 'dangles' || getCharmBrowseThemes(c).includes('dangles'),
    )
  }

  // Thematic browse ids: letters | food-drinks | symbols | sports | states
  return list.filter((c) => getCharmBrowseThemes(c).includes(filter))
}

export function applyCharmSearch(list, query) {
  const q = String(query ?? '')
    .trim()
    .toLowerCase()
  if (!q) return list
  return list.filter((c) => {
    const haystack = `${c.name} ${c.metal} ${c.id}`.toLowerCase()
    return haystack.includes(q)
  })
}

/**
 * @param {Array} list
 * @param {{
 *   hideOutOfStock?: boolean
 *   isOutOfStock?: (charm: any) => boolean
 * }} [opts]
 */
export function applyStockVisibility(list, { hideOutOfStock = true, isOutOfStock } = {}) {
  if (!hideOutOfStock || typeof isOutOfStock !== 'function') return list
  return list.filter((c) => !isOutOfStock(c))
}

/**
 * Sort: in-stock best sellers first, then other in-stock, out-of-stock last.
 * Within a tier: name A–Z, then silver before gold for identical names.
 * @param {Array<{ id: string, name: string, metal: string }>} list
 * @param {{ isOutOfStock?: (charm: any) => boolean }} [opts]
 */
export function sortCharmsForBrowse(list, { isOutOfStock } = {}) {
  const oos = typeof isOutOfStock === 'function' ? isOutOfStock : () => false

  return [...list].sort((a, b) => {
    const aOut = oos(a) ? 1 : 0
    const bOut = oos(b) ? 1 : 0
    if (aOut !== bOut) return aOut - bOut

    const aBest = !aOut && BEST_SELLER_CHARM_IDS.has(a.id) ? 0 : 1
    const bBest = !bOut && BEST_SELLER_CHARM_IDS.has(b.id) ? 0 : 1
    if (aBest !== bBest) return aBest - bBest

    const nameCmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    if (nameCmp !== 0) return nameCmp

    if (a.metal !== b.metal) {
      if (a.metal === 'silver') return -1
      if (b.metal === 'silver') return 1
    }
    return a.id.localeCompare(b.id)
  })
}

/**
 * Full browse pipeline used by Charm Studio + Create catalog.
 * @param {Array} list
 * @param {{
 *   filter?: string
 *   query?: string
 *   hideOutOfStock?: boolean
 *   isOutOfStock?: (charm: any) => boolean
 *   favoriteIds?: string[]
 * }} [options]
 */
export function filterCharmList(
  list,
  {
    filter = 'all',
    query = '',
    hideOutOfStock = true,
    isOutOfStock,
    isOutOfStockForSort,
    favoriteIds = [],
  } = {},
) {
  const byTab = applyCharmTabFilter(list, filter, { favoriteIds })
  const bySearch = applyCharmSearch(byTab, query)
  const byStock = applyStockVisibility(bySearch, { hideOutOfStock, isOutOfStock })
  return sortCharmsForBrowse(byStock, { isOutOfStock: isOutOfStockForSort ?? isOutOfStock })
}

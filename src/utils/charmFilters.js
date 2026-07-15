/**
 * Compose metal/category tab filtering with optional name search.
 * Tab IDs match site filters: 'all' | 'silver' | 'gold' | category string.
 */
export function applyCharmTabFilter(list, filter) {
  if (!filter || filter === 'all') return list
  if (filter === 'silver') return list.filter((c) => c.metal === 'silver')
  if (filter === 'gold') return list.filter((c) => c.metal === 'gold')
  return list.filter((c) => c.category === filter)
}

export function applyCharmSearch(list, query) {
  const q = String(query ?? '')
    .trim()
    .toLowerCase()
  if (!q) return list
  return list.filter((c) => c.name.toLowerCase().includes(q))
}

export function filterCharmList(list, { filter = 'all', query = '' } = {}) {
  return applyCharmSearch(applyCharmTabFilter(list, filter), query)
}

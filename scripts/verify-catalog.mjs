/**
 * Catalog browse regressions: filters, stock hide, sort, favorites, unique SKUs.
 * Run: npx vite-node scripts/verify-catalog.mjs
 */
import {
  CHARM_CATEGORY_FILTERS,
  charms,
  getCharmById,
  isFillerCharm,
} from '../src/data/charms.js'
import {
  BEST_SELLER_CHARM_IDS,
  getCharmBrowseThemes,
  getBrowsableCharms,
} from '../src/data/charmBrowse.js'
import {
  applyCharmSearch,
  applyCharmTabFilter,
  applyStockVisibility,
  filterCharmList,
  sortCharmsForBrowse,
} from '../src/utils/charmFilters.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

// ── Unique SKUs (no accidental duplicate ids / name+metal) ─────────────────
{
  const ids = new Set()
  const nameMetal = new Set()
  for (const charm of charms) {
    assert(!ids.has(charm.id), `duplicate catalog id ${charm.id}`)
    ids.add(charm.id)
    const key = `${charm.name.toLowerCase()}|${charm.metal}`
    assert(!nameMetal.has(key), `duplicate name+metal inventory key ${key} (${charm.id})`)
    nameMetal.add(key)
  }
  assert(ids.size === 115, `expected 115 charms, got ${ids.size}`)
  pass('unique-skus', { count: ids.size })
}

// Shared display names across metals are intentional variants — not duplicates
{
  const byName = new Map()
  for (const charm of charms) {
    if (isFillerCharm(charm) || charm.category === 'Starter Bracelets') continue
    const list = byName.get(charm.name) ?? []
    list.push(charm)
    byName.set(charm.name, list)
  }
  const multiMetal = [...byName.entries()].filter(([, list]) => list.length > 1)
  assert(multiMetal.length > 0, 'expected some shared names across metals')
  for (const [name, list] of multiMetal) {
    const metals = new Set(list.map((c) => c.metal))
    assert(metals.size === list.length || list.every((c) => c.id), `variants for ${name} keep distinct ids`)
    const ids = new Set(list.map((c) => c.id))
    assert(ids.size === list.length, `shared name "${name}" must keep distinct SKUs`)
  }
  pass('multi-metal-name-variants', { pairs: multiMetal.length })
}

// ── Browse filters ─────────────────────────────────────────────────────────
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'best-sellers'), 'best sellers tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'letters'), 'letters tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'food-drinks'), 'food tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'symbols'), 'symbols tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'sports'), 'sports tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'states'), 'states tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'dangles'), 'dangles tab')
assert(CHARM_CATEGORY_FILTERS.some((f) => f.id === 'favorites'), 'favorites tab')
pass('browse-filter-tabs')

const pickable = getBrowsableCharms({ includeStarters: false }).filter((c) => !isFillerCharm(c))

{
  const letters = applyCharmTabFilter(pickable, 'letters')
  assert(letters.length >= 10, 'letters filter returns letter charms')
  assert(letters.every((c) => getCharmBrowseThemes(c).includes('letters')), 'letters themed')
}
{
  const food = applyCharmTabFilter(pickable, 'food-drinks')
  assert(food.some((c) => c.id === 's-diet-coke'), 'food includes diet coke')
  assert(food.some((c) => c.id === 's-cherry-dangle'), 'food includes cherry dangle')
  assert(food.some((c) => c.id === 's-lemon'), 'food includes lemon')
}
{
  const sports = applyCharmTabFilter(pickable, 'sports')
  assert(sports.some((c) => c.id === 's-basketball'), 'sports includes basketball')
  assert(!sports.some((c) => c.id === 's-utah'), 'utah is states not sports')
}
{
  const states = applyCharmTabFilter(pickable, 'states')
  assert(states.some((c) => c.id === 's-utah'), 'states includes utah')
  assert(states.some((c) => c.id === 's-montana'), 'states includes montana')
}
{
  const best = applyCharmTabFilter(pickable, 'best-sellers')
  assert(best.length === BEST_SELLER_CHARM_IDS.size || best.every((c) => BEST_SELLER_CHARM_IDS.has(c.id)), 'best sellers from bundles')
  assert(best.every((c) => BEST_SELLER_CHARM_IDS.has(c.id)), 'best sellers ids valid')
}
{
  const fav = applyCharmTabFilter(pickable, 'favorites', { favoriteIds: ['s-dice', 'g-dice'] })
  assert(fav.length === 2, 'favorites filter')
  assert(fav.every((c) => c.id === 's-dice' || c.id === 'g-dice'), 'favorites ids')
}
pass('theme-filters')

// Search matches metal + name
{
  const pearl = applyCharmSearch(pickable, 'pearl dangle')
  assert(pearl.some((c) => c.id === 's-pearl-dangle'), 'search silver pearl')
  assert(pearl.some((c) => c.id === 'g-pearl-dangle'), 'search gold pearl')
  const goldOnly = applyCharmSearch(pearl, 'gold')
  assert(goldOnly.every((c) => c.metal === 'gold' || c.name.toLowerCase().includes('gold')), 'search gold')
}
pass('search')

// Stock hide + sort
{
  const oosIds = new Set(['s-dice', 'g-heart-red'])
  const isOut = (c) => oosIds.has(c.id)
  const hidden = applyStockVisibility(pickable, { hideOutOfStock: true, isOutOfStock: isOut })
  assert(!hidden.some((c) => oosIds.has(c.id)), 'OOS hidden by default path')
  const shown = applyStockVisibility(pickable, { hideOutOfStock: false, isOutOfStock: isOut })
  assert(shown.some((c) => c.id === 's-dice'), 'OOS visible when toggle on')

  const sorted = sortCharmsForBrowse(
    pickable.filter((c) => BEST_SELLER_CHARM_IDS.has(c.id) || oosIds.has(c.id) || c.id === 's-labubu'),
    { isOutOfStock: isOut },
  )
  const firstOutIndex = sorted.findIndex((c) => isOut(c))
  const lastInIndex = sorted.reduce((acc, c, i) => (!isOut(c) ? i : acc), -1)
  if (firstOutIndex !== -1 && lastInIndex !== -1) {
    assert(firstOutIndex > lastInIndex, 'all in-stock before any OOS')
  }
  const inStockBest = sorted.filter((c) => !isOut(c) && BEST_SELLER_CHARM_IDS.has(c.id))
  const inStockOther = sorted.filter((c) => !isOut(c) && !BEST_SELLER_CHARM_IDS.has(c.id))
  if (inStockBest.length && inStockOther.length) {
    const lastBest = sorted.findLastIndex((c) => !isOut(c) && BEST_SELLER_CHARM_IDS.has(c.id))
    const firstOther = sorted.findIndex((c) => !isOut(c) && !BEST_SELLER_CHARM_IDS.has(c.id))
    assert(lastBest < firstOther, 'best sellers before other in-stock')
  }
}
pass('stock-hide-and-sort')

// Full pipeline preserves ids for Square
{
  const list = filterCharmList(pickable, {
    filter: 'all',
    query: '',
    hideOutOfStock: true,
    isOutOfStock: () => false,
    favoriteIds: [],
  })
  for (const charm of list.slice(0, 20)) {
    assert(getCharmById(charm.id)?.id === charm.id, `id intact ${charm.id}`)
  }
}
pass('ids-intact')

console.log(JSON.stringify({ ok: true, results }, null, 2))

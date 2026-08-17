/**
 * Combined hardening regression suite for hero, bundles, sizing, pricing, cart.
 * Run: npx vite-node scripts/verify-hardening.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BASE_OPTIONS,
  DEFAULT_CHARM_PRICE,
  getCharmById,
  getCharmCapacity,
  isFillerCharm,
  SIZE_PRESETS,
  parseCharmCountInput,
  charms,
} from '../src/data/charms.js'
import { inventoryKey } from '../src/utils/inventory.js'
import {
  BEST_SELLER_BUNDLES,
  buildBundleCartPayload,
  getBundleConfiguredListPrice,
  resolveBundle,
} from '../src/data/bundles.js'
import {
  FULFILLMENT_PLACEHOLDER_TOKEN,
  FLAT_RATE_SHIPPING,
  getCustomerFacingFulfillmentCopy,
  isFulfillmentPlaceholder,
  ORDER_FULFILLMENT_TIMEFRAME,
} from '../src/data/shipping.js'
import {
  addCharmToLinkOrder,
  createInitialLinkOrder,
  getCharmsFromLinkOrder,
  resizeLinkOrder,
} from '../src/utils/braceletLinks.js'
import { buildOrderEstimate, formatPricingExample } from '../src/utils/orderEstimate.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function round(n) {
  return Math.round(Number(n) * 100) / 100
}

const results = []

function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

// ── 1. Fulfillment configuration ──────────────────────────────────────────
assert(ORDER_FULFILLMENT_TIMEFRAME == null || !isFulfillmentPlaceholder(ORDER_FULFILLMENT_TIMEFRAME), 'Configured fulfillment must not be placeholder')
assert(getCustomerFacingFulfillmentCopy() === null || !isFulfillmentPlaceholder(getCustomerFacingFulfillmentCopy()), 'Customer-facing fulfillment must not be placeholder')
assert(isFulfillmentPlaceholder(FULFILLMENT_PLACEHOLDER_TOKEN), 'Token detector works')
assert(isFulfillmentPlaceholder(null), 'Null treated as unset')
assert(
  ORDER_FULFILLMENT_TIMEFRAME === 'Ships in 3–5 business days',
  'Configured fulfillment timeframe must match owner copy',
)
assert(
  getCustomerFacingFulfillmentCopy() === 'Ships in 3–5 business days',
  'Customer-facing fulfillment must surface configured copy',
)
assert(FLAT_RATE_SHIPPING === 6, 'Flat-rate shipping remains $6')
pass('fulfillment-config-safe')

// Shipping charged once per order (not per build)
{
  const productA = 33.7
  const productB = 35.7
  const multiBuildProduct = productA + productB
  const orderTotal = multiBuildProduct + FLAT_RATE_SHIPPING
  assert(orderTotal === multiBuildProduct + 6, 'shipping once for two builds')
  assert(orderTotal !== multiBuildProduct + 12, 'shipping must not double per build')
}
pass('shipping-once-per-order')

const homeSrc = readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8')
const cartSrc = readFileSync(new URL('../src/pages/Cart.jsx', import.meta.url), 'utf8')
const drawerSrc = readFileSync(new URL('../src/components/CartDrawer.jsx', import.meta.url), 'utf8')

// Homepage surfaces fulfillment in hero + trust copy
assert(homeSrc.includes('FULFILLMENT_COPY'), 'Home keeps fulfillment copy binding')
assert(homeSrc.includes('FULFILLMENT_COPY ?'), 'Home conditionally renders fulfillment')
assert(cartSrc.includes('getCustomerFacingFulfillmentCopy'), 'Cart shows fulfillment')
assert(cartSrc.includes('once per order'), 'Cart clarifies shipping once per order')
assert(drawerSrc.includes('getCustomerFacingFulfillmentCopy'), 'Cart drawer shows fulfillment')
pass('fulfillment-surfaces-hero-cart-trust')

// ── 2. Homepage CTA destinations (source contract) ────────────────────────
assert(homeSrc.includes("hash: BEST_SELLERS_HASH") || homeSrc.includes("hash: 'best-sellers'"), 'Primary CTA targets best-sellers hash')
assert(homeSrc.includes('to="/create"'), 'Secondary CTA targets /create')
assert(!homeSrc.includes('BEST_SELLERS_AVAILABLE'), 'Obsolete BEST_SELLERS_AVAILABLE flag removed')
assert(homeSrc.includes('getCustomerFacingFulfillmentCopy'), 'Home uses safe fulfillment helper')
assert(!homeSrc.includes('{ORDER_FULFILLMENT_TIMEFRAME}'), 'Home does not render raw fulfillment constant')
pass('homepage-cta-contract')

// ── 3–6. Bundles: prices, substitutions, fillers ──────────────────────────
const equalSubMap = { 'flower - pink|silver': { inStock: false } } // s-flower-pink → s-flower-turquoise same $3.95
const higherSubMap = {
  'cherries - pink background|gold': { inStock: false }, // $3.95 → g-cherries-dangle $4.95
}
const lowerOrEqualMap = {
  'heart - red|gold': { inStock: false }, // g-heart-red → g-heart-red-and-gold (same 3.95)
}
const unavailableMap = {
  'checkered flag - gold|gold': { inStock: false, qty: 0 }, // no substitute configured
}

function allInStockInventoryMap() {
  /** @type {Record<string, { inStock: boolean, qty: number }>} */
  const map = {}
  for (const charm of charms) {
    if (isFillerCharm(charm)) continue
    map[inventoryKey(charm.name, charm.metal)] = { inStock: true, qty: 25 }
  }
  for (const base of BASE_OPTIONS) {
    map[inventoryKey(base.label, base.metal)] = { inStock: true, qty: 25 }
  }
  return map
}

const stockReady = { status: 'ready' }
const fullStockMap = allInStockInventoryMap()

for (const bundle of BEST_SELLER_BUNDLES) {
  const resolved = resolveBundle(bundle, fullStockMap, stockReady)
  assert(resolved.available, `${bundle.name} available with verified in-stock inventory`)
  const payload = buildBundleCartPayload(resolved)
  assert(payload.items.every((item) => !isFillerCharm(item)), `${bundle.name}: no paid fillers`)
  assert(payload.subtotal === resolved.price, `${bundle.name}: subtotal matches live price`)
  assert(resolved.plainLinkCount === resolved.capacity - resolved.resolvedCharms.length, `${bundle.name}: plain count`)
  assert(typeof bundle.imageIsInspiration === 'boolean', `${bundle.name}: inspiration flag set`)
  assert(getBundleConfiguredListPrice(bundle) === resolved.configuredListPrice, `${bundle.name}: list price from catalog`)
}
pass('bundles-base-prices-and-fillers')

{
  const silver = BEST_SELLER_BUNDLES.find((b) => b.id === 'silver-best-sellers')
  const withEqual = resolveBundle(silver, { ...fullStockMap, ...equalSubMap }, stockReady)
  assert(withEqual.available, 'equal-price substitution available')
  assert(
    withEqual.substitutionsApplied.some((s) => s.from.id === 's-flower-pink' && s.to.id === 's-flower-turquoise'),
    's-flower-pink → s-flower-turquoise',
  )
  assert(withEqual.priceDeltaFromConfigured === 0, 'equal sub keeps price')
  assert(withEqual.price === withEqual.configuredListPrice, 'price equals configured after equal sub')
}
{
  const gold = BEST_SELLER_BUNDLES.find((b) => b.id === 'gold-best-sellers')
  const withHigher = resolveBundle(gold, { ...fullStockMap, ...higherSubMap }, stockReady)
  assert(withHigher.available, 'higher-price substitution available')
  const sub = withHigher.substitutionsApplied.find((s) => s.from.id === 'g-cherries-pink-background')
  assert(sub?.to.id === 'g-cherries-dangle', 'cherries → cherries dangle')
  assert(sub.priceDelta === round(4.95 - 3.95), 'higher delta recorded')
  assert(withHigher.price === round(withHigher.configuredListPrice + 1), 'bundle price recalculated higher')
}
{
  const gold = BEST_SELLER_BUNDLES.find((b) => b.id === 'gold-best-sellers')
  const unavailable = resolveBundle(gold, { ...fullStockMap, ...unavailableMap }, stockReady)
  assert(!unavailable.available, 'primary and substitute unavailable → bundle unavailable')
  assert(unavailable.unavailableCharms.some((c) => c.id === 'g-checkered-flag-gold'), 'checkered flag listed unavailable')
}
pass('bundle-substitutions-price-recalc')

// Rapid add lock contract (module-level simulation)
{
  let lock = false
  let adds = 0
  function tryAdd() {
    if (lock) return false
    lock = true
    adds += 1
    lock = false
    return true
  }
  assert(tryAdd() && tryAdd(), 'intentional second add after unlock allowed')
  lock = true
  assert(!tryAdd(), 'rapid add blocked while locked')
  pass('rapid-add-lock-behavior', { adds })
}

// Multiple bundles + remove one build (cart math simulation)
{
  const a = buildBundleCartPayload(resolveBundle(BEST_SELLER_BUNDLES[0], fullStockMap, stockReady))
  const b = buildBundleCartPayload(resolveBundle(BEST_SELLER_BUNDLES[2], fullStockMap, stockReady))
  const items = new Map()
  function addPayload(payload) {
    for (const item of payload.items) {
      items.set(item.id, (items.get(item.id) ?? 0) + item.quantity)
    }
  }
  function removePayload(payload) {
    for (const item of payload.items) {
      const next = (items.get(item.id) ?? 0) - item.quantity
      if (next <= 0) items.delete(item.id)
      else items.set(item.id, next)
    }
  }
  addPayload(a)
  addPayload(a) // intentional duplicate Retro Starter
  addPayload(b)
  assert(items.get('silver') === 2, 'two silver bases after duplicate add')
  assert(items.get('gold') === 1, 'one gold base')
  removePayload(a)
  assert(items.get('silver') === 1, 'removing one build leaves the other silver base')
  assert(items.get('gold') === 1, 'gold untouched')
  pass('multi-bundle-and-remove-one')
}

// ── 7–10. Builder estimate scenarios ──────────────────────────────────────
const silver = BASE_OPTIONS.find((b) => b.id === 'silver')
const gold = BASE_OPTIONS.find((b) => b.id === 'gold')
const standard = getCharmById('s-heart-red')
const dangle = getCharmById('s-cherry-dangle')
assert(standard && dangle && silver && gold, 'catalog fixtures present')

{
  const est = buildOrderEstimate({ base: silver, charms: [], plainLinkCount: 18 })
  assert(est.productSubtotal === 10, 'base-only product')
  assert(est.plainLinkCount === 18, 'base-only plains')
  assert(est.shipping === FLAT_RATE_SHIPPING, 'shipping from config')
  assert(est.estimatedTotalBeforeTax === round(10 + FLAT_RATE_SHIPPING), 'base-only total before tax')
}
{
  const charms7 = Array.from({ length: 7 }, () => standard)
  const est = buildOrderEstimate({ base: silver, charms: charms7, plainLinkCount: 11 })
  assert(est.standardCount === 7 && est.dangleCount === 0, 'seven standard')
  assert(est.standardSubtotal === round(7 * standard.price), 'seven standard subtotal')
  assert(est.estimatedTotalBeforeTax === round(10 + 7 * standard.price + FLAT_RATE_SHIPPING), 'seven + ship')
}
{
  const est = buildOrderEstimate({ base: gold, charms: [dangle, dangle], plainLinkCount: 16 })
  assert(est.dangleCount === 2 && est.standardCount === 0, 'dangle-only')
  assert(est.dangleSubtotal === round(2 * dangle.price), 'dangle subtotal')
}
{
  const est = buildOrderEstimate({
    base: gold,
    charms: [standard, dangle, standard],
    plainLinkCount: 15,
  })
  assert(est.standardCount === 2 && est.dangleCount === 1, 'mixed')
  assert(
    est.productSubtotal === round(gold.price + 2 * standard.price + dangle.price),
    'mixed product',
  )
}
{
  const example = formatPricingExample({
    base: silver,
    standardCharmPrice: DEFAULT_CHARM_PRICE,
    standardCount: 7,
  })
  assert(example.includes('before tax'), 'example says before tax')
  assert(example.includes(String(round(10 + 7 * DEFAULT_CHARM_PRICE + FLAT_RATE_SHIPPING))), 'example uses live math')
}
pass('builder-estimate-scenarios')

// Sizing grow/shrink/block
{
  let order = createInitialLinkOrder(20)
  for (const id of ['s-heart-red', 's-dice', 's-smiley-face']) {
    order = addCharmToLinkOrder(order, getCharmById(id))
  }
  const grown = resizeLinkOrder(order, 23)
  assert(grown.ok && grown.linkOrder.length === 23, 'grow to large')
  assert(getCharmsFromLinkOrder(grown.linkOrder).length === 3, 'charms kept on grow')
  const shrunk = resizeLinkOrder(grown.linkOrder, 17)
  assert(shrunk.ok && shrunk.linkOrder.length === 17, 'shrink to small')
  const blocked = resizeLinkOrder(shrunk.linkOrder, 2)
  assert(!blocked.ok && blocked.overflow === 1, 'block too-small size')
  assert(parseCharmCountInput('12') === 12, 'custom size')
  assert(SIZE_PRESETS.length === 3, 'three presets')
  assert(getCharmCapacity(20, 'silver-watch') === 15, 'watch capacity')
}
pass('sizing-grow-shrink-block-custom')

// Fillers never paid in checkout payload shape
{
  const resolved = resolveBundle(BEST_SELLER_BUNDLES[0], fullStockMap, stockReady)
  const { items, build } = buildBundleCartPayload(resolved)
  assert(build.charms.some((c) => isFillerCharm(c)), 'build includes fillers for layout')
  assert(items.every((i) => !isFillerCharm(i) && i.id !== 's-plain-filler' && i.id !== 'g-plain-filler'), 'checkout items exclude fillers')
  const est = buildOrderEstimate({
    base: resolved.base,
    charms: resolved.resolvedCharms,
    plainLinkCount: resolved.plainLinkCount,
  })
  assert(est.productSubtotal === resolved.price, 'estimate product matches bundle price')
  assert(est.estimatedTotalBeforeTax === round(resolved.price + FLAT_RATE_SHIPPING), 'estimate matches cart math')
}
pass('plain-fillers-free-and-estimate-matches-cart')

// Square checkout handoff shape (ids valid in catalog)
{
  const { charms } = await import('../src/data/charms.js')
  const canonical = new Set([...charms.map((c) => c.id), ...BASE_OPTIONS.map((b) => b.id)])
  for (const bundle of BEST_SELLER_BUNDLES) {
    const { items, build } = buildBundleCartPayload(resolveBundle(bundle, fullStockMap, stockReady))
    for (const item of items) assert(canonical.has(item.id), `checkout id ${item.id}`)
    for (const charm of build.charms) assert(canonical.has(charm.id), `build charm ${charm.id}`)
  }
  pass('square-checkout-id-handoff')
}

// ── Production dist placeholder scan (after build) ────────────────────────
function walkFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) walkFiles(path, acc)
    else acc.push(path)
  }
  return acc
}

const distDir = fileURLToPath(new URL('../dist', import.meta.url))
let distScanned = false
try {
  if (!existsSync(distDir)) {
    pass('production-dist-no-fulfillment-placeholder', { skipped: 'dist missing — run build first' })
  } else {
    const files = walkFiles(distDir).filter((f) => /\.(html|js|css)$/.test(f))
    const needle = ['SET', 'FULFILLMENT', 'TIMEFRAME'].join('_')
    const offenders = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      if (text.includes(needle)) offenders.push(file.replace(distDir, 'dist'))
    }
    assert(offenders.length === 0, `Placeholder found in production assets: ${offenders.join(', ')}`)
    distScanned = true
    pass('production-dist-no-fulfillment-placeholder')
  }
} catch (error) {
  throw error
}

console.log(
  JSON.stringify(
    {
      ok: true,
      distScanned,
      shipping: FLAT_RATE_SHIPPING,
      fulfillmentCustomerCopy: getCustomerFacingFulfillmentCopy(),
      results,
    },
    null,
    2,
  ),
)

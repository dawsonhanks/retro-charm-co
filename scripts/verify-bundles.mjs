import { charms, BASE_OPTIONS, isFillerCharm } from '../src/data/charms.js'
import { BEST_SELLER_BUNDLES, resolveBundle, buildBundleCartPayload } from '../src/data/bundles.js'
import { inventoryKey } from '../src/utils/inventory.js'

function allInStockInventoryMap() {
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

const fullStockMap = allInStockInventoryMap()
const stockReady = { status: 'ready' }

const CANONICAL = new Map()
for (const c of charms) CANONICAL.set(c.id, { name: c.name, price: c.price })
for (const b of BASE_OPTIONS) CANONICAL.set(b.id, { name: b.label, price: b.price })

function validateCheckoutShape(items, braceletBuilds) {
  const errors = []
  for (const item of items) {
    if (!CANONICAL.has(item.id)) errors.push(`Unknown item id: ${item.id}`)
    const canonical = CANONICAL.get(item.id)
    if (canonical && Math.abs(canonical.price - item.price) > 0.001) {
      errors.push(`Price mismatch for ${item.id}: cart ${item.price} vs canonical ${canonical.price}`)
    }
  }
  for (const build of braceletBuilds) {
    if (!BASE_OPTIONS.some((b) => b.id === (build.baseId ?? build.metal))) {
      errors.push(`Invalid build base: ${build.baseId}`)
    }
    for (const charm of build.charms) {
      if (!CANONICAL.has(charm.id)) errors.push(`Unknown charm in build: ${charm.id}`)
    }
    const realCount = build.charms.filter((c) => !isFillerCharm(c)).length
    const itemCharmQty = items
      .filter((i) => !BASE_OPTIONS.some((b) => b.id === i.id))
      .reduce((s, i) => s + i.quantity, 0)
    if (realCount !== itemCharmQty) {
      errors.push(`Build real charms ${realCount} != item charm qty ${itemCharmQty} for ${build.label}`)
    }
  }
  return errors
}

const results = []
for (const bundle of BEST_SELLER_BUNDLES) {
  const resolved = resolveBundle(bundle, fullStockMap, stockReady)
  const payload = buildBundleCartPayload(resolved)
  const subtotal = payload.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const errors = validateCheckoutShape(payload.items, [payload.build])
  results.push({
    name: bundle.name,
    available: resolved.available,
    links: bundle.charmCount,
    slots: payload.build.charms.length,
    realCharms: resolved.resolvedCharms.map((c) => c.id),
    itemIds: payload.items.map((i) => `${i.id} x${i.quantity} @$${i.price}`),
    expectedPrice: resolved.price,
    cartSubtotal: Number(subtotal.toFixed(2)),
    buildLabel: payload.build.label,
    metal: payload.build.metal,
    errors,
  })
}

const oosMap = { 'flower - pink|silver': { inStock: false, qty: 0 } }
const withSub = resolveBundle(BEST_SELLER_BUNDLES[0], { ...fullStockMap, ...oosMap }, stockReady)
const subPayload = buildBundleCartPayload(withSub)

const hardOos = { 'checkered flag - gold|gold': { inStock: false, qty: 0 } }
const goldBundle = BEST_SELLER_BUNDLES.find((b) => b.id === 'gold-best-sellers')
const unavailable = resolveBundle(goldBundle, { ...fullStockMap, ...hardOos }, stockReady)

console.log(
  JSON.stringify(
    {
      bundles: results,
      substitutionTest: {
        available: withSub.available,
        substitutions: withSub.substitutionsApplied.map((s) => `${s.from.id} -> ${s.to.id}`),
        charmIds: withSub.resolvedCharms.map((c) => c.id),
        subtotal: subPayload.subtotal,
      },
      unavailableTest: {
        available: unavailable.available,
        unavailable: unavailable.unavailableCharms.map((c) => c.id),
      },
    },
    null,
    2,
  ),
)

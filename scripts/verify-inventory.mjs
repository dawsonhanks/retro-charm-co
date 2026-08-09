/**
 * Inventory fail-safe regression checks.
 * Run: npx vite-node scripts/verify-inventory.mjs
 */
import { charms, BASE_OPTIONS, isFillerCharm, getCharmById } from '../src/data/charms.js'
import {
  getInventory,
  isInventoryAuthoritative,
  isInventoryStale,
  INVENTORY_OUTAGE_MESSAGE,
  shouldUseMockInventory,
  isInventoryEmergencyFailOpen,
} from '../src/lib/inventory.js'
import { resetInventoryDiagnosticState } from '../src/lib/inventoryDiagnostics.js'
import {
  getCharmStockState,
  getStockStateLabel,
  inventoryKey,
  isCharmOutOfStock,
  rowsToInventoryMap,
  resolveCatalogProductForInventory,
} from '../src/utils/inventory.js'
import { validateCartInventory } from '../src/utils/validateCartInventory.js'
import { revalidateCheckoutInventory } from '../api/_lib/revalidateCheckoutInventory.js'
import { resolveBundle, BEST_SELLER_BUNDLES, buildBundleCartPayload } from '../src/data/bundles.js'
import { persistSavedBuild, loadSavedBuild, STORAGE_KEYS } from '../src/utils/storage.js'
import { createInitialLinkOrder, createCharmLink } from '../src/utils/braceletLinks.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

resetInventoryDiagnosticState()

function allInStockMap() {
  /** @type {Record<string, { inStock: boolean, qty: number }>} */
  const map = {}
  for (const charm of charms) {
    if (isFillerCharm(charm)) continue
    map[inventoryKey(charm.name, charm.metal)] = { inStock: true, qty: 10 }
  }
  for (const base of BASE_OPTIONS) {
    map[inventoryKey(base.label, base.metal)] = { inStock: true, qty: 10 }
  }
  return map
}

function mockFetchJson(data, { ok = true, status = 200, delayMs = 0 } = {}) {
  return async () => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
    return {
      ok,
      status,
      json: async () => data,
    }
  }
}

// ── Complete inventory response ─────────────────────────────────────────────
{
  const rows = [
    { name: 'Heart - Red', metal: 'silver', qty_in_stock: 3 },
    { name: 'WWJD', metal: 'gold', qty_in_stock: 0 },
  ]
  const result = await getInventory({
    fetchImpl: mockFetchJson(rows),
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(result.status === 'ready', 'complete response ready')
  assert(isInventoryAuthoritative(result), 'complete response authoritative')
  assert(result.map[inventoryKey('Heart - Red', 'silver')].inStock === true, 'in-stock mapped')
  assert(result.map[inventoryKey('WWJD', 'gold')].inStock === false, 'oos mapped')
  pass('complete-inventory-response')
}

// ── Timeout ─────────────────────────────────────────────────────────────────
{
  const result = await getInventory({
    fetchImpl: async (_url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('Aborted')
          err.name = 'AbortError'
          reject(err)
        })
      }),
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    timeoutMs: 30,
    isDev: false,
  })
  assert(result.status === 'unavailable', 'timeout → unavailable')
  assert(result.reason === 'timeout', 'timeout reason')
  assert(result.message === INVENTORY_OUTAGE_MESSAGE, 'timeout message')
  assert(!isInventoryAuthoritative(result), 'timeout not authoritative')
  pass('inventory-timeout')
}

// ── Network error ───────────────────────────────────────────────────────────
{
  const result = await getInventory({
    fetchImpl: async () => {
      throw new Error('network down')
    },
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(result.status === 'unavailable', 'network → unavailable')
  assert(result.reason === 'network_error', 'network reason')
  pass('inventory-network-error')
}

// ── Invalid response ────────────────────────────────────────────────────────
{
  const result = await getInventory({
    fetchImpl: mockFetchJson({ not: 'an array' }),
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(result.status === 'unavailable', 'invalid → unavailable')
  assert(result.reason === 'invalid_response', 'invalid reason')
  pass('inventory-invalid-response')
}

// ── Empty response ──────────────────────────────────────────────────────────
{
  const result = await getInventory({
    fetchImpl: mockFetchJson([]),
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(result.status === 'ready', 'empty array still ready')
  const heart = getCharmById('s-heart-red')
  assert(
    getCharmStockState(heart.name, heart.metal, result.map, { status: 'ready', productId: heart.id }) ===
      'unknown',
    'empty inventory → unknown for catalog item',
  )
  assert(
    isCharmOutOfStock(heart.name, heart.metal, result.map, { status: 'ready', productId: heart.id }),
    'empty inventory → non-purchasable',
  )
  pass('inventory-empty-response')
}

// ── One catalog item missing ────────────────────────────────────────────────
{
  resetInventoryDiagnosticState()
  const map = allInStockMap()
  const heart = getCharmById('s-heart-red')
  delete map[inventoryKey(heart.name, heart.metal)]
  const state = getCharmStockState(heart.name, heart.metal, map, {
    status: 'ready',
    productId: heart.id,
  })
  assert(state === 'unknown', 'missing product → unknown')
  assert(getStockStateLabel(state) === 'Availability unavailable', 'missing label')
  assert(
    isCharmOutOfStock(heart.name, heart.metal, map, { status: 'ready', productId: heart.id }),
    'missing product non-purchasable',
  )
  pass('catalog-item-missing')
}

// ── Out of stock ────────────────────────────────────────────────────────────
{
  const map = allInStockMap()
  const heart = getCharmById('s-heart-red')
  map[inventoryKey(heart.name, heart.metal)] = { inStock: false, qty: 0 }
  assert(
    getCharmStockState(heart.name, heart.metal, map, { status: 'ready', productId: heart.id }) ===
      'out_of_stock',
    'oos state',
  )
  pass('out-of-stock-item')
}

// ── Recovery after retry ────────────────────────────────────────────────────
{
  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    if (calls === 1) throw new Error('fail once')
    return mockFetchJson([{ name: 'Heart - Red', metal: 'silver', qty_in_stock: 2 }])()
  }
  const first = await getInventory({
    fetchImpl,
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(first.status === 'unavailable', 'first attempt fails')
  const second = await getInventory({
    fetchImpl,
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(second.status === 'ready', 'retry recovers')
  assert(isInventoryAuthoritative(second), 'recovered authoritative')
  pass('inventory-recover-after-retry')
}

// ── Build preserved during outage (storage) ─────────────────────────────────
{
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
  const charm = getCharmById('s-heart-red')
  const linkOrder = createInitialLinkOrder(17)
  linkOrder[2] = createCharmLink(charm)
  persistSavedBuild({ baseId: 'silver', charmCount: 17, linkOrder })
  const outage = await getInventory({
    fetchImpl: async () => {
      throw new Error('outage')
    },
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' },
    isDev: false,
  })
  assert(outage.status === 'unavailable', 'outage status')
  const saved = loadSavedBuild()
  assert(saved?.charmCount === 17, 'build size preserved during outage')
  assert(
    saved?.linkOrder?.some((l) => l.type === 'charm' && l.charmId === 's-heart-red'),
    'build charm preserved during outage',
  )
  assert(store.has(STORAGE_KEYS.savedBuild), 'storage key intact')
  pass('build-preserved-during-outage')
}

// ── Cart preserved when checkout blocked ────────────────────────────────────
{
  const cartItems = [
    { id: 's-heart-red', quantity: 1 },
    { id: 'silver', quantity: 1 },
  ]
  const cartCopy = structuredClone(cartItems)
  const blocked = validateCartInventory({
    items: cartItems,
    inventoryResult: {
      status: 'unavailable',
      rows: [],
      map: {},
      fetchedAt: null,
      reason: 'network_error',
      message: INVENTORY_OUTAGE_MESSAGE,
    },
  })
  assert(!blocked.ok, 'checkout blocked on outage')
  assert(JSON.stringify(cartItems) === JSON.stringify(cartCopy), 'cart unchanged after block')
  pass('cart-preserved-when-checkout-blocked')
}

// ── Free fillers excluded ───────────────────────────────────────────────────
{
  const filler = charms.find((c) => isFillerCharm(c))
  assert(filler, 'filler exists')
  const map = allInStockMap()
  // No filler row in map
  const validation = validateCartInventory({
    items: [
      { id: 'silver', quantity: 1 },
      { id: filler.id, quantity: 1 },
      { id: 's-heart-red', quantity: 1 },
    ],
    braceletBuilds: [
      {
        charms: [{ id: filler.id }, { id: 's-heart-red' }],
      },
    ],
    inventoryResult: { status: 'ready', rows: [], map, fetchedAt: Date.now() },
  })
  assert(validation.ok, 'filler does not block checkout')
  assert(!validation.unavailableItems.some((u) => u.id === filler.id), 'filler not listed unavailable')
  pass('free-fillers-excluded')
}

// ── Inventory changing between cart and checkout ────────────────────────────
{
  const mapAtCart = allInStockMap()
  const heart = getCharmById('s-heart-red')
  assert(
    !isCharmOutOfStock(heart.name, heart.metal, mapAtCart, { status: 'ready', productId: heart.id }),
    'available at cart view',
  )
  const mapAtCheckout = { ...mapAtCart }
  mapAtCheckout[inventoryKey(heart.name, heart.metal)] = { inStock: false, qty: 0 }
  const validation = validateCartInventory({
    items: [
      { id: 'silver', quantity: 1 },
      { id: heart.id, quantity: 1 },
    ],
    inventoryResult: { status: 'ready', rows: [], map: mapAtCheckout, fetchedAt: Date.now() },
  })
  assert(!validation.ok, 'checkout blocked after stock change')
  assert(validation.unavailableItems.some((u) => u.id === heart.id), 'changed item identified')
  pass('inventory-changed-before-checkout')
}

// ── No Payment Link on unverified (server revalidate) ───────────────────────
{
  const check = await revalidateCheckoutInventory({
    items: [{ id: 's-heart-red', quantity: 1 }],
    fetchImpl: async () => {
      throw new Error('down')
    },
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
    },
  })
  assert(!check.createdPaymentLinkAllowed, 'payment link not allowed when unverified')
  assert(!check.ok, 'revalidate not ok')
  pass('no-payment-link-unverified')
}

// ── Unconfigured never fail-opens in production ─────────────────────────────
{
  assert(!shouldUseMockInventory({}, { isDev: false }), 'mock disabled outside dev')
  assert(!isInventoryEmergencyFailOpen({}, { isDev: false }), 'emergency off by default')
  const result = await getInventory({
    env: {},
    isDev: false,
    fetchImpl: async () => {
      throw new Error('should not fetch')
    },
  })
  assert(result.status === 'unconfigured', 'missing env → unconfigured')
  assert(!isInventoryAuthoritative(result), 'unconfigured not sellable')
  const heart = getCharmById('s-heart-red')
  assert(
    getCharmStockState(heart.name, heart.metal, result.map, { status: result.status }) === 'unknown',
    'unconfigured → unknown stock',
  )
  pass('production-no-fail-open-missing-env')
}

// ── Stale helper ────────────────────────────────────────────────────────────
{
  assert(isInventoryStale(null), 'null fetchedAt stale')
  assert(!isInventoryStale(Date.now(), Date.now(), 60_000), 'fresh not stale')
  assert(isInventoryStale(Date.now() - 120_000, Date.now(), 60_000), 'old is stale')
  pass('stale-inventory-helper')
}

// ── Bundles fail-safe with verified map ─────────────────────────────────────
{
  const map = allInStockMap()
  for (const bundle of BEST_SELLER_BUNDLES) {
    const resolved = resolveBundle(bundle, map, { status: 'ready' })
    assert(resolved.available, `${bundle.name} available with full stock map`)
    const payload = buildBundleCartPayload(resolved)
    assert(payload.items.every((item) => !isFillerCharm(item)), `${bundle.name}: no paid fillers`)
  }
  const unresolved = resolveBundle(BEST_SELLER_BUNDLES[0], null, { status: 'unavailable' })
  assert(!unresolved.available, 'bundle unavailable when inventory unverified')
  pass('bundles-fail-safe')
}

// ── resolveCatalogProductForInventory ───────────────────────────────────────
{
  assert(resolveCatalogProductForInventory('silver')?.name === 'Silver Bracelet', 'base resolve')
  assert(resolveCatalogProductForInventory('s-plain-filler')?.isFiller === true, 'filler flagged')
  pass('resolve-catalog-product')
}

console.log(JSON.stringify({ ok: true, results }, null, 2))

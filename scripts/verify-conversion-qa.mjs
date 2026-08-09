/**
 * Conversion QA regression checks (persistence, inventory status, cart empty math).
 * Run: npx vite-node scripts/verify-conversion-qa.mjs
 */
import { readFileSync } from 'node:fs'
import { persistSavedBuild, loadSavedBuild, STORAGE_KEYS } from '../src/utils/storage.js'
import { loadInitialLinkOrder, loadInitialSelectedSize, createInitialLinkOrder, createCharmLink } from '../src/utils/braceletLinks.js'
import { getCharmById } from '../src/data/charms.js'
import { FLAT_RATE_SHIPPING } from '../src/data/shipping.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

// localStorage shim for Node
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

store.clear()
assert(loadSavedBuild() == null, 'starts empty')
assert(loadInitialSelectedSize() == null, 'no size when empty')

const charm = getCharmById('s-heart-red')
assert(charm, 'catalog charm exists')
const linkOrder = createInitialLinkOrder(17)
linkOrder[2] = createCharmLink(charm)

persistSavedBuild({ baseId: 'silver', charmCount: 17, linkOrder })
const saved = loadSavedBuild()
assert(saved?.baseId === 'silver', 'persists base')
assert(saved?.charmCount === 17, 'persists size')
assert(saved?.linkOrder?.some((l) => l.type === 'charm' && l.charmId === 's-heart-red'), 'persists charm id')
assert(loadInitialSelectedSize() === 17, 'restores size')
const restored = loadInitialLinkOrder()
assert(restored.some((l) => l.type === 'charm' && l.charm?.id === 's-heart-red'), 'restores charm object')

persistSavedBuild(null)
assert(loadSavedBuild() == null, 'clear works')
assert(!store.has(STORAGE_KEYS.savedBuild) || store.get(STORAGE_KEYS.savedBuild) == null, 'cleared from storage')
pass('build-persistence-roundtrip')

assert(FLAT_RATE_SHIPPING === 6, 'shipping still $6')
pass('shipping-flat-rate')

const builderSrc = readFileSync(new URL('../src/components/CharmBuilder.jsx', import.meta.url), 'utf8')
assert(builderSrc.includes('persistSavedBuild'), 'builder writes saved builds')
assert(builderSrc.includes('opacity-100'), 'mobile remove control visible')
assert(builderSrc.indexOf('Add charms') < builderSrc.indexOf('Add to Cart →'), 'picker appears before desktop Add to Cart CTA')
assert(builderSrc.includes('Add to Cart\n            </button>'), 'sticky bar includes Add to Cart')
pass('builder-conversion-layout')

const drawerSrc = readFileSync(new URL('../src/components/CartDrawer.jsx', import.meta.url), 'utf8')
assert(drawerSrc.includes('Add a bracelet to see shipping'), 'empty cart hides shipping total')
assert(drawerSrc.includes('Escape'), 'drawer Escape closes')
assert(drawerSrc.includes('useReducedMotion'), 'drawer respects reduced motion')
pass('cart-drawer-empty-and-a11y')

const inventorySrc = readFileSync(new URL('../src/lib/inventory.js', import.meta.url), 'utf8')
assert(inventorySrc.includes("status: 'unavailable'"), 'inventory returns unavailable status')
assert(inventorySrc.includes("status: 'unconfigured'"), 'inventory unconfigured status')
assert(inventorySrc.includes('INVENTORY_FETCH_TIMEOUT_MS'), 'inventory fetch timeout')
const bestSrc = readFileSync(new URL('../src/components/BestSellers.jsx', import.meta.url), 'utf8')
assert(bestSrc.includes('purchasesBlocked') || bestSrc.includes('stockLookupBlocked'), 'best sellers pause when inventory blocked')
assert(bestSrc.includes('Retry Inventory') || bestSrc.includes('InventoryStatusBanner'), 'best sellers retry path')
const createCheckoutSrc = readFileSync(new URL('../api/create-checkout.js', import.meta.url), 'utf8')
assert(createCheckoutSrc.includes('revalidateCheckoutInventory'), 'checkout revalidates inventory')
pass('inventory-status-contract')

const appSrc = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
assert(appSrc.includes('Skip to main content'), 'skip link present')
const mainSrc = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
assert(mainSrc.includes('reducedMotion="user"'), 'MotionConfig reduced motion')
pass('a11y-motion-skip')

console.log(JSON.stringify({ ok: true, results }, null, 2))

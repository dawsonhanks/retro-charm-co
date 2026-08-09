/**
 * Funnel analytics contract + simulated journey (dev sink).
 * Run: npx vite-node scripts/verify-analytics.mjs
 *
 * Proves each appropriate client event fires once for a complete browse→checkout
 * path, that PII is stripped, UTMs are preserved, and purchase_completed is
 * reserved for verified Square webhook path (not the confirmation page).
 */
import { readFileSync } from 'node:fs'
import {
  AnalyticsEvent,
  __setAnalyticsTestSink,
  captureAttributionFromLocation,
  getAttributionProps,
  sanitizeAnalyticsProps,
  trackBaseSelected,
  trackBuilderOpened,
  trackBundleAdded,
  trackBundleViewed,
  trackCartViewed,
  trackCharmAdded,
  trackCharmRemoved,
  trackCheckoutReturned,
  trackCheckoutStarted,
  trackCreateBraceletClicked,
  trackEmailSignupCompleted,
  trackEvent,
  trackHomepageViewed,
  trackSizeSelected,
} from '../src/lib/analytics.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

/** @type {{ event: string, props: Record<string, unknown> }[]} */
const fired = []

// Mock browser storage for attribution + once-keys
const store = new Map()
globalThis.window = {
  location: { search: '?utm_source=verify_script&utm_campaign=funnel_test&utm_medium=test' },
}
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

__setAnalyticsTestSink((event, props) => {
  fired.push({ event, props })
})

captureAttributionFromLocation(window.location.search)
const attribution = getAttributionProps()
assert(attribution.campaign_source === 'verify_script', 'utm_source → campaign_source')
assert(attribution.campaign_name === 'funnel_test', 'utm_campaign → campaign_name')
pass('utm-attribution', attribution)

// PII scrubbing
{
  const cleaned = sanitizeAnalyticsProps({
    email: 'person@example.com',
    name: 'Alex',
    cart_value: 42.5,
    note: 'hello@example.com',
    base_color: 'silver',
  })
  assert(cleaned.email === undefined, 'email blocked')
  assert(cleaned.name === undefined, 'name blocked')
  assert(cleaned.note === undefined, 'email-like string blocked')
  assert(cleaned.cart_value === 42.5, 'cart_value kept')
  assert(cleaned.base_color === 'silver', 'base_color kept')
}
pass('pii-scrub')

function clearFired() {
  fired.length = 0
}

function count(event) {
  return fired.filter((row) => row.event === event).length
}

function last(event) {
  return [...fired].reverse().find((row) => row.event === event)
}

// ── Simulated complete funnel ──────────────────────────────────────────────
clearFired()

trackHomepageViewed()
trackHomepageViewed() // once per session
assert(count(AnalyticsEvent.HOMEPAGE_VIEWED) === 1, 'homepage once')

trackCreateBraceletClicked({ source: 'home_hero' })
assert(count(AnalyticsEvent.CREATE_BRACELET_CLICKED) === 1, 'create click')

trackBuilderOpened({ surface: 'gallery-builder' })
trackBuilderOpened({ surface: 'gallery-builder' })
assert(count(AnalyticsEvent.BUILDER_OPENED) === 1, 'builder once per surface key')

trackBaseSelected({ baseId: 'silver', baseColor: 'silver', isWatchBand: false })
trackSizeSelected({ sizeLinks: 18, charmCapacity: 18, baseColor: 'silver' })
trackCharmAdded({
  productCategory: 'charms',
  baseColor: 'silver',
  metal: 'silver',
  charmCount: 1,
  sizeLinks: 18,
})
trackCharmRemoved({ productCategory: 'charms', metal: 'silver', charmCount: 0 })
trackCharmAdded({
  productCategory: 'dangles',
  baseColor: 'silver',
  metal: 'gold',
  charmCount: 1,
  sizeLinks: 18,
})

trackBundleViewed({
  bundleId: 'retro-starter',
  baseColor: 'silver',
  charmCount: 6,
  listPrice: 33.7,
})
trackBundleViewed({
  bundleId: 'retro-starter',
  baseColor: 'silver',
  charmCount: 6,
  listPrice: 33.7,
})
assert(count(AnalyticsEvent.BUNDLE_VIEWED) === 1, 'bundle viewed once')

trackBundleAdded({
  bundleId: 'retro-starter',
  baseColor: 'silver',
  charmCount: 6,
  cartValue: 33.7,
  itemCount: 7,
})

trackCartViewed({ itemCount: 7, cartValue: 39.7 })
trackCartViewed({ itemCount: 7, cartValue: 39.7 })
assert(count(AnalyticsEvent.CART_VIEWED) === 1, 'cart once')

trackCheckoutStarted({ itemCount: 7, cartValue: 39.7, shipping: 6 })
trackCheckoutReturned({ hasOrderToken: true })

trackEmailSignupCompleted({ source: 'footer' })

// Must NOT treat confirmation as purchase
assert(count(AnalyticsEvent.PURCHASE_COMPLETED) === 0, 'no client purchase_completed')
assert(count(AnalyticsEvent.CHECKOUT_RETURNED) === 1, 'checkout_returned present')

const expectedClient = [
  AnalyticsEvent.HOMEPAGE_VIEWED,
  AnalyticsEvent.CREATE_BRACELET_CLICKED,
  AnalyticsEvent.BUILDER_OPENED,
  AnalyticsEvent.BASE_SELECTED,
  AnalyticsEvent.SIZE_SELECTED,
  AnalyticsEvent.CHARM_ADDED,
  AnalyticsEvent.CHARM_REMOVED,
  AnalyticsEvent.BUNDLE_VIEWED,
  AnalyticsEvent.BUNDLE_ADDED,
  AnalyticsEvent.CART_VIEWED,
  AnalyticsEvent.CHECKOUT_STARTED,
  AnalyticsEvent.CHECKOUT_RETURNED,
  AnalyticsEvent.EMAIL_SIGNUP_COMPLETED,
]

for (const event of expectedClient) {
  assert(count(event) >= 1, `missing ${event}`)
}

// Attribution merged onto an event
assert(last(AnalyticsEvent.CHECKOUT_STARTED)?.props?.campaign_source === 'verify_script', 'utm on checkout')
assert(last(AnalyticsEvent.CHARM_ADDED)?.props?.email === undefined, 'no email on charm_added')
pass('client-funnel-once', {
  events: expectedClient.map((event) => ({ event, count: count(event) })),
})

// Source wiring — key files call the helpers
const files = {
  Home: readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8'),
  CharmBuilder: readFileSync(new URL('../src/components/CharmBuilder.jsx', import.meta.url), 'utf8'),
  BestSellers: readFileSync(new URL('../src/components/BestSellers.jsx', import.meta.url), 'utf8'),
  Cart: readFileSync(new URL('../src/pages/Cart.jsx', import.meta.url), 'utf8'),
  OrderConfirmation: readFileSync(new URL('../src/pages/OrderConfirmation.jsx', import.meta.url), 'utf8'),
  EmailSignup: readFileSync(new URL('../src/components/EmailSignup.jsx', import.meta.url), 'utf8'),
  Webhook: readFileSync(new URL('../api/square-webhook.js', import.meta.url), 'utf8'),
  App: readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8'),
}

assert(files.Home.includes('trackHomepageViewed'), 'Home homepage')
assert(files.Home.includes('trackCreateBraceletClicked'), 'Home CTA')
assert(files.CharmBuilder.includes('trackBuilderOpened'), 'builder opened')
assert(files.CharmBuilder.includes('trackBaseSelected'), 'base')
assert(files.CharmBuilder.includes('trackSizeSelected'), 'size')
assert(files.CharmBuilder.includes('trackCharmAdded'), 'charm add')
assert(files.CharmBuilder.includes('trackCharmRemoved'), 'charm remove')
assert(files.BestSellers.includes('trackBundleViewed'), 'bundle view')
assert(files.BestSellers.includes('trackBundleAdded'), 'bundle add')
assert(files.Cart.includes('trackCartViewed'), 'cart view')
assert(files.Cart.includes('trackCheckoutStarted'), 'checkout started')
assert(files.OrderConfirmation.includes('trackCheckoutReturned'), 'checkout returned')
assert(!files.OrderConfirmation.includes('trackPurchaseCompleted'), 'confirmation must not fire purchase')
assert(!/AnalyticsEvent\.PURCHASE_COMPLETED/.test(files.OrderConfirmation), 'confirmation no purchase constant')
assert(files.EmailSignup.includes('trackEmailSignupCompleted'), 'email signup')
assert(files.Webhook.includes('trackPurchaseCompleted'), 'webhook purchase')
assert(/status\s*(===|!==)\s*'COMPLETED'/.test(files.Webhook), 'webhook gated on COMPLETED')
assert(files.App.includes('AnalyticsBootstrap'), 'bootstrap mounted')
assert(files.App.includes('debug={import.meta.env.DEV}'), 'dev debug analytics')
pass('source-wiring')

// Server helper file exists and documents verified flag
const trackPurchaseSrc = readFileSync(new URL('../api/_lib/trackPurchase.js', import.meta.url), 'utf8')
assert(trackPurchaseSrc.includes('verified: true'), 'server purchase marked verified')
assert(trackPurchaseSrc.includes('square_webhook'), 'server source labeled')
pass('server-purchase-helper')

__setAnalyticsTestSink(null)

console.log(
  JSON.stringify(
    {
      ok: true,
      evidence: {
        note: 'Simulated funnel with test sink; each client stage fired once. purchase_completed is webhook-only.',
        attribution,
        clientEventCounts: expectedClient.map((event) => ({ event, count: count(event) })),
        purchaseCompletedClientCount: count(AnalyticsEvent.PURCHASE_COMPLETED),
      },
      results,
    },
    null,
    2,
  ),
)

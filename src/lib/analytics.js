/**
 * Privacy-conscious conversion analytics for RetroCharm Co.
 *
 * - Primary sink: Vercel Analytics custom events (`track`)
 * - Optional advertising pixels via Vite env (no-op when unset)
 * - UTM / campaign attribution persisted in sessionStorage for the shopping journey
 * - Development: console logging only for custom events (does not require production traffic)
 *
 * Never pass email, name, address, phone, payment tokens, or free-text PII in props.
 */

import { track as vercelTrack } from '@vercel/analytics'
import { AnalyticsEvent } from './analyticsEvents'

export { AnalyticsEvent }

const ATTRIBUTION_STORAGE_KEY = 'retrocharm_attribution_v1'
const ONCE_STORAGE_PREFIX = 'retrocharm_analytics_once:'

/** Property keys that must never leave the client in analytics payloads. */
const BLOCKED_PROP_KEYS = new Set([
  'email',
  'name',
  'first_name',
  'last_name',
  'full_name',
  'phone',
  'address',
  'address1',
  'address2',
  'street',
  'city',
  'state',
  'zip',
  'postal_code',
  'country',
  'card',
  'card_number',
  'cvv',
  'cvc',
  'payment',
  'payment_method',
  'token',
  'password',
  'user_id',
  'customer_id',
  'recipient',
  'shipping_address',
  'billing_address',
])

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

/** @type {((event: string, props: Record<string, string | number | boolean | null>) => void) | null} */
let testSink = null

/**
 * Test hook — capture events without calling vendors (used by verify-analytics).
 * @param {typeof testSink} sink
 */
export function __setAnalyticsTestSink(sink) {
  testSink = sink
}

function isDev() {
  try {
    return Boolean(import.meta.env?.DEV)
  } catch {
    return false
  }
}

function readEnv(key) {
  try {
    return import.meta.env?.[key]
  } catch {
    return undefined
  }
}

/**
 * @param {unknown} value
 * @returns {value is string | number | boolean | null}
 */
function isAllowedPropValue(value) {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/**
 * Strip PII keys and non-flat values. Vercel requires flat string/number/boolean/null.
 * @param {Record<string, unknown>} [raw]
 * @returns {Record<string, string | number | boolean | null>}
 */
export function sanitizeAnalyticsProps(raw = {}) {
  /** @type {Record<string, string | number | boolean | null>} */
  const clean = {}
  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = String(key).trim().toLowerCase()
    if (BLOCKED_PROP_KEYS.has(normalizedKey)) continue
    if (normalizedKey.includes('email') || normalizedKey.includes('phone')) continue
    if (normalizedKey.includes('address') || normalizedKey.includes('password')) continue
    if (!isAllowedPropValue(value)) continue
    if (typeof value === 'string' && value.includes('@') && value.includes('.')) continue
    clean[key] = value
  }
  return clean
}

/**
 * @returns {Record<string, string>}
 */
export function readStoredAttribution() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    /** @type {Record<string, string>} */
    const out = {}
    for (const key of [...UTM_KEYS, 'campaign_source', 'campaign_name', 'gclid', 'fbclid']) {
      if (typeof parsed[key] === 'string' && parsed[key]) out[key] = parsed[key]
    }
    return out
  } catch {
    return {}
  }
}

/**
 * Capture UTM / click ids from the current URL into sessionStorage (first-touch for the tab).
 * Safe to call on every navigation — does not overwrite an existing first-touch set.
 * @param {string} [search]
 */
export function captureAttributionFromLocation(search = typeof window !== 'undefined' ? window.location.search : '') {
  if (typeof window === 'undefined') return readStoredAttribution()

  const existing = readStoredAttribution()
  if (Object.keys(existing).length > 0) return existing

  const params = new URLSearchParams(search)
  /** @type {Record<string, string>} */
  const next = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) next[key] = value.slice(0, 200)
  }
  const gclid = params.get('gclid')
  const fbclid = params.get('fbclid')
  if (gclid) next.gclid = gclid.slice(0, 200)
  if (fbclid) next.fbclid = fbclid.slice(0, 200)

  if (next.utm_source) next.campaign_source = next.utm_source
  if (next.utm_campaign) next.campaign_name = next.utm_campaign

  if (Object.keys(next).length > 0) {
    try {
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // private mode / quota — ignore
    }
  }
  return next
}

/**
 * Attribution props merged into every event (non-PII campaign fields only).
 * @returns {Record<string, string>}
 */
export function getAttributionProps() {
  const stored = readStoredAttribution()
  /** @type {Record<string, string>} */
  const props = {}
  if (stored.campaign_source) props.campaign_source = stored.campaign_source
  if (stored.campaign_name) props.campaign_name = stored.campaign_name
  if (stored.utm_medium) props.utm_medium = stored.utm_medium
  if (stored.utm_source) props.utm_source = stored.utm_source
  if (stored.utm_campaign) props.utm_campaign = stored.utm_campaign
  return props
}

function logDev(eventName, props) {
  if (!isDev() && !testSink) return
  console.info('[analytics]', eventName, props)
}

function fireMetaPixel(eventName, props) {
  const pixelId = readEnv('VITE_META_PIXEL_ID')
  if (!pixelId || typeof window === 'undefined') return
  try {
    const fbq = window.fbq
    if (typeof fbq !== 'function') return
    // Map a few funnel steps to standard Meta events; custom otherwise.
    if (eventName === AnalyticsEvent.CHECKOUT_STARTED) {
      fbq('track', 'InitiateCheckout', {
        value: typeof props.cart_value === 'number' ? props.cart_value : undefined,
        currency: 'USD',
        num_items: typeof props.item_count === 'number' ? props.item_count : undefined,
      })
      return
    }
    if (eventName === AnalyticsEvent.PURCHASE_COMPLETED) {
      // Client should not fire this; keep mapping for completeness if ever called.
      fbq('track', 'Purchase', {
        value: typeof props.cart_value === 'number' ? props.cart_value : undefined,
        currency: props.currency === 'USD' || props.currency === 'usd' ? 'USD' : 'USD',
      })
      return
    }
    if (eventName === AnalyticsEvent.EMAIL_SIGNUP_COMPLETED) {
      fbq('track', 'Lead')
      return
    }
    fbq('trackCustom', eventName, props)
  } catch {
    // Pixel optional — never throw
  }
}

function fireGooglePixel(eventName, props) {
  const adsId = readEnv('VITE_GOOGLE_ADS_ID')
  if (!adsId || typeof window === 'undefined') return
  try {
    const gtag = window.gtag
    if (typeof gtag !== 'function') return
    gtag('event', eventName, props)
  } catch {
    // optional
  }
}

/**
 * Load optional advertising pixels when env IDs are present.
 * Safe no-op when unset or when scripts fail.
 */
export function initOptionalPixels() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const metaId = readEnv('VITE_META_PIXEL_ID')
  if (metaId && !window.fbq) {
    try {
      // Meta pixel stub (same contract as the official snippet).
      const fbq = function fbq() {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, arguments)
        } else {
          fbq.queue.push(arguments)
        }
      }
      window.fbq = fbq
      window._fbq = fbq
      fbq.push = fbq
      fbq.loaded = true
      fbq.version = '2.0'
      fbq.queue = []

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      const firstScript = document.getElementsByTagName('script')[0]
      firstScript?.parentNode?.insertBefore(script, firstScript)

      window.fbq('init', String(metaId))
      window.fbq('track', 'PageView')
    } catch (error) {
      logDev('meta_pixel_init_failed', { message: String(error?.message ?? error) })
    }
  }

  const gtagId = readEnv('VITE_GOOGLE_ADS_ID')
  if (gtagId && !window.gtag) {
    try {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(String(gtagId))}`
      document.head.appendChild(script)
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() {
        window.dataLayer.push(arguments)
      }
      window.gtag('js', new Date())
      window.gtag('config', String(gtagId), { send_page_view: false })
    } catch (error) {
      logDev('google_pixel_init_failed', { message: String(error?.message ?? error) })
    }
  }
}

/**
 * Core track — sanitizes props, merges attribution, logs in dev, forwards to vendors.
 * @param {string} eventName
 * @param {Record<string, unknown>} [props]
 */
export function trackEvent(eventName, props = {}) {
  const merged = sanitizeAnalyticsProps({
    ...getAttributionProps(),
    ...props,
  })

  logDev(eventName, merged)

  if (testSink) {
    testSink(eventName, merged)
    return
  }

  try {
    vercelTrack(eventName, merged)
  } catch (error) {
    logDev('vercel_track_failed', { event: eventName, message: String(error?.message ?? error) })
  }

  fireMetaPixel(eventName, merged)
  fireGooglePixel(eventName, merged)
}

/**
 * Fire at most once per browser tab session for the given key.
 * @param {string} onceKey
 * @param {string} eventName
 * @param {Record<string, unknown>} [props]
 */
export function trackEventOnce(onceKey, eventName, props = {}) {
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `${ONCE_STORAGE_PREFIX}${onceKey}`
      if (sessionStorage.getItem(storageKey)) return
      sessionStorage.setItem(storageKey, '1')
    } catch {
      // fall through and fire
    }
  }
  trackEvent(eventName, props)
}

/** Call once near app root (BrowserRouter mounted). */
export function initClientAnalytics() {
  captureAttributionFromLocation()
  initOptionalPixels()
}

// ── Typed funnel helpers (non-PII props only) ───────────────────────────────

export function trackHomepageViewed() {
  trackEventOnce('homepage_viewed', AnalyticsEvent.HOMEPAGE_VIEWED, { path: '/' })
}

export function trackCreateBraceletClicked(props = {}) {
  trackEvent(AnalyticsEvent.CREATE_BRACELET_CLICKED, {
    source: props.source ?? 'unknown',
  })
}

export function trackBuilderOpened(props = {}) {
  const surface = props.surface ?? 'unknown'
  trackEventOnce(`builder_opened:${surface}`, AnalyticsEvent.BUILDER_OPENED, {
    surface,
  })
}

export function trackBaseSelected(props = {}) {
  trackEvent(AnalyticsEvent.BASE_SELECTED, {
    base_id: props.baseId ?? null,
    base_color: props.baseColor ?? null,
    is_watch_band: Boolean(props.isWatchBand),
  })
}

export function trackSizeSelected(props = {}) {
  trackEvent(AnalyticsEvent.SIZE_SELECTED, {
    size_links: typeof props.sizeLinks === 'number' ? props.sizeLinks : null,
    charm_capacity: typeof props.charmCapacity === 'number' ? props.charmCapacity : null,
    base_color: props.baseColor ?? null,
  })
}

export function trackCharmAdded(props = {}) {
  trackEvent(AnalyticsEvent.CHARM_ADDED, {
    product_category: props.productCategory ?? null,
    base_color: props.baseColor ?? null,
    metal: props.metal ?? null,
    charm_count: typeof props.charmCount === 'number' ? props.charmCount : null,
    size_links: typeof props.sizeLinks === 'number' ? props.sizeLinks : null,
  })
}

export function trackCharmRemoved(props = {}) {
  trackEvent(AnalyticsEvent.CHARM_REMOVED, {
    product_category: props.productCategory ?? null,
    metal: props.metal ?? null,
    charm_count: typeof props.charmCount === 'number' ? props.charmCount : null,
  })
}

export function trackBundleViewed(props = {}) {
  const bundleId = props.bundleId ?? 'unknown'
  trackEventOnce(`bundle_viewed:${bundleId}`, AnalyticsEvent.BUNDLE_VIEWED, {
    bundle_id: bundleId,
    base_color: props.baseColor ?? null,
    charm_count: typeof props.charmCount === 'number' ? props.charmCount : null,
    cart_value: typeof props.listPrice === 'number' ? props.listPrice : null,
  })
}

export function trackBundleAdded(props = {}) {
  trackEvent(AnalyticsEvent.BUNDLE_ADDED, {
    bundle_id: props.bundleId ?? null,
    base_color: props.baseColor ?? null,
    charm_count: typeof props.charmCount === 'number' ? props.charmCount : null,
    cart_value: typeof props.cartValue === 'number' ? props.cartValue : null,
    item_count: typeof props.itemCount === 'number' ? props.itemCount : null,
  })
}

export function trackCartViewed(props = {}) {
  trackEventOnce('cart_viewed', AnalyticsEvent.CART_VIEWED, {
    item_count: typeof props.itemCount === 'number' ? props.itemCount : null,
    cart_value: typeof props.cartValue === 'number' ? props.cartValue : null,
  })
}

export function trackCheckoutStarted(props = {}) {
  trackEvent(AnalyticsEvent.CHECKOUT_STARTED, {
    item_count: typeof props.itemCount === 'number' ? props.itemCount : null,
    cart_value: typeof props.cartValue === 'number' ? props.cartValue : null,
    shipping: typeof props.shipping === 'number' ? props.shipping : null,
  })
}

/** Client return from Square redirect — not a verified purchase. */
export function trackCheckoutReturned(props = {}) {
  trackEventOnce('checkout_returned', AnalyticsEvent.CHECKOUT_RETURNED, {
    has_order_token: Boolean(props.hasOrderToken),
  })
}

export function trackEmailSignupCompleted(props = {}) {
  trackEvent(AnalyticsEvent.EMAIL_SIGNUP_COMPLETED, {
    source: props.source ?? 'unknown',
  })
}

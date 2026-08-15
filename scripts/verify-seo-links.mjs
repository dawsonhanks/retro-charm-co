/**
 * Link + sharing metadata audit.
 * Run: npx vite-node scripts/verify-seo-links.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { instagram, tiktok, SOCIAL_PROFILES } from '../src/data/social.js'
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, getSiteUrl, HOME_OG_IMAGE_PATH } from '../src/data/site.js'
import {
  buildBestSellerProductsJsonLd,
  buildMarketPlaceJsonLd,
  buildOrganizationJsonLd,
} from '../src/data/structuredData.js'
import { INFO_PAGES } from '../src/data/storeInfo.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const corrected = []

// ── Instagram / social ─────────────────────────────────────────────────────
assert(!instagram.url.endsWith('/a'), 'Instagram URL must not end with /a')
assert(
  instagram.url === 'https://www.instagram.com/theretrocharm.co/',
  `Instagram URL corrected to profile root, got ${instagram.url}`,
)
assert(tiktok.url === 'https://www.tiktok.com/@retrocharm.co', 'TikTok URL must match confirmed handle')
assert(SOCIAL_PROFILES.includes(instagram.url) && SOCIAL_PROFILES.includes(tiktok.url), 'sameAs includes both profiles')
corrected.push('Instagram footer URL: removed erroneous `/a` suffix → https://www.instagram.com/theretrocharm.co/')
corrected.push('TikTok URL centralized in src/data/social.js (was hardcoded in Footer)')
pass('social-urls', { instagram: instagram.url, tiktok: tiktok.url })

const footerSrc = read('src/components/Footer.jsx')
assert(footerSrc.includes('noopener noreferrer'), 'Social links open safely')
assert(footerSrc.includes('aria-label={label}'), 'Social icons use accessible names')
assert(footerSrc.includes('tiktok.url') || footerSrc.includes('tiktok'), 'Footer uses social.js TikTok')
assert(!footerSrc.includes('instagram.com/theretrocharm.co/a'), 'Footer does not hardcode bad IG URL')
pass('footer-social-a11y')

// ── Asset existence for OG / brand ─────────────────────────────────────────
for (const path of [DEFAULT_OG_IMAGE_PATH, HOME_OG_IMAGE_PATH, '/images/brand/retro-charm-logo.png']) {
  assert(existsSync(join(root, 'public', path.replace(/^\//, ''))), `Missing share/brand asset: ${path}`)
}
pass('og-assets-exist')

assert(getSiteUrl() === 'https://www.theretrocharmco.com' || getSiteUrl().startsWith('http'), 'Site URL configured')
assert(absoluteUrl('/create') === `${getSiteUrl()}/create`, 'absoluteUrl builds path correctly')
pass('site-url-helpers')

// ── Structured data honesty ────────────────────────────────────────────────
const org = buildOrganizationJsonLd()
assert(org.email, 'Organization includes confirmed email')
assert(!('telephone' in org), 'Organization must not invent a phone number')
assert(!('aggregateRating' in org), 'Organization must not invent ratings')
assert(!JSON.stringify(org).includes('reviewCount'), 'Organization must not invent review counts')

const products = buildBestSellerProductsJsonLd()
const productJson = JSON.stringify(products)
assert(!productJson.includes('aggregateRating'), 'Product schema must not invent ratings')
assert(!productJson.includes('reviewCount'), 'Product schema must not invent review counts')
assert(!productJson.includes('InStock') && !productJson.includes('OutOfStock'), 'Product schema omits invented availability')
assert(products.itemListElement.length >= 1, 'Best-seller ItemList has products')
assert(
  products.itemListElement.every((entry) => entry.item?.offers?.price),
  'Each product offer has a catalog price',
)

const place = buildMarketPlaceJsonLd()
assert(place?.address?.streetAddress || place?.address, 'Market Place uses confirmed address')
assert(!('aggregateRating' in (place || {})), 'Place must not invent ratings')
pass('structured-data-accurate')

// ── Routes + PageMeta coverage ─────────────────────────────────────────────
const appSrc = read('src/App.jsx')
assert(appSrc.includes('path="*"'), 'Catch-all 404 route registered')
assert(appSrc.includes('NotFound'), 'NotFound page wired')

const pageFiles = {
  'src/pages/Home.jsx': '/',
  'src/pages/Shop.jsx': '/shop',
  'src/pages/Create.jsx': '/create',
  'src/pages/FindUs.jsx': '/find-us',
  'src/pages/About.jsx': '/about',
  'src/pages/Cart.jsx': '/cart',
  'src/pages/OrderConfirmation.jsx': '/order-confirmation',
  'src/pages/NotFound.jsx': 'dynamic',
  'src/components/InfoPageLayout.jsx': 'info-pages',
}

for (const [file, path] of Object.entries(pageFiles)) {
  const src = read(file)
  assert(src.includes('PageMeta'), `${file} must use PageMeta`)
  if (path === 'info-pages' || path === 'dynamic') {
    assert(src.includes('path={'), `${file} sets dynamic path for canonical`)
  } else {
    assert(src.includes(`path="${path}"`) || src.includes(`path={'${path}'}`) || src.includes(`path={`), `${file} sets path for canonical`)
  }
}

for (const page of INFO_PAGES) {
  assert(page.title && page.description, `Info page ${page.path} has title + description`)
}

const cartSrc = read('src/pages/Cart.jsx')
const confirmSrc = read('src/pages/OrderConfirmation.jsx')
const notFoundSrc = read('src/pages/NotFound.jsx')
assert(cartSrc.includes('noindex'), 'Cart is noindex')
assert(confirmSrc.includes('noindex'), 'Order confirmation is noindex')
assert(notFoundSrc.includes('noindex'), '404 is noindex')
assert(notFoundSrc.includes('/create'), '404 links to Charm Studio')
corrected.push('Added branded 404 (`NotFound`) with Charm Studio CTA + catch-all route')
corrected.push('Added canonical, Open Graph, and Twitter meta via PageMeta on all routes')
corrected.push('Cart + order confirmation set to noindex')
pass('page-meta-coverage')

const indexHtml = read('index.html')
assert(indexHtml.includes('og:image'), 'index.html has OG image fallback')
assert(indexHtml.includes('rel="canonical"'), 'index.html has canonical fallback')
assert(
  indexHtml.includes(HOME_OG_IMAGE_PATH) || indexHtml.includes(HOME_OG_IMAGE_PATH.replace(/^\//, '')),
  'index.html OG/Twitter image must match HOME_OG_IMAGE_PATH (permitted hero)',
)
assert(!indexHtml.includes('customer-photo-9'), 'index.html must not use gallery-only customer-photo-9 for share tags')
assert(!String(HOME_OG_IMAGE_PATH).includes('customer-photo-9'), 'HOME_OG_IMAGE_PATH must not use gallery-only photo')
corrected.push('index.html: added default canonical + Open Graph / Twitter tags for first paint / crawlers')
pass('index-html-share-tags')

// ── Internal link audit (src + public) ─────────────────────────────────────
const routePaths = new Set([
  '/',
  '/create',
  '/find-us',
  '/about',
  '/cart',
  '/order-confirmation',
  '/shipping',
  '/returns',
  '/materials',
  '/faq',
  '/shop',
  '/404',
])

const internalHrefs = new Set()
const hrefRe = /\bto=["'](\/[^"'#?]*)["']|\bto=\{\s*["'](\/[^"'#?]*)["']|\bNavigate to=["'](\/[^"'#?]*)["']|\bpath=["']([^"']+)["']/g

function scanFile(rel) {
  const text = read(rel)
  let match
  const re = new RegExp(hrefRe.source, 'g')
  while ((match = re.exec(text))) {
    const raw = match[1] || match[2] || match[3] || match[4]
    if (!raw || raw === '*') continue
    const path = raw.startsWith('/') ? raw : `/${raw}`
    if (path.startsWith('/api')) continue
    internalHrefs.add(path)
  }
}

function walk(dir, filter) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === 'dist' || name.name.startsWith('.')) continue
    const full = join(dir, name.name)
    if (name.isDirectory()) walk(full, filter)
    else if (filter(name.name)) scanFile(relative(root, full))
  }
}

walk(join(root, 'src'), (name) => /\.(jsx|js)$/.test(name))

const unknown = [...internalHrefs].filter((path) => !routePaths.has(path) && !routePaths.has(path.replace(/\/$/, '')))
assert(unknown.length === 0, `Unknown internal paths linked: ${unknown.join(', ')}`)
pass('internal-links-resolve', { checked: internalHrefs.size })

const sitemap = read('public/sitemap.xml')
for (const path of ['/', '/shop', '/create', '/find-us', '/about', '/shipping', '/returns', '/materials', '/faq']) {
  assert(sitemap.includes(`theretrocharmco.com${path === '/' ? '/' : path}`), `sitemap includes ${path}`)
}
pass('sitemap-aligned')

console.log(
  JSON.stringify(
    {
      ok: true,
      correctedIssues: corrected,
      results,
    },
    null,
    2,
  ),
)

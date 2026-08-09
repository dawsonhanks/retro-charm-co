/**
 * Policy / trust info pages regression checks.
 * Run: npx vite-node scripts/verify-policies.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CHECKOUT_POLICY_LINKS,
  CHECKOUT_TRUST,
  CONTACT,
  FAQ_ENTRIES,
  FOOTER_POLICY_LINKS,
  getConfirmedCopy,
  getTrustPanelItems,
  INFO_PAGES,
  MATERIALS_INFO,
  RETURNS_INFO,
  SHIPPING_INFO,
  isPolicyPlaceholder,
} from '../src/data/storeInfo.js'
import { FLAT_RATE_SHIPPING, getCustomerFacingFulfillmentCopy } from '../src/data/shipping.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name) {
  results.push({ name, ok: true })
}

const paths = INFO_PAGES.map((p) => p.path)
assert(paths.includes('/shipping'), 'shipping page meta')
assert(paths.includes('/returns'), 'returns page meta')
assert(paths.includes('/materials'), 'materials page meta')
assert(paths.includes('/faq'), 'faq page meta')
assert(FOOTER_POLICY_LINKS.length === INFO_PAGES.length, 'footer links cover all info pages')
assert(
  CHECKOUT_POLICY_LINKS.every((l) => paths.includes(l.to)),
  'checkout policy links are info pages',
)
pass('info-page-meta')

assert(CONTACT.email === 'retro.charm.co.ut@gmail.com', 'contact email known')
assert(SHIPPING_INFO.flatRateLabel.includes('$6'), 'shipping cost from shipping.js')
assert(FLAT_RATE_SHIPPING === 6, 'flat rate still $6')
assert(getCustomerFacingFulfillmentCopy() === 'Ships in 3–5 business days', 'processing timeframe')
assert(getConfirmedCopy(SHIPPING_INFO.processing.lead), 'shipping processing lead confirmed')
assert(SHIPPING_INFO.destinations.includes.length >= 4, 'shipping destinations list present')
assert(SHIPPING_INFO.destinations.international.toLowerCase().includes('not currently ship internationally'), 'no international shipping')
assert(getConfirmedCopy(SHIPPING_INFO.tracking), 'tracking policy confirmed')
assert(getConfirmedCopy(SHIPPING_INFO.nonArrival.lead), 'non-arrival policy confirmed')
assert(
  !Object.values(SHIPPING_INFO).some(
    (value) => typeof value === 'string' && isPolicyPlaceholder(value),
  ),
  'no shipping TODO placeholders',
)
const shippingFaq = FAQ_ENTRIES.find((e) => e.id === 'shipping-cost')
const destinationsFaq = FAQ_ENTRIES.find((e) => e.id === 'shipping-destinations')
assert(shippingFaq?.answer.includes('$6'), 'FAQ shipping uses flat $6')
assert(destinationsFaq?.answer.toLowerCase().includes('united states'), 'FAQ destinations from storeInfo')
assert(
  shippingFaq?.answer.includes('3–5 business days') || shippingFaq?.answer.includes('3-5 business days'),
  'FAQ shipping mentions processing timeframe',
)
assert(getConfirmedCopy(MATERIALS_INFO.intro), 'materials intro confirmed')
assert(
  MATERIALS_INFO.materials.paragraphs.some((p) => p.includes('stainless steel')),
  'materials state stainless steel',
)
assert(
  MATERIALS_INFO.materials.paragraphs.some((p) => p.includes('not solid gold or solid silver')),
  'materials disclaim solid gold/silver',
)
assert(
  MATERIALS_INFO.materials.paragraphs.some((p) =>
    p.includes('do not advertise a specific plating method'),
  ),
  'materials disclaim specific plating',
)
assert(
  MATERIALS_INFO.availableFinishes.every((f) => /-tone$/i.test(f.label)),
  'finish labels use gold-tone / silver-tone',
)
assert(MATERIALS_INFO.waterAndWear.careTips.length >= 5, 'water/care tips present')
assert(
  MATERIALS_INFO.finishAndTarnishing.paragraphs.length >= 2,
  'finish and tarnishing copy present',
)
assert(MATERIALS_INFO.sizing?.tutorial?.href?.includes('youtube.com'), 'materials tutorial link')
assert(
  MATERIALS_INFO.sizing?.tutorial?.ariaLabel?.toLowerCase().includes('new tab'),
  'materials tutorial has accessible new-tab label',
)
assert(
  MATERIALS_INFO.trustPanelLabel.toLowerCase().includes('stainless') &&
    MATERIALS_INFO.trustPanelLabel.toLowerCase().includes('gold-tone') &&
    MATERIALS_INFO.trustPanelLabel.toLowerCase().includes('silver-tone'),
  'trust panel materials label present',
)

const materialsFaq = FAQ_ENTRIES.find((e) => e.id === 'materials')
const tarnishFaq = FAQ_ENTRIES.find((e) => e.id === 'tarnish')
assert(materialsFaq?.answer.toLowerCase().includes('stainless steel'), 'FAQ materials mentions stainless')
assert(materialsFaq?.answer.toLowerCase().includes('gold-tone'), 'FAQ materials uses gold-tone')
assert(materialsFaq?.answer.toLowerCase().includes('silver-tone'), 'FAQ materials uses silver-tone')
assert(
  tarnishFaq?.answer.toLowerCase().includes('resistant to tarnishing'),
  'FAQ tarnish matches materials nuance',
)

const materialsClaimCorpus = [
  ...MATERIALS_INFO.materials.paragraphs,
  ...MATERIALS_INFO.finishAndTarnishing.paragraphs,
  MATERIALS_INFO.waterAndWear.summary,
  ...MATERIALS_INFO.availableFinishes.map((f) => `${f.label} ${f.note}`),
  MATERIALS_INFO.trustPanelLabel,
  materialsFaq?.answer ?? '',
  tarnishFaq?.answer ?? '',
].join('\n')
const bannedMaterialClaims = [
  /\bhypoallergenic\b/i,
  /\bnickel[-\s]?free\b/i,
  /\b(?:is|are|made of|from)\s+solid\s+gold\b/i,
  /\b(?:is|are|made of|from)\s+solid\s+silver\b/i,
  /\b(?:PVD|vacuum\s+plating|gold\s+plated|micron)\b/i,
]
for (const pattern of bannedMaterialClaims) {
  assert(!pattern.test(materialsClaimCorpus), `materials copy must not claim ${pattern}`)
}
assert(getConfirmedCopy(RETURNS_INFO.intro), 'returns intro confirmed')
assert(RETURNS_INFO.sizing?.tutorial?.href?.includes('youtube.com'), 'sizing tutorial link present')
assert(
  RETURNS_INFO.sizing?.tutorial?.ariaLabel?.toLowerCase().includes('new tab'),
  'sizing tutorial has accessible new-tab label',
)
assert(RETURNS_INFO.damagedOrder.include.length >= 3, 'damaged-order include list present')
assert(getConfirmedCopy(RETURNS_INFO.damagedOrder.resolution), 'damaged-order resolution confirmed')
assert(getConfirmedCopy(RETURNS_INFO.returnAuthorization), 'return authorization confirmed')
assert(RETURNS_INFO.refundTiming.paragraphs.length >= 2, 'refund timing paragraphs present')
assert(RETURNS_INFO.contactEmail === CONTACT.email, 'returns uses configured contact email')
assert(FAQ_ENTRIES.length >= 8, 'FAQ has objection-covering entries')
assert(CHECKOUT_TRUST.detail.toLowerCase().includes('square'), 'Square language present')
assert(
  !CHECKOUT_TRUST.detail.toLowerCase().includes('guarantee') ||
    CHECKOUT_TRUST.detail.toLowerCase().includes('does not') ||
    CHECKOUT_TRUST.cartNote.toLowerCase().includes('does not'),
  'Square copy must not imply Square guarantees products',
)
assert(CHECKOUT_TRUST.cartNote.toLowerCase().includes('does not'), 'cart note clarifies Square scope')
pass('store-info-content-contract')

const trust = getTrustPanelItems()
assert(trust.some((i) => i.id === 'shipping'), 'trust panel shipping')
assert(trust.some((i) => i.id === 'square'), 'trust panel square')
assert(
  trust.some(
    (i) =>
      i.to === '/materials' &&
      i.label.toLowerCase().includes('stainless') &&
      i.label.toLowerCase().includes('gold-tone'),
  ),
  'trust panel materials info link',
)
assert(trust.some((i) => i.to === '/returns'), 'trust panel returns link')
pass('trust-panel-items')

function readSrc(rel) {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

const appSrc = readSrc('../src/App.jsx')
const footerSrc = readSrc('../src/components/Footer.jsx')
const cartSrc = readSrc('../src/pages/Cart.jsx')
const drawerSrc = readSrc('../src/components/CartDrawer.jsx')
const builderSrc = readSrc('../src/components/CharmBuilder.jsx')
const faqSrc = readSrc('../src/components/FAQ.jsx')

for (const path of paths) {
  const routeSegment = path.replace(/^\//, '')
  assert(appSrc.includes(`path="${routeSegment}"`), `App route for ${path}`)
  assert(footerSrc.includes(`to: '${path}'`) || footerSrc.includes('FOOTER_POLICY_LINKS'), `Footer covers ${path}`)
  assert(cartSrc.includes('PolicyLinks') || cartSrc.includes(path), `Cart references policies`)
  assert(drawerSrc.includes('PolicyLinks') || drawerSrc.includes(path), `Drawer references policies`)
}
assert(footerSrc.includes('FOOTER_POLICY_LINKS'), 'Footer uses FOOTER_POLICY_LINKS')
assert(cartSrc.includes('TrustPanel'), 'Cart has TrustPanel')
assert(cartSrc.includes('PolicyLinks'), 'Cart has PolicyLinks')
assert(drawerSrc.includes('TrustPanel'), 'Drawer has TrustPanel')
assert(drawerSrc.includes('PolicyLinks'), 'Drawer has PolicyLinks')
assert(builderSrc.includes('TrustPanel'), 'Charm Studio has TrustPanel')
assert(faqSrc.includes('FAQ_ENTRIES'), 'FAQ reads from storeInfo')
pass('wiring-footer-cart-studio')

const pageFiles = {
  '/shipping': '../src/pages/Shipping.jsx',
  '/returns': '../src/pages/Returns.jsx',
  '/materials': '../src/pages/Materials.jsx',
  '/faq': '../src/pages/FaqPage.jsx',
}
for (const [path, rel] of Object.entries(pageFiles)) {
  const abs = fileURLToPath(new URL(rel, import.meta.url))
  assert(existsSync(abs), `page file exists for ${path}`)
  const src = readFileSync(abs, 'utf8')
  assert(src.includes('InfoPageLayout') || src.includes('Helmet'), `${path} has page chrome`)
  assert(src.includes('title') || src.includes('META'), `${path} sets title metadata`)
}
pass('page-files-exist')

const sitemap = readSrc('../public/sitemap.xml')
for (const path of paths) {
  assert(sitemap.includes(path), `sitemap includes ${path}`)
}
pass('sitemap-info-pages')

console.log(JSON.stringify({ ok: true, paths, results }, null, 2))

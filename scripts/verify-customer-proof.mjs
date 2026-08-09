/**
 * Customer proof regression checks.
 * Run: npx vite-node scripts/verify-customer-proof.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BENEFIT_META,
  CUSTOMER_PHOTOS,
  FULL_PHOTO_PLACEMENTS,
  HOME_HERO_PHOTO_ID,
  TESTIMONIALS,
  TESTIMONIAL_PLACEHOLDER_TOKEN,
  getCustomerPhotoById,
  getCustomerPhotoForPlacement,
  getDevPreviewTestimonials,
  getHomeHeroPhoto,
  getNearCtaProofPhotos,
  getProofStripPhotos,
  getPublishableCustomerPhotos,
  getPublishableTestimonials,
  getTestimonialAttribution,
  isPhotoAllowedForPlacement,
  isTestimonialPlaceholder,
} from '../src/data/customerProof.js'
import { HOME_OG_IMAGE_PATH } from '../src/data/site.js'
import { BEST_SELLER_BUNDLES } from '../src/data/bundles.js'
import { buildBestSellerProductsJsonLd } from '../src/data/structuredData.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []
function pass(name, detail = {}) {
  results.push({ name, ok: true, ...detail })
}

const root = fileURLToPath(new URL('..', import.meta.url))
const BENEFITS = new Set(Object.keys(BENEFIT_META))
const PLACEMENTS = new Set(FULL_PHOTO_PLACEMENTS)

assert(CUSTOMER_PHOTOS.length >= 4, 'Need enough customer photos for proof strip')
assert(
  CUSTOMER_PHOTOS.every(
    (photo) =>
      photo.id &&
      photo.src &&
      photo.alt &&
      photo.alt.length > 40 &&
      photo.width > 0 &&
      photo.height > 0 &&
      BENEFITS.has(photo.benefit) &&
      photo.benefitCaption &&
      typeof photo.photoPermissionGranted === 'boolean' &&
      Array.isArray(photo.allowedPlacements) &&
      photo.allowedPlacements.length > 0 &&
      photo.allowedPlacements.every((p) => PLACEMENTS.has(p)) &&
      typeof photo.heroEligible === 'boolean' &&
      typeof photo.marketingEligible === 'boolean',
  ),
  'Every customer photo needs id, asset, alt, benefit, caption, and placement permission fields',
)

for (const photo of CUSTOMER_PHOTOS) {
  const abs = fileURLToPath(new URL(`../public${photo.src}`, import.meta.url))
  assert(existsSync(abs), `Missing photo asset: ${photo.src}`)
  if (photo.photoPermissionGranted !== true) {
    assert(
      photo.allowedPlacements.length === 0,
      `${photo.id}: no placements when photoPermissionGranted is false`,
    )
  }
}
pass('customer-photos-complete', { count: CUSTOMER_PHOTOS.length })

const gallery = getPublishableCustomerPhotos()
assert(
  gallery.every((p) => isPhotoAllowedForPlacement(p, 'gallery')),
  'Gallery selector must only return gallery-eligible photos',
)
assert(
  gallery.some((p) => p.id === 'customer-photo-9'),
  'customer-photo-9 must appear in the customer gallery',
)

const photo9 = getCustomerPhotoById('customer-photo-9')
assert(photo9, 'customer-photo-9 must live in CUSTOMER_PHOTOS')
assert(photo9.photoPermissionGranted === true, 'customer-photo-9 has gallery photo permission')
assert(
  JSON.stringify(photo9.allowedPlacements) === JSON.stringify(['gallery']),
  'customer-photo-9 allowedPlacements must be gallery-only',
)
assert(photo9.heroEligible === false, 'customer-photo-9 must not be heroEligible')
assert(photo9.marketingEligible === false, 'customer-photo-9 must not be marketingEligible')
assert(!isPhotoAllowedForPlacement(photo9, 'hero'), 'photo-9 blocked from hero')
assert(!isPhotoAllowedForPlacement(photo9, 'proofStrip'), 'photo-9 blocked from proof strip')
assert(!isPhotoAllowedForPlacement(photo9, 'nearCta'), 'photo-9 blocked from near-CTA')
assert(!isPhotoAllowedForPlacement(photo9, 'bundle'), 'photo-9 blocked from bundles')
assert(!isPhotoAllowedForPlacement(photo9, 'share'), 'photo-9 blocked from OG/Twitter share')
assert(!isPhotoAllowedForPlacement(photo9, 'structuredData'), 'photo-9 blocked from structured data')
assert(!isPhotoAllowedForPlacement(photo9, 'advertising'), 'photo-9 blocked from advertising')
assert(getCustomerPhotoForPlacement('customer-photo-9', 'gallery'), 'photo-9 allowed for gallery')
assert(
  getCustomerPhotoForPlacement('customer-photo-9', 'hero') == null,
  'placement helper must not return photo-9 for hero',
)
pass('photo-placement-permissions', {
  galleryCount: gallery.length,
  photo9Placements: photo9.allowedPlacements,
})

const strip = getProofStripPhotos()
assert(strip.length === 4, 'Proof strip should show four benefit photos')
assert(new Set(strip.map((p) => p.benefit)).size === 4, 'Strip must cover fit, personalization, gifting, stacking')
assert(
  strip.every((p) => isPhotoAllowedForPlacement(p, 'proofStrip')),
  'Proof strip must only include proofStrip-eligible photos',
)
assert(
  strip.every((p) => p.id !== 'customer-photo-9'),
  'Proof strip must not include gallery-only customer-photo-9',
)
pass('proof-strip-benefits')

const nearCta = getNearCtaProofPhotos()
assert(nearCta.length === 3, 'Near-CTA proof should show three photos')
assert(nearCta.every((p) => BENEFITS.has(p.benefit)), 'Near-CTA photos need benefits')
assert(
  nearCta.every((p) => isPhotoAllowedForPlacement(p, 'nearCta')),
  'Near-CTA proof must only include nearCta-eligible photos',
)
assert(
  nearCta.every((p) => p.id !== 'customer-photo-9'),
  'Near-CTA must not include gallery-only customer-photo-9',
)
pass('near-cta-proof')

const hero = getHomeHeroPhoto()
assert(hero.id === HOME_HERO_PHOTO_ID, 'Hero helper must resolve HOME_HERO_PHOTO_ID')
assert(hero.id === 'customer-photo-6', 'Hero remains customer-photo-6')
assert(hero.heroEligible === true && hero.marketingEligible === true, 'Hero must be fully eligible')
assert(isPhotoAllowedForPlacement(hero, 'hero'), 'Hero must pass hero placement check')
assert(isPhotoAllowedForPlacement(hero, 'share'), 'Hero must also be share-eligible')
assert(HOME_OG_IMAGE_PATH === hero.src, 'Homepage OG image must match the hero photo')
assert(
  gallery.some((p) => p.id === hero.id),
  'Hero photo must remain in the gallery set',
)
pass('hero-and-og-use-permitted-photo', { heroId: hero.id, og: HOME_OG_IMAGE_PATH })

assert(isTestimonialPlaceholder(TESTIMONIAL_PLACEHOLDER_TOKEN), 'Token detector works')
assert(isTestimonialPlaceholder('TODO: write review'), 'TODO quotes treated as placeholder')
assert(isTestimonialPlaceholder('lorem ipsum'), 'Lorem treated as placeholder')
assert(!isTestimonialPlaceholder('The sizing guide made ordering easy.'), 'Real quote passes detector')

const publishableTestimonials = getPublishableTestimonials()
assert(
  publishableTestimonials.every((t) => !t.isPlaceholder && !isTestimonialPlaceholder(t.quote)),
  'Publishable list must exclude placeholders',
)
assert(
  TESTIMONIALS.filter((t) => t.isPlaceholder).every((t) => isTestimonialPlaceholder(t.quote)),
  'Marked placeholders must use placeholder quote content',
)
assert(
  publishableTestimonials.length === 0,
  'No real testimonials approved yet — getPublishableTestimonials() must stay empty so placeholders cannot ship',
)
pass('testimonials-cannot-ship-placeholders', { publishable: publishableTestimonials.length })

for (const entry of TESTIMONIALS) {
  if (!entry.permissionGranted) {
    assert(getTestimonialAttribution(entry) == null, 'No name/city without permission')
  }
}
pass('attribution-requires-permission')

const homeSrc = readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8')
const aboutSrc = readFileSync(new URL('../src/pages/About.jsx', import.meta.url), 'utf8')
const builderSrc = readFileSync(new URL('../src/components/CharmBuilder.jsx', import.meta.url), 'utf8')
const cartSrc = readFileSync(new URL('../src/pages/Cart.jsx', import.meta.url), 'utf8')
const drawerSrc = readFileSync(new URL('../src/components/CartDrawer.jsx', import.meta.url), 'utf8')
const proofSrc = readFileSync(new URL('../src/components/CustomerProof.jsx', import.meta.url), 'utf8')
const proofDataSrc = readFileSync(new URL('../src/data/customerProof.js', import.meta.url), 'utf8')

assert(homeSrc.includes('CustomerProofStrip'), 'Homepage must include proof strip')
assert(homeSrc.indexOf('BestSellers') < homeSrc.indexOf('CustomerProofStrip'), 'Strip should follow best sellers')
assert(homeSrc.includes('CustomerPhotoGallery'), 'Homepage gallery uses shared component')
assert(homeSrc.includes('getHomeHeroPhoto'), 'Homepage hero uses permitted hero helper')
assert(!homeSrc.includes('customer-photo-9'), 'Homepage must not hardcode customer-photo-9')
assert(aboutSrc.includes('CustomerPhotoGallery'), 'About uses shared gallery')
assert(builderSrc.includes('CustomerProofNearCta'), 'Charm Studio includes near-CTA proof')
assert(cartSrc.includes('CustomerProofNearCta'), 'Cart summary includes proof')
assert(drawerSrc.includes('CustomerProofNearCta'), 'Cart drawer includes proof')
assert(proofSrc.includes('getPublishableCustomerPhotos'), 'Gallery must use publishable/gallery selector')
assert(!proofSrc.includes('CUSTOMER_PHOTOS.map'), 'Gallery must not render the raw catalog without placement filter')
assert(proofSrc.includes("loading={priority ? 'eager' : 'lazy'}"), 'Proof images default to lazy loading')
assert(proofSrc.includes('sizes='), 'Images declare sizes for responsive loading')
assert(proofSrc.includes('Placeholder — do not publish') || proofSrc.includes('never publish'), 'Placeholder UI is clearly marked')
assert(proofDataSrc.includes('photoPermissionGranted'), 'customerProof.js documents photo permission field')
assert(proofDataSrc.includes('allowedPlacements'), 'customerProof.js documents allowedPlacements')
assert(proofDataSrc.includes('heroEligible'), 'customerProof.js documents heroEligible')
assert(proofDataSrc.includes('marketingEligible'), 'customerProof.js documents marketingEligible')
assert(proofDataSrc.includes('Audit note'), 'customerProof.js retains audit note for gallery-only photo')
assert(!proofDataSrc.includes('customerProof.blocked'), 'blocked-module docs must be removed')
assert(
  proofDataSrc.includes('Independent of testimonial') ||
    proofDataSrc.includes('does NOT imply name/city') ||
    proofDataSrc.includes('PHOTO vs IDENTITY'),
  'customerProof.js must separate photo permission from name/city/testimonial permission',
)
assert(!existsSync(join(root, 'src/data/customerProof.blocked.js')), 'customerProof.blocked.js must be removed')
pass('proof-wired-to-buying-surfaces')

const preview = getDevPreviewTestimonials()
if (import.meta.env.PROD) {
  assert(preview.length === 0, 'Dev preview testimonials must be empty in production builds')
}
pass('dev-preview-gated', { previewCount: preview.length, prod: Boolean(import.meta.env.PROD) })

const restrictedNeedles = new Set([
  photo9.id,
  photo9.src,
  photo9.src.replace(/^\//, ''),
  'customer-photo-9.jpg',
])

const restrictedScanFiles = [
  'src/pages/Home.jsx',
  'src/data/site.js',
  'src/data/bundles.js',
  'src/data/structuredData.js',
  'index.html',
]

const restrictedHits = []
for (const rel of restrictedScanFiles) {
  const text = readFileSync(join(root, rel), 'utf8')
  for (const needle of restrictedNeedles) {
    if (text.includes(needle)) restrictedHits.push({ file: rel, needle })
  }
}
assert(
  restrictedHits.length === 0,
  `Gallery-only photo referenced in restricted surfaces: ${JSON.stringify(restrictedHits)}`,
)
pass('gallery-only-absent-from-restricted-surfaces')

for (const bundle of BEST_SELLER_BUNDLES) {
  assert(
    !restrictedNeedles.has(bundle.image) && !restrictedNeedles.has(String(bundle.image).replace(/^\//, '')),
    `Bundle ${bundle.id} must not use gallery-only customer-photo-9`,
  )
  const matching = CUSTOMER_PHOTOS.find((p) => p.src === bundle.image)
  if (matching) {
    assert(
      isPhotoAllowedForPlacement(matching, 'bundle'),
      `Bundle ${bundle.id} image must be bundle-eligible`,
    )
  }
}

const goldBundle = BEST_SELLER_BUNDLES.find((b) => b.id === 'gold-best-sellers')
assert(goldBundle, 'Gold Best Sellers bundle exists')
assert(
  goldBundle.image === '/images/customer-photos/customer-photo-8.webp',
  'Gold Best Sellers remains customer-photo-8',
)

const productJson = JSON.stringify(buildBestSellerProductsJsonLd())
for (const needle of restrictedNeedles) {
  assert(!productJson.includes(needle), `Structured data must not include gallery-only photo: ${needle}`)
}
pass('bundles-and-structured-data-respect-placements')

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
assert(indexHtml.includes(hero.src), 'index.html OG/Twitter/preload must reference hero asset')
assert(!indexHtml.includes('customer-photo-9'), 'index.html must not reference customer-photo-9')
pass('index-html-share-and-preload')

const distDir = join(root, 'dist')
if (existsSync(distDir)) {
  const distIndex = readFileSync(join(distDir, 'index.html'), 'utf8')
  assert(!distIndex.includes('customer-photo-9'), 'dist/index.html must not reference customer-photo-9')
  assert(
    distIndex.includes(hero.src) || distIndex.includes(hero.src.replace(/^\//, '')),
    'dist index uses hero share image',
  )
  pass('dist-share-tags-exclude-gallery-only', { scanned: true })
} else {
  pass('dist-share-tags-exclude-gallery-only', { scanned: false, note: 'dist/ not present; run build then re-verify' })
}

console.log(
  JSON.stringify(
    {
      ok: true,
      photo9Audit: {
        id: 'customer-photo-9',
        status: 'gallery-only',
        photoPermissionGranted: true,
        allowedPlacements: ['gallery'],
        heroEligible: false,
        marketingEligible: false,
        note: 'Owner granted website customer-gallery use only; excluded from hero, bundles, proof/near-CTA, ads, preload, structured data, and OG/Twitter',
      },
      results,
    },
    null,
    2,
  ),
)

/**
 * Customer photo proof and testimonials.
 *
 * PHOTO vs IDENTITY PERMISSION (kept separate on purpose):
 * - Photo fields (`photoPermissionGranted`, `allowedPlacements`, `heroEligible`,
 *   `marketingEligible`) control where a photograph may appear.
 * - Testimonial `permissionGranted` controls whether a customer’s first name,
 *   city, or other personal identifiers may be published with a quote.
 * Having photo permission does NOT imply name/city/testimonial permission,
 * and vice versa.
 *
 * Placement rules (enforced by selectors + verify scripts):
 * - gallery — CustomerPhotoGallery on the dedicated Customer Photos page
 * - hero — homepage hero + matching share/preload imagery
 * - proofStrip — homepage benefit proof strip
 * - nearCta — Charm Studio / cart near-CTA thumbnails
 * - bundle — best-seller card imagery
 * - share — Open Graph / Twitter share images
 * - structuredData — Product/Organization JSON-LD images
 * - advertising — paid ads / off-site marketing creatives
 *
 * Audit note — customer-photo-9:
 * Owner granted permission for the website customer gallery only. It is
 * gallery-eligible (`allowedPlacements: ['gallery']`) with
 * `heroEligible: false` and `marketingEligible: false`. Do not use it as
 * homepage hero, bundle imagery, proof-strip / near-CTA imagery, advertising,
 * preload, structured-data image, or Open Graph / Twitter sharing image.
 *
 * Written testimonials: only publish entries that pass
 * `getPublishableTestimonials()`. Placeholder quotes are for local layout
 * preview and must never ship in production UI.
 */

/** Sentinel that must never appear in customer-facing production UI. */
export const TESTIMONIAL_PLACEHOLDER_TOKEN = ['SET', 'TESTIMONIAL', 'QUOTE'].join('_')

/**
 * Homepage hero + share-image photo. Must be hero- and marketing-eligible.
 * Prefer a strong close-up bracelet shot.
 */
export const HOME_HERO_PHOTO_ID = 'customer-photo-10'

/**
 * @typedef {'fit' | 'personalization' | 'gifting' | 'stacking'} CustomerProofBenefit
 */

/**
 * @typedef {'gallery' | 'hero' | 'proofStrip' | 'nearCta' | 'bundle' | 'share' | 'structuredData' | 'advertising'} CustomerPhotoPlacement
 */

/** @type {CustomerPhotoPlacement[]} */
export const FULL_PHOTO_PLACEMENTS = [
  'gallery',
  'hero',
  'proofStrip',
  'nearCta',
  'bundle',
  'share',
  'structuredData',
  'advertising',
]

/**
 * @typedef {Object} CustomerPhoto
 * @property {string} id
 * @property {string} src
 * @property {number} width
 * @property {number} height
 * @property {string} alt
 * @property {CustomerProofBenefit} benefit
 * @property {string} benefitCaption Short line tying the photo to a product benefit.
 * @property {boolean} photoPermissionGranted Base photo release (required for any use).
 *   Independent of testimonial name/city/quote permission.
 * @property {CustomerPhotoPlacement[]} allowedPlacements Surfaces this photo may appear on.
 * @property {boolean} heroEligible When false, never use as homepage hero / share hero.
 * @property {boolean} marketingEligible When false, never use for ads, bundles, OG/Twitter,
 *   preload, structured data, or other marketing placements beyond gallery.
 */

/**
 * Default permission shape for fully released lifestyle photos.
 * @returns {{ photoPermissionGranted: true, allowedPlacements: CustomerPhotoPlacement[], heroEligible: true, marketingEligible: true }}
 */
function fullPhotoPermissions() {
  return {
    photoPermissionGranted: true,
    allowedPlacements: [...FULL_PHOTO_PLACEMENTS],
    heroEligible: true,
    marketingEligible: true,
  }
}

/** @type {Record<CustomerProofBenefit, { label: string, studioHint: string }>} */
export const BENEFIT_META = {
  fit: {
    label: 'Fit',
    studioHint: 'Sized to your wrist in Charm Studio',
  },
  personalization: {
    label: 'Personalization',
    studioHint: 'Charms that tell your story',
  },
  gifting: {
    label: 'Gifting',
    studioHint: 'Made to gift, ready to wear',
  },
  stacking: {
    label: 'Stacking',
    studioHint: 'Layers with everyday bracelets',
  },
}

/** @type {CustomerPhoto[]} */
export const CUSTOMER_PHOTOS = [
  {
    id: 'customer-photo-1',
    src: '/images/customer-photos/customer-photo-1.webp',
    width: 848,
    height: 1024,
    alt: 'Two friends holding up wrists with layered gold and silver Italian charm bracelets featuring heart, flag, and fish dangle charms',
    benefit: 'gifting',
    benefitCaption: 'A gift they will actually wear — and show off together.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-2',
    src: '/images/customer-photos/customer-photo-2.webp',
    width: 900,
    height: 1018,
    alt: 'Close-up of a wrist stacking a silver Italian charm bracelet with a gold chain and a gold beaded cross bracelet',
    benefit: 'stacking',
    benefitCaption: 'Built to stack with the bracelets you already love.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-3',
    src: '/images/customer-photos/customer-photo-3.webp',
    width: 900,
    height: 812,
    alt: 'Two customers wearing gold Italian charm bracelets with checkered and pearl dangle charms',
    benefit: 'gifting',
    benefitCaption: 'Matching energy for birthdays, markets, and best-friend days.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-4',
    src: '/images/customer-photos/customer-photo-4.webp',
    width: 768,
    height: 1024,
    alt: 'Apple Watch with a gold Italian charm band featuring fish, flag, cross, star, and heart dangle charms',
    benefit: 'personalization',
    benefitCaption: 'Every charm is a detail you choose — not a one-size look.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-5',
    src: '/images/customer-photos/customer-photo-5.webp',
    width: 768,
    height: 1024,
    alt: 'Wrist wearing a stacked silver Italian charm bracelet with black beaded and cord bracelets at an outdoor market',
    benefit: 'fit',
    benefitCaption: 'Comfortable on the wrist for markets, errands, and all-day wear.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-6',
    src: '/images/customer-photos/customer-photo-6.webp',
    width: 768,
    height: 1024,
    alt: 'Close-up of a hand wearing stacked gold and silver Italian charm bracelets with heart, flower, checkerboard, cherry, and I love you charms over denim and grass',
    benefit: 'personalization',
    benefitCaption: 'Mix metals and meanings until it feels like yours.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-7',
    src: '/images/customer-photos/customer-photo-7.webp',
    width: 768,
    height: 1024,
    alt: 'Wrist with layered silver chains and a gold Italian charm bracelet with star, I love you, checkerboard links, and fish and pearl dangle charms',
    benefit: 'stacking',
    benefitCaption: 'Charm links nest next to chains without looking costume-y.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-8',
    src: '/images/customer-photos/customer-photo-8.webp',
    width: 768,
    height: 1024,
    alt: 'Wrist wearing stacked gold and silver Italian charm bracelets with cherries, Diet Coke, American flag, and checkerboard charms',
    benefit: 'personalization',
    benefitCaption: 'Playful charms that still read as jewelry you wear daily.',
    ...fullPhotoPermissions(),
  },
  {
    id: 'customer-photo-10',
    src: '/images/customer-photos/customer-photo-10.webp',
    width: 1086,
    height: 1448,
    alt: 'Wrist stacked with gold and silver RetroCharm Co Italian charm bracelets featuring heart, American flag, flower, star, cherry, and I love you charms',
    benefit: 'stacking',
    benefitCaption: 'Stack the gold and silver best sellers for an everyday duo.',
    // Hero-only: intentionally not shown in the customer gallery or proof strip.
    photoPermissionGranted: true,
    allowedPlacements: ['hero', 'share'],
    heroEligible: true,
    marketingEligible: true,
  },
  {
    // Gallery-only: owner granted website customer-gallery use; not hero/marketing.
    id: 'customer-photo-9',
    src: '/images/customer-photos/customer-photo-9.jpg',
    width: 666,
    height: 1024,
    alt: 'Hand with pink nails wearing gold rings and a gold Italian charm bracelet featuring strawberry, dice, WWJD, and twenty links',
    benefit: 'fit',
    benefitCaption: 'Link count is sized in Charm Studio so the clasp sits right.',
    photoPermissionGranted: true,
    allowedPlacements: ['gallery'],
    heroEligible: false,
    marketingEligible: false,
  },
]

/** Homepage strip: one photo per core benefit, in buying-decision order. */
const STRIP_IDS = [
  'customer-photo-5', // fit
  'customer-photo-6', // personalization (also homepage hero)
  'customer-photo-1', // gifting
  'customer-photo-2', // stacking
]

/** Compact proof near Charm Studio CTA / cart summary. */
const NEAR_CTA_IDS = [
  'customer-photo-5', // fit
  'customer-photo-8', // personalization
  'customer-photo-7', // stacking
]

/**
 * @typedef {Object} Testimonial
 * @property {string} id
 * @property {string} quote
 * @property {boolean} isPlaceholder
 * @property {boolean} permissionGranted When false, never show firstName/city.
 *   Independent of photo permission fields on customer photos.
 * @property {string} [firstName]
 * @property {string} [city]
 */

/**
 * Placeholder testimonials for local layout only.
 * Replace `quote` with real approved copy and set `isPlaceholder: false`
 * (and `permissionGranted` + name/city only with explicit permission).
 *
 * @type {Testimonial[]}
 */
export const TESTIMONIALS = [
  {
    id: 'placeholder-fit',
    quote: TESTIMONIAL_PLACEHOLDER_TOKEN,
    isPlaceholder: true,
    permissionGranted: false,
    firstName: 'Alex',
    city: 'Placeholder City',
  },
  {
    id: 'placeholder-personalization',
    quote: TESTIMONIAL_PLACEHOLDER_TOKEN,
    isPlaceholder: true,
    permissionGranted: false,
    firstName: 'Jordan',
    city: 'Placeholder City',
  },
  {
    id: 'placeholder-gifting',
    quote: TESTIMONIAL_PLACEHOLDER_TOKEN,
    isPlaceholder: true,
    permissionGranted: false,
    firstName: 'Sam',
    city: 'Placeholder City',
  },
  {
    id: 'placeholder-stacking',
    quote: TESTIMONIAL_PLACEHOLDER_TOKEN,
    isPlaceholder: true,
    permissionGranted: false,
    firstName: 'Riley',
    city: 'Placeholder City',
  },
]

/**
 * @param {CustomerPhoto | null | undefined} photo
 * @param {CustomerPhotoPlacement} placement
 * @returns {boolean}
 */
export function isPhotoAllowedForPlacement(photo, placement) {
  if (!photo || photo.photoPermissionGranted !== true) return false
  if (!Array.isArray(photo.allowedPlacements) || !photo.allowedPlacements.includes(placement)) {
    return false
  }
  if (placement === 'hero' && photo.heroEligible !== true) return false
  if (
    (placement === 'bundle' ||
      placement === 'share' ||
      placement === 'structuredData' ||
      placement === 'advertising' ||
      placement === 'proofStrip' ||
      placement === 'nearCta') &&
    photo.marketingEligible !== true
  ) {
    return false
  }
  // proofStrip / nearCta also require marketingEligible (above); gallery does not.
  return true
}

/**
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isTestimonialPlaceholder(value) {
  if (value == null) return true
  const trimmed = String(value).trim()
  if (!trimmed) return true
  const upper = trimmed.toUpperCase()
  return (
    upper === TESTIMONIAL_PLACEHOLDER_TOKEN ||
    upper.includes('SET_TESTIMONIAL') ||
    upper.includes('UPDATE_ME') ||
    upper.includes('PLACEHOLDER') ||
    upper.startsWith('TODO') ||
    upper.startsWith('LOREM')
  )
}

/**
 * Testimonials safe for production UI (empty until real quotes are approved).
 * @returns {Testimonial[]}
 */
export function getPublishableTestimonials() {
  return TESTIMONIALS.filter(
    (entry) =>
      !entry.isPlaceholder &&
      !isTestimonialPlaceholder(entry.quote) &&
      String(entry.quote).trim().length > 0,
  )
}

/**
 * Dev-only layout preview. Always empty in production builds.
 * @returns {Testimonial[]}
 */
export function getDevPreviewTestimonials() {
  if (import.meta.env.PROD) return []
  return TESTIMONIALS.filter((entry) => entry.isPlaceholder || isTestimonialPlaceholder(entry.quote))
}

/**
 * Attribution line only when the business has permission.
 * @param {Pick<Testimonial, 'permissionGranted' | 'firstName' | 'city'>} entry
 * @returns {string | null}
 */
export function getTestimonialAttribution(entry) {
  if (!entry?.permissionGranted) return null
  const name = typeof entry.firstName === 'string' ? entry.firstName.trim() : ''
  const city = typeof entry.city === 'string' ? entry.city.trim() : ''
  if (!name) return null
  if (city.toLowerCase().includes('placeholder')) return name
  return city ? `${name}, ${city}` : name
}

/**
 * Catalog lookup (full list, including gallery-only photos).
 * @param {string} id
 * @returns {CustomerPhoto | undefined}
 */
export function getCustomerPhotoById(id) {
  return CUSTOMER_PHOTOS.find((photo) => photo.id === id)
}

/**
 * Photos approved for the public customer gallery.
 * @returns {CustomerPhoto[]}
 */
export function getPublishableCustomerPhotos() {
  return CUSTOMER_PHOTOS.filter((photo) => isPhotoAllowedForPlacement(photo, 'gallery'))
}

/**
 * Photo by id when allowed for a placement, otherwise undefined.
 * @param {string} id
 * @param {CustomerPhotoPlacement} placement
 * @returns {CustomerPhoto | undefined}
 */
export function getCustomerPhotoForPlacement(id, placement) {
  const photo = getCustomerPhotoById(id)
  if (!isPhotoAllowedForPlacement(photo, placement)) return undefined
  return photo
}

/**
 * Gallery-eligible photo by id.
 * @param {string} id
 * @returns {CustomerPhoto | undefined}
 */
export function getPublishableCustomerPhotoById(id) {
  return getCustomerPhotoForPlacement(id, 'gallery')
}

/**
 * Homepage hero photograph (must be hero-eligible + marketing-eligible).
 * @returns {CustomerPhoto}
 */
export function getHomeHeroPhoto() {
  const photo = getCustomerPhotoForPlacement(HOME_HERO_PHOTO_ID, 'hero')
  if (!photo || !isPhotoAllowedForPlacement(photo, 'share')) {
    throw new Error(
      `Homepage hero photo "${HOME_HERO_PHOTO_ID}" is missing or not eligible for hero/share placement`,
    )
  }
  return photo
}

/** @returns {CustomerPhoto[]} */
export function getProofStripPhotos() {
  return STRIP_IDS.map((id) => getCustomerPhotoForPlacement(id, 'proofStrip')).filter(Boolean)
}

/** @returns {CustomerPhoto[]} */
export function getNearCtaProofPhotos() {
  return NEAR_CTA_IDS.map((id) => getCustomerPhotoForPlacement(id, 'nearCta')).filter(Boolean)
}

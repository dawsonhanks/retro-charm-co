import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from './site'
import { CONTACT } from './storeInfo'
import { SOCIAL_PROFILES } from './social'
import { BEST_SELLER_BUNDLES, getBundleConfiguredListPrice } from './bundles'
import { locations } from './locations'

/**
 * Organization / OnlineStore JSON-LD.
 * Only includes confirmed details — no phone, street HQ, ratings, or hours invented.
 * @returns {Record<string, unknown>}
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    '@id': `${getSiteUrl()}/#organization`,
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl('/images/brand/retro-charm-logo.png'),
    image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    description: DEFAULT_DESCRIPTION,
    email: CONTACT.email,
    sameAs: [...SOCIAL_PROFILES],
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Utah',
    },
  }
}

/**
 * Best-seller bundles as Product entities with catalog list prices.
 * Omits availability, ratings, and review counts (not confirmed for schema).
 * @returns {Record<string, unknown>}
 */
export function buildBestSellerProductsJsonLd() {
  const products = BEST_SELLER_BUNDLES.map((bundle) => {
    const price = getBundleConfiguredListPrice(bundle)
    return {
      '@type': 'Product',
      '@id': `${getSiteUrl()}/#product-${bundle.id}`,
      name: bundle.name,
      description: bundle.description,
      image: absoluteUrl(bundle.image),
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
      offers: {
        '@type': 'Offer',
        url: absoluteUrl('/#best-sellers'),
        priceCurrency: 'USD',
        price: price.toFixed(2),
        itemCondition: 'https://schema.org/NewCondition',
      },
    }
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAME} best sellers`,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: product,
    })),
  }
}

/**
 * Pop-up market location as a Place (Find Us). Uses confirmed market address only.
 * @param {(typeof locations)[number]} [location]
 * @returns {Record<string, unknown> | null}
 */
export function buildMarketPlaceJsonLd(location = locations[0]) {
  if (!location) return null

  const addressMatch = String(location.address).match(
    /^(.+),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i,
  )

  /** @type {Record<string, unknown>} */
  const address = {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  }

  if (addressMatch) {
    address.streetAddress = addressMatch[1].trim()
    address.addressLocality = addressMatch[2].trim()
    address.addressRegion = addressMatch[3].trim().toUpperCase()
    address.postalCode = addressMatch[4].trim()
  } else {
    address.streetAddress = location.address
  }

  /** @type {Record<string, unknown>} */
  const place = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${SITE_NAME} booth — ${location.name}`,
    description: `Find ${SITE_NAME} at ${location.name}. ${location.dayLabel}, ${location.hours}. Season: ${location.dates}.`,
    address,
    url: absoluteUrl('/find-us'),
  }

  if (typeof location.lat === 'number' && typeof location.lng === 'number') {
    place.geo = {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng,
    }
  }

  return place
}

/**
 * WebSite node with search-less site identity (no SearchAction invented).
 * @returns {Record<string, unknown>}
 */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${getSiteUrl()}/#website`,
    name: SITE_NAME,
    url: getSiteUrl(),
    description: DEFAULT_DESCRIPTION,
    publisher: { '@id': `${getSiteUrl()}/#organization` },
    inLanguage: 'en-US',
  }
}

/**
 * @param {{ title?: string, description?: string, path?: string }} [page]
 * @returns {Record<string, unknown>}
 */
export function buildWebPageJsonLd(page = {}) {
  const path = page.path || '/'
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: page.title || DEFAULT_TITLE,
    description: page.description || DEFAULT_DESCRIPTION,
    isPartOf: { '@id': `${getSiteUrl()}/#website` },
    about: { '@id': `${getSiteUrl()}/#organization` },
  }
}

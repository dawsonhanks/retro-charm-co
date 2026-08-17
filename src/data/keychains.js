/**
 * Charm keychain bases — standalone accessories (NOT bracelet links),
 * so they live here instead of in charms.js and never enter the Charm Studio.
 *
 * Photos live in /public/images/keychains/. Add charms from the catalog
 * the same way you build a bracelet.
 *
 * Override `price` on any single item if a style differs from the line.
 */

/** @typedef {{ id: string, name: string, price: number, metal: 'silver' | 'gold', image: string }} Keychain */

/** @type {Keychain[]} */
export const KEYCHAINS = [
  {
    id: 'keychain-silver',
    name: 'Silver Keychain',
    price: 6.95,
    metal: 'silver',
    image: '/images/keychains/keychain-silver.webp',
  },
  {
    id: 'keychain-gold',
    name: 'Gold Keychain',
    price: 7.95,
    metal: 'gold',
    image: '/images/keychains/keychain-gold.webp',
  },
  {
    id: 'keychain-heart-silver',
    name: 'Heart Keychain',
    price: 7.95,
    metal: 'silver',
    image: '/images/keychains/keychain-heart-silver.webp',
  },
]

export const KEYCHAIN_PRICE_FROM = Math.min(...KEYCHAINS.map((k) => k.price))

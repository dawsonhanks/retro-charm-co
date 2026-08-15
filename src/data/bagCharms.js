/**
 * Pre-made beaded bag charms — standalone accessories (NOT bracelet links),
 * so they live here instead of in charms.js and never enter the Charm Studio.
 *
 * Photos live in /public/images/bag-charms/. To retire or add a style, edit the
 * array below; set `image` to null to fall back to a "Photo coming soon" tile.
 *
 * Flat price for the line — override `price` on any single item if needed.
 */
export const BAG_CHARM_PRICE = 9.95

/** @typedef {{ id: string, name: string, price: number, image: string | null }} BagCharm */

/** @type {BagCharm[]} */
export const BAG_CHARMS = [
  { id: 'bag-tutti-frutti', name: 'Tutti Frutti', price: BAG_CHARM_PRICE, image: '/images/bag-charms/tutti-frutti.webp' },
  { id: 'bag-sherbet', name: 'Sherbet', price: BAG_CHARM_PRICE, image: '/images/bag-charms/sherbet.webp' },
  { id: 'bag-peaches', name: 'Peaches', price: BAG_CHARM_PRICE, image: '/images/bag-charms/peaches.webp' },
  { id: 'bag-cherry', name: 'Cherry', price: BAG_CHARM_PRICE, image: '/images/bag-charms/cherry.webp' },
  { id: 'bag-blue-raspberry', name: 'Blue Raspberry', price: BAG_CHARM_PRICE, image: '/images/bag-charms/blue-raspberry.webp' },
  { id: 'bag-lychee', name: 'Lychee', price: BAG_CHARM_PRICE, image: '/images/bag-charms/lychee.webp' },
]

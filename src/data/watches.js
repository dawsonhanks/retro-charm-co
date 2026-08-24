/**
 * Charm bracelet watches — standalone accessories (NOT bracelet links),
 * so they live here instead of in charms.js and never enter the Charm Studio.
 *
 * Photos live in /public/images/watches/.
 */

/** @typedef {{ id: string, name: string, price: number, metal: 'silver' | 'gold', image: string }} Watch */

/** @type {Watch[]} */
export const WATCHES = [
  {
    id: 'watch-silver',
    name: 'Silver Watch',
    price: 18,
    metal: 'silver',
    image: '/images/watches/silver-watch.webp',
  },
  {
    id: 'watch-gold',
    name: 'Gold Watch',
    price: 20,
    metal: 'gold',
    image: '/images/watches/gold-watch.webp',
  },
]

export const WATCH_PRICE_FROM = Math.min(...WATCHES.map((w) => w.price))

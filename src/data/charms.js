/** @typedef {'Starter Bracelets' | 'charms' | 'dangles'} CharmCategory */

/**
 * @typedef {Object} Charm
 * @property {string} id
 * @property {string} name
 * @property {CharmCategory} category
 * @property {number} price
 * @property {'path' | 'letter' | 'emoji' | 'image'} iconType
 * @property {string} [letter]
 * @property {string} [emoji]
 * @property {string} [image]
 * @property {string} [viewBox]
 * @property {string} [path]
 * @property {{ d: string, fillRule?: string }[]} [paths]
 * @property {string} [iconClass]
 * @property {'silver' | 'gold'} metal
 */

export const BASE_OPTIONS = [
  { id: 'silver', metal: 'silver', label: 'Silver Bracelet', price: 10, chainClass: 'stroke-slate-300', image: '/images/base-bracelet-silver.webp' },
  { id: 'silver-watch', metal: 'silver', label: 'Silver Watch Band', price: 18, chainClass: 'stroke-slate-300', image: '/images/base-bracelet-silver-watch.webp' },
  { id: 'gold', metal: 'gold', label: 'Gold Bracelet', price: 12, chainClass: 'stroke-amber-400', image: '/images/base-bracelet-gold.webp' },
  { id: 'gold-watch', metal: 'gold', label: 'Gold Watch Band', price: 20, chainClass: 'stroke-amber-400', image: '/images/base-bracelet-gold-watch.webp' },
]

/** Charm slots reserved by the watch face on watch-band bases. */
export const WATCH_BASE_CHARM_RESERVE = 5

export function isWatchBase(baseId) {
  return typeof baseId === 'string' && baseId.includes('watch')
}

/**
 * How many charms a size can hold for a given base.
 * Watch bands use 5 fewer slots than the selected size.
 * @param {number | null | undefined} sizeCharmCount
 * @param {string | null | undefined} baseId
 * @returns {number | null}
 */
export function getCharmCapacity(sizeCharmCount, baseId) {
  if (sizeCharmCount == null || !Number.isFinite(sizeCharmCount)) return null
  const reserve = isWatchBase(baseId) ? WATCH_BASE_CHARM_RESERVE : 0
  return Math.max(0, sizeCharmCount - reserve)
}

export const DEFAULT_CHARM_PRICE = 3.95

export const CHARM_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'Starter Bracelets', label: 'Starter Bracelets' },
  { id: 'charms', label: 'Charms' },
  { id: 'dangles', label: 'Dangle Charms' },
]

/** @type {Charm[]} */
export const charms = [
  // ── Plain filler links (spacers) ───────────────────────────────────────
  { id: 's-plain-filler', name: 'Plain Filler', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/plain-silver-link.webp' },
  { id: 'g-plain-filler', name: 'Plain Filler', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/plain-gold-link.webp' },

  // ── Starter Bracelets ─────────────────────────────────────────────────
  { id: 's-silver-base', name: 'Silver Base', category: 'Starter Bracelets', price: 10, metal: 'silver', iconType: 'image', image: '/images/starter-bracelets/silver-base.webp' },
  { id: 's-silver-apple-watch', name: 'Silver Apple Watch', category: 'Starter Bracelets', price: 18, metal: 'silver', iconType: 'image', image: '/images/starter-bracelets/silver-apple-watch.webp' },
  { id: 'g-gold-base', name: 'Gold Base', category: 'Starter Bracelets', price: 12, metal: 'gold', iconType: 'image', image: '/images/starter-bracelets/gold-base.webp' },
  { id: 'g-gold-apple-watch', name: 'Gold Apple Watch', category: 'Starter Bracelets', price: 20, metal: 'gold', iconType: 'image', image: '/images/starter-bracelets/gold-apple-watch.webp' },

  // ── Letter Charms (from new photo set) ──────────────────────────────
  { id: 's-letter-a', name: 'Letter A', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-a-silver.webp' },
  { id: 's-letter-c', name: 'Letter C', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-c-silver.webp' },
  { id: 's-letter-e', name: 'Letter E', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-e-silver.webp' },
  { id: 's-letter-h', name: 'Letter H', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-h-silver.webp' },
  { id: 's-letter-j', name: 'Letter J', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-j-silver.webp' },
  { id: 's-letter-k', name: 'Letter K', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-k-silver.webp' },
  { id: 's-letter-l', name: 'Letter L', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-l-silver.webp' },
  { id: 's-letter-m', name: 'Letter M', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-m-silver.webp' },
  { id: 's-letter-n', name: 'Letter N', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-n-silver.webp' },
  { id: 's-letter-p', name: 'Letter P', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-p-silver.webp' },
  { id: 's-letter-r', name: 'Letter R', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-r-silver.webp' },
  { id: 's-letter-d', name: 'Letter D', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-d-silver.webp' },
  { id: 's-letter-s', name: 'Letter S', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-s-silver.webp' },
  { id: 's-letter-t', name: 'Letter T', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/letter-charms/letter-t-silver.webp' },

  // ── Charms (from new photo set) ───────────────────────────────────────
  { id: 'g-fish-dangle-green-white', name: 'Fish Dangle - Green/White', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/animals-characters/fish-dangle-green-white-gold.webp' },
  { id: 's-labubu', name: 'Labubu', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/animals-characters/labubu-silver.webp' },
  { id: 's-paw-print-blue', name: 'Paw Print - Blue', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/animals-characters/paw-print-blue-silver.webp' },
  { id: 'g-pearl-gold', name: 'Pearl - Gold', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/animals-characters/pearl-gold-gold.webp' },
  { id: 'g-dangle-blue-teal', name: 'Dangle - Blue/Teal', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/birthstone-dangles/dangle-blue-teal-gold.webp' },
  { id: 'g-dangle-clear', name: 'Dangle - Clear', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/birthstone-dangles/dangle-clear-gold.webp' },
  { id: 'g-dangle-garnet', name: 'Dangle - Garnet', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/birthstone-dangles/dangle-garnet-gold.webp' },
  { id: 'g-dangle-green', name: 'Dangle - Green', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/birthstone-dangles/dangle-green-gold.webp' },
  { id: 'g-dangle-pink-magenta', name: 'Dangle - Pink/Magenta', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/birthstone-dangles/dangle-pink-magenta-gold.webp' },
  { id: 's-dangle-red-ruby', name: 'Dangle - Red/Ruby', category: 'dangles', price: 4.95, metal: 'silver', iconType: 'image', image: '/images/charms/birthstone-dangles/dangle-red-ruby-silver.webp' },
  { id: 'g-bow-red-with-pearl', name: 'Bow - Red with Pearl', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/bows/bow-red-with-pearl-gold.webp' },
  { id: 'g-cherries-dangle', name: 'Cherries Dangle', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/cherries-dangle-gold.webp' },
  { id: 'g-fish-dangle-teal-white-2', name: 'Fish Dangle - Teal/White (2)', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/fish-dangle-teal-white-2-gold.webp' },
  { id: 'g-heart-coin-dangle-silver-sunburst', name: 'Heart Coin Dangle - Silver Sunburst', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/heart-coin-dangle-silver-sunburst-gold.webp' },
  { id: 'g-heart-dangle-gold', name: 'Heart Dangle - Gold', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/heart-dangle-gold-gold.webp' },
  { id: 'g-heart-dangle-silver', name: 'Heart Dangle - Silver', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/heart-dangle-silver-gold.webp' },
  { id: 's-heart-dangle-silver-2', name: 'Heart Dangle - Silver (2)', category: 'dangles', price: 4.95, metal: 'silver', iconType: 'image', image: '/images/charms/dangle-charms/heart-dangle-silver-2-silver.webp' },
  { id: 's-pearl-dangle', name: 'Pearl Dangle', category: 'dangles', price: 4.95, metal: 'silver', iconType: 'image', image: '/images/charms/dangle-charms/pearl-dangle-silver.webp' },
  { id: 'g-pearl-dangle', name: 'Pearl Dangle', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/pearl-dangle-gold.webp' },
  { id: 'g-sapphire-dangle', name: 'Sapphire Dangle', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/sapphire-dangle-gold.webp' },
  { id: 's-cherry-dangle', name: 'Cherry Dangle', category: 'dangles', price: 4.95, metal: 'silver', iconType: 'image', image: '/images/charms/dangle-charms/cherry-dangle-silver.webp' },
  { id: 'g-star-dangle-gold', name: 'Star Dangle - Gold', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/star-dangle-gold-gold.webp' },
  { id: 's-star-dangle-silver', name: 'Star Dangle - Silver', category: 'dangles', price: 4.95, metal: 'silver', iconType: 'image', image: '/images/charms/dangle-charms/star-dangle-silver-silver.webp' },
  { id: 'g-strawberry-dangle', name: 'Strawberry Dangle', category: 'dangles', price: 4.95, metal: 'gold', iconType: 'image', image: '/images/charms/dangle-charms/strawberry-dangle-gold.webp' },
  { id: 's-strawberry-dangle-2', name: 'Strawberry Dangle (2)', category: 'dangles', price: 4.95, metal: 'silver', iconType: 'image', image: '/images/charms/dangle-charms/strawberry-dangle-2-silver.webp' },
  { id: 's-cross-black', name: 'Cross - Black', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/faith/cross-black-silver.webp' },
  { id: 'g-cross-black', name: 'Cross - Black', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/faith/cross-black-gold.webp' },
  { id: 's-fish-symbol', name: 'Fish Symbol', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/faith/fish-symbol-silver.webp' },
  { id: 'g-wwjd', name: 'WWJD', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/faith/wwjd-gold.webp' },
  { id: 's-lv-logo', name: 'LV Logo', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/fashion/lv-logo-silver.webp' },
  { id: 's-flower-pink', name: 'Flower - Pink', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/flowers/flower-pink-silver.webp' },
  { id: 'g-flower-pink', name: 'Flower - Pink', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/flowers/flower-pink-gold.webp' },
  { id: 's-flower-turquoise', name: 'Flower - Turquoise', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/flowers/flower-turquoise-silver.webp' },
  { id: 'g-flower-turquoise', name: 'Flower - Turquoise', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/flowers/flower-turquoise-gold.webp' },
  { id: 's-flower-yellow', name: 'Flower - Yellow', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/flowers/flower-yellow-silver.webp' },
  { id: 's-rose', name: 'Rose', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/flowers/rose-silver.webp' },
  { id: 's-cherries', name: 'Cherries', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/food-drink/cherries-silver.webp' },
  { id: 'g-cherries-pink-background', name: 'Cherries - Pink Background', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/food-drink/cherries-pink-background-gold.webp' },
  { id: 'g-cherry-heart-checkered', name: 'Cherry Heart Checkered', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/food-drink/cherry-heart-checkered-gold.webp' },
  { id: 'g-diet-coke-can', name: 'Diet Coke Can', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/food-drink/diet-coke-can-gold.webp' },
  { id: 'g-strawberry', name: 'Strawberry', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/food-drink/strawberry-gold.webp' },
  { id: 'g-watermelon', name: 'Watermelon', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/food-drink/watermelon-gold.webp' },
  { id: 'g-charm-red-rectangle', name: 'Charm - Red Rectangle', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/gemstones/charm-red-rectangle-gold.webp' },
  { id: 's-turquoise-stone', name: 'Turquoise Stone', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/gemstones/turquoise-stone-silver.webp' },
  { id: 'g-turquoise-stone', name: 'Turquoise Stone', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/gemstones/turquoise-stone-gold.webp' },
  { id: 's-double-heart-red-pink', name: 'Double Heart - Red/Pink', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/hearts/double-heart-red-pink-silver.webp' },
  { id: 'g-heart-red', name: 'Heart - Red', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/hearts/heart-red-gold.webp' },
  { id: 's-heart-red', name: 'Heart - Red', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/hearts/heart-red-silver.webp' },
  { id: 'g-heart-red-and-gold', name: 'Heart - Red and Gold', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/hearts/heart-red-and-gold-gold.webp' },
  { id: 'g-raised-heart', name: 'Raised Gold Heart', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/hearts/raised-heart-gold.webp' },
  { id: 's-star-black', name: 'Star - Black', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/stars/star-black-silver.webp' },
  { id: 's-star-gold', name: 'Star - Gold', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/stars/star-gold-silver.webp' },
  { id: 's-star-green', name: 'Star - Green', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/stars/star-green-silver.webp' },
  { id: 'g-black-star', name: 'Black Star', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/stars/black-star-gold.webp' },
  { id: 's-plain-star', name: 'Plain Silver Star', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/stars/plain-star-silver.webp' },
  { id: 'g-star-red-layered', name: 'Star - Red Layered', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/stars/star-red-layered-gold.webp' },
  { id: 's-basketball', name: 'Basketball', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/basketball-silver.webp' },
  { id: 's-eight-ball', name: 'Eight Ball', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/eight-ball-silver.webp' },
  { id: 'g-sewing-machine', name: 'Sewing Machine', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/symbols-sports/sewing-machine-gold.webp' },
  { id: 's-checkered-blue-white', name: 'Checkered - Blue/White', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/checkered-blue-white-silver.webp' },
  { id: 's-checkered-pink', name: 'Checkered - Pink', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/checkered-pink-silver.webp' },
  { id: 'g-checkered-flag-gold', name: 'Checkered Flag - Gold', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/symbols-sports/checkered-flag-gold-gold.webp' },
  { id: 's-checkered-flag-silver', name: 'Checkered Flag - Silver', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/checkered-flag-silver-silver.webp' },
  { id: 'g-dice', name: 'Dice', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/symbols-sports/dice-gold.webp' },
  { id: 'g-music-note', name: 'Music Note', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/symbols-sports/music-note-gold.webp' },
  { id: 's-pickleball-paddle', name: 'Pickleball Paddle', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/pickleball-paddle-silver.webp' },
  { id: 's-rolling-stones-tongue', name: 'Rolling Stones Tongue', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/rolling-stones-tongue-silver.webp' },
  { id: 's-smiley-face', name: 'Smiley Face', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/smiley-face-silver.webp' },
  { id: 's-smiley-face-yellow', name: 'Smiley Face Yellow', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/smiley-face-yellow-silver.webp' },
  { id: 's-soccer-ball', name: 'Soccer Ball', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/symbols-sports/soccer-ball-silver.webp' },
  { id: 's-american-flag', name: 'American Flag', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/travel-places/american-flag-silver.webp' },
  { id: 'g-american-flag', name: 'American Flag', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/travel-places/american-flag-gold.webp' },
  { id: 'g-italian-flag', name: 'Italian Flag', category: 'charms', price: 3.95, metal: 'gold', iconType: 'image', image: '/images/charms/travel-places/italian-flag-gold.webp' },
  { id: 's-montana', name: 'Montana', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/travel-places/montana-silver.webp' },
  { id: 's-palm-tree-sunset', name: 'Palm Tree Sunset', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/travel-places/palm-tree-sunset-silver.webp' },
  { id: 's-mom', name: 'MOM', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/words-phrases/mom-silver.webp' },
  { id: 's-treat-people-with-kindness', name: 'Treat People With Kindness', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/words-phrases/treat-people-with-kindness-silver.webp' },
  { id: 's-yeet-or-be-yeeted', name: 'Yeet or be Yeeted', category: 'charms', price: 3.95, metal: 'silver', iconType: 'image', image: '/images/charms/words-phrases/yeet-or-be-yeeted-silver.webp' },
]

export const SIZE_OPTIONS = [
  { charmCount: 16, lengthInches: 5.7 },
  { charmCount: 17, lengthInches: 6.0 },
  { charmCount: 18, lengthInches: 6.4 },
  { charmCount: 19, lengthInches: 6.7 },
  { charmCount: 20, lengthInches: 7.1 },
  { charmCount: 21, lengthInches: 7.4 },
  { charmCount: 22, lengthInches: 7.8 },
  { charmCount: 23, lengthInches: 8.1 },
  { charmCount: 24, lengthInches: 8.5 },
]

export const DEFAULT_BRACELET_SIZE = 18
export const MIN_BRACELET_CHARMS = 10
export const MAX_BRACELET_CHARMS = 30

export function getApproximateLengthInches(charmCount) {
  return Math.round((0.35 * charmCount + 0.1) * 10) / 10
}

export function isValidCharmCount(charmCount) {
  return Number.isInteger(charmCount) && charmCount >= MIN_BRACELET_CHARMS && charmCount <= MAX_BRACELET_CHARMS
}

export function parseCharmCountInput(value) {
  const trimmed = String(value).trim()
  if (!/^\d+$/.test(trimmed)) {
    return null
  }

  const charmCount = Number(trimmed)
  return isValidCharmCount(charmCount) ? charmCount : null
}

export function getSizeLengthLabel(charmCount) {
  const exact = SIZE_OPTIONS.find((option) => option.charmCount === charmCount)
  if (exact) {
    return `${exact.lengthInches}"`
  }

  return `~${getApproximateLengthInches(charmCount)}" (approx.)`
}

export function getCharmById(id) {
  return charms.find((c) => c.id === id)
}

export function isFillerCharm(charmOrId) {
  const id = typeof charmOrId === 'string' ? charmOrId : charmOrId?.id
  return id === 's-plain-filler' || id === 'g-plain-filler'
}

/** @param {'silver' | 'gold'} metal */
export function getFillerCharmForMetal(metal) {
  return getCharmById(metal === 'gold' ? 'g-plain-filler' : 's-plain-filler')
}

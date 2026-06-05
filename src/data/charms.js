/** @typedef {'starter' | 'letters' | 'charms'} CharmCategory */

/**
 * @typedef {Object} Charm
 * @property {string} id
 * @property {string} name
 * @property {CharmCategory} category
 * @property {number} price
 * @property {'path' | 'letter' | 'emoji'} iconType
 * @property {string} [letter]
 * @property {string} [emoji]
 * @property {string} [viewBox]
 * @property {string} [path]
 * @property {{ d: string, fillRule?: string }[]} [paths]
 * @property {'silver' | 'gold'} metal
 */

export const BASE_OPTIONS = [
  { id: 'silver', label: 'Silver Link', price: 10, chainClass: 'stroke-slate-300' },
  { id: 'gold', label: 'Gold Link', price: 12, chainClass: 'stroke-amber-400' },
]

export const DEFAULT_CHARM_PRICE = 4

export const CHARM_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'starter', label: 'Starter Bracelets' },
  { id: 'letters', label: 'Letter Charms' },
  { id: 'charms', label: 'Charms' },
]

/** @type {Charm[]} */
export const charms = [
  // ── Silver Starter Bracelets ──────────────────────────────────────────
  { id: 's-grey', name: 'Grey Starter Bracelet', category: 'starter', price: 10, metal: 'silver', iconType: 'emoji', emoji: '🩶' },
  { id: 's-star', name: 'Star Starter Bracelet', category: 'starter', price: 10, metal: 'silver', iconType: 'emoji', emoji: '⭐' },
  { id: 's-fish', name: 'Fish Starter Bracelet', category: 'starter', price: 10, metal: 'silver', iconType: 'emoji', emoji: '🐟' },
  { id: 's-smile', name: 'Smile Starter Bracelet', category: 'starter', price: 10, metal: 'silver', iconType: 'emoji', emoji: '😊' },

  // ── Gold Starter Bracelets ────────────────────────────────────────────
  { id: 'g-shiny', name: 'Gold Shiny Starter Bracelet', category: 'starter', price: 12, metal: 'gold', iconType: 'emoji', emoji: '✨' },

  // ── Silver Letter Charms ──────────────────────────────────────────────
  { id: 's-la', name: 'Letter A', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'A' },
  { id: 's-lc', name: 'Letter C', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'C' },
  { id: 's-ld', name: 'Letter D', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'D' },
  { id: 's-le', name: 'Letter E', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'E' },
  { id: 's-lh', name: 'Letter H', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'H' },
  { id: 's-lj', name: 'Letter J', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'J' },
  { id: 's-lk', name: 'Letter K', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'K' },
  { id: 's-ll', name: 'Letter L', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'L' },
  { id: 's-lm', name: 'Letter M', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'M' },
  { id: 's-ln', name: 'Letter N', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'N' },
  { id: 's-lp', name: 'Letter P', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'P' },
  { id: 's-lr', name: 'Letter R', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'R' },
  { id: 's-ls', name: 'Letter S', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'S' },
  { id: 's-lt', name: 'Letter T', category: 'letters', price: 4, metal: 'silver', iconType: 'letter', letter: 'T' },

  // ── Silver Charms ─────────────────────────────────────────────────────
  { id: 's-redheart', name: 'Red Heart', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '❤️' },
  { id: 's-rphearts', name: 'Red & Pink Hearts', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '💕' },
  { id: 's-iloveyou', name: 'I Love You Heart', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '💞' },
  { id: 's-yellowflower', name: 'Yellow Flower', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🌼' },
  { id: 's-pinkflower', name: 'Pink Flower', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🌸' },
  { id: 's-blueflower', name: 'Blue Flower', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '💐' },
  { id: 's-palmtree', name: 'Sunset Palm Tree', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🌴' },
  { id: 's-pawprint', name: 'Blue Paw Print', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🐾' },
  { id: 's-cherries', name: 'Red Cherries', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🍒' },
  { id: 's-greenstar', name: 'Green Star', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '⭐' },
  { id: 's-smiley', name: 'Yellow Smiley Face', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '😊' },
  { id: 's-raceflag', name: 'Checker Racing Flag', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🏁' },
  { id: 's-pickleball', name: 'Pickleball Paddle', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🏓' },
  { id: 's-8ball', name: 'Eight Ball', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🎱' },
  { id: 's-basketball', name: 'Basketball', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🏀' },
  { id: 's-soccer', name: 'Soccer Ball', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '⚽' },
  { id: 's-usa', name: 'USA Flag', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🇺🇸' },
  { id: 's-montana', name: 'Montana Flag', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🗻' },
  { id: 's-rollingstones', name: 'Rolling Stones Tongue', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '👅' },
  { id: 's-lv', name: 'LV Logo', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🎰' },
  { id: 's-monster', name: 'Monster (Assorted)', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '👹' },
  { id: 's-flowerred', name: 'Flower on Red', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🌺' },
  { id: 's-momred', name: 'Mom on Red', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '👩' },
  { id: 's-whiterose', name: 'White Rose on Red', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🌹' },
  { id: 's-redheartgold', name: 'Red Heart on Gold', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '❤️' },
  { id: 's-yeet', name: 'Yeet or be Yeeted', category: 'charms', price: 4, metal: 'silver', iconType: 'emoji', emoji: '🚀' },

  // ── Gold Charms ───────────────────────────────────────────────────────
  { id: 'g-redfilled', name: 'Red Filled Heart', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '❤️' },
  { id: 'g-raisedgold', name: 'Raised Gold Heart', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '💛' },
  { id: 'g-pinkflower', name: 'Pink Rounded Flower', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '🌸' },
  { id: 'g-blueflower', name: 'Blue Flower', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '💐' },
  { id: 'g-musicnote', name: 'Black Music Note', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '🎵' },
  { id: 'g-blackstar', name: 'Black Star', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '🌟' },
  { id: 'g-blackcross', name: 'Black Cross', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '✝️' },
  { id: 'g-bluestarburst', name: 'Blue Star Burst', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '💥' },
  { id: 'g-pinkcherries', name: 'Pink Cherries', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '🍒' },
  { id: 'g-raceflag', name: 'Racing Checkered Flag', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '🏁' },
  { id: 'g-wwjd', name: 'WWJD', category: 'charms', price: 4, metal: 'gold', iconType: 'emoji', emoji: '✝️' },
]

export const MAX_BRACELET_CHARMS = 18

export function getCharmById(id) {
  return charms.find((c) => c.id === id)
}

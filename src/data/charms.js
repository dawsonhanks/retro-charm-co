/** @typedef {'nature' | 'retro' | 'letters' | 'food' | 'spiritual'} CharmCategory */

/**
 * @typedef {Object} Charm
 * @property {string} id
 * @property {string} name
 * @property {CharmCategory} category
 * @property {number} price
 * @property {'path' | 'letter'} iconType
 * @property {string} [letter] — for iconType letter
 * @property {string} [viewBox]
 * @property {string} [path] — single path d for iconType path
 * @property {{ d: string, fillRule?: string }[]} [paths] — multiple paths
 */

export const BASE_OPTIONS = [
  { id: 'silver', label: 'Silver Link', price: 12, chainClass: 'stroke-slate-300' },
  { id: 'rose', label: 'Rose Gold Link', price: 13, chainClass: 'stroke-rose-300' },
  { id: 'gold', label: 'Gold Link', price: 15, chainClass: 'stroke-amber-400' },
]

export const DEFAULT_CHARM_PRICE = 2.25

export const CHARM_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'retro', label: 'Retro' },
  { id: 'letters', label: 'Letters' },
  { id: 'food', label: 'Food & Fun' },
  { id: 'spiritual', label: 'Spiritual' },
]

/** @type {Charm[]} */
export const charms = [
  // Nature & animals
  {
    id: 'sun',
    name: 'Sun',
    category: 'nature',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M12 2.25v1.5M12 20.25v1.5M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M2.25 12h1.5M20.25 12h1.5M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z',
  },
  {
    id: 'moon',
    name: 'Moon',
    category: 'nature',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    category: 'nature',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 3v18M8.5 8.5C6 10 4 13 4 16c0 2.5 2 4 4.5 4 1.5 0 3-.5 3.5-2V6c-.5 1.5-2 2-3.5 2.5z',
      },
      {
        d: 'M15.5 8.5C18 10 20 13 20 16c0 2.5-2 4-4.5 4-1.5 0-3-.5-3.5-2V6c.5 1.5 2 2 3.5 2.5z',
      },
    ],
  },
  {
    id: 'flower',
    name: 'Flower',
    category: 'nature',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M12 8c-1.5-2-4-2-4 1 0 2 1 3 3 4 2-1 3-2 3-4 0-3-2.5-3-4-1zm0 0v8m-4-4h8',
  },
  {
    id: 'leaf',
    name: 'Leaf',
    category: 'nature',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M6 20c6-2 10-8 10-16-8 0-14 4-16 10 3 0 5 2 6 6z',
  },
  // Retro / nostalgia
  {
    id: 'cassette',
    name: 'Cassette',
    category: 'retro',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h8v4H8v-4zm1 1h2v2H9v-2zm4 0h2v2h-2v-2z',
  },
  {
    id: 'camera',
    name: 'Camera',
    category: 'retro',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M4 8h3l2-2h6l2 2h3v10H4V8zm8 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  },
  {
    id: 'cherry',
    name: 'Cherry',
    category: 'retro',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3c2 3 5 4 8 4-1 6-4 10-8 10S5 17 4 11c3 0 6-1 8-4z' },
      { d: 'M12 3v6' },
    ],
  },
  {
    id: 'lightning',
    name: 'Lightning',
    category: 'retro',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'retro',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M12 21s-7-4.6-7-10a4 4 0 017-2.7A4 4 0 0119 11c0 5.4-7 10-7 10z',
  },
  // Letters (popular initials)
  ...['A', 'B', 'C', 'D', 'E', 'J', 'K', 'L', 'M', 'R', 'S', 'T'].map((letter) => ({
    id: `letter-${letter.toLowerCase()}`,
    name: `Letter ${letter}`,
    category: 'letters',
    price: 2.25,
    iconType: 'letter',
    letter,
  })),
  // Food & fun
  {
    id: 'rainbow',
    name: 'Rainbow',
    category: 'food',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M4 16c2-6 6-9 8-9s6 3 8 9M6 18c1.5-4 4-6 6-6s4.5 2 6 6M8 20c1-2 2.5-3 4-3s3 1 4 3',
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    category: 'food',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M12 22v-6M8 16h8M6 10c0-3 2.5-6 6-6s6 3 6 6c0 2-2 3.5-4 4H10c-2-.5-4-2-4-4z',
  },
  {
    id: 'ice-cream',
    name: 'Ice Cream',
    category: 'food',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M8 10l4 12 4-12M8 10h8M9 6a3 3 0 016 0v4H9V6z',
  },
  // Spiritual / symbolic
  {
    id: 'evil-eye',
    name: 'Evil Eye',
    category: 'spiritual',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 5C7 8 4 12 4 12s3 4 8 7 8-7 8-7-3-4-8-7z' },
      { d: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
      { d: 'M12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
    ],
  },
  {
    id: 'hamsa',
    name: 'Hamsa',
    category: 'spiritual',
    price: 2.25,
    iconType: 'path',
    viewBox: '0 0 24 24',
    path: 'M12 2l2 3h3v4l2 3-2 3v5a4 4 0 01-8 0v-5l-2-3 2-3V5h3l2-3zm0 8v4',
  },
]

export const MAX_BRACELET_CHARMS = 18

export function getCharmById(id) {
  return charms.find((c) => c.id === id)
}

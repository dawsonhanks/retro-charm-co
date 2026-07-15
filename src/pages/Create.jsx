import { lazy, Suspense, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { getCharmById, isFillerCharm } from '../data/charms'
import { CharmSearchInput } from '../components/CharmSearchInput'
import { filterCharmList } from '../utils/charmFilters'
import {
  addCharmToLinkOrder,
  getCharmsFromLinkOrder,
  loadInitialLinkOrder,
} from '../utils/braceletLinks'

const CharmBuilder = lazy(() =>
  import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder }))
)

const SILVER_CHARMS = [
  // Plain filler
  { id: 's-plain-filler', category: 'Charms', name: 'Plain Filler', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/plain-silver-link.webp' },

  // Starter Bracelets
  { id: 's-silver-base', category: 'Starter Bracelets', name: 'Silver Base', price: 10, metal: 'silver', stock: 20, image: '/images/starter-bracelets/silver-base.webp' },
  { id: 's-silver-apple-watch', category: 'Starter Bracelets', name: 'Silver Apple Watch', price: 18, metal: 'silver', stock: 20, image: '/images/starter-bracelets/silver-apple-watch.webp' },

  // Letter Charms
  { id: 's-letter-a', category: 'Charms', name: 'Letter A', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-a-silver.webp' },
  { id: 's-letter-c', category: 'Charms', name: 'Letter C', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-c-silver.webp' },
  { id: 's-letter-e', category: 'Charms', name: 'Letter E', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-e-silver.webp' },
  { id: 's-letter-h', category: 'Charms', name: 'Letter H', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-h-silver.webp' },
  { id: 's-letter-j', category: 'Charms', name: 'Letter J', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-j-silver.webp' },
  { id: 's-letter-k', category: 'Charms', name: 'Letter K', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-k-silver.webp' },
  { id: 's-letter-l', category: 'Charms', name: 'Letter L', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-l-silver.webp' },
  { id: 's-letter-m', category: 'Charms', name: 'Letter M', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-m-silver.webp' },
  { id: 's-letter-n', category: 'Charms', name: 'Letter N', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-n-silver.webp' },
  { id: 's-letter-p', category: 'Charms', name: 'Letter P', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-p-silver.webp' },
  { id: 's-letter-r', category: 'Charms', name: 'Letter R', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-r-silver.webp' },
  { id: 's-letter-d', category: 'Charms', name: 'Letter D', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-d-silver.webp' },
  { id: 's-letter-s', category: 'Charms', name: 'Letter S', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-s-silver.webp' },
  { id: 's-letter-t', category: 'Charms', name: 'Letter T', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-t-silver.webp' },

  // Charms
  { id: 's-labubu', category: 'Charms', name: 'Labubu', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/animals-characters/labubu-silver.webp' },
  { id: 's-paw-print-blue', category: 'Charms', name: 'Paw Print - Blue', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/animals-characters/paw-print-blue-silver.webp' },
  { id: 's-dangle-red-ruby', category: 'Dangle Charms', name: 'Dangle - Red/Ruby', price: 4.95, metal: 'silver', stock: 20, image: '/images/charms/birthstone-dangles/dangle-red-ruby-silver.webp' },
  { id: 's-heart-dangle-silver-2', category: 'Dangle Charms', name: 'Heart Dangle - Silver (2)', price: 4.95, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/heart-dangle-silver-2-silver.webp' },
  { id: 's-pearl-dangle', category: 'Dangle Charms', name: 'Pearl Dangle', price: 4.95, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/pearl-dangle-silver.webp' },
  { id: 's-cherry-dangle', category: 'Dangle Charms', name: 'Cherry Dangle', price: 4.95, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/cherry-dangle-silver.webp' },
  { id: 's-star-dangle-silver', category: 'Dangle Charms', name: 'Star Dangle - Silver', price: 4.95, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/star-dangle-silver-silver.webp' },
  { id: 's-strawberry-dangle-2', category: 'Dangle Charms', name: 'Strawberry Dangle (2)', price: 4.95, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/strawberry-dangle-2-silver.webp' },
  { id: 's-cross-black', category: 'Charms', name: 'Cross - Black', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/faith/cross-black-silver.webp' },
  { id: 's-fish-symbol', category: 'Charms', name: 'Fish Symbol', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/faith/fish-symbol-silver.webp' },
  { id: 's-lv-logo', category: 'Charms', name: 'LV Logo', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/fashion/lv-logo-silver.webp' },
  { id: 's-flower-pink', category: 'Charms', name: 'Flower - Pink', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/flowers/flower-pink-silver.webp' },
  { id: 's-flower-turquoise', category: 'Charms', name: 'Flower - Turquoise', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/flowers/flower-turquoise-silver.webp' },
  { id: 's-flower-yellow', category: 'Charms', name: 'Flower - Yellow', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/flowers/flower-yellow-silver.webp' },
  { id: 's-rose', category: 'Charms', name: 'Rose', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/flowers/rose-silver.webp' },
  { id: 's-cherries', category: 'Charms', name: 'Cherries', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/food-drink/cherries-silver.webp' },
  { id: 's-turquoise-stone', category: 'Charms', name: 'Turquoise Stone', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/gemstones/turquoise-stone-silver.webp' },
  { id: 's-double-heart-red-pink', category: 'Charms', name: 'Double Heart - Red/Pink', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/hearts/double-heart-red-pink-silver.webp' },
  { id: 's-heart-red', category: 'Charms', name: 'Heart - Red', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/hearts/heart-red-silver.webp' },
  { id: 's-star-black', category: 'Charms', name: 'Star - Black', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/stars/star-black-silver.webp' },
  { id: 's-star-gold', category: 'Charms', name: 'Star - Gold', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/stars/star-gold-silver.webp' },
  { id: 's-star-green', category: 'Charms', name: 'Star - Green', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/stars/star-green-silver.webp' },
  { id: 's-plain-star', category: 'Charms', name: 'Plain Silver Star', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/stars/plain-star-silver.webp' },
  { id: 's-basketball', category: 'Charms', name: 'Basketball', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/basketball-silver.webp' },
  { id: 's-eight-ball', category: 'Charms', name: 'Eight Ball', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/eight-ball-silver.webp' },
  { id: 's-checkered-blue-white', category: 'Charms', name: 'Checkered - Blue/White', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/checkered-blue-white-silver.webp' },
  { id: 's-checkered-pink', category: 'Charms', name: 'Checkered - Pink', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/checkered-pink-silver.webp' },
  { id: 's-checkered-flag-silver', category: 'Charms', name: 'Checkered Flag - Silver', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/checkered-flag-silver-silver.webp' },
  { id: 's-pickleball-paddle', category: 'Charms', name: 'Pickleball Paddle', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/pickleball-paddle-silver.webp' },
  { id: 's-rolling-stones-tongue', category: 'Charms', name: 'Rolling Stones Tongue', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/rolling-stones-tongue-silver.webp' },
  { id: 's-smiley-face', category: 'Charms', name: 'Smiley Face', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/smiley-face-silver.webp' },
  { id: 's-smiley-face-yellow', category: 'Charms', name: 'Smiley Face Yellow', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/smiley-face-yellow-silver.webp' },
  { id: 's-soccer-ball', category: 'Charms', name: 'Soccer Ball', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/soccer-ball-silver.webp' },
  { id: 's-american-flag', category: 'Charms', name: 'American Flag', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/travel-places/american-flag-silver.webp' },
  { id: 's-montana', category: 'Charms', name: 'Montana', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/travel-places/montana-silver.webp' },
  { id: 's-palm-tree-sunset', category: 'Charms', name: 'Palm Tree Sunset', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/travel-places/palm-tree-sunset-silver.webp' },
  { id: 's-mom', category: 'Charms', name: 'MOM', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/words-phrases/mom-silver.webp' },
  { id: 's-treat-people-with-kindness', category: 'Charms', name: 'Treat People With Kindness', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/words-phrases/treat-people-with-kindness-silver.webp' },
  { id: 's-yeet-or-be-yeeted', category: 'Charms', name: 'Yeet or be Yeeted', price: 3.95, metal: 'silver', stock: 20, image: '/images/charms/words-phrases/yeet-or-be-yeeted-silver.webp' },
]

const GOLD_CHARMS = [
  // Plain filler
  { id: 'g-plain-filler', category: 'Charms', name: 'Plain Filler', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/plain-gold-link.webp' },

  // Starter Bracelets
  { id: 'g-gold-base', category: 'Starter Bracelets', name: 'Gold Base', price: 12, metal: 'gold', stock: 20, image: '/images/starter-bracelets/gold-base.webp' },
  { id: 'g-gold-apple-watch', category: 'Starter Bracelets', name: 'Gold Apple Watch', price: 20, metal: 'gold', stock: 20, image: '/images/starter-bracelets/gold-apple-watch.webp' },

  // Charms
  { id: 'g-fish-dangle-green-white', category: 'Dangle Charms', name: 'Fish Dangle - Green/White', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/animals-characters/fish-dangle-green-white-gold.webp' },
  { id: 'g-pearl-gold', category: 'Charms', name: 'Pearl - Gold', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/animals-characters/pearl-gold-gold.webp' },
  { id: 'g-dangle-blue-teal', category: 'Dangle Charms', name: 'Dangle - Blue/Teal', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-blue-teal-gold.webp' },
  { id: 'g-dangle-clear', category: 'Dangle Charms', name: 'Dangle - Clear', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-clear-gold.webp' },
  { id: 'g-dangle-garnet', category: 'Dangle Charms', name: 'Dangle - Garnet', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-garnet-gold.webp' },
  { id: 'g-dangle-green', category: 'Dangle Charms', name: 'Dangle - Green', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-green-gold.webp' },
  { id: 'g-dangle-pink-magenta', category: 'Dangle Charms', name: 'Dangle - Pink/Magenta', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-pink-magenta-gold.webp' },
  { id: 'g-bow-red-with-pearl', category: 'Charms', name: 'Bow - Red with Pearl', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/bows/bow-red-with-pearl-gold.webp' },
  { id: 'g-cherries-dangle', category: 'Dangle Charms', name: 'Cherries Dangle', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/cherries-dangle-gold.webp' },
  { id: 'g-fish-dangle-teal-white-2', category: 'Dangle Charms', name: 'Fish Dangle - Teal/White (2)', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/fish-dangle-teal-white-2-gold.webp' },
  { id: 'g-heart-coin-dangle-silver-sunburst', category: 'Dangle Charms', name: 'Heart Coin Dangle - Silver Sunburst', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/heart-coin-dangle-silver-sunburst-gold.webp' },
  { id: 'g-sapphire-dangle', category: 'Dangle Charms', name: 'Sapphire Dangle', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/sapphire-dangle-gold.webp' },
  { id: 'g-pearl-dangle', category: 'Dangle Charms', name: 'Pearl Dangle', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/pearl-dangle-gold.webp' },
  { id: 'g-heart-dangle-gold', category: 'Dangle Charms', name: 'Heart Dangle - Gold', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/heart-dangle-gold-gold.webp' },
  { id: 'g-heart-dangle-silver', category: 'Dangle Charms', name: 'Heart Dangle - Silver', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/heart-dangle-silver-gold.webp' },
  { id: 'g-star-dangle-gold', category: 'Dangle Charms', name: 'Star Dangle - Gold', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/star-dangle-gold-gold.webp' },
  { id: 'g-strawberry-dangle', category: 'Dangle Charms', name: 'Strawberry Dangle', price: 4.95, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/strawberry-dangle-gold.webp' },
  { id: 'g-cross-black', category: 'Charms', name: 'Cross - Black', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/faith/cross-black-gold.webp' },
  { id: 'g-wwjd', category: 'Charms', name: 'WWJD', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/faith/wwjd-gold.webp' },
  { id: 'g-flower-pink', category: 'Charms', name: 'Flower - Pink', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/flowers/flower-pink-gold.webp' },
  { id: 'g-flower-turquoise', category: 'Charms', name: 'Flower - Turquoise', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/flowers/flower-turquoise-gold.webp' },
  { id: 'g-tulip-flower', category: 'Charms', name: 'Tulip Flower', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/flowers/tulip-flower-gold.webp' },
  { id: 'g-cherries-pink-background', category: 'Charms', name: 'Cherries - Pink Background', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/food-drink/cherries-pink-background-gold.webp' },
  { id: 'g-cherry-heart-checkered', category: 'Charms', name: 'Cherry Heart Checkered', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/food-drink/cherry-heart-checkered-gold.webp' },
  { id: 'g-diet-coke-can', category: 'Charms', name: 'Diet Coke Can', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/food-drink/diet-coke-can-gold.webp' },
  { id: 'g-strawberry', category: 'Charms', name: 'Strawberry', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/food-drink/strawberry-gold.webp' },
  { id: 'g-watermelon', category: 'Charms', name: 'Watermelon', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/food-drink/watermelon-gold.webp' },
  { id: 'g-charm-red-rectangle', category: 'Charms', name: 'Charm - Red Rectangle', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/gemstones/charm-red-rectangle-gold.webp' },
  { id: 'g-turquoise-stone', category: 'Charms', name: 'Turquoise Stone', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/gemstones/turquoise-stone-gold.webp' },
  { id: 'g-heart-red', category: 'Charms', name: 'Heart - Red', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/hearts/heart-red-gold.webp' },
  { id: 'g-heart-red-and-gold', category: 'Charms', name: 'Heart - Red and Gold', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/hearts/heart-red-and-gold-gold.webp' },
  { id: 'g-raised-heart', category: 'Charms', name: 'Raised Gold Heart', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/hearts/raised-heart-gold.webp' },
  { id: 'g-black-star', category: 'Charms', name: 'Black Star', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/stars/black-star-gold.webp' },
  { id: 'g-star-red-layered', category: 'Charms', name: 'Star - Red Layered', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/stars/star-red-layered-gold.webp' },
  { id: 'g-sewing-machine', category: 'Charms', name: 'Sewing Machine', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/sewing-machine-gold.webp' },
  { id: 'g-checkered-flag-gold', category: 'Charms', name: 'Checkered Flag - Gold', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/checkered-flag-gold-gold.webp' },
  { id: 'g-dice', category: 'Charms', name: 'Dice', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/dice-gold.webp' },
  { id: 'g-music-note', category: 'Charms', name: 'Music Note', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/music-note-gold.webp' },
  { id: 'g-american-flag', category: 'Charms', name: 'American Flag', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/travel-places/american-flag-gold.webp' },
  { id: 'g-italian-flag', category: 'Charms', name: 'Italian Flag', price: 3.95, metal: 'gold', stock: 20, image: '/images/charms/travel-places/italian-flag-gold.webp' },
]

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'Starter Bracelets', label: 'Starter Bracelets' },
  { id: 'Charms', label: 'Charms' },
  { id: 'Dangle Charms', label: 'Dangle Charms' },
]

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

function getLetterFromName(name) {
  const match = name.match(/Letter\s+([A-Za-z])/i)
  return match?.[1]?.toUpperCase() ?? null
}

function getCharmEmoji(charm) {
  const name = charm.name.toLowerCase()

  if (charm.category === 'Letter Charms') {
    const letter = getLetterFromName(charm.name)
    return letter ? ` ${letter} ` : '✨'
  }

  if (charm.category === 'Starter Bracelets') {
    if (name.includes('apple watch') || name.includes('watch')) return '⌚️'
    if (name.includes('base')) return '🔗'
    return '🔗'
  }

  if (name.includes('heart')) return '❤️'
  if (name.includes('love')) return '💞'
  if (name.includes('cherries')) return '🍒'
  if (name.includes('flower')) return '🌸'
  if (name.includes('palm')) return '🌴'
  if (name.includes('paw')) return '🐾'
  if (name.includes('star')) return '⭐'
  if (name.includes('smiley')) return '😊'
  if (name.includes('racing') || name.includes('flag')) return '🏁'
  if (name.includes('pickleball')) return '🏓'
  if (name.includes('eight ball')) return '🎱'
  if (name.includes('basketball')) return '🏀'
  if (name.includes('soccer')) return '⚽'
  if (name.includes('usa')) return '🇺🇸'
  if (name.includes('montana')) return '🗻'
  if (name.includes('rolling stones')) return '👅'
  if (name.includes('lv')) return '🎰'
  if (name.includes('monster')) return '👹'
  if (name.includes('mom')) return '👩'
  if (name.includes('rose')) return '🌹'
  if (name.includes('music note') || name.includes('music')) return '🎵'
  if (name.includes('cross')) return '✝️'
  if (name.includes('wwjd')) return '✝️'
  if (name.includes('yeet')) return '🚀'

  return '✨'
}

function MetalBadge({ metal }) {
  if (metal === 'gold') {
    return (
      <span className="inline-flex rounded-full border border-jscolors-gold/50 bg-jscolors-cream px-3 py-1 text-xs font-semibold text-jscolors-ink">
        Gold
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
      Silver
    </span>
  )
}

function PlainFillerGraphic({ metal, className = 'h-24 w-24' }) {
  const isGold = metal === 'gold'
  const stroke = isGold ? '#d4af37' : '#b8bcc6'

  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-2xl border-2 border-jscolors-gold/40 ${
        isGold ? 'bg-gradient-to-br from-amber-50 to-amber-200' : 'bg-gradient-to-br from-slate-100 to-slate-300'
      } ${className}`}
    >
      <svg className="h-12 w-6" viewBox="0 0 20 40" fill="none" aria-hidden>
        <rect x="3" y="10" width="14" height="20" rx="3" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.65)" />
        <line x1="10" y1="14" x2="10" y2="26" stroke={stroke} strokeWidth="1.5" opacity="0.5" />
      </svg>
    </div>
  )
}

function CharmPlaceholder({ charm }) {
  if (charm.image) {
    return (
      <img
        src={charm.image}
        alt={charm.name}
        className="h-24 w-24 rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80 object-contain"
      />
    )
  }

  if (charm.id === 's-plain-filler' || charm.id === 'g-plain-filler') {
    return <PlainFillerGraphic metal={charm.metal} />
  }

  if (charm.category === 'Letter Charms') {
    const letter = getLetterFromName(charm.name)
    return (
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80">
        <span className="font-display text-3xl font-bold text-jscolors-ink">{letter ?? '✨'}</span>
      </div>
    )
  }

  const emoji = getCharmEmoji(charm)
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80">
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-16">
      <img
        src="/images/brand/retro-charm-icon-mark.png"
        alt=""
        width={56}
        height={44}
        className="h-12 w-auto animate-pulse object-contain opacity-90"
        aria-label="Loading"
      />
    </div>
  )
}

export default function Create() {
  const { addItem } = useCart()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [addedIds, setAddedIds] = useState(() => new Set())
  const [braceletAddedIds, setBraceletAddedIds] = useState(() => new Set())
  const [linkOrder, setLinkOrder] = useState(loadInitialLinkOrder)
  const [selectedSize, setSelectedSize] = useState(null)

  const braceletCharmCount = useMemo(() => getCharmsFromLinkOrder(linkOrder).length, [linkOrder])
  const braceletFull = selectedSize != null && braceletCharmCount >= selectedSize
  const braceletUnavailable = selectedSize == null

  function handleAddToBracelet(catalogCharm) {
    const charm = getCharmById(catalogCharm.id)
    if (!charm || charm.category === 'Starter Bracelets' || isFillerCharm(charm) || braceletFull || braceletUnavailable) return
    setLinkOrder((prev) => addCharmToLinkOrder(prev, charm))
    setBraceletAddedIds((prev) => new Set(prev).add(catalogCharm.id))
    setTimeout(() => {
      setBraceletAddedIds((prev) => {
        const next = new Set(prev)
        next.delete(catalogCharm.id)
        return next
      })
    }, 1200)
  }

  function handleAddToCart(charm) {
    if (isFillerCharm(charm)) return
    addItem({
      id: charm.id,
      name: charm.name,
      price: charm.price,
      metal: charm.metal,
      image: charm.image,
      quantity: 1,
    })
    setAddedIds((prev) => new Set(prev).add(charm.id))
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev)
        next.delete(charm.id)
        return next
      })
    }, 1200)
  }

  const inventory = useMemo(() => {
    const sPlain = SILVER_CHARMS.find((c) => c.id === 's-plain-filler')
    const gPlain = GOLD_CHARMS.find((c) => c.id === 'g-plain-filler')
    const restSilver = SILVER_CHARMS.filter((c) => c.id !== 's-plain-filler')
    const restGold = GOLD_CHARMS.filter((c) => c.id !== 'g-plain-filler')
    return [sPlain, gPlain, ...restSilver, ...restGold].filter(Boolean)
  }, [])

  const filtered = useMemo(
    () => filterCharmList(inventory, { filter, query: searchQuery }),
    [filter, inventory, searchQuery],
  )

  return (
    <>
      <Helmet>
        <title>Charm Studio | RetroCharm Co</title>
        <meta
          name="description"
          content="Browse every charm we carry, build your bracelet online, and order your custom stack."
        />
      </Helmet>

      <header className="relative overflow-hidden border-b border-jscolors-gold/20 bg-gradient-to-b from-jscolors-blue to-jscolors-cta px-4 py-14 text-center text-jscolors-cream md:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-jscolors-pink/30 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-jscolors-gold/25 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold">Charm Studio</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-jscolors-cream md:text-5xl">Build Your Bracelet</h1>
          <p className="mx-auto mt-4 max-w-2xl text-jscolors-cream/80">
            Browse every charm we carry, snap your favorites into the builder below, and order exactly what you want.
          </p>
        </div>
      </header>

      <Suspense fallback={<PageLoader />}>
        <div className="border-t-2 border-jscolors-gold/20 bg-jscolors-navy/5 py-16">
          <CharmBuilder
            className="px-4"
            idPrefix="gallery-builder"
            instructionLabel={selectedSize == null ? 'Choose your base and size to start building' : undefined}
            linkOrder={linkOrder}
            onLinkOrderChange={setLinkOrder}
            selectedSize={selectedSize}
            onSelectedSizeChange={setSelectedSize}
          />
        </div>
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-label="Charm filters">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-jscolors-ink/80">
            <span className="font-semibold text-jscolors-ink">{filtered.length}</span> showing
          </div>
          <div className="hidden text-sm text-jscolors-ink/70 sm:block">{/* spacer for balance */}</div>
        </div>

        <div className="mx-auto mt-4 max-w-xl">
          <CharmSearchInput
            id="catalog-charm-search"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="mt-4" role="tablist" aria-label="Filter charm catalog">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTERS.map((f) => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.id)}
                  className={[
                    'flex-shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition',
                    active
                      ? 'border-jscolors-gold bg-white text-jscolors-ink shadow-sm'
                      : 'border-jscolors-gold/30 bg-jscolors-cream text-jscolors-ink/90 hover:bg-white/70',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-label="Charm catalog">
        {filtered.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-jscolors-gold/40 bg-white/60 p-8 text-center">
            <p className="font-display text-xl font-semibold text-jscolors-ink">No charms match that filter</p>
            <p className="mt-2 text-sm text-jscolors-ink/80">
              Try a different metal or category — fresh favorites are always rolling in.
            </p>
          </div>
        ) : (
          <div className="grid auto-rows-fr grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((charm) => (
                <motion.div
                  key={charm.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="min-w-0"
                >
                  <article className="retro-card retro-card-hover flex h-full flex-col p-5">
                    <MetalBadge metal={charm.metal} />

                    <div className="mt-4 flex flex-1 flex-col items-center text-center">
                      <CharmPlaceholder charm={charm} />
                      <h3 className="mt-4 line-clamp-2 font-display text-lg font-semibold text-jscolors-ink">
                        {charm.name}
                      </h3>
        <p className="mt-2 font-semibold text-jscolors-blue">{formatPrice(charm.price)}</p>
                      <p className="mt-2 text-sm font-medium text-jscolors-ink/70">{charm.category}</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToBracelet(charm)}
                        disabled={
                          isFillerCharm(charm) ||
                          braceletUnavailable ||
                          braceletFull ||
                          braceletAddedIds.has(charm.id)
                        }
                        title={
                          isFillerCharm(charm)
                            ? 'Blank fillers auto-fill empty bracelet slots'
                            : braceletUnavailable
                              ? 'Choose a bracelet size in the builder first'
                              : braceletFull
                                ? `Bracelet is full (${selectedSize} charms)`
                                : undefined
                        }
                        className={[
                          'w-full rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition',
                          braceletAddedIds.has(charm.id)
                            ? 'cursor-default border-emerald-300 bg-emerald-50 text-emerald-700'
                            : isFillerCharm(charm) || braceletUnavailable || braceletFull
                              ? 'cursor-not-allowed border-jscolors-gold/25 bg-jscolors-cream/60 text-jscolors-ink/45'
                              : 'border-jscolors-pink bg-white text-jscolors-ink hover:bg-jscolors-pink/10',
                        ].join(' ')}
                      >
                        {isFillerCharm(charm)
                          ? 'Auto-fills empty slots'
                          : braceletAddedIds.has(charm.id)
                            ? 'On Bracelet ✓'
                            : braceletUnavailable
                              ? 'Choose size first'
                              : braceletFull
                                ? `Bracelet full (${selectedSize})`
                                : 'Add to Bracelet'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(charm)}
                        disabled={isFillerCharm(charm) || addedIds.has(charm.id)}
                        title={isFillerCharm(charm) ? 'Blank fillers are included with your bracelet base' : undefined}
                        className={[
                          'w-full rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition',
                          addedIds.has(charm.id)
                            ? 'cursor-default border-emerald-300 bg-emerald-50 text-emerald-700'
                            : isFillerCharm(charm)
                              ? 'cursor-not-allowed border-jscolors-gold/25 bg-jscolors-cream/60 text-jscolors-ink/45'
                              : 'border-jscolors-cta bg-jscolors-cta text-jscolors-cream hover:border-jscolors-cta-hover hover:bg-jscolors-cta-hover',
                        ].join(' ')}
                      >
                        {isFillerCharm(charm)
                          ? 'Included with base'
                          : addedIds.has(charm.id)
                            ? 'Added ✓'
                            : 'Add to Cart'}
                      </button>
                    </div>
                  </article>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </>
  )
}

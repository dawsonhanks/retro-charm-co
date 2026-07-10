import { lazy, Suspense, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'

const CharmBuilder = lazy(() =>
  import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder }))
)

const SILVER_CHARMS = [
  // Starter Bracelets

  // Letter Charms
  { id: 's-letter-a', category: 'Letter Charms', name: 'Letter A', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-a-silver.webp' },
  { id: 's-letter-c', category: 'Letter Charms', name: 'Letter C', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-c-silver.webp' },
  { id: 's-letter-e', category: 'Letter Charms', name: 'Letter E', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-e-silver.webp' },
  { id: 's-letter-h', category: 'Letter Charms', name: 'Letter H', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-h-silver.webp' },
  { id: 's-letter-j', category: 'Letter Charms', name: 'Letter J', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-j-silver.webp' },
  { id: 's-letter-k', category: 'Letter Charms', name: 'Letter K', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-k-silver.webp' },
  { id: 's-letter-l', category: 'Letter Charms', name: 'Letter L', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-l-silver.webp' },
  { id: 's-letter-m', category: 'Letter Charms', name: 'Letter M', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-m-silver.webp' },
  { id: 's-letter-n', category: 'Letter Charms', name: 'Letter N', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-n-silver.webp' },
  { id: 's-letter-p', category: 'Letter Charms', name: 'Letter P', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-p-silver.webp' },
  { id: 's-letter-r', category: 'Letter Charms', name: 'Letter R', price: 4, metal: 'silver', stock: 20, image: '/images/charms/letter-charms/letter-r-silver.webp' },

  // Charms
  { id: 's-labubu', category: 'Charms', name: 'Labubu', price: 4, metal: 'silver', stock: 20, image: '/images/charms/animals-characters/labubu-silver.webp' },
  { id: 's-paw-print-blue', category: 'Charms', name: 'Paw Print - Blue', price: 4, metal: 'silver', stock: 20, image: '/images/charms/animals-characters/paw-print-blue-silver.webp' },
  { id: 's-dangle-red-ruby', category: 'Charms', name: 'Dangle - Red/Ruby', price: 4, metal: 'silver', stock: 20, image: '/images/charms/birthstone-dangles/dangle-red-ruby-silver.webp' },
  { id: 's-heart-coin-dangle-antique-bronze', category: 'Charms', name: 'Heart Coin Dangle - Antique Bronze', price: 4, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/heart-coin-dangle-antique-bronze-silver.webp' },
  { id: 's-heart-dangle-silver-2', category: 'Charms', name: 'Heart Dangle - Silver (2)', price: 4, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/heart-dangle-silver-2-silver.webp' },
  { id: 's-pearl-dangle', category: 'Charms', name: 'Pearl Dangle', price: 4, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/pearl-dangle-silver.webp' },
  { id: 's-star-dangle-silver', category: 'Charms', name: 'Star Dangle - Silver', price: 4, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/star-dangle-silver-silver.webp' },
  { id: 's-strawberry-dangle-2', category: 'Charms', name: 'Strawberry Dangle (2)', price: 4, metal: 'silver', stock: 20, image: '/images/charms/dangle-charms/strawberry-dangle-2-silver.webp' },
  { id: 's-cross-black', category: 'Charms', name: 'Cross - Black', price: 4, metal: 'silver', stock: 20, image: '/images/charms/faith/cross-black-silver.webp' },
  { id: 's-fish-symbol', category: 'Charms', name: 'Fish Symbol', price: 4, metal: 'silver', stock: 20, image: '/images/charms/faith/fish-symbol-silver.webp' },
  { id: 's-lv-logo', category: 'Charms', name: 'LV Logo', price: 4, metal: 'silver', stock: 20, image: '/images/charms/fashion/lv-logo-silver.webp' },
  { id: 's-flower-pink', category: 'Charms', name: 'Flower - Pink', price: 4, metal: 'silver', stock: 20, image: '/images/charms/flowers/flower-pink-silver.webp' },
  { id: 's-flower-turquoise', category: 'Charms', name: 'Flower - Turquoise', price: 4, metal: 'silver', stock: 20, image: '/images/charms/flowers/flower-turquoise-silver.webp' },
  { id: 's-flower-yellow', category: 'Charms', name: 'Flower - Yellow', price: 4, metal: 'silver', stock: 20, image: '/images/charms/flowers/flower-yellow-silver.webp' },
  { id: 's-cherries', category: 'Charms', name: 'Cherries', price: 4, metal: 'silver', stock: 20, image: '/images/charms/food-drink/cherries-silver.webp' },
  { id: 's-turquoise-stone', category: 'Charms', name: 'Turquoise Stone', price: 4, metal: 'silver', stock: 20, image: '/images/charms/gemstones/turquoise-stone-silver.webp' },
  { id: 's-double-heart-red-pink', category: 'Charms', name: 'Double Heart - Red/Pink', price: 4, metal: 'silver', stock: 20, image: '/images/charms/hearts/double-heart-red-pink-silver.webp' },
  { id: 's-heart-red', category: 'Charms', name: 'Heart - Red', price: 4, metal: 'silver', stock: 20, image: '/images/charms/hearts/heart-red-silver.webp' },
  { id: 's-star-black', category: 'Charms', name: 'Star - Black', price: 4, metal: 'silver', stock: 20, image: '/images/charms/stars/star-black-silver.webp' },
  { id: 's-star-gold', category: 'Charms', name: 'Star - Gold', price: 4, metal: 'silver', stock: 20, image: '/images/charms/stars/star-gold-silver.webp' },
  { id: 's-star-green', category: 'Charms', name: 'Star - Green', price: 4, metal: 'silver', stock: 20, image: '/images/charms/stars/star-green-silver.webp' },
  { id: 's-basketball', category: 'Charms', name: 'Basketball', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/basketball-silver.webp' },
  { id: 's-checkered-blue-white', category: 'Charms', name: 'Checkered - Blue/White', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/checkered-blue-white-silver.webp' },
  { id: 's-checkered-pink', category: 'Charms', name: 'Checkered - Pink', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/checkered-pink-silver.webp' },
  { id: 's-checkered-flag-silver', category: 'Charms', name: 'Checkered Flag - Silver', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/checkered-flag-silver-silver.webp' },
  { id: 's-pickleball-paddle', category: 'Charms', name: 'Pickleball Paddle', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/pickleball-paddle-silver.webp' },
  { id: 's-rolling-stones-tongue', category: 'Charms', name: 'Rolling Stones Tongue', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/rolling-stones-tongue-silver.webp' },
  { id: 's-smiley-face', category: 'Charms', name: 'Smiley Face', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/smiley-face-silver.webp' },
  { id: 's-smiley-face-yellow', category: 'Charms', name: 'Smiley Face Yellow', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/smiley-face-yellow-silver.webp' },
  { id: 's-soccer-ball', category: 'Charms', name: 'Soccer Ball', price: 4, metal: 'silver', stock: 20, image: '/images/charms/symbols-sports/soccer-ball-silver.webp' },
  { id: 's-palm-tree-sunset', category: 'Charms', name: 'Palm Tree Sunset', price: 4, metal: 'silver', stock: 20, image: '/images/charms/travel-places/palm-tree-sunset-silver.webp' },
  { id: 's-mom', category: 'Charms', name: 'MOM', price: 4, metal: 'silver', stock: 20, image: '/images/charms/words-phrases/mom-silver.webp' },
  { id: 's-treat-people-with-kindness', category: 'Charms', name: 'Treat People With Kindness', price: 4, metal: 'silver', stock: 20, image: '/images/charms/words-phrases/treat-people-with-kindness-silver.webp' },
]

const GOLD_CHARMS = [
  // Starter Bracelets

  // Charms
  { id: 'g-fish-dangle-green-white', category: 'Charms', name: 'Fish Dangle - Green/White', price: 4, metal: 'gold', stock: 20, image: '/images/charms/animals-characters/fish-dangle-green-white-gold.webp' },
  { id: 'g-pearl-gold', category: 'Charms', name: 'Pearl - Gold', price: 4, metal: 'gold', stock: 20, image: '/images/charms/animals-characters/pearl-gold-gold.webp' },
  { id: 'g-dangle-blue-teal', category: 'Charms', name: 'Dangle - Blue/Teal', price: 4, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-blue-teal-gold.webp' },
  { id: 'g-dangle-clear', category: 'Charms', name: 'Dangle - Clear', price: 4, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-clear-gold.webp' },
  { id: 'g-dangle-garnet', category: 'Charms', name: 'Dangle - Garnet', price: 4, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-garnet-gold.webp' },
  { id: 'g-dangle-green', category: 'Charms', name: 'Dangle - Green', price: 4, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-green-gold.webp' },
  { id: 'g-dangle-pink-magenta', category: 'Charms', name: 'Dangle - Pink/Magenta', price: 4, metal: 'gold', stock: 20, image: '/images/charms/birthstone-dangles/dangle-pink-magenta-gold.webp' },
  { id: 'g-bow-red-with-pearl', category: 'Charms', name: 'Bow - Red with Pearl', price: 4, metal: 'gold', stock: 20, image: '/images/charms/bows/bow-red-with-pearl-gold.webp' },
  { id: 'g-cherries-dangle', category: 'Charms', name: 'Cherries Dangle', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/cherries-dangle-gold.webp' },
  { id: 'g-fish-dangle-teal-white-2', category: 'Charms', name: 'Fish Dangle - Teal/White (2)', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/fish-dangle-teal-white-2-gold.webp' },
  { id: 'g-heart-coin-dangle-silver-sunburst', category: 'Charms', name: 'Heart Coin Dangle - Silver Sunburst', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/heart-coin-dangle-silver-sunburst-gold.webp' },
  { id: 'g-heart-dangle-gold', category: 'Charms', name: 'Heart Dangle - Gold', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/heart-dangle-gold-gold.webp' },
  { id: 'g-heart-dangle-silver', category: 'Charms', name: 'Heart Dangle - Silver', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/heart-dangle-silver-gold.webp' },
  { id: 'g-star-dangle-gold', category: 'Charms', name: 'Star Dangle - Gold', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/star-dangle-gold-gold.webp' },
  { id: 'g-strawberry-dangle', category: 'Charms', name: 'Strawberry Dangle', price: 4, metal: 'gold', stock: 20, image: '/images/charms/dangle-charms/strawberry-dangle-gold.webp' },
  { id: 'g-cross-black', category: 'Charms', name: 'Cross - Black', price: 4, metal: 'gold', stock: 20, image: '/images/charms/faith/cross-black-gold.webp' },
  { id: 'g-wwjd', category: 'Charms', name: 'WWJD', price: 4, metal: 'gold', stock: 20, image: '/images/charms/faith/wwjd-gold.webp' },
  { id: 'g-flower-pink', category: 'Charms', name: 'Flower - Pink', price: 4, metal: 'gold', stock: 20, image: '/images/charms/flowers/flower-pink-gold.webp' },
  { id: 'g-flower-turquoise', category: 'Charms', name: 'Flower - Turquoise', price: 4, metal: 'gold', stock: 20, image: '/images/charms/flowers/flower-turquoise-gold.webp' },
  { id: 'g-tulip-flower', category: 'Charms', name: 'Tulip Flower', price: 4, metal: 'gold', stock: 20, image: '/images/charms/flowers/tulip-flower-gold.webp' },
  { id: 'g-cherries-pink-background', category: 'Charms', name: 'Cherries - Pink Background', price: 4, metal: 'gold', stock: 20, image: '/images/charms/food-drink/cherries-pink-background-gold.webp' },
  { id: 'g-cherry-heart-checkered', category: 'Charms', name: 'Cherry Heart Checkered', price: 4, metal: 'gold', stock: 20, image: '/images/charms/food-drink/cherry-heart-checkered-gold.webp' },
  { id: 'g-diet-coke-can', category: 'Charms', name: 'Diet Coke Can', price: 4, metal: 'gold', stock: 20, image: '/images/charms/food-drink/diet-coke-can-gold.webp' },
  { id: 'g-strawberry', category: 'Charms', name: 'Strawberry', price: 4, metal: 'gold', stock: 20, image: '/images/charms/food-drink/strawberry-gold.webp' },
  { id: 'g-watermelon', category: 'Charms', name: 'Watermelon', price: 4, metal: 'gold', stock: 20, image: '/images/charms/food-drink/watermelon-gold.webp' },
  { id: 'g-charm-red-rectangle', category: 'Charms', name: 'Charm - Red Rectangle', price: 4, metal: 'gold', stock: 20, image: '/images/charms/gemstones/charm-red-rectangle-gold.webp' },
  { id: 'g-heart-red', category: 'Charms', name: 'Heart - Red', price: 4, metal: 'gold', stock: 20, image: '/images/charms/hearts/heart-red-gold.webp' },
  { id: 'g-heart-red-and-gold', category: 'Charms', name: 'Heart - Red and Gold', price: 4, metal: 'gold', stock: 20, image: '/images/charms/hearts/heart-red-and-gold-gold.webp' },
  { id: 'g-star-red-layered', category: 'Charms', name: 'Star - Red Layered', price: 4, metal: 'gold', stock: 20, image: '/images/charms/stars/star-red-layered-gold.webp' },
  { id: 'g-checkered-flag-gold', category: 'Charms', name: 'Checkered Flag - Gold', price: 4, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/checkered-flag-gold-gold.webp' },
  { id: 'g-dice', category: 'Charms', name: 'Dice', price: 4, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/dice-gold.webp' },
  { id: 'g-music-note', category: 'Charms', name: 'Music Note', price: 4, metal: 'gold', stock: 20, image: '/images/charms/symbols-sports/music-note-gold.webp' },
  { id: 'g-american-flag', category: 'Charms', name: 'American Flag', price: 4, metal: 'gold', stock: 20, image: '/images/charms/travel-places/american-flag-gold.webp' },
  { id: 'g-italian-flag', category: 'Charms', name: 'Italian Flag', price: 4, metal: 'gold', stock: 20, image: '/images/charms/travel-places/italian-flag-gold.webp' },
  { id: 'g-montana-state-charm', category: 'Charms', name: 'Montana State Charm', price: 4, metal: 'gold', stock: 20, image: '/images/charms/travel-places/montana-state-charm-gold.webp' },
]

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'Starter Bracelets', label: 'Starter Bracelets' },
  { id: 'Letter Charms', label: 'Letter Charms' },
  { id: 'Charms', label: 'Charms' },
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
    if (name.includes('star')) return '⭐'
    if (name.includes('fish')) return '🐟'
    if (name.includes('smile')) return '😊'
    if (name.includes('shiny')) return '✨'
    if (name.includes('grey')) return '🩶'
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
      <span className="inline-flex rounded-full border border-[#d9b97c]/60 bg-[#f2e4c8] px-3 py-1 text-xs font-semibold text-[#6b4e28]">
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

  if (charm.category === 'Letter Charms') {
    const letter = getLetterFromName(charm.name)
    return (
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80">
        <span className="font-display text-3xl font-bold text-jscolors-navy">{letter ?? '✨'}</span>
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
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-jscolors-gold border-t-jscolors-pink" aria-label="Loading" />
    </div>
  )
}

export default function Create() {
  const { addItem } = useCart()
  const [filter, setFilter] = useState('all')
  const [addedIds, setAddedIds] = useState(() => new Set())

  function handleAddToCart(charm) {
    addItem({ id: charm.id, name: charm.name, price: charm.price, metal: charm.metal, quantity: 1 })
    setAddedIds((prev) => new Set(prev).add(charm.id))
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev)
        next.delete(charm.id)
        return next
      })
    }, 1200)
  }

  const inventory = useMemo(() => [...SILVER_CHARMS, ...GOLD_CHARMS], [])

  const filtered = useMemo(() => {
    if (filter === 'all') return inventory
    if (filter === 'silver') return inventory.filter((c) => c.metal === 'silver')
    if (filter === 'gold') return inventory.filter((c) => c.metal === 'gold')
    return inventory.filter((c) => c.category === filter)
  }, [filter, inventory])

  return (
    <>
      <Helmet>
        <title>Charm Studio | RetroCharm Co</title>
        <meta
          name="description"
          content="Browse every charm we carry, build your bracelet online, and order your custom stack."
        />
      </Helmet>

      <header className="relative overflow-hidden border-b border-jscolors-gold/20 bg-gradient-to-b from-jscolors-navy to-jscolors-charcoal px-4 py-14 text-center text-jscolors-cream md:py-20">
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
            instructionLabel="Tap to add · drag to rearrange · 18 links to start"
          />
        </div>
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-label="Charm filters">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-jscolors-charcoal/80">
            <span className="font-semibold text-jscolors-navy">{filtered.length}</span> showing
          </div>
          <div className="hidden text-sm text-jscolors-charcoal/70 sm:block">{/* spacer for balance */}</div>
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
                      ? 'border-jscolors-gold bg-white text-jscolors-navy shadow-sm'
                      : 'border-jscolors-gold/30 bg-jscolors-cream text-jscolors-navy/90 hover:bg-white/70',
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
            <p className="font-display text-xl font-semibold text-jscolors-navy">No charms match that filter</p>
            <p className="mt-2 text-sm text-jscolors-charcoal/80">
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
                      <h3 className="mt-4 line-clamp-2 font-display text-lg font-semibold text-jscolors-navy">
                        {charm.name}
                      </h3>
                      <p className="mt-2 font-semibold text-jscolors-charcoal">{formatPrice(charm.price)}</p>
                      <p className="mt-2 text-sm font-medium text-jscolors-charcoal/70">{charm.category}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(charm)}
                      disabled={addedIds.has(charm.id)}
                      className={[
                        'mt-4 w-full rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition',
                        addedIds.has(charm.id)
                          ? 'cursor-default border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-jscolors-gold bg-jscolors-navy text-jscolors-cream hover:bg-jscolors-navy/90',
                      ].join(' ')}
                    >
                      {addedIds.has(charm.id) ? 'Added ✓' : 'Add to Cart'}
                    </button>
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

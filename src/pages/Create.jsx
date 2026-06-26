import { lazy, Suspense, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'

const CharmBuilder = lazy(() =>
  import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder }))
)

const SILVER_CHARMS = [
  // Starter Bracelets
  { id: 's-grey', category: 'Starter Bracelets', name: 'Grey Starter Bracelet', price: 10, metal: 'silver', stock: 40 },
  { id: 's-star', category: 'Starter Bracelets', name: 'Star Starter Bracelet', price: 10, metal: 'silver', stock: 20 },
  { id: 's-fish', category: 'Starter Bracelets', name: 'Fish Starter Bracelet', price: 10, metal: 'silver', stock: 20 },
  { id: 's-smile', category: 'Starter Bracelets', name: 'Smile Starter Bracelet', price: 10, metal: 'silver', stock: 20 },

  // Letter Charms
  { id: 's-la', category: 'Letter Charms', name: 'Letter A', price: 4, metal: 'silver', stock: 20 },
  { id: 's-lc', category: 'Letter Charms', name: 'Letter C', price: 4, metal: 'silver', stock: 20 },
  { id: 's-ld', category: 'Letter Charms', name: 'Letter D', price: 4, metal: 'silver', stock: 10 },
  { id: 's-le', category: 'Letter Charms', name: 'Letter E', price: 4, metal: 'silver', stock: 10 },
  { id: 's-lh', category: 'Letter Charms', name: 'Letter H', price: 4, metal: 'silver', stock: 10 },
  { id: 's-lj', category: 'Letter Charms', name: 'Letter J', price: 4, metal: 'silver', stock: 20 },
  { id: 's-lk', category: 'Letter Charms', name: 'Letter K', price: 4, metal: 'silver', stock: 20 },
  { id: 's-ll', category: 'Letter Charms', name: 'Letter L', price: 4, metal: 'silver', stock: 20 },
  { id: 's-lm', category: 'Letter Charms', name: 'Letter M', price: 4, metal: 'silver', stock: 20 },
  { id: 's-ln', category: 'Letter Charms', name: 'Letter N', price: 4, metal: 'silver', stock: 10 },
  { id: 's-lp', category: 'Letter Charms', name: 'Letter P', price: 4, metal: 'silver', stock: 10 },
  { id: 's-lr', category: 'Letter Charms', name: 'Letter R', price: 4, metal: 'silver', stock: 10 },
  { id: 's-ls', category: 'Letter Charms', name: 'Letter S', price: 4, metal: 'silver', stock: 20 },
  { id: 's-lt', category: 'Letter Charms', name: 'Letter T', price: 4, metal: 'silver', stock: 10 },

  // Charms
  { id: 's-redheart', category: 'Charms', name: 'Red Heart', price: 4, metal: 'silver', stock: 20 },
  { id: 's-rphearts', category: 'Charms', name: 'Red & Pink Hearts', price: 4, metal: 'silver', stock: 20 },
  { id: 's-iloveyou', category: 'Charms', name: 'I Love You Heart', price: 4, metal: 'silver', stock: 10 },
  { id: 's-yellowflower', category: 'Charms', name: 'Yellow Flower', price: 4, metal: 'silver', stock: 20 },
  { id: 's-pinkflower', category: 'Charms', name: 'Pink Flower', price: 4, metal: 'silver', stock: 20 },
  { id: 's-blueflower', category: 'Charms', name: 'Blue Flower', price: 4, metal: 'silver', stock: 20 },
  { id: 's-palmtree', category: 'Charms', name: 'Sunset Palm Tree', price: 4, metal: 'silver', stock: 20 },
  { id: 's-pawprint', category: 'Charms', name: 'Blue Paw Print', price: 4, metal: 'silver', stock: 20 },
  { id: 's-cherries', category: 'Charms', name: 'Red Cherries', price: 4, metal: 'silver', stock: 20 },
  { id: 's-greenstar', category: 'Charms', name: 'Green Star', price: 4, metal: 'silver', stock: 20 },
  { id: 's-smiley', category: 'Charms', name: 'Yellow Smiley Face', price: 4, metal: 'silver', stock: 20 },
  { id: 's-raceflag', category: 'Charms', name: 'Checker Racing Flag', price: 4, metal: 'silver', stock: 20 },
  { id: 's-pickleball', category: 'Charms', name: 'Pickleball Paddle', price: 4, metal: 'silver', stock: 20 },
  { id: 's-8ball', category: 'Charms', name: 'Eight Ball', price: 4, metal: 'silver', stock: 20 },
  { id: 's-basketball', category: 'Charms', name: 'Basketball', price: 4, metal: 'silver', stock: 20 },
  { id: 's-soccer', category: 'Charms', name: 'Soccer Ball', price: 4, metal: 'silver', stock: 20 },
  { id: 's-usa', category: 'Charms', name: 'USA Flag', price: 4, metal: 'silver', stock: 20 },
  { id: 's-montana', category: 'Charms', name: 'Montana Flag', price: 4, metal: 'silver', stock: 10 },
  { id: 's-rollingstones', category: 'Charms', name: 'Rolling Stones Tongue', price: 4, metal: 'silver', stock: 10 },
  { id: 's-lv', category: 'Charms', name: 'LV Logo', price: 4, metal: 'silver', stock: 10 },
  { id: 's-monster', category: 'Charms', name: 'Monster (Assorted)', price: 4, metal: 'silver', stock: 10 },
  { id: 's-flowerred', category: 'Charms', name: 'Flower on Red', price: 4, metal: 'silver', stock: 10 },
  { id: 's-momred', category: 'Charms', name: 'Mom on Red', price: 4, metal: 'silver', stock: 10 },
  { id: 's-whiterose', category: 'Charms', name: 'White Rose on Red', price: 4, metal: 'silver', stock: 10 },
  { id: 's-redheartgold', category: 'Charms', name: 'Red Heart on Gold', price: 4, metal: 'silver', stock: 10 },
  { id: 's-yeet', category: 'Charms', name: 'Yeet or be Yeeted', price: 4, metal: 'silver', stock: 10 },
]

const GOLD_CHARMS = [
  // Starter Bracelets
  { id: 'g-shiny', category: 'Starter Bracelets', name: 'Gold Shiny Starter Bracelet', price: 12, metal: 'gold', stock: 22 },

  // Charms
  { id: 'g-redfilled', category: 'Charms', name: 'Red Filled Heart', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-raisedgold', category: 'Charms', name: 'Raised Gold Heart', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-pinkflower', category: 'Charms', name: 'Pink Rounded Flower', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-blueflower', category: 'Charms', name: 'Blue Flower', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-musicnote', category: 'Charms', name: 'Black Music Note', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-blackstar', category: 'Charms', name: 'Black Star', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-blackcross', category: 'Charms', name: 'Black Cross', price: 4, metal: 'gold', stock: 20 },
  { id: 'g-bluestarburst', category: 'Charms', name: 'Blue Star Burst', price: 4, metal: 'gold', stock: 10 },
  { id: 'g-pinkcherries', category: 'Charms', name: 'Pink Cherries', price: 4, metal: 'gold', stock: 10 },
  { id: 'g-raceflag', category: 'Charms', name: 'Racing Checkered Flag', price: 4, metal: 'gold', stock: 10 },
  { id: 'g-wwjd', category: 'Charms', name: 'WWJD', price: 4, metal: 'gold', stock: 10 },
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
      <span className="inline-flex rounded-full border border-[#D4A017]/50 bg-[#D4A017] px-3 py-1 text-xs font-semibold text-[#2a1d05]">
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
        <title>Charm Studio | Retro Charm Co 2.0</title>
        <meta
          name="description"
          content="Browse every charm we carry and build your bracelet before you visit us at the Orem Sunset Farmers Market."
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
            Browse every charm we carry, snap your favorites into the builder below, and walk into market night knowing
            exactly what you want.
          </p>
        </div>
      </header>

      <Suspense fallback={<PageLoader />}>
        <div className="border-t-2 border-jscolors-gold/20 bg-jscolors-navy/5 py-16">
          <CharmBuilder className="px-4" idPrefix="gallery-builder" />
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
                    <div className="flex items-start justify-between gap-3">
                      <MetalBadge metal={charm.metal} />
                      <span
                        className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-jscolors-navy/90"
                        title="Current inventory at the booth"
                      >
                        {charm.stock} in stock
                      </span>
                    </div>

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

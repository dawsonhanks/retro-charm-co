import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageMeta } from '../components/PageMeta'
import { FilterBar } from '../components/FilterBar'
import { BestSellers } from '../components/BestSellers'
import { SparkleRow } from '../components/RetroAccents'
import { BASE_OPTIONS, isWatchBase } from '../data/charms'
import {
  CHARM_BROWSE_FILTERS,
  BEST_SELLER_CHARM_IDS,
  getBrowsableCharms,
  getCharmBrowseThemes,
  formatCharmSubtitle,
} from '../data/charmBrowse'
import { buildWebPageJsonLd } from '../data/structuredData'
import { BAG_CHARMS, BAG_CHARM_PRICE } from '../data/bagCharms'
import { KEYCHAINS, KEYCHAIN_PRICE_FROM } from '../data/keychains'
import { TOOLS, TOOL_PRICE_FROM } from '../data/tools'
import { WATCHES, WATCH_PRICE_FROM } from '../data/watches'
import { useCart } from '../context/CartContext.jsx'
import { useInventory } from '../hooks/useInventory'
import { isCharmVerifiedOutOfStock } from '../utils/inventory'

const META = {
  path: '/shop',
  title: 'Shop the Collection | RetroCharm Co',
  description:
    'Browse the full RetroCharm Co collection — bracelet bases, Italian charms, dangles, charm watches, beaded bag charms, charm keychains, and builder tools. Build a bracelet in the Charm Studio or find us at the market.',
}

// Bracelet bases only — watch bands get their own (coming soon) section below.
const BRACELET_BASES = BASE_OPTIONS.filter((b) => !isWatchBase(b.id))

// Reuse the site-wide browse taxonomy, minus the personalized "Favorites" tab.
const SHOP_FILTERS = CHARM_BROWSE_FILTERS.filter((f) => f.id !== 'favorites')

// Catalog charms + dangles (no filler links, no starter bases).
const CATALOG_CHARMS = getBrowsableCharms({ includeStarters: false })

const CHARM_PRICE_FROM = Math.min(...CATALOG_CHARMS.map((c) => c.price))
const BASE_PRICE_FROM = Math.min(...BRACELET_BASES.map((b) => b.price))

/**
 * Filter catalog charms for the active browse tab.
 * Mirrors the Charm Studio browse tabs so the two views stay consistent.
 */
function filterCharms(charms, filterId) {
  if (filterId === 'all') return charms
  if (filterId === 'best-sellers') return charms.filter((c) => BEST_SELLER_CHARM_IDS.has(c.id))
  if (filterId === 'silver') return charms.filter((c) => c.metal === 'silver')
  if (filterId === 'gold') return charms.filter((c) => c.metal === 'gold')
  return charms.filter((c) => getCharmBrowseThemes(c).includes(filterId))
}

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div className="text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jscolors-gold-warm">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="mt-2 font-display text-3xl font-bold text-jscolors-ink md:text-4xl">
        {title}
      </h2>
      {description ? <p className="mx-auto mt-3 max-w-xl text-jscolors-ink/75">{description}</p> : null}
    </div>
  )
}

/**
 * Adds a single standalone shop item (base, charm, bag charm, keychain, tool)
 * to the cart. Cart dedupes by id and checkout runs through Square like the bundles.
 */
function AddToCartButton({ item }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      metal: item.metal,
      quantity: 1,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-live="polite"
      className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-full bg-jscolors-cta px-4 py-2 text-xs font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold sm:text-sm"
    >
      {added ? 'Added ✓' : 'Add to Cart'}
    </button>
  )
}

function BaseCard({ base, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.3), type: 'spring', stiffness: 320, damping: 28 }}
      className="retro-card retro-card-hover flex h-full flex-col overflow-hidden"
    >
      <div className="flex aspect-square items-center justify-center bg-jscolors-cream/70 p-5">
        <img
          src={base.image}
          alt={base.label}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 border-t border-jscolors-gold/25 px-4 py-4 text-center">
        <h3 className="font-display text-lg font-semibold text-jscolors-ink">{base.label}</h3>
        <p className="font-semibold text-jscolors-blue">${base.price}</p>
        <span className="mt-1 rounded-full bg-jscolors-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-jscolors-ink/80">
          {base.metal === 'gold' ? 'Gold-tone' : 'Silver-tone'}
        </span>
        <AddToCartButton item={{ id: base.id, name: base.label, price: base.price, metal: base.metal, image: base.image }} />
      </div>
    </motion.article>
  )
}

function CharmCard({ charm, index, outOfStock = false }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.03, 0.3), type: 'spring', stiffness: 340, damping: 30 }}
      className="retro-card retro-card-hover flex h-full flex-col overflow-hidden"
    >
      <div className="relative flex aspect-square items-center justify-center bg-jscolors-cream/70 p-4">
        {BEST_SELLER_CHARM_IDS.has(charm.id) && !outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-jscolors-pink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Best seller
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-jscolors-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Out of Stock
          </span>
        )}
        <img
          src={charm.image}
          alt={charm.name}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-contain ${outOfStock ? 'opacity-40 grayscale' : ''}`}
        />
      </div>
      <div className="flex flex-1 flex-col items-center gap-0.5 border-t border-jscolors-gold/25 px-3 py-3 text-center">
        <h3 className="font-display text-sm font-semibold leading-snug text-jscolors-ink">{charm.name}</h3>
        <p className="text-[11px] font-medium uppercase tracking-wide text-jscolors-ink/60">
          {formatCharmSubtitle(charm)}
        </p>
        <p className="mt-0.5 font-semibold text-jscolors-blue">${charm.price.toFixed(2)}</p>
        {outOfStock ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-jscolors-ink/15 bg-jscolors-ink/5 px-4 py-2 text-xs font-semibold text-jscolors-ink/50 sm:text-sm"
          >
            Out of Stock
          </button>
        ) : (
          <AddToCartButton item={charm} />
        )}
      </div>
    </motion.article>
  )
}

function BagCharmCard({ item, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.05, 0.3), type: 'spring', stiffness: 320, damping: 28 }}
      className="retro-card retro-card-hover flex h-full flex-col overflow-hidden"
    >
      <div className="relative flex aspect-square items-center justify-center bg-jscolors-cream/70 p-4">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <span className="rounded-full bg-jscolors-pink/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-jscolors-pink">
              Photo soon
            </span>
            <p className="text-xs text-jscolors-ink/55">New style — image landing shortly</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-0.5 border-t border-jscolors-gold/25 px-3 py-3 text-center">
        <h3 className="font-display text-sm font-semibold leading-snug text-jscolors-ink">{item.name}</h3>
        <p className="text-[11px] font-medium uppercase tracking-wide text-jscolors-ink/60">Beaded</p>
        <p className="mt-0.5 font-semibold text-jscolors-blue">${item.price.toFixed(2)}</p>
        {item.image ? <AddToCartButton item={item} /> : null}
      </div>
    </motion.article>
  )
}

function KeychainCard({ item, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.3), type: 'spring', stiffness: 320, damping: 28 }}
      className="retro-card retro-card-hover flex h-full flex-col overflow-hidden"
    >
      <div className="flex aspect-square items-center justify-center bg-jscolors-cream/70 p-5">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 border-t border-jscolors-gold/25 px-4 py-4 text-center">
        <h3 className="font-display text-lg font-semibold text-jscolors-ink">{item.name}</h3>
        <p className="font-semibold text-jscolors-blue">${item.price.toFixed(2)}</p>
        <span className="mt-1 rounded-full bg-jscolors-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-jscolors-ink/80">
          {item.metal === 'gold' ? 'Gold-tone' : 'Silver-tone'}
        </span>
        <AddToCartButton item={item} />
      </div>
    </motion.article>
  )
}

function ToolCard({ item, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.3), type: 'spring', stiffness: 320, damping: 28 }}
      className="retro-card retro-card-hover flex h-full flex-col overflow-hidden"
    >
      <div className="relative flex aspect-square items-center justify-center bg-jscolors-cream/70 p-5">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <span className="rounded-full bg-jscolors-pink/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-jscolors-pink">
              Photo soon
            </span>
            <p className="text-xs text-jscolors-ink/55">Image landing shortly</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-0.5 border-t border-jscolors-gold/25 px-4 py-4 text-center">
        <h3 className="font-display text-lg font-semibold text-jscolors-ink">{item.name}</h3>
        {item.subtitle ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-jscolors-ink/60">{item.subtitle}</p>
        ) : null}
        <p className="mt-0.5 font-semibold text-jscolors-blue">${item.price.toFixed(2)}</p>
        {item.image ? <AddToCartButton item={item} /> : null}
      </div>
    </motion.article>
  )
}

function WatchCard({ item, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.3), type: 'spring', stiffness: 320, damping: 28 }}
      className="retro-card retro-card-hover flex h-full flex-col overflow-hidden"
    >
      <div className="flex aspect-square items-center justify-center bg-jscolors-cream/70 p-5">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 border-t border-jscolors-gold/25 px-4 py-4 text-center">
        <h3 className="font-display text-lg font-semibold text-jscolors-ink">{item.name}</h3>
        <p className="font-semibold text-jscolors-blue">${item.price.toFixed(2)}</p>
        <span className="mt-1 rounded-full bg-jscolors-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-jscolors-ink/80">
          {item.metal === 'gold' ? 'Gold-tone' : 'Silver-tone'}
        </span>
        <AddToCartButton item={item} />
      </div>
    </motion.article>
  )
}

export default function Shop() {
  const [activeFilter, setActiveFilter] = useState('all')
  const inventory = useInventory()
  const inventoryStatus = inventory.verified ? inventory.status : 'unavailable'

  const visibleCharms = useMemo(
    () => filterCharms(CATALOG_CHARMS, activeFilter),
    [activeFilter],
  )

  return (
    <>
      <PageMeta
        title={META.title}
        description={META.description}
        path={META.path}
        jsonLd={buildWebPageJsonLd({ title: META.title, description: META.description, path: META.path })}
      />

      {/* Hero */}
      <header className="border-b border-jscolors-gold/25 bg-jscolors-blue px-4 py-14 text-center text-jscolors-cream md:py-20">
        <SparkleRow className="mx-auto opacity-90" />
        <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl">Shop the Collection</h1>
        <p className="mx-auto mt-4 max-w-2xl text-jscolors-cream/85">
          Browse everything we make — bracelet bases, Italian charms and dangles, charm watches, beaded bag charms, charm keychains, and builder tools.
          See something you love? Build it in the Charm Studio or come find us at the market.
        </p>
        <nav aria-label="Jump to section" className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {[
            { href: '#best-sellers', label: 'Prebuilt' },
            { href: '#bases', label: 'Bases' },
            { href: '#charms', label: 'Charms' },
            { href: '#watches', label: 'Watches' },
            { href: '#bag-charms', label: 'Bag Charms' },
            { href: '#keychains', label: 'Keychains' },
            { href: '#tools', label: 'Tools' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 items-center rounded-full border-2 border-jscolors-cream/50 px-5 py-2 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cream/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Prebuilt / ready-made bracelets — reuses the homepage bundles component
          (live pricing, stock, and Add to Cart → Square checkout). */}
      <BestSellers />

      {/* Bases */}
      <section id="bases" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:py-16" aria-labelledby="shop-bases-heading">
        <SectionHeading
          eyebrow="Bracelets"
          title="Bases"
          description={`Every bracelet starts with a stainless steel base, from $${BASE_PRICE_FROM}. Pick your metal, then load it up with charms.`}
          id="shop-bases-heading"
        />
        <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-4 sm:gap-6">
          {BRACELET_BASES.map((base, i) => (
            <BaseCard key={base.id} base={base} index={i} />
          ))}
        </div>
      </section>

      {/* Charms (with category filters) */}
      <section
        id="charms"
        className="scroll-mt-24 border-y border-jscolors-gold/25 bg-jscolors-cream/70 px-4 py-14 md:py-16"
        aria-labelledby="shop-charms-heading"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Charms & dangles"
            title="Charms"
            description={`Charms from $${CHARM_PRICE_FROM.toFixed(2)} — add as many as you like. Filter by category to find your favorites.`}
            id="shop-charms-heading"
          />

          <div className="mt-8">
            <FilterBar
              active={activeFilter}
              onChange={setActiveFilter}
              filters={SHOP_FILTERS}
              layoutId="shop-filter-pill"
            />
          </div>

          <p className="mt-4 text-center text-sm text-jscolors-ink/60" aria-live="polite">
            {visibleCharms.length} {visibleCharms.length === 1 ? 'charm' : 'charms'}
          </p>

          {visibleCharms.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {visibleCharms.map((charm, i) => (
                <CharmCard
                  key={charm.id}
                  charm={charm}
                  index={i}
                  outOfStock={isCharmVerifiedOutOfStock(charm.name, charm.metal, inventory.map, { status: inventoryStatus })}
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-jscolors-ink/70">
              No charms in this category yet — check back soon or browse another category.
            </p>
          )}
        </div>
      </section>

      {/* Watches */}
      <section
        id="watches"
        className="scroll-mt-24 border-t border-jscolors-gold/25 bg-jscolors-cream/70 px-4 py-14 md:py-16"
        aria-labelledby="shop-watches-heading"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="For your wrist"
            title="Watches"
            description={`Quartz charm watches on a stainless steel Italian charm band, from $${WATCH_PRICE_FROM.toFixed(2)}.`}
            id="shop-watches-heading"
          />
          <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-4 sm:gap-6">
            {WATCHES.map((item, i) => (
              <WatchCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Bag charms */}
      <section
        id="bag-charms"
        className="scroll-mt-24 border-t border-jscolors-gold/25 bg-jscolors-cream/70 px-4 py-14 md:py-16"
        aria-labelledby="shop-bag-heading"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Beyond the bracelet"
            title="Bag Charms"
            description={`Pre-made beaded bag charms — $${BAG_CHARM_PRICE.toFixed(2)} each. Clip one on your bag, keys, or lanyard.`}
            id="shop-bag-heading"
          />
          <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {BAG_CHARMS.map((item, i) => (
              <BagCharmCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Keychains */}
      <section
        id="keychains"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:py-16"
        aria-labelledby="shop-keychain-heading"
      >
        <SectionHeading
          eyebrow="Take them with you"
          title="Keychains"
          description={`Stainless steel charm keychains from $${KEYCHAIN_PRICE_FROM.toFixed(2)} — clip one to your keys or bag and build it up just like a bracelet.`}
          id="shop-keychain-heading"
        />
        <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {KEYCHAINS.map((item, i) => (
            <KeychainCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* Tools */}
      <section
        id="tools"
        className="scroll-mt-24 border-t border-jscolors-gold/25 bg-jscolors-cream/70 px-4 py-14 md:py-16"
        aria-labelledby="shop-tools-heading"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Helpful extras"
            title="Tools"
            description={`Handy extras for building your bracelet, from $${TOOL_PRICE_FROM.toFixed(2)}.`}
            id="shop-tools-heading"
          />
          <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {TOOLS.map((item, i) => (
              <ToolCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 py-16" aria-labelledby="shop-cta-heading">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-jscolors-gold/30 bg-jscolors-blue px-6 py-12 text-center text-jscolors-cream shadow-[var(--shadow-retro-card)] md:px-10">
          <h2 id="shop-cta-heading" className="font-display text-2xl font-bold md:text-3xl">
            Ready to build your own?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-jscolors-cream/85">
            Design a bracelet in the Charm Studio and check out securely with Square — flat $6 shipping on every order.
          </p>
          <Link
            to="/create"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-jscolors-gold/55 bg-jscolors-cta px-8 py-2.5 text-sm font-semibold text-jscolors-cream shadow-lg shadow-jscolors-cta/20 transition hover:bg-jscolors-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold sm:text-base"
          >
            Open the Charm Studio
          </Link>
        </div>
      </section>
    </>
  )
}

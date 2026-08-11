import { lazy, Suspense, useMemo, useState } from 'react'
import { PageMeta } from '../components/PageMeta'
import { useCart } from '../context/CartContext.jsx'
import { CHARM_CATEGORY_FILTERS, charms, getCharmById, isFillerCharm } from '../data/charms'
import { formatCharmSubtitle, formatMetalLabel } from '../data/charmBrowse'
import { CharmSearchInput } from '../components/CharmSearchInput'
import { FilterBar } from '../components/FilterBar'
import { StockVisibilityToggle } from '../components/StockVisibilityToggle'
import { InventoryStatusBanner } from '../components/InventoryStatusBanner'
import { filterCharmList } from '../utils/charmFilters'
import { useCharmFavorites } from '../utils/favorites'
import { useInventory } from '../hooks/useInventory'
import {
  getCharmStockState,
  getStockStateLabel,
  isCharmOutOfStock,
  isCharmVerifiedOutOfStock,
} from '../utils/inventory'
import {
  addCharmToLinkOrder,
  loadInitialLinkOrder,
  loadInitialSelectedSize,
} from '../utils/braceletLinks'
import { buildWebPageJsonLd } from '../data/structuredData'

const CharmBuilder = lazy(() =>
  import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder })),
)

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
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

function CharmImage({ charm }) {
  if (!charm.image) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80 text-sm font-semibold text-jscolors-ink/60">
        {formatMetalLabel(charm.metal)}
      </div>
    )
  }

  return (
    <img
      src={charm.image}
      alt={`${charm.name} — ${formatMetalLabel(charm.metal)}`}
      className="h-24 w-24 rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80 object-contain"
      loading="lazy"
      decoding="async"
    />
  )
}

function PageLoader() {
  return (
    <div className="mx-auto min-h-[420px] max-w-6xl px-4 py-14" role="status" aria-live="polite">
      <div className="text-center">
        <img
          src="/images/brand/retro-charm-icon-mark.webp"
          alt=""
          width={56}
          height={44}
          className="mx-auto h-11 w-auto animate-pulse object-contain opacity-90"
        />
        <p className="mt-4 font-display text-xl font-semibold text-jscolors-ink">Getting your bracelet builder ready…</p>
        <p className="mt-1 text-sm text-jscolors-ink/65">Loading your saved design and current charm availability.</p>
      </div>
      <div className="mt-8 grid animate-pulse gap-4 md:grid-cols-[1.1fr_0.9fr]" aria-hidden>
        <div className="h-56 rounded-3xl border border-jscolors-gold/25 bg-white/60" />
        <div className="space-y-4 rounded-3xl border border-jscolors-gold/25 bg-white/60 p-5">
          <div className="h-5 w-2/3 rounded-full bg-jscolors-gold/20" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-2xl bg-jscolors-gold/15" />
            <div className="h-24 rounded-2xl bg-jscolors-gold/15" />
          </div>
          <div className="h-12 rounded-2xl bg-jscolors-gold/15" />
        </div>
      </div>
    </div>
  )
}

export default function Create() {
  const { addItem } = useCart()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [addedIds, setAddedIds] = useState(() => new Set())
  const [braceletAddedIds, setBraceletAddedIds] = useState(() => new Set())
  const [linkOrder, setLinkOrder] = useState(loadInitialLinkOrder)
  const [selectedSize, setSelectedSize] = useState(loadInitialSelectedSize)
  const { favoriteIds, isFavorite, toggleFavorite } = useCharmFavorites()
  const inventory = useInventory()
  const inventoryMap = inventory.map
  const inventoryStatus = inventory.verified ? inventory.status : 'unavailable'

  const charmCapacity = selectedSize != null ? linkOrder.length : null
  const braceletFull = selectedSize != null && !linkOrder.some((link) => link.type === 'plain')
  const braceletUnavailable = selectedSize == null

  function stockStateForCharm(charm) {
    return getCharmStockState(charm.name, charm.metal, inventoryMap, {
      status: inventoryStatus,
      productId: charm.id,
    })
  }

  function isNonPurchasable(charm) {
    return isCharmOutOfStock(charm.name, charm.metal, inventoryMap, {
      status: inventoryStatus,
      productId: charm.id,
    })
  }

  function handleAddToBracelet(catalogCharm) {
    const charm = getCharmById(catalogCharm.id)
    if (!charm || charm.category === 'Starter Bracelets' || isFillerCharm(charm) || braceletFull || braceletUnavailable) {
      return
    }
    if (isNonPurchasable(catalogCharm)) return
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
    if (isNonPurchasable(charm)) return
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

  const catalog = useMemo(
    () => charms.filter((c) => !isFillerCharm(c)),
    [],
  )

  const filtered = useMemo(() => {
    const isOutOfStock = (charm) =>
      isCharmVerifiedOutOfStock(charm.name, charm.metal, inventoryMap, {
        status: inventoryStatus,
        productId: charm.id,
      })
    const isNonPurchasableForSort = (charm) =>
      isCharmOutOfStock(charm.name, charm.metal, inventoryMap, {
        status: inventoryStatus,
        productId: charm.id,
      })
    return filterCharmList(catalog, {
      filter,
      query: searchQuery,
      hideOutOfStock: !showOutOfStock,
      isOutOfStock,
      isOutOfStockForSort: isNonPurchasableForSort,
      favoriteIds,
    })
  }, [filter, catalog, searchQuery, showOutOfStock, inventoryMap, inventoryStatus, favoriteIds])

  const hasActiveFilters = filter !== 'all' || searchQuery.trim() !== '' || showOutOfStock

  function clearFilters() {
    setFilter('all')
    setSearchQuery('')
    setShowOutOfStock(false)
  }

  return (
    <>
      <PageMeta
        title="Charm Studio | RetroCharm Co"
        description="Browse every charm we carry, build your bracelet online, and order your custom stack."
        path="/create"
        jsonLd={buildWebPageJsonLd({
          title: 'Charm Studio | RetroCharm Co',
          description: 'Browse every charm we carry, build your bracelet online, and order your custom stack.',
          path: '/create',
        })}
      />

      <header className="relative overflow-hidden border-b border-jscolors-gold/20 bg-gradient-to-b from-jscolors-blue to-jscolors-cta px-4 py-14 text-center text-jscolors-cream md:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-jscolors-pink/30 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-jscolors-gold/25 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold">Charm Studio</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-jscolors-cream md:text-5xl">Build Your Bracelet</h1>
          <p className="mx-auto mt-4 max-w-2xl text-jscolors-cream/80">
            Browse every charm we carry, shortlist favorites, snap them into the builder, and order exactly what you want.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-jscolors-ink/80" aria-live="polite">
            <span className="font-semibold text-jscolors-ink">{filtered.length}</span> showing
            {favoriteIds.length > 0 ? ` · ${favoriteIds.length} shortlisted` : ''}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-jscolors-ink underline decoration-jscolors-gold-warm underline-offset-2 transition hover:text-jscolors-pink"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="mx-auto mt-4 max-w-xl">
          <CharmSearchInput
            id="catalog-charm-search"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="mt-4">
          <FilterBar
            active={filter}
            onChange={setFilter}
            filters={CHARM_CATEGORY_FILTERS}
            layoutId="catalog-filter-pill"
          />
        </div>

        <div className="mt-3 flex justify-center">
          <StockVisibilityToggle
            id="catalog-show-oos"
            checked={showOutOfStock}
            onChange={setShowOutOfStock}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-label="Charm catalog">
        {inventory.outageMessage ? (
          <InventoryStatusBanner
            className="mb-6"
            message={inventory.outageMessage}
            onRetry={inventory.retry}
            retrying={inventory.retrying}
          />
        ) : null}
        {filtered.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-jscolors-gold/40 bg-white/60 p-8 text-center">
            <p className="font-display text-xl font-semibold text-jscolors-ink">No charms match that filter</p>
            <p className="mt-2 text-sm text-jscolors-ink/80">
              Try a different search or category
              {!showOutOfStock ? ', or turn on “Show out of stock”' : ''}.
              {filter === 'favorites' ? ' Save charms with the heart to build a shortlist.' : ''}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-full border-2 border-jscolors-gold/50 bg-white px-4 py-2 text-sm font-semibold text-jscolors-ink transition hover:border-jscolors-gold"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid auto-rows-fr grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((charm) => {
              const stockState = stockStateForCharm(charm)
              const stockLabel = getStockStateLabel(stockState)
              const nonPurchasable = stockState !== 'in_stock'
              const favorited = isFavorite(charm.id)
              const braceletDisabled =
                nonPurchasable ||
                isFillerCharm(charm) ||
                braceletUnavailable ||
                braceletFull ||
                braceletAddedIds.has(charm.id)
              const cartDisabled = nonPurchasable || isFillerCharm(charm) || addedIds.has(charm.id)
              const metalLabel = formatMetalLabel(charm.metal)

              return (
                <article
                  key={charm.id}
                  className={[
                    'retro-card relative flex h-full flex-col p-5',
                    nonPurchasable ? 'opacity-60 grayscale' : 'retro-card-hover',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <MetalBadge metal={charm.metal} />
                    <div className="flex items-center gap-2">
                      {stockLabel ? (
                        <span className="rounded bg-jscolors-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {stockLabel}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(charm.id)}
                        className={[
                          'inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm transition',
                          favorited
                            ? 'border-jscolors-pink bg-jscolors-pink text-white'
                            : 'border-jscolors-gold/50 bg-white text-jscolors-ink/70 hover:border-jscolors-pink',
                        ].join(' ')}
                        aria-label={
                          favorited
                            ? `Remove ${charm.name} ${metalLabel} from shortlist`
                            : `Save ${charm.name} ${metalLabel} to shortlist`
                        }
                        aria-pressed={favorited}
                      >
                        {favorited ? '♥' : '♡'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col items-center text-center">
                    <CharmImage charm={charm} />
                    <h3 className="mt-4 line-clamp-2 font-display text-lg font-semibold text-jscolors-ink">
                      {charm.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-jscolors-ink/60">
                      {formatCharmSubtitle(charm)}
                    </p>
                    <p className="mt-2 font-semibold text-jscolors-blue">{formatPrice(charm.price)}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToBracelet(charm)}
                      disabled={braceletDisabled}
                      title={
                        stockLabel
                          ? `${charm.name} — ${stockLabel}`
                          : braceletUnavailable
                            ? 'Choose a bracelet size in the builder first'
                            : braceletFull
                              ? `Bracelet is full (${charmCapacity} charms)`
                              : undefined
                      }
                      className={[
                        'w-full rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition',
                        braceletAddedIds.has(charm.id)
                          ? 'cursor-default border-emerald-300 bg-emerald-50 text-emerald-700'
                          : braceletDisabled
                            ? 'cursor-not-allowed border-jscolors-gold/25 bg-jscolors-cream/60 text-jscolors-ink/45'
                            : 'border-jscolors-pink bg-white text-jscolors-ink hover:bg-jscolors-pink/10',
                      ].join(' ')}
                    >
                      {stockLabel
                        ? stockLabel
                        : braceletAddedIds.has(charm.id)
                          ? 'On Bracelet ✓'
                          : braceletUnavailable
                            ? 'Choose size first'
                            : braceletFull
                              ? `Bracelet full (${charmCapacity})`
                              : 'Add to Bracelet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(charm)}
                      disabled={cartDisabled}
                      title={stockLabel ? `${charm.name} — ${stockLabel}` : undefined}
                      className={[
                        'w-full rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition',
                        addedIds.has(charm.id)
                          ? 'cursor-default border-emerald-300 bg-emerald-50 text-emerald-700'
                          : cartDisabled
                            ? 'cursor-not-allowed border-jscolors-gold/25 bg-jscolors-cream/60 text-jscolors-ink/45'
                            : 'border-jscolors-cta bg-jscolors-cta text-jscolors-cream hover:border-jscolors-cta-hover hover:bg-jscolors-cta-hover',
                      ].join(' ')}
                    >
                      {stockLabel ? stockLabel : addedIds.has(charm.id) ? 'Added ✓' : 'Add to Cart'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

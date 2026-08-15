import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import {
  BEST_SELLER_BUNDLES,
  buildBundleCartPayload,
  formatBundlePrice,
  resolveBundle,
} from '../data/bundles'
import { getInventory, isInventoryAuthoritative, INVENTORY_OUTAGE_MESSAGE } from '../lib/inventory'
import { useInventory } from '../hooks/useInventory'
import { InventoryStatusBanner } from './InventoryStatusBanner'
import { trackBundleAdded, trackBundleViewed, trackCreateBraceletClicked } from '../lib/analytics'

/**
 * Homepage “Shop Best Sellers” ready-made bracelet bundles.
 */
export function BestSellers() {
  const navigate = useNavigate()
  const { addItem, addBraceletBuild } = useCart()
  const inventory = useInventory()
  const [addingId, setAddingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const addLockRef = useRef(false)

  const inventoryStatus = inventory.verified ? inventory.status : 'unavailable'

  const resolvedBundles = useMemo(
    () =>
      BEST_SELLER_BUNDLES.map((bundle) => {
        const resolved = resolveBundle(bundle, inventory.map, { status: inventoryStatus })
        if (inventory.purchasesBlocked) {
          return { ...resolved, available: false }
        }
        return resolved
      }),
    [inventory.map, inventoryStatus, inventory.purchasesBlocked],
  )

  const stockLookupBlocked = inventory.purchasesBlocked

  async function handleAddToCart(bundleId) {
    if (addLockRef.current || addingId) return
    addLockRef.current = true
    setAddingId(bundleId)
    setFeedback(null)

    try {
      const rowsResult = await getInventory()
      if (!isInventoryAuthoritative(rowsResult)) {
        setFeedback({
          type: 'error',
          message: rowsResult.message ?? INVENTORY_OUTAGE_MESSAGE,
        })
        return
      }

      const bundle = BEST_SELLER_BUNDLES.find((entry) => entry.id === bundleId)
      if (!bundle) throw new Error('Bundle not found.')

      const fresh = resolveBundle(bundle, rowsResult.map, { status: rowsResult.status })
      if (!fresh.available) {
        setFeedback({
          type: 'error',
          message: `${bundle.name} is currently unavailable. Customize a similar look in Charm Studio.`,
        })
        return
      }

      const { items, build } = buildBundleCartPayload(fresh)
      for (const item of items) {
        addItem(item)
      }
      addBraceletBuild(build)

      trackBundleAdded({
        bundleId: bundle.id,
        baseColor: fresh.base?.metal ?? null,
        charmCount: fresh.resolvedCharms?.length ?? bundle.charmIds.length,
        cartValue: fresh.price,
        itemCount: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      })

      setFeedback({
        type: 'success',
        message: `${bundle.name} added to cart.`,
      })

      await new Promise((resolve) => setTimeout(resolve, 350))
      navigate('/cart')
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not add this bundle to cart.',
      })
    } finally {
      addLockRef.current = false
      setAddingId(null)
    }
  }

  return (
    <section
      id="best-sellers"
      className="scroll-mt-24 border-y border-jscolors-gold/25 bg-jscolors-cream/80 py-14 md:py-20"
      aria-labelledby="best-sellers-heading"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm">
            Ready-made
          </p>
          <h2 id="best-sellers-heading" className="mt-3 font-display text-3xl font-bold text-jscolors-ink md:text-4xl">
            Shop Best Sellers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-jscolors-ink/75">
            Skip the builder — add a curated bracelet in one tap. Prefer to design your own?{' '}
            <Link
              to="/create"
              className="font-semibold text-jscolors-ink underline decoration-jscolors-gold-warm/70 underline-offset-2 transition hover:text-jscolors-gold-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
              onClick={() => trackCreateBraceletClicked({ source: 'best_sellers' })}
            >
              Open Charm Studio
            </Link>
            .
          </p>
        </div>

        {inventory.outageMessage ? (
          <InventoryStatusBanner
            className="mx-auto mt-6 max-w-xl"
            message={inventory.outageMessage}
            onRetry={inventory.retry}
            retrying={inventory.retrying}
          />
        ) : null}

        <div
          className={`mx-auto mt-6 max-w-xl rounded-xl px-4 py-3 text-center text-sm ${
            feedback
              ? feedback.type === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-900'
              : 'sr-only'
          }`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {feedback?.message ?? ''}
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
          {resolvedBundles.map((resolved) => (
            <li key={resolved.bundle.id}>
              <BundleCard
                resolved={resolved}
                inventoryReady={inventory.verified}
                stockLookupBlocked={stockLookupBlocked}
                adding={addingId === resolved.bundle.id}
                anyAdding={addingId != null}
                onAdd={() => handleAddToCart(resolved.bundle.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function BundleCard({
  resolved,
  inventoryReady,
  stockLookupBlocked,
  adding,
  anyAdding,
  onAdd,
}) {
  const {
    bundle,
    base,
    available,
    resolvedCharms,
    substitutionsApplied,
    unavailableCharms,
    plainLinkCount,
    price,
    priceDeltaFromConfigured,
  } = resolved
  const cardRef = useRef(null)
  const metalLabel = base?.metal === 'gold' ? 'Gold' : 'Silver'
  const stockLabel = !inventoryReady
    ? stockLookupBlocked
      ? 'Availability unavailable'
      : 'Checking stock…'
    : available
      ? 'In stock'
      : 'Sold out'

  useBundleViewTracking(cardRef, bundle.id)

  const busy = adding || anyAdding
  const disabled = !available || !inventoryReady || busy

  return (
    <article
      ref={cardRef}
      className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-jscolors-gold/35 bg-white/90 shadow-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-jscolors-cream">
        <img
          src={bundle.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute left-3 top-3 rounded-full bg-jscolors-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {stockLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold text-jscolors-ink">{bundle.name}</h3>
        <p className="mt-1 text-sm text-jscolors-ink/70">{bundle.description}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-jscolors-ink/55">
          {metalLabel} · {bundle.charmCount} links
          {plainLinkCount > 0 ? ` · ${plainLinkCount} free fillers` : ''}
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-jscolors-blue">{formatBundlePrice(price)}</p>
        {priceDeltaFromConfigured !== 0 && inventoryReady && available ? (
          <p className="mt-1 text-xs text-jscolors-ink/60">
            Live price reflects available charms
            {priceDeltaFromConfigured > 0 ? ' (substitution upgrade)' : ''}.
          </p>
        ) : null}

        {substitutionsApplied.length > 0 && inventoryReady && (
          <p className="mt-3 text-xs leading-relaxed text-jscolors-ink/70">
            Substitutions:{' '}
            {substitutionsApplied.map((s) => `${s.from.name} → ${s.to.name}`).join(', ')}
          </p>
        )}

        {inventoryReady && !available ? (
          <Link
            to="/create"
            className="mt-5 block w-full rounded-full border-2 border-jscolors-cta px-4 py-3 text-center text-sm font-semibold text-jscolors-cta transition hover:bg-jscolors-cta hover:text-jscolors-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
            onClick={() => trackCreateBraceletClicked({ source: `sold_out_bundle_${bundle.id}` })}
          >
            Build a Similar Bracelet
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled}
            className="mt-5 w-full rounded-full bg-jscolors-cta px-4 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? 'Adding…' : !inventoryReady ? 'Checking stock…' : 'Add to Cart'}
          </button>
        )}

        {!available && inventoryReady && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800" role="status">
            {unavailableCharms.length > 0
              ? `Sold out: ${unavailableCharms.map((c) => c.name).join(', ')}. You can still customize a similar look in Charm Studio.`
              : 'This bundle is sold out right now.'}
          </div>
        )}

        {resolvedCharms.length > 0 && inventoryReady && available ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Included charms">
            {resolvedCharms.map((charm) => (
              <li
                key={`${bundle.id}-${charm.id}`}
                className="rounded-full border border-jscolors-gold/30 bg-jscolors-cream/80 px-2 py-0.5 text-[10px] font-medium text-jscolors-ink/80"
              >
                {charm.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}

function useBundleViewTracking(cardRef, bundleId) {
  const seen = useRef(false)
  useEffect(() => {
    const node = cardRef.current
    if (!node || seen.current) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (seen.current) return
          seen.current = true
          trackBundleViewed({ bundleId })
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [cardRef, bundleId])
}

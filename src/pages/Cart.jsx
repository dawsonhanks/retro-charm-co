import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SparkleRow } from '../components/RetroAccents'
import { CartItemThumbnail } from '../components/CartItemThumbnail'
import { BraceletBuildsPreview } from '../components/BraceletBuildsPreview'
import { CartItemQuantityControls, RemoveCartItemButton } from '../components/RemoveCartItemButton'
import { useCart } from '../context/CartContext.jsx'
import { FLAT_RATE_SHIPPING, getCustomerFacingFulfillmentCopy, SHIPPING_LINE_ITEM_NAME } from '../data/shipping'
import { createCheckoutSession } from '../utils/checkoutApi'
import { hashCartItems } from '../utils/idempotency'
import { CustomerProofNearCta } from '../components/CustomerProof'
import { TrustPanel } from '../components/TrustPanel'
import { PolicyLinks } from '../components/PolicyLinks'
import { PageMeta } from '../components/PageMeta'
import { InventoryStatusBanner } from '../components/InventoryStatusBanner'
import { trackCartViewed, trackCheckoutStarted } from '../lib/analytics'
import { getInventory, isInventoryAuthoritative, INVENTORY_OUTAGE_MESSAGE } from '../lib/inventory'
import { validateCartInventory } from '../utils/validateCartInventory'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export default function Cart() {
  const { items, cartTotal, clearCart, removeItem, updateQuantity, braceletBuilds } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [unavailableItems, setUnavailableItems] = useState([])
  // Flat-rate shipping is charged once per order, not per bracelet build.
  const orderTotal = cartTotal + FLAT_RATE_SHIPPING
  const fulfillmentCopy = getCustomerFacingFulfillmentCopy()

  // Capture mount metrics once so cart edits do not re-fire a page-view event.
  const [cartViewMetrics] = useState(() => ({
    itemCount: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    cartValue: cartTotal + FLAT_RATE_SHIPPING,
  }))

  useEffect(() => {
    trackCartViewed(cartViewMetrics)
  }, [cartViewMetrics])

  function handleEmptyCart() {
    if (window.confirm('Empty your cart?')) {
      clearCart()
    }
  }

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    setUnavailableItems([])

    try {
      const inventoryResult = await getInventory()
      if (!isInventoryAuthoritative(inventoryResult)) {
        setError(inventoryResult.message ?? INVENTORY_OUTAGE_MESSAGE)
        setLoading(false)
        return
      }

      const validation = validateCartInventory({
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        braceletBuilds,
        inventoryResult,
      })
      if (!validation.ok) {
        setError(validation.message ?? INVENTORY_OUTAGE_MESSAGE)
        setUnavailableItems(validation.unavailableItems ?? [])
        setLoading(false)
        return
      }

      const data = await createCheckoutSession({
        items: items.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        idempotencyKey: hashCartItems(items),
        braceletBuilds,
      })

      trackCheckoutStarted({
        itemCount: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
        cartValue: orderTotal,
        shipping: FLAT_RATE_SHIPPING,
      })

      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <PageMeta
        title="Cart | RetroCharm Co"
        description="Review your RetroCharm Co cart and checkout securely with Square."
        path="/cart"
        noindex
      />

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <div className="text-center">
          <SparkleRow className="mx-auto" />
          <h1 className="mt-6 font-display text-4xl font-bold text-jscolors-ink md:text-5xl">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 p-10 text-center shadow-lg">
            <p className="text-lg text-jscolors-ink/80">Your cart is empty.</p>
            <Link
              to="/create"
              className="mt-6 inline-block rounded-full bg-jscolors-cta px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover"
            >
              Build a bracelet
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <BraceletBuildsPreview builds={braceletBuilds} />
            <ul className="divide-y divide-jscolors-gold/25 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 shadow-lg">
              {items.map((item) => {
                const blocked = unavailableItems.some((u) => u.id === item.id)
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-5 sm:gap-4 sm:px-6">
                    <CartItemThumbnail item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold text-jscolors-ink">{item.name}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-ink/60">
                        {item.metal}
                      </p>
                      <p className="mt-1 text-sm text-jscolors-blue">{formatPrice(item.price)} each</p>
                      {blocked ? (
                        <p className="mt-2 text-xs font-semibold text-red-700" role="status">
                          {unavailableItems.find((u) => u.id === item.id)?.label ?? 'Unavailable'}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <CartItemQuantityControls
                          itemName={item.name}
                          quantity={item.quantity}
                          onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                          onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                        />
                        <RemoveCartItemButton
                          itemName={item.name}
                          onClick={() => removeItem(item.id)}
                        />
                      </div>
                    </div>
                    <p className="shrink-0 pt-1 font-semibold text-jscolors-blue">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                )
              })}
            </ul>

            <div className="rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 p-6 shadow-lg">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-jscolors-ink/80">
                  <span>Product subtotal</span>
                  <span className="font-semibold text-jscolors-blue">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-jscolors-ink/80">
                  <span>{SHIPPING_LINE_ITEM_NAME} (flat rate)</span>
                  <span className="font-semibold text-jscolors-blue">{formatPrice(FLAT_RATE_SHIPPING)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-jscolors-gold/25 pt-4">
                <span className="font-display text-lg font-semibold text-jscolors-ink">
                  Estimated total before tax
                </span>
                <span className="font-display text-2xl font-bold text-jscolors-blue">
                  {formatPrice(orderTotal)}
                </span>
              </div>
              <p className="mt-2 text-xs text-jscolors-ink/60">
                {fulfillmentCopy ? `${fulfillmentCopy}. ` : ''}
                Shipping is ${FLAT_RATE_SHIPPING.toFixed(2)} once per order, no matter how many bracelets
                you add. Tax is calculated by Square at checkout. Plain filler links are included free and
                are not charged.
              </p>

              <CustomerProofNearCta className="mt-5" heading="Customers love these details" />
              <TrustPanel className="mt-5" compact />
              <PolicyLinks className="mt-4" />

              {error && (
                <div className="mt-4 space-y-2">
                  {error === INVENTORY_OUTAGE_MESSAGE ? (
                    <InventoryStatusBanner message={error} />
                  ) : (
                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-6 w-full rounded-full bg-jscolors-cta px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verifying inventory…' : 'Checkout'}
              </button>

              <button
                type="button"
                onClick={handleEmptyCart}
                disabled={loading}
                className="mt-3 w-full rounded-full border-2 border-jscolors-ink/20 bg-white px-6 py-3 text-sm font-semibold text-jscolors-ink/70 transition hover:border-jscolors-gold hover:text-jscolors-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Empty Cart
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

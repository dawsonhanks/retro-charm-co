import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SparkleRow } from '../components/RetroAccents'
import { CartItemThumbnail } from '../components/CartItemThumbnail'
import { BraceletBuildsPreview } from '../components/BraceletBuildsPreview'
import { CartItemQuantityControls, RemoveCartItemButton } from '../components/RemoveCartItemButton'
import { useCart } from '../context/CartContext.jsx'
import { FLAT_RATE_SHIPPING, SHIPPING_LINE_ITEM_NAME } from '../data/shipping'
import { createCheckoutSession } from '../utils/checkoutApi'
import { hashCartItems } from '../utils/idempotency'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export default function Cart() {
  const { items, cartTotal, clearCart, removeItem, updateQuantity, braceletBuilds } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const orderTotal = cartTotal + FLAT_RATE_SHIPPING

  function handleEmptyCart() {
    if (window.confirm('Empty your cart?')) {
      clearCart()
    }
  }

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const data = await createCheckoutSession({
        items: items.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        idempotencyKey: hashCartItems(items),
        braceletBuilds,
      })

      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Cart | RetroCharm Co</title>
        <meta name="description" content="Review your RetroCharm Co cart and checkout securely with Square." />
      </Helmet>

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
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-5 sm:gap-4 sm:px-6">
                  <CartItemThumbnail item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-jscolors-ink">{item.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-ink/60">{item.metal}</p>
                    <p className="mt-1 text-sm text-jscolors-blue">{formatPrice(item.price)} each</p>
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
              ))}
            </ul>

            <div className="rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 p-6 shadow-lg">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-jscolors-ink/80">
                  <span>Subtotal</span>
                  <span className="font-semibold text-jscolors-blue">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-jscolors-ink/80">
                  <span>{SHIPPING_LINE_ITEM_NAME}</span>
                  <span className="font-semibold text-jscolors-blue">{formatPrice(FLAT_RATE_SHIPPING)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-jscolors-gold/25 pt-4">
                <span className="font-display text-lg font-semibold text-jscolors-ink">Order total</span>
                <span className="font-display text-2xl font-bold text-jscolors-blue">{formatPrice(orderTotal)}</span>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-6 w-full rounded-full bg-jscolors-cta px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Redirecting to checkout…' : 'Checkout'}
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

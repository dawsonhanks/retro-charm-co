import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SparkleRow } from '../components/RetroAccents'
import { CartItemThumbnail } from '../components/CartItemThumbnail'
import { BraceletBuildsPreview } from '../components/BraceletBuildsPreview'
import { useCart } from '../context/CartContext.jsx'
import { hashCartItems } from '../utils/idempotency'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export default function Cart() {
  const { items, cartTotal, clearCart, braceletBuilds } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleEmptyCart() {
    if (window.confirm('Empty your cart?')) {
      clearCart()
    }
  }

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
          idempotencyKey: hashCartItems(items),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed. Please try again.')
      }

      if (!data.checkoutUrl) {
        throw new Error('No checkout URL returned. Please try again.')
      }

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
          <h1 className="mt-6 font-display text-4xl font-bold text-jscolors-navy md:text-5xl">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 p-10 text-center shadow-lg">
            <p className="text-lg text-jscolors-charcoal/80">Your cart is empty.</p>
            <Link
              to="/create"
              className="mt-6 inline-block rounded-full bg-jscolors-navy px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-navy/90"
            >
              Build a bracelet
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <BraceletBuildsPreview builds={braceletBuilds} />
            <ul className="divide-y divide-jscolors-gold/25 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 shadow-lg">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-4 px-6 py-5 sm:items-center">
                  <CartItemThumbnail item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-jscolors-navy">{item.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-navy/60">{item.metal}</p>
                    <p className="mt-2 text-sm text-jscolors-charcoal/80">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-jscolors-navy">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            <div className="rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-jscolors-navy">Order total</span>
                <span className="font-display text-2xl font-bold text-jscolors-navy">{formatPrice(cartTotal)}</span>
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
                className="mt-6 w-full rounded-full bg-jscolors-navy px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Redirecting to checkout…' : 'Checkout'}
              </button>

              <button
                type="button"
                onClick={handleEmptyCart}
                disabled={loading}
                className="mt-3 w-full rounded-full border-2 border-jscolors-charcoal/25 bg-white px-6 py-3 text-sm font-semibold text-jscolors-navy/70 transition hover:border-jscolors-gold hover:text-jscolors-navy disabled:cursor-not-allowed disabled:opacity-60"
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

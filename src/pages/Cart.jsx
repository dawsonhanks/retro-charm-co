import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SparkleRow } from '../components/RetroAccents'
import { useCart } from '../context/CartContext.jsx'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export default function Cart() {
  const { items, cartTotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ name, price, quantity }) => ({ name, price, quantity })),
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
        <title>Cart | Retro Charm Co 2.0</title>
        <meta name="description" content="Review your Retro Charm Co cart and checkout securely with Square." />
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
              to="/shop"
              className="mt-6 inline-block rounded-full bg-jscolors-navy px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-navy/90"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <ul className="divide-y divide-jscolors-gold/25 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 shadow-lg">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold text-jscolors-navy">{item.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-navy/60">{item.metal}</p>
                    <p className="mt-2 text-sm text-jscolors-charcoal/80">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-jscolors-navy">{formatPrice(item.price * item.quantity)}</p>
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
            </div>
          </div>
        )}
      </section>
    </>
  )
}

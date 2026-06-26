import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SparkleRow } from '../components/RetroAccents'
import { BASE_OPTIONS, DEFAULT_CHARM_PRICE } from '../data/charms'
import { readJson, STORAGE_KEYS } from '../utils/storage'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

function getBasePrice(baseId) {
  return BASE_OPTIONS.find((b) => b.id === baseId)?.price ?? BASE_OPTIONS[0].price
}

export default function Shop() {
  const [build] = useState(() => readJson(STORAGE_KEYS.savedBuild, null))
  const [charmNames, setCharmNames] = useState(() => {
    const saved = readJson(STORAGE_KEYS.savedBuild, null)
    return Array.isArray(saved?.charmNames) ? [...saved.charmNames] : []
  })
  const [hasBase, setHasBase] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function removeCharm(index) {
    setCharmNames((prev) => prev.filter((_, i) => i !== index))
  }

  function removeBase() {
    setHasBase(false)
  }

  async function handleCheckout() {
    if (!build || !hasBase) return

    setLoading(true)
    setError(null)

    const basePrice = getBasePrice(build.baseId)
    const items = [
      { name: build.baseLabel, price: basePrice, quantity: 1 },
      ...charmNames.map((name) => ({ name, price: DEFAULT_CHARM_PRICE, quantity: 1 })),
    ]

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
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

  const basePrice = build ? getBasePrice(build.baseId) : 0
  const orderTotal = (hasBase ? basePrice : 0) + charmNames.length * DEFAULT_CHARM_PRICE

  return (
    <>
      <Helmet>
        <title>Your Order | Retro Charm Co 2.0</title>
        <meta name="description" content="Review your custom Retro Charm Co bracelet and checkout securely with Square." />
      </Helmet>

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <div className="text-center">
          <SparkleRow className="mx-auto" />
          <h1 className="mt-6 font-display text-4xl font-bold text-jscolors-navy md:text-5xl">Your Order</h1>
        </div>

        {!build ? (
          <div className="mt-12 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 p-10 text-center shadow-lg">
            <p className="text-lg text-jscolors-charcoal/80">No build saved yet.</p>
            <Link
              to="/create"
              className="mt-6 inline-block rounded-full bg-jscolors-navy px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-navy/90"
            >
              Build your bracelet
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <ul className="divide-y divide-jscolors-gold/25 rounded-3xl border-2 border-jscolors-gold/35 bg-white/80 shadow-lg">
              {hasBase && (
                <li className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-jscolors-navy">{build.baseLabel}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-navy/60">Base bracelet</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-semibold text-jscolors-navy">{formatPrice(basePrice)}</p>
                    <button
                      type="button"
                      onClick={removeBase}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-jscolors-gold/50 text-lg leading-none text-jscolors-navy/60 transition hover:bg-jscolors-pink/35 hover:text-jscolors-navy"
                      aria-label={`Remove ${build.baseLabel}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              )}

              {charmNames.map((name, i) => (
                <li key={`${name}-${i}`} className="flex items-center justify-between gap-4 px-6 py-5">
                  <p className="min-w-0 flex-1 font-display text-lg font-semibold text-jscolors-navy">{name}</p>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-semibold text-jscolors-navy">{formatPrice(DEFAULT_CHARM_PRICE)}</p>
                    <button
                      type="button"
                      onClick={() => removeCharm(i)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-jscolors-gold/50 text-lg leading-none text-jscolors-navy/60 transition hover:bg-jscolors-pink/35 hover:text-jscolors-navy"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="retro-card border-jscolors-gold/35 p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-jscolors-navy">Order total</span>
                <span className="font-display text-2xl font-bold text-jscolors-navy">{formatPrice(orderTotal)}</span>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              {!hasBase && (
                <p className="mt-4 text-sm text-jscolors-charcoal/80">A base bracelet is required to checkout</p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || !hasBase}
                className="mt-6 w-full rounded-full bg-jscolors-navy px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Redirecting to checkout…' : 'Checkout'}
              </button>

              <Link
                to="/create"
                className="mt-4 block text-center text-sm font-medium text-jscolors-navy/70 transition hover:text-jscolors-navy"
              >
                ← Edit your build
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

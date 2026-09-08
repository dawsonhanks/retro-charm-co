import { useState } from 'react'
import { Link } from 'react-router-dom'

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <aside className="relative bg-jscolors-cta text-jscolors-cream" aria-label="First order promotion">
      <Link
        to="/shop"
        className="block px-10 py-2.5 text-center transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold focus-visible:ring-inset"
      >
        <p className="text-sm font-semibold tracking-wide sm:text-base">
          10% off your first order — code{' '}
          <span className="inline-block rounded-md border border-jscolors-gold/70 bg-jscolors-cream/10 px-2 py-0.5 font-bold tracking-[0.12em] text-white">
            WELCOME10
          </span>{' '}
          at checkout
        </p>
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none text-jscolors-cream/70 transition hover:bg-jscolors-cream/10 hover:text-jscolors-cream"
        aria-label="Dismiss promotion"
      >
        ×
      </button>
    </aside>
  )
}

import { Link } from 'react-router-dom'
import { CHECKOUT_TRUST, getTrustPanelItems } from '../data/storeInfo'

/**
 * Concise trust strip for Charm Studio and cart / checkout.
 * @param {{ className?: string, compact?: boolean }} props
 */
export function TrustPanel({ className = '', compact = false }) {
  const items = getTrustPanelItems()

  return (
    <aside
      className={`rounded-2xl border border-jscolors-gold/35 bg-jscolors-cream/60 p-4 shadow-sm ${className}`}
      aria-label="Shopping assurances"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jscolors-gold-warm">
        Why shop with us
      </p>
      <ul className={`mt-3 ${compact ? 'space-y-1.5' : 'space-y-2'}`}>
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-jscolors-ink/85">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jscolors-gold" aria-hidden />
            {item.to ? (
              <Link
                to={item.to}
                className="underline decoration-jscolors-gold-warm/70 underline-offset-2 transition hover:text-jscolors-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
              >
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
      {!compact ? (
        <p className="mt-3 text-[11px] leading-snug text-jscolors-ink/60">{CHECKOUT_TRUST.detail}</p>
      ) : null}
    </aside>
  )
}

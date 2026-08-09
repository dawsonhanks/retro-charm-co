import { Link } from 'react-router-dom'
import { CHECKOUT_POLICY_LINKS, CHECKOUT_TRUST } from '../data/storeInfo'

/**
 * Policy links placed near cart / checkout CTAs.
 * @param {{ className?: string, showSquareNote?: boolean }} props
 */
export function PolicyLinks({ className = '', showSquareNote = true }) {
  return (
    <div className={className}>
      {showSquareNote ? (
        <p className="text-xs leading-relaxed text-jscolors-ink/65">{CHECKOUT_TRUST.cartNote}</p>
      ) : null}
      <nav aria-label="Order policies" className={showSquareNote ? 'mt-3' : undefined}>
        <ul className="flex flex-wrap gap-x-1 gap-y-1 text-xs font-semibold text-jscolors-ink/75">
          {CHECKOUT_POLICY_LINKS.map((link, index) => (
            <li key={link.to} className="inline-flex items-center">
              {index > 0 ? (
                <span className="mx-2 text-jscolors-gold/60" aria-hidden>
                  ·
                </span>
              ) : null}
              <Link
                to={link.to}
                className="underline decoration-jscolors-gold-warm/70 underline-offset-2 transition hover:text-jscolors-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

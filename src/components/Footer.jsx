import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmailSignup } from './EmailSignup'
import { CONTACT, FOOTER_POLICY_LINKS } from '../data/storeInfo'
import { instagram, tiktok } from '../data/social'

const CONTACT_EMAIL = CONTACT.email

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/create', label: 'Charm Studio' },
  { to: '/find-us', label: 'Find Us' },
  { to: '/about', label: 'Customer Photos' },
  { to: '/cart', label: 'Cart' },
]

const socialLinks = [
  {
    id: 'instagram',
    href: instagram.url,
    label: `Follow ${instagram.handle} on Instagram (opens in a new tab)`,
    Glyph: InstagramGlyph,
  },
  {
    id: 'tiktok',
    href: tiktok.url,
    label: `Follow ${tiktok.handle} on TikTok (opens in a new tab)`,
    Glyph: TikTokGlyph,
  },
]

export function Footer() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <footer className="mt-auto border-t-2 border-jscolors-gold/35 bg-[#7d5b6c] text-jscolors-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/images/brand/retro-charm-icon-mark.webp"
              alt=""
              width={48}
              height={38}
              className="h-10 w-auto object-contain"
              decoding="async"
              loading="lazy"
            />
            <p className="font-display text-xl font-semibold text-jscolors-cream">RetroCharm Co</p>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-jscolors-cream/75">
            Custom Italian charm bracelets, built online by you. Pick your base, choose your charms, and order your story.
          </p>
          <div className="mt-6 flex gap-3">
            {socialLinks.map(({ id, href, label, Glyph }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-jscolors-gold/50 text-jscolors-gold transition hover:bg-jscolors-gold hover:text-jscolors-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-cream"
                aria-label={label}
              >
                <Glyph />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-jscolors-gold">Explore</h2>
          <ul className="mt-4 space-y-2">
            {footerLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm text-jscolors-cream/80 transition hover:text-jscolors-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-cream"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setContactOpen((open) => !open)}
                aria-expanded={contactOpen}
                className="inline-flex items-center gap-1.5 text-sm text-jscolors-cream/80 transition hover:text-jscolors-pink"
              >
                Contact Us
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${contactOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {contactOpen ? (
                <p className="mt-1.5 break-all text-sm text-jscolors-cream/70">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="underline decoration-jscolors-gold/50 underline-offset-2 transition hover:text-jscolors-pink"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
              ) : null}
            </li>
          </ul>

          <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-jscolors-gold">
            Help
          </h2>
          <ul className="mt-4 space-y-2">
            {FOOTER_POLICY_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm text-jscolors-cream/80 transition hover:text-jscolors-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-cream"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-jscolors-gold">Charm mail</h2>
          <p className="mt-2 text-sm text-jscolors-cream/75">New charm drops, restocks, and online ordering updates.</p>
          <EmailSignup className="mt-4" source="footer" />
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-jscolors-cream/50">
        © {new Date().getFullYear()} RetroCharm Co. Handmade with love in Utah.
      </div>
    </footer>
  )
}

function InstagramGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.326.976.976 1.264 2.242 1.326 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.326 3.608-.976.976-2.242 1.264-3.608 1.326-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.326-.976-.976-1.264-2.242-1.326-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.35-2.633 1.326-3.608C4.535 2.558 5.802 2.27 7.168 2.208 8.434 2.15 8.814 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.053.072 5.775.13 4.602.425 3.635 1.392 2.668 2.359 2.373 3.532 2.315 4.81.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.947.058 1.278.353 2.451 1.32 3.418.967.967 2.14 1.262 3.418 1.32 1.28.058 1.688.072 4.947.072 3.259 0 3.668-.014 4.947-.072 1.278-.058 2.451-.353 3.418-1.32.967-.967 1.262-2.14 1.32-3.418.058-1.28.072-1.688.072-4.947 0-3.259-.014-3.668-.072-4.947-.058-1.278-.353-2.451-1.32-3.418C21.641 2.668 20.468 2.373 19.19 2.315 17.912 2.257 17.503 2.243 14.244 2.243L12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z" />
    </svg>
  )
}

function TikTokGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  )
}

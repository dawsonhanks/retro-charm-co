import { Link, useLocation } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SparkleRow } from '../components/RetroAccents'
import { trackCreateBraceletClicked } from '../lib/analytics'

const TITLE = 'Page Not Found | RetroCharm Co'
const DESCRIPTION =
  'This page is missing, but your bracelet does not have to be. Head back to Charm Studio to build a custom Italian charm bracelet.'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <>
      <PageMeta title={TITLE} description={DESCRIPTION} path={pathname || '/'} noindex />

      <section
        className="relative overflow-hidden bg-gradient-to-b from-jscolors-cream via-[#ddd0b8] to-jscolors-cream px-4 py-16 text-center text-jscolors-ink md:py-24"
        aria-labelledby="not-found-heading"
      >
        <SparkleRow className="mx-auto" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm">404</p>
        <h1 id="not-found-heading" className="mt-3 font-display text-4xl font-bold md:text-5xl">
          This charm link is missing
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-jscolors-ink/80 md:text-lg">
          The page you asked for is not here. You can keep shopping from home or jump straight into Charm Studio to build
          your bracelet.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            to="/create"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-jscolors-cta px-8 py-3 text-sm font-semibold text-jscolors-cream shadow-lg shadow-jscolors-cta/20 transition hover:bg-jscolors-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
            onClick={() => trackCreateBraceletClicked({ source: 'not_found' })}
          >
            Open Charm Studio
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-jscolors-gold/55 bg-transparent px-8 py-3 text-sm font-semibold text-jscolors-ink transition hover:border-jscolors-gold hover:bg-jscolors-pink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
          >
            Back to Home
          </Link>
        </div>

        <img
          src="/images/brand/retro-charm-icon-mark.webp"
          alt=""
          width={72}
          height={56}
          className="mx-auto mt-14 h-14 w-auto object-contain opacity-90"
          decoding="async"
          loading="lazy"
        />
      </section>
    </>
  )
}

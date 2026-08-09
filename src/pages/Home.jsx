import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BestSellers } from '../components/BestSellers'
import { CustomerPhotoGallery, CustomerProofStrip } from '../components/CustomerProof'
import { HowItWorks } from '../components/HowItWorks'
import { PageMeta } from '../components/PageMeta'
import { StarField } from '../components/RetroAccents'
import { BASE_OPTIONS } from '../data/charms'
import { getHomeHeroPhoto } from '../data/customerProof'
import { DEFAULT_TITLE, HOME_OG_IMAGE_PATH } from '../data/site'
import {
  buildBestSellerProductsJsonLd,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from '../data/structuredData'
import { formatFlatRateShippingLabel, getCustomerFacingFulfillmentCopy } from '../data/shipping'
import { loadInitialLinkOrder, loadInitialSelectedSize } from '../utils/braceletLinks'
import { trackCreateBraceletClicked, trackHomepageViewed } from '../lib/analytics'

const CharmBuilder = lazy(() => import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder })))

const BEST_SELLERS_HASH = 'best-sellers'
const FULFILLMENT_COPY = getCustomerFacingFulfillmentCopy()

const STARTING_BRACELET_PRICE = Math.min(...BASE_OPTIONS.map((b) => b.price))
const SHIPPING_TRUST_LABEL = formatFlatRateShippingLabel()

const HERO_PHOTO = getHomeHeroPhoto()

const secondaryCtaClassName =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 border-jscolors-gold/55 bg-transparent px-6 py-2.5 text-sm font-semibold text-jscolors-ink transition hover:border-jscolors-gold hover:bg-jscolors-pink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold sm:px-7 sm:text-base'

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-16" role="status" aria-live="polite">
      <img
        src="/images/brand/retro-charm-icon-mark.webp"
        alt=""
        width={56}
        height={44}
        className="h-12 w-auto animate-pulse object-contain opacity-90"
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

function HeroTrustRow() {
  return (
    <ul
      className="mt-3.5 flex w-full flex-col items-center gap-1.5 text-[11px] font-medium leading-snug text-jscolors-ink/80 sm:mt-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-2 sm:text-xs md:justify-start"
      aria-label="Shopping assurances"
    >
      <li className="inline-flex items-center gap-1.5">
        <TruckIcon />
        <span>
          {SHIPPING_TRUST_LABEL}
          {FULFILLMENT_COPY ? ` · ${FULFILLMENT_COPY}` : ''}
        </span>
      </li>
      <li className="inline-flex items-center gap-1.5">
        <LockIcon />
        <span>Secure Square checkout</span>
      </li>
      <li>
        <Link
          to="/create"
          className="inline-flex items-center gap-1.5 underline decoration-jscolors-gold-warm/70 underline-offset-2 transition hover:text-jscolors-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
        >
          <RulerIcon />
          <span>Sizing help</span>
        </Link>
      </li>
    </ul>
  )
}

function TruckIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-jscolors-gold-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3V7zM14 10h4l3 3v4h-7v-7z" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="17.5" cy="18.5" r="1.5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-jscolors-gold-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path strokeLinecap="round" d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  )
}

function RulerIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-jscolors-gold-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v8H4V8zM8 8v3M12 8v2M16 8v3" />
    </svg>
  )
}

const HOME_DESCRIPTION = `Custom Italian charm bracelets from $${STARTING_BRACELET_PRICE}. Pick your base, choose your charms, and order your story.`

export default function Home() {
  const [linkOrder, setLinkOrder] = useState(loadInitialLinkOrder)
  const [selectedSize, setSelectedSize] = useState(loadInitialSelectedSize)
  const location = useLocation()

  useEffect(() => {
    trackHomepageViewed()
  }, [])

  useEffect(() => {
    const hash = location.hash.replace(/^#/, '')
    if (hash !== BEST_SELLERS_HASH) return
    // Defer until section is painted (including after client-side navigation).
    const id = window.requestAnimationFrame(() => {
      document.getElementById(BEST_SELLERS_HASH)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [location.hash, location.pathname])

  return (
    <>
      <PageMeta
        title={DEFAULT_TITLE}
        description={HOME_DESCRIPTION}
        path="/"
        image={HOME_OG_IMAGE_PATH}
        jsonLd={[
          buildOrganizationJsonLd(),
          buildWebSiteJsonLd(),
          buildWebPageJsonLd({ title: DEFAULT_TITLE, description: HOME_DESCRIPTION, path: '/' }),
          buildBestSellerProductsJsonLd(),
        ]}
      />

      <section
        className="relative overflow-hidden bg-gradient-to-b from-jscolors-cream via-[#ddd0b8] to-jscolors-cream text-jscolors-ink"
        aria-labelledby="home-hero-heading"
      >
        <StarField className="pointer-events-none absolute left-0 right-0 top-2 z-10 mx-auto hidden max-w-4xl opacity-70 md:block" />

        <div className="relative grid md:grid-cols-2 md:items-stretch lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="relative h-[168px] w-full sm:h-[220px] md:h-auto md:min-h-[min(70vh,540px)]">
            <img
              src={HERO_PHOTO.src}
              alt={HERO_PHOTO.alt}
              width={HERO_PHOTO.width}
              height={HERO_PHOTO.height}
              sizes="(max-width: 767px) 100vw, 55vw"
              className="absolute inset-0 h-full w-full object-cover object-[center_42%] sm:object-[center_38%] md:object-[center_32%]"
              decoding="async"
              fetchPriority="high"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-jscolors-cream/90 to-transparent md:hidden"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-[#ddd0b8]/80 to-transparent md:block"
              aria-hidden
            />
          </div>

          <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-4 pb-5 pt-3 text-center sm:px-6 sm:pb-8 sm:pt-5 md:mx-0 md:max-w-none md:items-start md:justify-center md:px-8 md:pb-12 md:pt-10 md:text-left lg:px-12">
            <p className="font-display text-[1.65rem] font-bold leading-none tracking-tight text-jscolors-ink sm:text-3xl md:text-4xl">
              RetroCharm Co
            </p>

            <h1
              id="home-hero-heading"
              className="mt-1.5 max-w-[18ch] font-display text-lg font-semibold leading-snug text-jscolors-ink sm:mt-3 sm:text-2xl md:max-w-[16ch] md:text-3xl lg:text-[2.1rem]"
            >
              Custom Italian Charm Bracelets
            </h1>

            <p className="mt-2.5 max-w-md text-[13px] leading-snug text-jscolors-ink/85 sm:mt-4 sm:text-base sm:leading-relaxed">
              <span className="font-semibold text-jscolors-ink">Custom bracelets from ${STARTING_BRACELET_PRICE}.</span>
              {FULFILLMENT_COPY ? (
                <span className="mt-1 block break-words sm:mt-0 sm:inline"> {FULFILLMENT_COPY}.</span>
              ) : null}
            </p>

            <div className="mt-4 flex w-full max-w-md flex-col items-stretch gap-2 sm:mt-6 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-start">
              <Link
                to={{ pathname: '/', hash: BEST_SELLERS_HASH }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-jscolors-gold/55 bg-jscolors-cta px-7 py-2.5 text-sm font-semibold text-jscolors-cream shadow-lg shadow-jscolors-cta/20 transition hover:bg-jscolors-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold sm:px-8 sm:text-base"
              >
                Shop Best Sellers
              </Link>

              <Link
                to="/create"
                className={secondaryCtaClassName}
                onClick={() => trackCreateBraceletClicked({ source: 'home_hero' })}
              >
                Create Your Bracelet
              </Link>
            </div>

            <HeroTrustRow />
          </div>
        </div>
      </section>

      <HowItWorks />

      <BestSellers />

      <CustomerProofStrip />

      <Suspense fallback={<PageLoader />}>
        <div id="charm-studio" className="scroll-mt-24 bg-jscolors-cream/70 py-16">
          <CharmBuilder
            className="px-4"
            idPrefix="home-builder"
            linkOrder={linkOrder}
            onLinkOrderChange={setLinkOrder}
            selectedSize={selectedSize}
            onSelectedSizeChange={setSelectedSize}
          />
        </div>
      </Suspense>

      <CustomerPhotoGallery className="border-y border-jscolors-gold/25 bg-jscolors-cream/90 py-16 md:py-20" />
    </>
  )
}

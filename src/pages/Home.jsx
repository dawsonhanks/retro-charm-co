import { Helmet } from 'react-helmet-async'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HowItWorks } from '../components/HowItWorks'
import { StarField, SparkleRow, FloatingHearts } from '../components/RetroAccents'
import { loadInitialLinkOrder } from '../utils/braceletLinks'

const CharmBuilder = lazy(() => import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder })))

const heroWords = ['Italian', 'Charm', 'Bracelets']
const CUSTOMER_PHOTOS = [
  {
    src: '/images/customer-photos/customer-photo-1.jpg',
    alt: 'Two customers showing layered Italian charm bracelets with gold and silver links, featuring heart, flag, and fish dangle charms',
  },
  {
    src: '/images/customer-photos/customer-photo-2.jpg',
    alt: 'Close-up of a wrist wearing stacked bracelets with a silver Italian charm bracelet, gold chain, and gold beaded cross bracelet',
  },
  {
    src: '/images/customer-photos/customer-photo-3.jpg',
    alt: 'Two customers wearing gold Italian charm bracelets with checkered and pearl dangle charms',
  },
]

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-jscolors-gold border-t-jscolors-pink" aria-label="Loading" />
    </div>
  )
}

export default function Home() {
  const [linkOrder, setLinkOrder] = useState(loadInitialLinkOrder)
  const [selectedSize, setSelectedSize] = useState(null)

  return (
    <>
      <Helmet>
        <title>RetroCharm Co | Italian Charm Bracelets in Utah</title>
        <meta
          name="description"
          content="Custom Italian charm bracelets built online. Pick your base, choose your charms, and order your story."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#f6eef2] via-[#edf1f6] to-[#f6eef2] text-jscolors-charcoal">
        <StarField className="absolute left-0 right-0 top-4 mx-auto max-w-4xl opacity-90" />
        <FloatingHearts className="pointer-events-none absolute bottom-8 right-4 hidden w-32 md:block" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center md:pb-28 md:pt-24">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm"
          >
            Build online • Ship your story
          </motion.p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-4">
            {heroWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.1, type: 'spring', stiffness: 320, damping: 26 }}
                className="font-display text-4xl font-bold text-jscolors-navy sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {word}
              </motion.span>
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            className="mt-10 max-w-3xl font-display text-2xl font-semibold leading-snug text-jscolors-navy sm:text-3xl md:text-4xl"
          >
            Charm by Charm, Made by You.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, type: 'spring', stiffness: 280, damping: 20 }}
            className="mt-12 md:mt-14"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center rounded-full border border-jscolors-gold/55 bg-jscolors-navy px-10 py-4 text-base font-semibold text-jscolors-cream shadow-lg shadow-jscolors-gold/20 transition hover:bg-jscolors-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
            >
              Create Your Bracelet
            </Link>
          </motion.div>
          <SparkleRow className="mt-10" />
        </div>
      </section>

      <HowItWorks />

      <Suspense fallback={<PageLoader />}>
        <div className="bg-jscolors-cream/70 py-16">
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

      <section className="border-y border-jscolors-gold/25 bg-[#f3eef3]/85 py-16 md:py-20" aria-labelledby="customer-photos-heading">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 id="customer-photos-heading" className="font-display text-3xl font-bold text-jscolors-navy">
            Customer Photos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-jscolors-charcoal/80">
            See how our customers style their charm bracelets
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {CUSTOMER_PHOTOS.map((photo) => (
              <div key={photo.src} className="aspect-square overflow-hidden rounded-xl">
                <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

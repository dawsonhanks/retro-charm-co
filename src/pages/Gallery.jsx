import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterBar } from '../components/FilterBar'
import { CharmCard } from '../components/CharmCard'
import { charms } from '../data/charms'

const CharmBuilder = lazy(() => import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder })))

function GalleryLoader() {
  return (
    <div className="flex min-h-[240px] items-center justify-center py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-jscolors-gold border-t-jscolors-pink" aria-label="Loading builder" />
    </div>
  )
}

export default function Gallery() {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return charms
    return charms.filter((c) => c.category === filter)
  }, [filter])

  return (
    <>
      <Helmet>
        <title>Charm Gallery | Retro Charm Co 2.0</title>
        <meta
          name="description"
          content="Browse Italian charm icons for your bracelet — nature, retro, letters, food, and spiritual styles with wishlist saving."
        />
      </Helmet>

      <header className="border-b border-jscolors-gold/20 bg-gradient-to-b from-white to-jscolors-cream px-4 py-14 text-center md:py-20">
        <h1 className="font-display text-4xl font-bold text-jscolors-navy md:text-5xl">Charm Gallery</h1>
        <p className="mx-auto mt-4 max-w-2xl text-jscolors-charcoal/85">
          Tap filters to explore categories — every charm is $2.25 in this demo pricing (booth pricing may vary slightly by style).
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-label="Charm filters">
        <FilterBar active={filter} onChange={setFilter} />
      </section>

      <motion.ul
        layout
        className="mx-auto grid max-w-6xl auto-rows-fr grid-cols-1 gap-6 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((charm, index) => (
            <motion.li
              key={charm.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="min-w-0"
            >
              <CharmCard charm={charm} index={index} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <Suspense fallback={<GalleryLoader />}>
        <div className="bg-white py-16">
          <CharmBuilder className="px-4" idPrefix="gallery-builder" />
        </div>
      </Suspense>
    </>
  )
}

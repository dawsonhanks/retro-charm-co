import { useState } from 'react'
import { motion } from 'framer-motion'
import { CharmSvgIcon } from './CharmIcon'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'
import { CHARM_CATEGORY_FILTERS } from '../data/charms'

const categoryLabel = (id) => CHARM_CATEGORY_FILTERS.find((c) => c.id === id)?.label ?? id

export function CharmCard({ charm, index = 0 }) {
  const [onList, setOnList] = useState(() => readJson(STORAGE_KEYS.wishlist, []).includes(charm.id))

  function toggleWishlist() {
    const w = readJson(STORAGE_KEYS.wishlist, [])
    const has = w.includes(charm.id)
    const next = has ? w.filter((x) => x !== charm.id) : [...w, charm.id]
    writeJson(STORAGE_KEYS.wishlist, next)
    setOnList(!has)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.04, 0.4), type: 'spring', stiffness: 320, damping: 28 }}
      className="retro-card retro-card-hover flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-jscolors-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-jscolors-ink">
          {categoryLabel(charm.category)}
        </span>
        <button
          type="button"
          onClick={toggleWishlist}
          className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition ${
            onList ? 'border-jscolors-pink bg-jscolors-pink text-white' : 'border-jscolors-gold/50 text-jscolors-ink hover:border-jscolors-gold'
          }`}
          aria-pressed={onList}
        >
          {onList ? 'Saved' : 'Add to wishlist'}
        </button>
      </div>
      <div className="mt-4 flex flex-1 flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-jscolors-gold/40 bg-jscolors-cream/80">
          <CharmSvgIcon charm={charm} className="h-14 w-14 text-jscolors-pink" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold text-jscolors-ink">{charm.name}</h3>
        <p className="mt-2 font-semibold text-jscolors-blue">${charm.price.toFixed(2)}</p>
      </div>
    </motion.article>
  )
}

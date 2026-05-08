import { motion } from 'framer-motion'
import { CHARM_CATEGORY_FILTERS } from '../data/charms'

export function FilterBar({ active, onChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3" role="tablist" aria-label="Filter charms by category">
      {CHARM_CATEGORY_FILTERS.map((cat) => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition md:px-5 md:py-2.5 md:text-base ${
              isActive ? '' : 'bg-white/80 shadow-sm ring-1 ring-jscolors-gold/25'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-jscolors-pink shadow-md"
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? 'text-white' : 'text-jscolors-navy hover:text-jscolors-pink'}`}>
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

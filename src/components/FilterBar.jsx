import { motion } from 'framer-motion'
import { CHARM_CATEGORY_FILTERS } from '../data/charms'

/**
 * @param {{
 *   active: string
 *   onChange: (id: string) => void
 *   filters?: { id: string, label: string }[]
 *   layoutId?: string
 * }} props
 */
export function FilterBar({ active, onChange, filters = CHARM_CATEGORY_FILTERS, layoutId = 'filter-pill' }) {
  return (
    <div
      className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 md:flex-wrap md:justify-center md:gap-3 md:overflow-visible md:pb-0"
      role="tablist"
      aria-label="Filter charms by category"
    >
      {filters.map((cat) => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            className={`relative flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition md:px-5 md:py-2.5 md:text-base ${
              isActive ? '' : 'bg-white/80 shadow-sm ring-1 ring-jscolors-gold/25'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-jscolors-pink shadow-md"
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? 'text-white' : 'text-jscolors-ink hover:text-jscolors-pink'}`}>
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQ_ENTRIES } from '../data/storeInfo'

/**
 * Accordion FAQ. Content comes from `src/data/storeInfo.js` — edit there, not here.
 * @param {{
 *   entries?: typeof FAQ_ENTRIES,
 *   embedded?: boolean,
 *   headingLevel?: 'h2' | 'none',
 *   className?: string,
 * }} props
 */
export function FAQ({ entries = FAQ_ENTRIES, embedded = false, headingLevel = 'h2', className = '' }) {
  const [openIndex, setOpenIndex] = useState(null)

  function toggle(index) {
    setOpenIndex((current) => (current === index ? null : index))
  }

  const list = (
    <ul className={embedded ? 'space-y-3' : 'mt-8 space-y-3'}>
      {entries.map((item, index) => {
        const isOpen = openIndex === index
        const panelId = `faq-panel-${item.id}`
        const buttonId = `faq-button-${item.id}`
        return (
          <li key={item.id}>
            <div
              className={`retro-card overflow-hidden transition-colors ${
                isOpen ? 'border-jscolors-gold' : 'border-jscolors-gold/30'
              }`}
            >
              <button
                type="button"
                id={buttonId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="font-semibold text-jscolors-ink">{item.question}</span>
                <span className="shrink-0 text-xl font-light text-jscolors-gold-warm" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm leading-relaxed text-jscolors-ink/85">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ul>
  )

  if (headingLevel === 'none') {
    return (
      <div className={className} aria-label="Frequently asked questions">
        {list}
      </div>
    )
  }

  return (
    <section className={`mx-auto max-w-3xl px-4 pb-20 ${className}`} aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-center font-display text-2xl font-bold text-jscolors-ink md:text-3xl">
        Frequently asked questions
      </h2>
      {list}
    </section>
  )
}

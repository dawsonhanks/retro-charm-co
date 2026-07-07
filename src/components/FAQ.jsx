import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const FAQS = [
  {
    q: 'How does this work?',
    a: 'Pick a starter bracelet as your base, then choose as many individual charms as you like. Add your favorites to cart and place your order online in minutes.',
  },
  {
    q: 'Can I add charms later?',
    a: 'Absolutely. Italian charm bracelets are designed to be expandable, so you can come back anytime and order more charms to keep building your stack.',
  },
  {
    q: 'Will the charms tarnish over time?',
    a: 'Nope — our charms are made to last. You can wear them daily without worrying about tarnishing.',
  },
  {
    q: 'What sizes are available?',
    a: 'One size fits most, and the expandable link design makes it easy to get a comfortable fit.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We take cash and card (via Square). Venmo works too if needed.',
  },
  {
    q: 'How long does it take to build a bracelet?',
    a: 'Most people finish building their bracelet in about 10–15 minutes, but you can take your time and customize every detail.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  function toggle(index) {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-20" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-center font-display text-2xl font-bold text-jscolors-navy md:text-3xl">
        Frequently asked questions
      </h2>
      <ul className="mt-8 space-y-3">
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <li key={item.q}>
              <div
                className={`retro-card overflow-hidden transition-colors ${
                  isOpen ? 'border-jscolors-gold' : 'border-jscolors-gold/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-jscolors-navy">{item.q}</span>
                  <span className="shrink-0 text-xl font-light text-jscolors-gold" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-jscolors-charcoal/85">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

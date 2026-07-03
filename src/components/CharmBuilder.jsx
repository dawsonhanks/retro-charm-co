import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { BASE_OPTIONS, charms, DEFAULT_CHARM_PRICE, getCharmById, MAX_BRACELET_CHARMS } from '../data/charms'
import { CharmSvgIcon, CharmPickerGrid } from './CharmIcon'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'
import { useCart } from '../context/CartContext.jsx'

export function CharmBuilder({ className = '', idPrefix = 'builder' }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [baseId, setBaseId] = useState(() => {
    const saved = readJson(STORAGE_KEYS.savedBuild, null)
    return saved?.baseId ?? BASE_OPTIONS[0].id
  })
  const [charmIds, setCharmIds] = useState(() => {
    const saved = readJson(STORAGE_KEYS.savedBuild, null)
    return saved?.charmIds ?? []
  })

  const base = BASE_OPTIONS.find((b) => b.id === baseId) ?? BASE_OPTIONS[0]
  const pickerCharms = useMemo(() => charms.filter((c) => c.category !== 'starter'), [])
  const selected = charmIds.map((id) => getCharmById(id)).filter((c) => c && c.category !== 'starter')
  const charmTotal = selected.length * DEFAULT_CHARM_PRICE
  const grand = base.price + charmTotal
  const n = selected.length
  const atMax = n >= MAX_BRACELET_CHARMS

  const summaryLine = useMemo(() => {
    const baseStr = `$${base.price.toFixed(2)} base`
    if (n === 0) return `Your bracelet: ${baseStr} + 0 charms = $${base.price.toFixed(2)}`
    const charmPart = `${n} charms × $${DEFAULT_CHARM_PRICE.toFixed(2)} = $${charmTotal.toFixed(2)}`
    return `Your bracelet: ${baseStr} + ${charmPart} = $${grand.toFixed(2)}`
  }, [base.price, n, charmTotal, grand])

  function addCharm(c) {
    if (atMax || c.category === 'starter') return
    setCharmIds((prev) => [...prev, c.id])
  }

  function reset() {
    setCharmIds([])
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function addToCart() {
    // Base bracelet is always represented, even with zero charms selected.
    addItem({ id: base.id, name: base.label, price: base.price, metal: base.id, quantity: 1 })

    selected.forEach((c) => {
      addItem({ id: c.id, name: c.name, price: c.price, metal: c.metal, quantity: 1 })
    })

    // Clear the in-progress build so it isn't re-added if the customer comes back to the builder.
    setCharmIds([])
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)

    navigate('/cart')
  }

  const chainStroke = base.id === 'gold' ? '#d4af37' : '#b8bcc6'

  return (
    <section className={`mx-auto max-w-6xl ${className}`} aria-labelledby={`${idPrefix}-heading`}>
      <div className="text-center">
        <h2 id={`${idPrefix}-heading`} className="font-display text-2xl font-bold text-jscolors-navy md:text-3xl">
          Interactive Charm Studio
        </h2>
        <p className="mt-2 text-sm text-jscolors-charcoal/80 md:text-base">
          Tap charms to snap them onto your bracelet preview — up to {MAX_BRACELET_CHARMS} charms. Reset anytime or save a summary for the booth.
        </p>
      </div>

      <div className="mt-8 retro-card border-jscolors-gold/35 p-5 md:p-8">
        <p className="text-center text-sm font-semibold text-jscolors-navy">Choose your base</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {BASE_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBaseId(b.id)}
              className={`rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition ${
                baseId === b.id
                  ? 'border-jscolors-pink bg-jscolors-pink text-white shadow-md'
                  : 'border-jscolors-gold/40 bg-white text-jscolors-navy hover:border-jscolors-gold'
              }`}
            >
              {b.label} — ${b.price}
            </button>
          ))}
        </div>

        <div className="relative mt-10">
          <BraceletBaseGraphic stroke={chainStroke} />
          <LayoutGroup>
            <div className="relative mx-auto flex min-h-[140px] max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-8">
              <AnimatePresence initial={false}>
                {charmIds.map((id, i) => {
                  const c = getCharmById(id)
                  if (!c || c.category === 'starter') return null
                  return (
                    <motion.div
                      key={`${id}-${i}`}
                      layout
                      initial={{ scale: 0.2, opacity: 0, y: 16 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                      className="relative z-10 rounded-full border-2 border-jscolors-gold bg-white p-2 shadow-md"
                    >
                      <CharmSvgIcon charm={c} className="h-8 w-8 text-jscolors-pink" />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {n === 0 && (
                <p className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-center text-sm text-jscolors-charcoal/45">
                  Charms appear here as you tap below
                </p>
              )}
            </div>
          </LayoutGroup>
        </div>

        <p className="mt-4 text-center font-display text-lg font-semibold text-jscolors-navy md:text-xl">{summaryLine}</p>
        {atMax && <p className="mt-2 text-center text-sm font-medium text-jscolors-pink">Full bracelet — that is 18 charms of joy.</p>}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full border-2 border-jscolors-charcoal/25 bg-white px-6 py-3 text-sm font-semibold text-jscolors-navy hover:border-jscolors-gold"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={addToCart}
            className="rounded-full bg-jscolors-gold px-6 py-3 text-sm font-semibold text-jscolors-navy shadow hover:brightness-105"
          >
            Add to Cart →
          </button>
        </div>

        <div className="mt-10 border-t border-jscolors-gold/25 pt-8">
          <p className="text-center text-sm font-semibold text-jscolors-navy">Add charms</p>
          <div className="mt-4 max-h-[320px] overflow-y-auto pr-1 md:max-h-[380px]">
            <CharmPickerGrid charms={pickerCharms} onPick={addCharm} maxReached={atMax} />
          </div>
        </div>
      </div>
    </section>
  )
}

function BraceletBaseGraphic({ stroke }) {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[100px] w-[min(100%,520px)] -translate-x-1/2 -translate-y-1/2 md:h-[120px]"
      viewBox="0 0 520 80"
      fill="none"
      aria-hidden
    >
      <path
        d="M40 40c60-28 160-28 220 0 60 28 160 28 220 0"
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.35"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((i) => {
        const x = 46 + i * 26
        return (
          <g key={i}>
            <rect x={x} y="34" width="14" height="12" rx="3" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.65)" />
            <line x1={x + 7} y1="36" x2={x + 7} y2="44" stroke={stroke} strokeWidth="1.5" opacity="0.5" />
          </g>
        )
      })}
    </svg>
  )
}

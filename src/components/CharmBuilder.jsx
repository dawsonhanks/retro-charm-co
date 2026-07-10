import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BASE_OPTIONS, charms, DEFAULT_CHARM_PRICE } from '../data/charms'
import { CharmSvgIcon, CharmPickerGrid } from './CharmIcon'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'
import { useCart } from '../context/CartContext.jsx'
import {
  BASE_LINK_COUNT,
  addCharmToLinkOrder,
  createInitialLinkOrder,
  getCharmsFromLinkOrder,
  loadInitialLinkOrder,
  removeCharmFromLinkOrder,
} from '../utils/braceletLinks'

export function CharmBuilder({
  className = '',
  idPrefix = 'builder',
  instructionLabel,
  linkOrder: controlledLinkOrder,
  onLinkOrderChange,
}) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [baseId, setBaseId] = useState(() => {
    const saved = readJson(STORAGE_KEYS.savedBuild, null)
    return saved?.baseId ?? BASE_OPTIONS[0].id
  })
  const [internalLinkOrder, setInternalLinkOrder] = useState(loadInitialLinkOrder)
  const isControlled = controlledLinkOrder !== undefined && onLinkOrderChange !== undefined
  const linkOrder = isControlled ? controlledLinkOrder : internalLinkOrder

  function updateLinkOrder(updater) {
    if (isControlled) {
      onLinkOrderChange(updater)
    } else {
      setInternalLinkOrder(updater)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const base = BASE_OPTIONS.find((b) => b.id === baseId) ?? BASE_OPTIONS[0]
  const pickerCharms = useMemo(() => charms.filter((c) => c.category !== 'starter'), [])
  const selected = useMemo(() => getCharmsFromLinkOrder(linkOrder), [linkOrder])
  const charmTotal = selected.length * DEFAULT_CHARM_PRICE
  const grand = base.price + charmTotal
  const n = selected.length
  const baseSlotsFull = linkOrder.length >= BASE_LINK_COUNT && !linkOrder.some((link) => link.type === 'plain')

  const summaryLine = useMemo(() => {
    const baseStr = `$${base.price.toFixed(2)} base`
    if (n === 0) return `Your bracelet: ${baseStr} + 0 charms = $${base.price.toFixed(2)}`
    const charmPart = `${n} charms × $${DEFAULT_CHARM_PRICE.toFixed(2)} = $${charmTotal.toFixed(2)}`
    return `Your bracelet: ${baseStr} + ${charmPart} = $${grand.toFixed(2)}`
  }, [base.price, n, charmTotal, grand])

  function addCharm(c) {
    if (c.category === 'starter') return
    updateLinkOrder((prev) => addCharmToLinkOrder(prev, c))
  }

  function removeCharm(linkId) {
    updateLinkOrder((prev) => removeCharmFromLinkOrder(prev, linkId))
  }

  function handleBaseChange(nextBaseId) {
    setBaseId(nextBaseId)
  }

  function reset() {
    updateLinkOrder(createInitialLinkOrder())
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function addToCart() {
    addItem({ id: base.id, name: base.label, price: base.price, metal: base.id, quantity: 1 })

    selected.forEach((c) => {
      addItem({ id: c.id, name: c.name, price: c.price, metal: c.metal, quantity: 1 })
    })

    updateLinkOrder(createInitialLinkOrder())
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)

    navigate('/cart')
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    updateLinkOrder((prev) => {
      const oldIndex = prev.findIndex((link) => link.id === active.id)
      const newIndex = prev.findIndex((link) => link.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const chainStroke = base.id === 'gold' ? '#d4af37' : '#b8bcc6'
  const sortableIds = linkOrder.map((link) => link.id)

  return (
    <section
      className={`mx-auto max-w-6xl ${className}`}
      aria-labelledby={instructionLabel ? `${idPrefix}-instruction` : `${idPrefix}-heading`}
    >
      {instructionLabel ? (
        <p
          id={`${idPrefix}-instruction`}
          className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm"
        >
          {instructionLabel}
        </p>
      ) : (
        <div className="text-center">
          <h2 id={`${idPrefix}-heading`} className="font-display text-2xl font-bold text-jscolors-navy md:text-3xl">
            Interactive Charm Studio
          </h2>
          <p className="mt-2 text-sm text-jscolors-charcoal/80 md:text-base">
            Tap charms to add them, then drag to rearrange — {BASE_LINK_COUNT} link slots to start, with room to grow.
          </p>
        </div>
      )}

      <div className={`retro-card border-jscolors-gold/35 p-5 md:p-8 ${instructionLabel ? 'mt-6' : 'mt-8'}`}>
        <p className="text-center text-sm font-semibold text-jscolors-navy">Choose your base</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {BASE_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleBaseChange(b.id)}
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
          <BraceletBaseGraphic stroke={chainStroke} linkCount={linkOrder.length} />
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
              <div className="relative mx-auto flex min-h-[140px] max-w-full items-center justify-center gap-1.5 overflow-x-auto px-4 py-8 md:gap-2">
                {linkOrder.map((link) => (
                  <SortableBraceletLink
                    key={link.id}
                    link={link}
                    chainStroke={chainStroke}
                    onRemove={removeCharm}
                  />
                ))}
                {n === 0 && (
                  <p className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-center text-sm text-jscolors-charcoal/45">
                    Charms appear here as you tap below
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <p className="mt-4 text-center font-display text-lg font-semibold text-jscolors-navy md:text-xl">{summaryLine}</p>
        {baseSlotsFull && (
          <p className="mt-2 text-center text-sm font-medium text-jscolors-pink">
            All {BASE_LINK_COUNT} slots filled — new charms extend your bracelet.
          </p>
        )}

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
            <CharmPickerGrid charms={pickerCharms} onPick={addCharm} maxReached={false} />
          </div>
        </div>
      </div>
    </section>
  )
}

function SortableBraceletLink({ link, chainStroke, onRemove }) {
  const isCharm = link.type === 'charm'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    disabled: !isCharm ? { draggable: false, droppable: true } : false,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 10,
    opacity: isDragging ? 0.65 : 1,
  }

  if (!isCharm) {
    return (
      <div ref={setNodeRef} style={style} className="relative shrink-0">
        <PlainLinkGraphic stroke={chainStroke} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative shrink-0 rounded-full border-2 border-jscolors-gold bg-white p-2 shadow-md touch-none"
      {...attributes}
      {...listeners}
    >
      <CharmSvgIcon charm={link.charm} className="h-8 w-8 text-jscolors-pink" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(link.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-jscolors-gold/60 bg-white text-xs leading-none text-jscolors-navy/70 opacity-0 shadow transition hover:bg-jscolors-pink/40 hover:text-jscolors-navy group-hover:opacity-100 focus:opacity-100"
        aria-label={`Remove ${link.charm.name}`}
      >
        ×
      </button>
    </div>
  )
}

function PlainLinkGraphic({ stroke }) {
  return (
    <svg className="h-10 w-5 shrink-0" viewBox="0 0 20 40" fill="none" aria-hidden>
      <rect x="3" y="10" width="14" height="20" rx="3" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.65)" />
      <line x1="10" y1="14" x2="10" y2="26" stroke={stroke} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

function BraceletBaseGraphic({ stroke, linkCount }) {
  const slots = Math.max(linkCount, BASE_LINK_COUNT)
  const width = Math.min(920, 40 + slots * 26)
  const height = 80

  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[100px] -translate-x-1/2 -translate-y-1/2 md:h-[120px]"
      style={{ width: `min(100%, ${width}px)` }}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
    >
      <path
        d={`M40 40c${Math.round((width - 80) * 0.12)}-28 ${Math.round((width - 80) * 0.32)}-28 ${Math.round((width - 80) * 0.44)} 0 ${Math.round((width - 80) * 0.12)} 28 ${Math.round((width - 80) * 0.32)} 28 ${Math.round((width - 80) * 0.44)} 0`}
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  )
}

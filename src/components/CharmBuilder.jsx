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
import { BASE_OPTIONS, charms, DEFAULT_BRACELET_SIZE, getApproximateLengthInches, getCharmById, getSizeLengthLabel, parseCharmCountInput, SIZE_OPTIONS } from '../data/charms'
import { CharmSvgIcon, CharmPickerGrid } from './CharmIcon'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'
import { useCart } from '../context/CartContext.jsx'
import {
  addCharmToLinkOrder,
  createInitialLinkOrder,
  createLinkOrderForSize,
  getCharmsFromLinkOrder,
  loadInitialLinkOrder,
  removeCharmFromLinkOrder,
} from '../utils/braceletLinks'

const SIZE_GUIDE_PHOTOS = [
  {
    src: '/images/size-guide/measure-wrist.jpg',
    alt: 'Measuring wrist with a tape measure to determine bracelet size',
    caption: 'Measure Your Wrist',
  },
  {
    src: '/images/size-guide/select-size.jpg',
    alt: 'Selecting the number of charm links for a custom Italian charm bracelet',
    caption: 'Select Your Size',
  },
  {
    src: '/images/size-guide/enjoy-fit.jpg',
    alt: 'Finished charm bracelet worn comfortably on the wrist',
    caption: 'Enjoy Your Fit',
  },
]

export function CharmBuilder({
  className = '',
  idPrefix = 'builder',
  instructionLabel,
  linkOrder: controlledLinkOrder,
  onLinkOrderChange,
  selectedSize: controlledSelectedSize,
  onSelectedSizeChange,
}) {
  const navigate = useNavigate()
  const { addItem, addBraceletBuild, replaceBraceletBuild, braceletBuilds } = useCart()
  const [editingBuildId, setEditingBuildId] = useState(null)
  const [baseId, setBaseId] = useState(() => {
    const saved = readJson(STORAGE_KEYS.savedBuild, null)
    return saved?.baseId ?? BASE_OPTIONS[0].id
  })
  const [internalLinkOrder, setInternalLinkOrder] = useState(loadInitialLinkOrder)
  const [internalSelectedSize, setInternalSelectedSize] = useState(() => {
    const saved = readJson(STORAGE_KEYS.savedBuild, null)
    return typeof saved?.charmCount === 'number' ? saved.charmCount : null
  })
  const [customSizeInput, setCustomSizeInput] = useState('')
  const [customSizeError, setCustomSizeError] = useState(null)
  const [isSizePickerExpanded, setIsSizePickerExpanded] = useState(true)
  const [sizeChangeError, setSizeChangeError] = useState(null)
  const isControlled = controlledLinkOrder !== undefined && onLinkOrderChange !== undefined
  const isSizeControlled = controlledSelectedSize !== undefined && onSelectedSizeChange !== undefined
  const linkOrder = isControlled ? controlledLinkOrder : internalLinkOrder
  const selectedSize = isSizeControlled ? controlledSelectedSize : internalSelectedSize

  function updateLinkOrder(updater) {
    if (isControlled) {
      onLinkOrderChange(updater)
    } else {
      setInternalLinkOrder(updater)
    }
  }

  function updateSelectedSize(nextSize) {
    if (isSizeControlled) {
      onSelectedSizeChange(nextSize)
    } else {
      setInternalSelectedSize(nextSize)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const base = BASE_OPTIONS.find((b) => b.id === baseId) ?? BASE_OPTIONS[0]
  const pickerCharms = useMemo(() => charms.filter((c) => c.category !== 'starter'), [])
  const selected = useMemo(() => getCharmsFromLinkOrder(linkOrder), [linkOrder])
  const braceletFull =
    selectedSize != null && linkOrder.length >= selectedSize && !linkOrder.some((link) => link.type === 'plain')
  const parsedCustomSize = parseCharmCountInput(customSizeInput)

  function clearCustomSizeInput() {
    setCustomSizeInput('')
    setCustomSizeError(null)
  }

  function handleCustomSizeInputChange(event) {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 2)
    setCustomSizeInput(digitsOnly)
    setCustomSizeError(null)
  }

  function handleCustomSizeConfirm() {
    const charmCount = parseCharmCountInput(customSizeInput)
    if (charmCount == null) {
      setCustomSizeError('Enter a whole number between 10 and 30 charms.')
      return
    }

    clearCustomSizeInput()
    handleSizeSelect(charmCount)
  }

  function addCharm(c) {
    if (c.category === 'starter' || selectedSize == null || braceletFull) return
    updateLinkOrder((prev) => addCharmToLinkOrder(prev, c))
  }

  function removeCharm(linkId) {
    updateLinkOrder((prev) => removeCharmFromLinkOrder(prev, linkId))
  }

  function handleBaseChange(nextBaseId) {
    setBaseId(nextBaseId)
  }

  function handleSizeSelect(charmCount) {
    const charmsOnTrack = getCharmsFromLinkOrder(linkOrder)

    if (charmsOnTrack.length > charmCount) {
      setSizeChangeError('Remove some charms first to choose a smaller size.')
      return
    }

    const nextCharms = charmsOnTrack.slice(0, charmCount)
    clearCustomSizeInput()
    setSizeChangeError(null)
    updateSelectedSize(charmCount)
    updateLinkOrder(createLinkOrderForSize(charmCount, nextCharms))
    setIsSizePickerExpanded(false)
  }

  function handleChangeSizeClick() {
    setIsSizePickerExpanded(true)
    setSizeChangeError(null)
  }

  function reset() {
    setEditingBuildId(null)
    clearCustomSizeInput()
    setIsSizePickerExpanded(true)
    setSizeChangeError(null)
    updateSelectedSize(null)
    updateLinkOrder(createInitialLinkOrder(DEFAULT_BRACELET_SIZE))
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function handleContinueBuild(buildId) {
    const build = braceletBuilds.find((b) => b.buildId === buildId)
    if (!build) return

    const slotCount = build.charmCount ?? DEFAULT_BRACELET_SIZE
    setEditingBuildId(build.buildId)
    setBaseId(build.metal)
    updateSelectedSize(slotCount)
    updateLinkOrder(linkOrderFromSavedCharms(build.charms, slotCount))
    setIsSizePickerExpanded(false)
    setSizeChangeError(null)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function handleStartNewBracelet() {
    setEditingBuildId(null)
    clearCustomSizeInput()
    setIsSizePickerExpanded(true)
    setSizeChangeError(null)
    updateSelectedSize(null)
    updateLinkOrder(createInitialLinkOrder(DEFAULT_BRACELET_SIZE))
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function addToCart() {
    if (selectedSize == null) return

    const currentBuild = {
      metal: base.id,
      charmCount: selectedSize,
      charms: selected.map((c) => ({
        id: c.id,
        image: c.image,
        name: c.name,
      })),
    }

    if (editingBuildId) {
      replaceBraceletBuild(editingBuildId, currentBuild)
    } else {
      addItem({ id: base.id, name: base.label, price: base.price, metal: base.id, quantity: 1 })

      selected.forEach((c) => {
        addItem({
          id: c.id,
          name: c.name,
          price: c.price,
          metal: c.metal,
          image: c.image,
          quantity: 1,
        })
      })

      addBraceletBuild(currentBuild)
    }

    setEditingBuildId(null)
    updateSelectedSize(null)
    updateLinkOrder(createInitialLinkOrder(DEFAULT_BRACELET_SIZE))
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
  const trackInstructionLabel =
    selectedSize != null
      ? `Tap to add · drag to rearrange · ${selectedSize ?? DEFAULT_BRACELET_SIZE} link slots`
      : null
  const showHeaderInstruction = selectedSize == null && instructionLabel
  const showDefaultHeading = selectedSize == null && !instructionLabel

  return (
    <section
      className={`mx-auto max-w-6xl ${className}`}
      aria-labelledby={
        showHeaderInstruction
          ? `${idPrefix}-instruction`
          : trackInstructionLabel
            ? `${idPrefix}-track-instruction`
            : `${idPrefix}-heading`
      }
    >
      {showHeaderInstruction && (
        <p
          id={`${idPrefix}-instruction`}
          className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm"
        >
          {instructionLabel}
        </p>
      )}
      {showDefaultHeading && (
        <div className="text-center">
          <h2 id={`${idPrefix}-heading`} className="font-display text-2xl font-bold text-jscolors-navy md:text-3xl">
            Interactive Charm Studio
          </h2>
          <p className="mt-2 text-sm text-jscolors-charcoal/80 md:text-base">
            Choose your base and size, then tap charms to add them and drag to rearrange.
          </p>
        </div>
      )}

      {braceletBuilds.length > 0 && (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-jscolors-gold/35 bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-semibold text-jscolors-navy">Continue a previous build</p>
          <ul className="mt-3 space-y-2" role="listbox" aria-label="Continue a previous build">
            {braceletBuilds.map((build) => (
              <li key={build.buildId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={editingBuildId === build.buildId}
                  onClick={() => handleContinueBuild(build.buildId)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${
                    editingBuildId === build.buildId
                      ? 'border-jscolors-pink bg-jscolors-pink/10'
                      : 'border-jscolors-gold/30 bg-white hover:border-jscolors-gold'
                  }`}
                >
                  <PreviousBuildOptionPreview build={build} />
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={editingBuildId === null}
                onClick={handleStartNewBracelet}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                  editingBuildId === null
                    ? 'border-jscolors-pink bg-jscolors-pink/10 text-jscolors-navy'
                    : 'border-jscolors-gold/30 bg-white text-jscolors-navy hover:border-jscolors-gold'
                }`}
              >
                Start a new bracelet instead
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className={`retro-card border-jscolors-gold/35 p-5 md:p-8 ${showHeaderInstruction || showDefaultHeading || braceletBuilds.length > 0 ? 'mt-6' : 'mt-8'}`}>
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

        {(selectedSize == null || isSizePickerExpanded) && (
          <div className="mt-8">
            <p className="text-center text-sm font-semibold text-jscolors-navy">Choose your size</p>
            <p className="mx-auto mt-2 max-w-full px-2 text-center text-xs text-jscolors-charcoal/75 whitespace-nowrap max-[389px]:text-[9px] sm:text-sm">
              Small wrist: 16–18 charms · Medium wrist: 19–21 charms · Large wrist: 22–24 charms
            </p>
            <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-4 sm:gap-6">
              {SIZE_GUIDE_PHOTOS.map((photo) => (
                <div key={photo.src} className="flex flex-col items-center text-center">
                  <div className="aspect-square w-full max-w-[140px] overflow-hidden rounded-2xl sm:max-w-[160px]">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-jscolors-navy sm:text-sm">{photo.caption}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-5 max-w-md overflow-hidden rounded-xl border border-jscolors-gold/35 bg-white/80 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-jscolors-gold/25 bg-jscolors-cream/60">
                    <th className="px-4 py-3 text-left font-semibold text-jscolors-navy">Charms</th>
                    <th className="px-4 py-3 text-left font-semibold text-jscolors-navy">Length</th>
                    <th className="sr-only">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_OPTIONS.map((option) => (
                    <tr key={option.charmCount} className="border-b border-jscolors-gold/15 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-jscolors-navy">{option.charmCount}</td>
                      <td className="px-4 py-3 text-jscolors-charcoal/80">{option.lengthInches}&quot;</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSizeSelect(option.charmCount)}
                          className="rounded-full border-2 border-jscolors-gold/40 bg-white px-4 py-1.5 text-xs font-semibold text-jscolors-navy transition hover:border-jscolors-pink hover:bg-jscolors-pink/10"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mx-auto mt-4 max-w-md rounded-xl border border-jscolors-gold/35 bg-white/80 p-4 shadow-sm">
              <label htmlFor={`${idPrefix}-custom-size`} className="block text-sm font-semibold text-jscolors-navy">
                Custom size
              </label>
              <p className="mt-1 text-xs text-jscolors-charcoal/75">Enter 10–30 charms if you need a size outside the table.</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id={`${idPrefix}-custom-size`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customSizeInput}
                  onChange={handleCustomSizeInputChange}
                  placeholder="e.g. 12"
                  className="w-24 rounded-lg border-2 border-jscolors-gold/35 bg-white px-3 py-2 text-sm font-medium text-jscolors-navy outline-none transition focus:border-jscolors-pink"
                  aria-describedby={customSizeError ? `${idPrefix}-custom-size-error` : undefined}
                />
                <span className="text-sm text-jscolors-charcoal/80">charms</span>
                <button
                  type="button"
                  onClick={handleCustomSizeConfirm}
                  disabled={parsedCustomSize == null}
                  className="ml-auto rounded-full border-2 border-jscolors-gold/40 bg-white px-4 py-2 text-xs font-semibold text-jscolors-navy transition hover:border-jscolors-pink hover:bg-jscolors-pink/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use custom size
                </button>
              </div>
              {parsedCustomSize != null && (
                <p className="mt-2 text-xs text-jscolors-charcoal/75">
                  Estimated length: {getSizeLengthLabel(parsedCustomSize)}
                </p>
              )}
              {customSizeError && (
                <p id={`${idPrefix}-custom-size-error`} className="mt-2 text-xs text-red-600" role="alert">
                  {customSizeError}
                </p>
              )}
            </div>
            {sizeChangeError && (
              <p className="mx-auto mt-3 max-w-md text-center text-xs text-red-600" role="alert">
                {sizeChangeError}
              </p>
            )}
          </div>
        )}

        {selectedSize != null && !isSizePickerExpanded && (
          <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-between gap-3 rounded-xl border border-jscolors-gold/35 bg-jscolors-cream/50 px-4 py-3">
            <p className="text-sm font-semibold text-jscolors-navy">{formatSizeSummary(selectedSize)}</p>
            <button
              type="button"
              onClick={handleChangeSizeClick}
              className="shrink-0 text-sm font-semibold text-jscolors-navy underline decoration-jscolors-gold-warm underline-offset-2 transition hover:text-jscolors-pink"
            >
              Change size
            </button>
          </div>
        )}

        {selectedSize != null && (
          <>
        <p
          id={`${idPrefix}-track-instruction`}
          className={`text-center text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm ${isSizePickerExpanded ? 'mt-8' : 'mt-6'}`}
        >
          {trackInstructionLabel}
        </p>
        <div className="relative mt-2">
          <BraceletBaseGraphic stroke={chainStroke} linkCount={selectedSize} />
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
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {braceletFull && (
          <p className="mt-6 text-center text-sm font-medium text-jscolors-pink">
            All {selectedSize} slots filled — remove a charm to swap something in.
          </p>
        )}

        <div className={`flex flex-wrap justify-center gap-3 ${braceletFull ? 'mt-6' : 'mt-8'}`}>
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
            <CharmPickerGrid charms={pickerCharms} onPick={addCharm} maxReached={braceletFull} />
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  )
}

function formatSizeSummary(charmCount) {
  const exact = SIZE_OPTIONS.find((option) => option.charmCount === charmCount)
  if (exact) {
    return `Size: ${charmCount} charms (${exact.lengthInches} inches)`
  }

  return `Size: ${charmCount} charms (~${getApproximateLengthInches(charmCount)} inches, approx.)`
}

function linkOrderFromSavedCharms(savedCharms, slotCount) {
  const charmsOnTrack = savedCharms
    .map((c) => getCharmById(c.id))
    .filter((charm) => charm && charm.category !== 'starter')

  return createLinkOrderForSize(slotCount, charmsOnTrack)
}

function PreviousBuildOptionPreview({ build }) {
  const metalLabel = build.metal === 'gold' ? 'Gold' : 'Silver'
  const charmCount = build.charms.length
  const sizeLabel = build.charmCount ? `${build.charmCount} links` : null
  const summary =
    charmCount === 0
      ? 'No charms yet'
      : `${charmCount} charm${charmCount === 1 ? '' : 's'} · starts with ${build.charms[0].name}`

  return (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center">
        {build.charms.length > 0 ? (
          build.charms.slice(0, 4).map((charm, index) => (
            <div
              key={`${charm.id}-${index}`}
              className={`${index > 0 ? '-ml-2' : ''} rounded-full border-2 border-jscolors-gold bg-white p-0.5 shadow-sm`}
            >
              {charm.image ? (
                <img src={charm.image} alt="" className="h-7 w-7 object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gray-200" aria-hidden />
              )}
            </div>
          ))
        ) : (
          <div className="h-8 w-8 rounded-full border-2 border-dashed border-jscolors-gold/40 bg-jscolors-cream/80" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-jscolors-navy">
          {metalLabel} bracelet{sizeLabel ? ` · ${sizeLabel}` : ''}
        </p>
        <p className="mt-0.5 truncate text-xs text-jscolors-charcoal/75">{summary}</p>
      </div>
    </div>
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
  const slots = linkCount
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

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
import { BASE_OPTIONS, charms, CHARM_CATEGORY_FILTERS, DEFAULT_BRACELET_SIZE, getApproximateLengthInches, getCharmById, getCharmCapacity, getFillerCharmForMetal, getSizeLengthLabel, isFillerCharm, isWatchBase, parseCharmCountInput, SIZE_OPTIONS, WATCH_BASE_CHARM_RESERVE } from '../data/charms'
import { CharmSvgIcon, CharmPickerGrid } from './CharmIcon'
import { CharmPickerScrollArea } from './CharmPickerScrollArea'
import { CharmSearchInput } from './CharmSearchInput'
import { FilterBar } from './FilterBar'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'
import { filterCharmList } from '../utils/charmFilters'
import { fetchInventoryWithMismatchReport } from '../utils/inventoryApi'
import { isCharmOutOfStock } from '../utils/inventory'
import { useCart } from '../context/CartContext.jsx'
import {
  addCharmToLinkOrder,
  createCharmLink,
  createInitialLinkOrder,
  createLinkOrderForSize,
  createPlainLink,
  getCharmsFromLinkOrder,
  loadInitialLinkOrder,
  removeCharmFromLinkOrder,
} from '../utils/braceletLinks'

const PICKER_FILTERS = CHARM_CATEGORY_FILTERS.filter((f) => f.id !== 'Starter Bracelets')

const SIZE_GUIDE_PHOTOS = [
  {
    src: '/images/size-guide/measure-wrist.webp',
    alt: 'Measuring wrist with a tape measure to determine bracelet size',
    caption: 'Measure Your Wrist',
  },
  {
    src: '/images/size-guide/select-size.webp',
    alt: 'Selecting the number of charm links for a custom Italian charm bracelet',
    caption: 'Select Your Size',
  },
  {
    src: '/images/size-guide/enjoy-fit.webp',
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
  const [baseChangeError, setBaseChangeError] = useState(null)
  const [pickerFilter, setPickerFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [justAddedId, setJustAddedId] = useState(null)
  const [addToast, setAddToast] = useState(null)
  const justAddedTimeoutRef = useRef(null)
  const addToastTimeoutRef = useRef(null)
  const addToastKeyRef = useRef(0)
  const [inventoryMap, setInventoryMap] = useState(null)
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const base = BASE_OPTIONS.find((b) => b.id === baseId) ?? BASE_OPTIONS[0]
  const isWatchBand = isWatchBase(base.id)
  const charmCapacity = selectedSize != null ? getCharmCapacity(selectedSize, base.id) : null
  const pickerCharms = useMemo(() => {
    const available = charms.filter((c) => c.category !== 'Starter Bracelets' && !isFillerCharm(c))
    return filterCharmList(available, { filter: pickerFilter, query: searchQuery })
  }, [pickerFilter, searchQuery])
  const selected = useMemo(() => getCharmsFromLinkOrder(linkOrder), [linkOrder])
  const onBraceletCounts = useMemo(() => {
    const counts = {}
    for (const charm of selected) {
      counts[charm.id] = (counts[charm.id] ?? 0) + 1
    }
    return counts
  }, [selected])
  const braceletFull =
    charmCapacity != null && linkOrder.length >= charmCapacity && !linkOrder.some((link) => link.type === 'plain')
  const parsedCustomSize = parseCharmCountInput(customSizeInput)

  useEffect(() => {
    return () => {
      if (justAddedTimeoutRef.current) clearTimeout(justAddedTimeoutRef.current)
      if (addToastTimeoutRef.current) clearTimeout(addToastTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchInventoryWithMismatchReport().then(({ inventory }) => {
      if (!cancelled) setInventoryMap(inventory)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function isOutOfStockForCharm(charm) {
    return isCharmOutOfStock(charm.name, base.metal, inventoryMap)
  }

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
    if (c.category === 'Starter Bracelets' || isFillerCharm(c) || selectedSize == null || braceletFull) return
    if (isCharmOutOfStock(c.name, base.metal, inventoryMap)) return
    updateLinkOrder((prev) => addCharmToLinkOrder(prev, c))

    const nextCount = selected.length + 1
    addToastKeyRef.current += 1
    setJustAddedId(c.id)
    setAddToast({
      key: addToastKeyRef.current,
      name: c.name,
      count: nextCount,
      size: charmCapacity,
    })

    if (justAddedTimeoutRef.current) clearTimeout(justAddedTimeoutRef.current)
    if (addToastTimeoutRef.current) clearTimeout(addToastTimeoutRef.current)

    justAddedTimeoutRef.current = setTimeout(() => setJustAddedId(null), 1400)
    addToastTimeoutRef.current = setTimeout(() => setAddToast(null), 2200)
  }

  function removeCharm(linkId) {
    updateLinkOrder((prev) => removeCharmFromLinkOrder(prev, linkId))
    setBaseChangeError(null)
  }

  function handleBaseChange(nextBaseId) {
    if (nextBaseId === baseId) return

    if (selectedSize == null) {
      setBaseId(nextBaseId)
      setBaseChangeError(null)
      return
    }

    const nextCapacity = getCharmCapacity(selectedSize, nextBaseId)
    const charmsOnTrack = getCharmsFromLinkOrder(linkOrder)

    if (charmsOnTrack.length > nextCapacity) {
      const overflow = charmsOnTrack.length - nextCapacity
      setBaseChangeError(
        `The watch face takes up space for ${WATCH_BASE_CHARM_RESERVE} charms, so this size only holds ${nextCapacity}. Remove ${overflow} charm${overflow === 1 ? '' : 's'} first, then you can switch.`,
      )
      return
    }

    setBaseId(nextBaseId)
    setBaseChangeError(null)
    setSizeChangeError(null)
    if (nextCapacity !== linkOrder.length) {
      updateLinkOrder(createLinkOrderForSize(nextCapacity, charmsOnTrack))
    }
  }

  function handleSizeSelect(charmCount) {
    const capacity = getCharmCapacity(charmCount, baseId)
    const charmsOnTrack = getCharmsFromLinkOrder(linkOrder)

    if (charmsOnTrack.length > capacity) {
      setSizeChangeError(
        isWatchBase(baseId)
          ? `This watch band only holds ${capacity} charms at that size. Remove some charms first, then choose it.`
          : 'Remove some charms first to choose a smaller size.',
      )
      return
    }

    const nextCharms = charmsOnTrack.slice(0, capacity)
    clearCustomSizeInput()
    setSizeChangeError(null)
    setBaseChangeError(null)
    updateSelectedSize(charmCount)
    updateLinkOrder(createLinkOrderForSize(capacity, nextCharms))
    setIsSizePickerExpanded(false)
  }

  function handleChangeSizeClick() {
    setIsSizePickerExpanded(true)
    setSizeChangeError(null)
    setBaseChangeError(null)
  }

  function reset() {
    setEditingBuildId(null)
    clearCustomSizeInput()
    setIsSizePickerExpanded(true)
    setSizeChangeError(null)
    setBaseChangeError(null)
    updateSelectedSize(null)
    updateLinkOrder(createInitialLinkOrder(DEFAULT_BRACELET_SIZE))
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function handleContinueBuild(buildId) {
    const build = braceletBuilds.find((b) => b.buildId === buildId)
    if (!build) return

    const nextBaseId = build.baseId ?? build.metal
    const nominalSize = build.charmCount ?? DEFAULT_BRACELET_SIZE
    const slotCount = getCharmCapacity(nominalSize, nextBaseId) ?? DEFAULT_BRACELET_SIZE
    setEditingBuildId(build.buildId)
    setBaseId(nextBaseId)
    updateSelectedSize(nominalSize)
    updateLinkOrder(linkOrderFromSavedCharms(build.charms, slotCount))
    setIsSizePickerExpanded(false)
    setSizeChangeError(null)
    setBaseChangeError(null)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function handleStartNewBracelet() {
    setEditingBuildId(null)
    clearCustomSizeInput()
    setIsSizePickerExpanded(true)
    setSizeChangeError(null)
    setBaseChangeError(null)
    updateSelectedSize(null)
    updateLinkOrder(createInitialLinkOrder(DEFAULT_BRACELET_SIZE))
    setBaseId(BASE_OPTIONS[0].id)
    writeJson(STORAGE_KEYS.savedBuild, null)
  }

  function addToCart() {
    if (selectedSize == null) return

    // Persist every slot (real charms + fillers) so order emails / rebuilds
    // keep absolute positions — not just the real-charm subsequence.
    const filler = getFillerCharmForMetal(base.metal)
    const slotSequence = linkOrder.map((link) => {
      if (link.type === 'charm' && link.charm && !isFillerCharm(link.charm)) {
        return {
          id: link.charm.id,
          image: link.charm.image,
          name: link.charm.name,
        }
      }
      return {
        id: filler.id,
        image: filler.image,
        name: filler.name,
      }
    })

    const currentBuild = {
      baseId: base.id,
      metal: base.metal,
      charmCount: selectedSize,
      charms: slotSequence,
    }

    if (editingBuildId) {
      replaceBraceletBuild(editingBuildId, currentBuild)
    } else {
      addItem({ id: base.id, name: base.label, price: base.price, metal: base.metal, image: base.image, quantity: 1 })

      selected.forEach((c) => {
        if (isFillerCharm(c)) return
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

  const chainStroke = base.metal === 'gold' ? '#d4af37' : '#b8bcc6'
  const sortableIds = linkOrder.map((link) => link.id)
  const trackInstructionLabel =
    charmCapacity != null
      ? `Tap to add · drag to rearrange · ${charmCapacity} link slots`
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
          <h2 id={`${idPrefix}-heading`} className="font-display text-2xl font-bold text-jscolors-ink md:text-3xl">
            Interactive Charm Studio
          </h2>
          <p className="mt-2 text-sm text-jscolors-ink/80 md:text-base">
            Choose your base and size, then tap charms to add them and drag to rearrange.
          </p>
        </div>
      )}

      {braceletBuilds.length > 0 && (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-jscolors-gold/35 bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-semibold text-jscolors-ink">Continue a previous build</p>
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
                    ? 'border-jscolors-pink bg-jscolors-pink/10 text-jscolors-ink'
                    : 'border-jscolors-gold/30 bg-white text-jscolors-ink hover:border-jscolors-gold'
                }`}
              >
                Start a new bracelet instead
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className={`retro-card border-jscolors-gold/35 p-5 md:p-8 ${showHeaderInstruction || showDefaultHeading || braceletBuilds.length > 0 ? 'mt-6' : 'mt-8'}`}>
        <p className="text-center text-sm font-semibold text-jscolors-ink">Choose your base</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
          {BASE_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleBaseChange(b.id)}
              className={`flex w-full flex-col items-center overflow-hidden rounded-2xl border-2 bg-white text-left transition sm:w-[168px] ${
                baseId === b.id
                  ? 'border-jscolors-pink shadow-md'
                  : 'border-jscolors-gold/40 hover:border-jscolors-gold'
              }`}
            >
              <img
                src={b.image}
                alt={b.label}
                className="aspect-[3/2] w-full object-contain bg-white p-2"
                loading="lazy"
                decoding="async"
              />
              <span
                className={`w-full px-3 py-2.5 text-center text-sm font-semibold ${
                  baseId === b.id ? 'bg-jscolors-pink text-white' : 'text-jscolors-ink'
                }`}
              >
                {b.label} — ${b.price}
              </span>
            </button>
          ))}
        </div>
        {isWatchBand && (
          <p className="mx-auto mt-3 max-w-lg text-center text-xs text-jscolors-ink/75 text-balance sm:text-sm">
            The watch face takes up space for {WATCH_BASE_CHARM_RESERVE} charms, so this size holds {WATCH_BASE_CHARM_RESERVE} fewer.
          </p>
        )}
        {baseChangeError && (
          <p className="mx-auto mt-3 max-w-lg text-center text-xs text-red-600" role="alert">
            {baseChangeError}
          </p>
        )}

        {(selectedSize == null || isSizePickerExpanded) && (
          <div className="mt-8">
            <p className="text-center text-sm font-semibold text-jscolors-ink">Choose your size</p>
            <p className="mx-auto mt-2 max-w-full px-2 text-center text-xs text-jscolors-ink/75 text-balance sm:text-sm">
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
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-jscolors-ink sm:text-sm">{photo.caption}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-5 max-w-md overflow-hidden rounded-xl border border-jscolors-gold/35 bg-white/80 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-jscolors-gold/25 bg-jscolors-cream/60">
                    <th className="px-4 py-3 text-left font-semibold text-jscolors-ink">Charms</th>
                    <th className="px-4 py-3 text-left font-semibold text-jscolors-ink">Length</th>
                    <th className="sr-only">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_OPTIONS.map((option) => (
                    <tr key={option.charmCount} className="border-b border-jscolors-gold/15 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-jscolors-ink">{option.charmCount}</td>
                      <td className="px-4 py-3 text-jscolors-ink/80">{option.lengthInches}&quot;</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSizeSelect(option.charmCount)}
                          className="rounded-full border-2 border-jscolors-gold/40 bg-white px-4 py-1.5 text-xs font-semibold text-jscolors-ink transition hover:border-jscolors-pink hover:bg-jscolors-pink/10"
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
              <label htmlFor={`${idPrefix}-custom-size`} className="block text-sm font-semibold text-jscolors-ink">
                Custom size
              </label>
              <p className="mt-1 text-xs text-jscolors-ink/75">Enter 10–30 charms if you need a size outside the table.</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id={`${idPrefix}-custom-size`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customSizeInput}
                  onChange={handleCustomSizeInputChange}
                  placeholder="e.g. 12"
                  className="w-24 rounded-lg border-2 border-jscolors-gold/35 bg-white px-3 py-2 text-sm font-medium text-jscolors-ink outline-none transition focus:border-jscolors-pink"
                  aria-describedby={customSizeError ? `${idPrefix}-custom-size-error` : undefined}
                />
                <span className="text-sm text-jscolors-ink/80">charms</span>
                <button
                  type="button"
                  onClick={handleCustomSizeConfirm}
                  disabled={parsedCustomSize == null}
                  className="ml-auto rounded-full border-2 border-jscolors-gold/40 bg-white px-4 py-2 text-xs font-semibold text-jscolors-ink transition hover:border-jscolors-pink hover:bg-jscolors-pink/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use custom size
                </button>
              </div>
              {parsedCustomSize != null && (
                <p className="mt-2 text-xs text-jscolors-ink/75">
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
            <p className="text-sm font-semibold text-jscolors-ink">{formatSizeSummary(selectedSize, charmCapacity, isWatchBand)}</p>
            <button
              type="button"
              onClick={handleChangeSizeClick}
              className="shrink-0 text-sm font-semibold text-jscolors-ink underline decoration-jscolors-gold-warm underline-offset-2 transition hover:text-jscolors-pink"
            >
              Change size
            </button>
          </div>
        )}

        {selectedSize != null && charmCapacity != null && (
          <>
        <p
          id={`${idPrefix}-track-instruction`}
          className={`text-center text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm ${isSizePickerExpanded ? 'mt-8' : 'mt-6'}`}
        >
          {trackInstructionLabel}
        </p>
        <div className="relative mt-2 min-w-0">
          <BraceletBaseGraphic stroke={chainStroke} linkCount={charmCapacity} />
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
              <div className="relative mx-auto flex min-h-[120px] w-full min-w-0 max-w-full items-center justify-center gap-px overflow-x-auto overscroll-x-contain px-3 py-8 sm:px-4">
                {linkOrder.map((link) => (
                  <SortableBraceletLink
                    key={link.id}
                    link={link}
                    metal={base.metal}
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
            All {charmCapacity} slots filled — remove a charm to swap something in.
          </p>
        )}

        <div className={`flex flex-wrap justify-center gap-3 ${braceletFull ? 'mt-6' : 'mt-8'}`}>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border-2 border-jscolors-charcoal/25 bg-white px-6 py-3 text-sm font-semibold text-jscolors-ink hover:border-jscolors-gold"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={addToCart}
            className="rounded-full bg-jscolors-cta px-6 py-3 text-sm font-semibold text-jscolors-cream shadow hover:bg-jscolors-cta-hover"
          >
            Add to Cart →
          </button>
        </div>

        <div className="mt-10 border-t border-jscolors-gold/25 pt-8">
          <div className="flex flex-col items-center gap-1">
            <p className="text-center text-sm font-semibold text-jscolors-ink">Add charms</p>
            <p
              className="text-center text-xs font-medium text-jscolors-ink/70"
              aria-live="polite"
            >
              <span className="tabular-nums text-jscolors-pink">{selected.length}</span>
              {' of '}
              <span className="tabular-nums">{charmCapacity}</span>
              {' charms'}
            </p>
            {isWatchBand && (
              <p className="mx-auto mt-1 max-w-sm text-center text-xs text-jscolors-ink/65 text-balance">
                The watch face takes up space for {WATCH_BASE_CHARM_RESERVE} charms, so this size holds {WATCH_BASE_CHARM_RESERVE} fewer.
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {addToast && (
              <motion.div
                key={addToast.key}
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="mx-auto mt-3 w-full max-w-sm"
              >
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 shadow-md shadow-emerald-900/10">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-semibold text-emerald-900">
                    <span className="line-clamp-1">{addToast.name} added</span>
                    <span className="mt-0.5 block text-xs font-medium text-emerald-700/90">
                      {addToast.count} of {addToast.size} charms
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mx-auto mt-4 max-w-xl">
            <CharmSearchInput
              id={`${idPrefix}-charm-search`}
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </div>
          <div className="mt-4">
            <FilterBar
              active={pickerFilter}
              onChange={setPickerFilter}
              filters={PICKER_FILTERS}
              layoutId={`${idPrefix}-filter-pill`}
            />
          </div>
          <CharmPickerScrollArea>
            {pickerCharms.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-jscolors-gold/40 bg-white/60 p-8 text-center">
                <p className="font-display text-xl font-semibold text-jscolors-ink">No charms match that filter</p>
                <p className="mt-2 text-sm text-jscolors-ink/80">
                  Try a different search, metal, or category — fresh favorites are always rolling in.
                </p>
              </div>
            ) : (
              <CharmPickerGrid
                charms={pickerCharms}
                onPick={addCharm}
                maxReached={braceletFull}
                onBraceletCounts={onBraceletCounts}
                justAddedId={justAddedId}
                isOutOfStock={isOutOfStockForCharm}
              />
            )}
          </CharmPickerScrollArea>
        </div>
          </>
        )}
      </div>
    </section>
  )
}

function formatSizeSummary(charmCount, charmCapacity = charmCount, isWatchBand = false) {
  const exact = SIZE_OPTIONS.find((option) => option.charmCount === charmCount)
  const lengthPart = exact
    ? `${exact.lengthInches} inches`
    : `~${getApproximateLengthInches(charmCount)} inches, approx.`

  if (isWatchBand && charmCapacity != null && charmCapacity !== charmCount) {
    return `Size: ${charmCount} (${lengthPart}) · ${charmCapacity} charm slots`
  }

  return `Size: ${charmCount} charms (${lengthPart})`
}

function linkOrderFromSavedCharms(savedCharms, slotCount) {
  const hasExplicitFillers = savedCharms.some((c) => isFillerCharm(c))
  const looksLikeFullSequence =
    hasExplicitFillers && savedCharms.length > 0 && savedCharms.length === slotCount

  if (looksLikeFullSequence) {
    return savedCharms.map((entry) => {
      if (isFillerCharm(entry)) return createPlainLink()
      const charm = getCharmById(entry.id)
      if (!charm || charm.category === 'Starter Bracelets' || isFillerCharm(charm)) {
        return createPlainLink()
      }
      return createCharmLink(charm)
    })
  }

  // Legacy builds stored only real charms (no fillers) — pack into slots left-to-right.
  const charmsOnTrack = savedCharms
    .map((c) => getCharmById(c.id))
    .filter((charm) => charm && charm.category !== 'Starter Bracelets' && !isFillerCharm(charm))

  return createLinkOrderForSize(slotCount, charmsOnTrack)
}

function PreviousBuildOptionPreview({ build }) {
  const base = BASE_OPTIONS.find((b) => b.id === (build.baseId ?? build.metal))
  const metalLabel = base?.label ?? (build.metal === 'gold' ? 'Gold' : 'Silver')
  const realCharms = (build.charms ?? []).filter((c) => !isFillerCharm(c))
  const charmCount = realCharms.length
  const sizeLabel = build.charmCount ? `${build.charmCount} links` : null
  const summary =
    charmCount === 0
      ? 'No charms yet'
      : `${charmCount} charm${charmCount === 1 ? '' : 's'} · starts with ${realCharms[0].name}`

  return (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center">
        {realCharms.length > 0 ? (
          realCharms.slice(0, 4).map((charm, index) => (
            <div
              key={`${charm.id}-${index}`}
              className={`${index > 0 ? '-ml-2' : ''} rounded-full border-2 border-jscolors-gold bg-white p-0.5 shadow-sm`}
            >
              {charm.image ? (
                <img src={charm.image} alt="" className="h-7 w-7 object-contain" loading="lazy" decoding="async" />
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
        <p className="font-display font-semibold text-jscolors-ink">
          {metalLabel}{sizeLabel ? ` · ${sizeLabel}` : ''}
        </p>
        <p className="mt-0.5 truncate text-xs text-jscolors-ink/75">{summary}</p>
      </div>
    </div>
  )
}

function SortableBraceletLink({ link, metal, chainStroke, onRemove }) {
  const isRealCharm = link.type === 'charm' && link.charm && !isFillerCharm(link.charm)
  const fillerCharm = getFillerCharmForMetal(metal)
  // Plain/filler slots must stay droppable (and draggable) so real charms can
  // reorder into them. @dnd-kit's `disabled` flags disable that interaction —
  // `{ droppable: true }` was incorrectly turning drops OFF.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 10,
    opacity: isDragging ? 0.65 : 1,
  }

  if (!isRealCharm) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative shrink-0 touch-none rounded-md border border-jscolors-gold/40 bg-white p-0.5 shadow-sm"
        {...attributes}
        {...listeners}
      >
        {fillerCharm?.image ? (
          <img
            src={fillerCharm.image}
            alt={fillerCharm.name}
            className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <PlainLinkGraphic stroke={chainStroke} />
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative shrink-0 touch-none rounded-md border border-jscolors-gold bg-white p-0.5 shadow-sm"
      {...attributes}
      {...listeners}
    >
      <CharmSvgIcon charm={link.charm} className="h-9 w-9 text-jscolors-pink sm:h-10 sm:w-10" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(link.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-jscolors-gold/60 bg-white text-xs leading-none text-jscolors-ink/70 opacity-0 shadow transition hover:bg-jscolors-pink/40 hover:text-jscolors-ink group-hover:opacity-100 focus:opacity-100"
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
  const width = Math.min(1100, 40 + slots * 22)
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

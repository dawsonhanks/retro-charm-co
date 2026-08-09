import { DEFAULT_BRACELET_SIZE, getCharmById, getCharmCapacity, isFillerCharm } from '../data/charms'
import { loadSavedBuild, readJson, STORAGE_KEYS } from './storage'

/** @deprecated Use DEFAULT_BRACELET_SIZE — kept for preview components */
export const BASE_LINK_COUNT = DEFAULT_BRACELET_SIZE

/** @typedef {{ id: string, type: 'plain' }} PlainLink */
/** @typedef {{ id: string, type: 'charm', charm: import('../data/charms').Charm }} CharmLink */
/** @typedef {PlainLink | CharmLink} BraceletLink */

let linkIdCounter = 0

export function createLinkId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  linkIdCounter += 1
  return `link-${Date.now()}-${linkIdCounter}`
}

/** @returns {PlainLink} */
export function createPlainLink() {
  return { id: createLinkId(), type: 'plain' }
}

/** @param {import('../data/charms').Charm} charm @returns {CharmLink} */
export function createCharmLink(charm) {
  return { id: createLinkId(), type: 'charm', charm }
}

/** @param {number} [slotCount] @returns {BraceletLink[]} */
export function createInitialLinkOrder(slotCount = DEFAULT_BRACELET_SIZE) {
  return Array.from({ length: slotCount }, () => createPlainLink())
}

/** @returns {number | null} */
export function loadInitialSelectedSize() {
  const saved = loadSavedBuild()
  return typeof saved?.charmCount === 'number' ? saved.charmCount : null
}

/** @returns {BraceletLink[]} */
export function loadInitialLinkOrder() {
  const saved = readJson(STORAGE_KEYS.savedBuild, null)
  const nominalSize = saved?.charmCount ?? DEFAULT_BRACELET_SIZE
  const slotCount = getCharmCapacity(nominalSize, saved?.baseId) ?? DEFAULT_BRACELET_SIZE

  if (Array.isArray(saved?.linkOrder) && saved.linkOrder.length > 0) {
    const restored = saved.linkOrder
      .map((link) => {
        if (link.type === 'charm' && link.charmId) {
          const charm = getCharmById(link.charmId)
          if (charm) return { id: link.id ?? createLinkId(), type: 'charm', charm }
        }
        if (link.type === 'plain') return { id: link.id ?? createLinkId(), type: 'plain' }
        return null
      })
      .filter(Boolean)
    if (restored.length > 0) return restored
  }
  if (Array.isArray(saved?.charmIds)) {
    return linkOrderFromCharmIds(saved.charmIds, getCharmById, slotCount)
  }
  return createInitialLinkOrder(slotCount)
}

/**
 * @param {BraceletLink[]} linkOrder
 * @returns {{ start: number, length: number }}
 */
export function findLargestPlainRun(linkOrder) {
  let bestStart = 0
  let bestLen = 0
  let currentStart = 0
  let currentLen = 0

  for (let i = 0; i < linkOrder.length; i++) {
    if (linkOrder[i].type === 'plain') {
      if (currentLen === 0) currentStart = i
      currentLen += 1
      if (currentLen > bestLen) {
        bestLen = currentLen
        bestStart = currentStart
      }
    } else {
      currentLen = 0
    }
  }

  return { start: bestStart, length: bestLen }
}

/**
 * @param {BraceletLink[]} linkOrder
 * @param {import('../data/charms').Charm} charm
 * @returns {BraceletLink[]}
 */
export function addCharmToLinkOrder(linkOrder, charm) {
  if (isFillerCharm(charm)) return linkOrder

  const hasPlain = linkOrder.some((link) => link.type === 'plain')

  if (!hasPlain) {
    return linkOrder
  }

  const { start, length } = findLargestPlainRun(linkOrder)
  const middleOffset = Math.floor((length - 1) / 2)
  const insertIndex = start + middleOffset

  const next = [...linkOrder]
  next[insertIndex] = createCharmLink(charm)
  return next
}

/**
 * @param {BraceletLink[]} linkOrder
 * @param {string} linkId
 * @returns {BraceletLink[]}
 */
export function removeCharmFromLinkOrder(linkOrder, linkId) {
  const index = linkOrder.findIndex((link) => link.id === linkId)
  if (index === -1) return linkOrder

  const next = [...linkOrder]
  next[index] = createPlainLink()
  return next
}

/**
 * Real (customer-chosen) charms on the track — excludes plain slots and filler placeholders.
 * @param {BraceletLink[]} linkOrder
 * @returns {import('../data/charms').Charm[]}
 */
export function getCharmsFromLinkOrder(linkOrder) {
  return linkOrder
    .filter((link) => link.type === 'charm' && link.charm && !isFillerCharm(link.charm))
    .map((link) => link.charm)
}

/**
 * @param {number} slotCount
 * @param {import('../data/charms').Charm[]} [charmsOnTrack]
 * @returns {BraceletLink[]}
 */
export function createLinkOrderForSize(slotCount, charmsOnTrack = []) {
  const realCharms = charmsOnTrack.filter((charm) => charm && !isFillerCharm(charm))
  return Array.from({ length: slotCount }, (_, i) =>
    i < realCharms.length ? createCharmLink(realCharms[i]) : createPlainLink(),
  )
}

/**
 * Resize the track while preserving selected charms and their relative order.
 * Prefer dropping/adding plain slots so mid-build size changes never delete charms.
 *
 * @param {BraceletLink[]} linkOrder
 * @param {number} newSlotCount
 * @returns {{ ok: true, linkOrder: BraceletLink[] } | { ok: false, overflow: number, linkOrder: BraceletLink[] }}
 */
export function resizeLinkOrder(linkOrder, newSlotCount) {
  if (!Number.isInteger(newSlotCount) || newSlotCount < 0) {
    return { ok: false, overflow: 0, linkOrder }
  }

  const realCount = getCharmsFromLinkOrder(linkOrder).length
  if (realCount > newSlotCount) {
    return { ok: false, overflow: realCount - newSlotCount, linkOrder }
  }

  if (linkOrder.length === newSlotCount) {
    return { ok: true, linkOrder }
  }

  if (newSlotCount > linkOrder.length) {
    return {
      ok: true,
      linkOrder: [
        ...linkOrder,
        ...Array.from({ length: newSlotCount - linkOrder.length }, () => createPlainLink()),
      ],
    }
  }

  const next = [...linkOrder]
  while (next.length > newSlotCount) {
    let removeIdx = -1
    for (let i = next.length - 1; i >= 0; i -= 1) {
      if (next[i].type === 'plain') {
        removeIdx = i
        break
      }
    }
    if (removeIdx === -1) {
      removeIdx = next.findIndex((link) => link.type === 'plain')
    }
    if (removeIdx === -1) break
    next.splice(removeIdx, 1)
  }

  return { ok: true, linkOrder: next }
}

/**
 * Rebuild link order from legacy saved charm id list.
 * @param {string[]} charmIds
 * @param {(id: string) => import('../data/charms').Charm | undefined} getCharmByIdFn
 * @param {number} [slotCount]
 * @returns {BraceletLink[]}
 */
export function linkOrderFromCharmIds(charmIds, getCharmByIdFn, slotCount = DEFAULT_BRACELET_SIZE) {
  let order = createInitialLinkOrder(slotCount)
  for (const id of charmIds) {
    const charm = getCharmByIdFn(id)
    if (charm && charm.category !== 'Starter Bracelets') {
      order = addCharmToLinkOrder(order, charm)
    }
  }
  return order
}

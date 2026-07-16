import { DEFAULT_BRACELET_SIZE, getCharmById, getCharmCapacity, isFillerCharm } from '../data/charms'
import { readJson, STORAGE_KEYS } from './storage'

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

/** @returns {BraceletLink[]} */
export function loadInitialLinkOrder() {
  const saved = readJson(STORAGE_KEYS.savedBuild, null)
  const nominalSize = saved?.charmCount ?? DEFAULT_BRACELET_SIZE
  const slotCount = getCharmCapacity(nominalSize, saved?.baseId) ?? DEFAULT_BRACELET_SIZE

  if (Array.isArray(saved?.linkOrder) && saved.linkOrder.length > 0) {
    return saved.linkOrder
      .map((link) => {
        if (link.type === 'charm' && link.charmId) {
          const charm = getCharmById(link.charmId)
          if (charm) return { id: link.id ?? createLinkId(), type: 'charm', charm }
        }
        if (link.type === 'plain') return { id: link.id ?? createLinkId(), type: 'plain' }
        return null
      })
      .filter(Boolean)
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

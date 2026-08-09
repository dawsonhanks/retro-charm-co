import { charms, BASE_OPTIONS, isFillerCharm, getCharmById } from '../data/charms.js'
import { logMissingInventoryProduct } from '../lib/inventoryDiagnostics.js'
import { isInventoryEmergencyFailOpen } from '../lib/inventoryConfig.js'

/** @typedef {{ inStock: boolean, qty: number }} InventoryEntry */
/** @typedef {Record<string, InventoryEntry>} InventoryMap */
/** @typedef {{ name: string, metal: string, qty_in_stock: number }} InventoryRow */

export const INVENTORY_OUTAGE_MESSAGE =
  'Live inventory is temporarily unavailable. Please try again shortly.'

export const AVAILABILITY_UNAVAILABLE_LABEL = 'Availability unavailable'
export const OUT_OF_STOCK_LABEL = 'Out of Stock'

/** @typedef {'in_stock' | 'out_of_stock' | 'unknown'} CharmStockState */

/**
 * Normalize a charm or sheet display name for matching.
 * @param {string} name
 */
export function normalizeInventoryName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/**
 * Normalize metal from sheet ("Silver"/"Gold") or catalog ("silver"/"gold").
 * @param {string} metal
 */
export function normalizeInventoryMetal(metal) {
  const value = String(metal ?? '')
    .trim()
    .toLowerCase()
  if (value === 'silver' || value === 'gold') return value
  return value
}

/**
 * Stable lookup key: normalized name + metal.
 * @param {string} name
 * @param {string} metal
 */
export function inventoryKey(name, metal) {
  return `${normalizeInventoryName(name)}|${normalizeInventoryMetal(metal)}`
}

/**
 * @param {InventoryRow[] | null | undefined} rows
 * @returns {InventoryMap}
 */
export function rowsToInventoryMap(rows) {
  /** @type {InventoryMap} */
  const map = {}
  for (const row of rows ?? []) {
    const name = String(row?.name ?? '').trim()
    const metal = String(row?.metal ?? '').trim()
    if (!name || !metal) continue
    const qtyRaw = Number(row.qty_in_stock)
    const qty = Number.isFinite(qtyRaw) ? qtyRaw : 0
    map[inventoryKey(name, metal)] = { inStock: qty > 0, qty }
  }
  return map
}

/**
 * Whether inventory status allows selling against the map.
 * @param {string | null | undefined} status
 */
export function isInventoryStatusVerified(status) {
  return status === 'ready' || status === 'mock'
}

/**
 * Authoritative stock state for a catalog variant.
 * Fail-safe: unverified inventory or missing rows → `unknown` (non-purchasable).
 *
 * @param {string} charmName
 * @param {string} charmMetal
 * @param {InventoryMap | null | undefined} inventoryMap
 * @param {{
 *   status?: string | null,
 *   productId?: string | null,
 *   emergencyFailOpen?: boolean,
 * }} [opts]
 * @returns {CharmStockState}
 */
export function getCharmStockState(charmName, charmMetal, inventoryMap, opts = {}) {
  const emergency =
    opts.emergencyFailOpen === true ||
    (opts.emergencyFailOpen == null && isInventoryEmergencyFailOpen())

  const verified = opts.status == null ? true : isInventoryStatusVerified(opts.status)

  if (!verified) {
    return emergency ? 'in_stock' : 'unknown'
  }

  if (!inventoryMap) {
    return emergency ? 'in_stock' : 'unknown'
  }

  const entry = inventoryMap[inventoryKey(charmName, charmMetal)]
  if (!entry) {
    if (opts.productId) logMissingInventoryProduct(opts.productId)
    return emergency ? 'in_stock' : 'unknown'
  }

  return entry.inStock ? 'in_stock' : 'out_of_stock'
}

/**
 * @param {CharmStockState} state
 */
export function isCharmPurchasableState(state) {
  return state === 'in_stock'
}

/**
 * Customer-facing badge — never labels unverified items as in stock.
 * @param {CharmStockState} state
 * @returns {string | null}
 */
export function getStockStateLabel(state) {
  if (state === 'out_of_stock') return OUT_OF_STOCK_LABEL
  if (state === 'unknown') return AVAILABILITY_UNAVAILABLE_LABEL
  return null
}

/**
 * Whether a charm tile should block purchase (OOS or unverified).
 * Fail-safe: missing inventory data or unknown keys are non-purchasable
 * unless the explicit emergency fail-open override is enabled.
 *
 * Stock is tracked per charm variant (charm's own metal), never the base metal.
 *
 * @param {string} charmName
 * @param {string} charmMetal
 * @param {InventoryMap | null | undefined} inventoryMap
 * @param {{ status?: string | null, productId?: string | null, emergencyFailOpen?: boolean }} [opts]
 */
export function isCharmOutOfStock(charmName, charmMetal, inventoryMap, opts = {}) {
  const state = getCharmStockState(charmName, charmMetal, inventoryMap, opts)
  return !isCharmPurchasableState(state)
}

/**
 * True only for verified out-of-stock (used to hide OOS while keeping unknowns visible).
 * @param {string} charmName
 * @param {string} charmMetal
 * @param {InventoryMap | null | undefined} inventoryMap
 * @param {{ status?: string | null, productId?: string | null, emergencyFailOpen?: boolean }} [opts]
 */
export function isCharmVerifiedOutOfStock(charmName, charmMetal, inventoryMap, opts = {}) {
  return getCharmStockState(charmName, charmMetal, inventoryMap, opts) === 'out_of_stock'
}

/**
 * Resolve catalog product (charm or base) for inventory validation.
 * @param {string} id
 * @returns {{ id: string, name: string, metal: string, isFiller: boolean } | null}
 */
export function resolveCatalogProductForInventory(id) {
  if (typeof id !== 'string' || !id) return null
  const charm = getCharmById(id)
  if (charm) {
    return {
      id: charm.id,
      name: charm.name,
      metal: charm.metal,
      isFiller: isFillerCharm(charm),
    }
  }
  const base = BASE_OPTIONS.find((b) => b.id === id)
  if (base) {
    return {
      id: base.id,
      name: base.label,
      metal: base.metal,
      isFiller: false,
    }
  }
  return null
}

/**
 * Whether a sheet row is in stock (legacy CSV helper).
 * Blank/missing count → in stock. Out when Count <= 0 OR In Stock is NO.
 * @param {string | number | null | undefined} count
 * @param {string | null | undefined} inStockFlag
 */
export function isSheetRowInStock(count, inStockFlag) {
  const flag = String(inStockFlag ?? '')
    .trim()
    .toUpperCase()
  if (flag === 'NO') return false

  const countRaw = String(count ?? '').trim()
  if (countRaw === '') return true

  const parsed = Number(countRaw)
  if (!Number.isFinite(parsed)) return true

  return parsed > 0
}

/**
 * Parse one CSV line respecting quoted fields.
 * @param {string} line
 */
function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  fields.push(current)
  return fields.map((field) => field.trim())
}

/**
 * Parse published Google Sheet CSV into an inventory map (legacy).
 * @param {string} csvText
 * @returns {InventoryMap}
 */
export function parseInventoryCsv(csvText) {
  const text = String(csvText ?? '').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return {}

  const header = parseCsvLine(lines[0]).map((col) => col.trim().toLowerCase())
  const nameIdx = header.findIndex((col) => col === 'charm name' || col === 'name')
  const metalIdx = header.findIndex((col) => col === 'metal')
  const countIdx = header.findIndex((col) => col === 'count' || col === 'qty' || col === 'quantity')
  const inStockIdx = header.findIndex((col) => col === 'in stock' || col === 'instock' || col === 'in_stock')

  if (nameIdx === -1 || metalIdx === -1) {
    throw new Error('Inventory CSV must include Charm Name and Metal columns')
  }

  /** @type {InventoryMap} */
  const inventory = {}

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i])
    const charmName = row[nameIdx]?.trim()
    const metal = row[metalIdx]?.trim()
    if (!charmName || !metal) continue

    const count = countIdx >= 0 ? row[countIdx] : ''
    const inStockFlag = inStockIdx >= 0 ? row[inStockIdx] : ''
    const key = inventoryKey(charmName, metal)
    const inStock = isSheetRowInStock(count, inStockFlag)
    const qtyParsed = Number(String(count ?? '').trim())
    inventory[key] = {
      inStock,
      qty: inStock ? (Number.isFinite(qtyParsed) && String(count ?? '').trim() !== '' ? qtyParsed : 1) : 0,
    }
  }

  return inventory
}

/** Pickable charms from the catalog (excludes starters and fillers). */
export function getPickableCatalogCharms() {
  return charms.filter((charm) => charm.category !== 'Starter Bracelets' && !isFillerCharm(charm))
}

/**
 * Compare inventory keys to charms.js and warn on mismatches.
 * @param {InventoryMap | null | undefined} inventoryMap
 */
export function logInventoryMismatches(inventoryMap) {
  if (!inventoryMap || Object.keys(inventoryMap).length === 0) {
    return { unmatchedCharms: [], orphanSheetRows: [] }
  }

  const catalogKeys = new Set()
  /** @type {Map<string, { name: string, metal: string, id: string }>} */
  const catalogByKey = new Map()

  for (const charm of getPickableCatalogCharms()) {
    const key = inventoryKey(charm.name, charm.metal)
    catalogKeys.add(key)
    catalogByKey.set(key, { name: charm.name, metal: charm.metal, id: charm.id })
  }

  const sheetKeys = new Set(Object.keys(inventoryMap))
  const unmatchedCharms = []

  for (const key of catalogKeys) {
    if (!sheetKeys.has(key)) {
      const charm = catalogByKey.get(key)
      unmatchedCharms.push(`${charm.name} (${charm.metal})`)
      logMissingInventoryProduct(charm.id)
    }
  }

  const orphanSheetRows = []
  for (const key of sheetKeys) {
    if (!catalogKeys.has(key)) {
      orphanSheetRows.push(key)
      console.warn(`[inventory] Inventory row matches no catalog charm: ${key}`)
    }
  }

  return { unmatchedCharms, orphanSheetRows }
}

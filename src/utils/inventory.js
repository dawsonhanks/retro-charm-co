import { charms, isFillerCharm } from '../data/charms.js'

/** @typedef {{ inStock: boolean }} InventoryEntry */

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
 * Whether a sheet row is in stock.
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
 * Parse published Google Sheet CSV into an inventory map.
 * @param {string} csvText
 * @returns {Record<string, InventoryEntry>}
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

  /** @type {Record<string, InventoryEntry>} */
  const inventory = {}

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i])
    const charmName = row[nameIdx]?.trim()
    const metal = row[metalIdx]?.trim()
    if (!charmName || !metal) continue

    const count = countIdx >= 0 ? row[countIdx] : ''
    const inStockFlag = inStockIdx >= 0 ? row[inStockIdx] : ''
    const key = inventoryKey(charmName, metal)
    inventory[key] = { inStock: isSheetRowInStock(count, inStockFlag) }
  }

  return inventory
}

/** Pickable charms from the catalog (excludes starters and fillers). */
export function getPickableCatalogCharms() {
  return charms.filter((charm) => charm.category !== 'Starter Bracelets' && !isFillerCharm(charm))
}

/**
 * Compare sheet inventory keys to charms.js and warn on mismatches.
 * @param {Record<string, InventoryEntry> | null | undefined} inventoryMap
 */
export function logInventoryMismatches(inventoryMap) {
  if (!inventoryMap || Object.keys(inventoryMap).length === 0) {
    return { unmatchedCharms: [], orphanSheetRows: [] }
  }

  const catalogKeys = new Set()
  /** @type {Map<string, { name: string, metal: string }>} */
  const catalogByKey = new Map()

  for (const charm of getPickableCatalogCharms()) {
    const key = inventoryKey(charm.name, charm.metal)
    catalogKeys.add(key)
    catalogByKey.set(key, { name: charm.name, metal: charm.metal })
  }

  const sheetKeys = new Set(Object.keys(inventoryMap))
  const unmatchedCharms = []

  for (const key of catalogKeys) {
    if (!sheetKeys.has(key)) {
      const charm = catalogByKey.get(key)
      unmatchedCharms.push(`${charm.name} (${charm.metal})`)
      console.warn(`[inventory] No sheet row for catalog charm: ${charm.name} (${charm.metal})`)
    }
  }

  const orphanSheetRows = []
  for (const key of sheetKeys) {
    if (!catalogKeys.has(key)) {
      orphanSheetRows.push(key)
      console.warn(`[inventory] Sheet row matches no catalog charm: ${key}`)
    }
  }

  return { unmatchedCharms, orphanSheetRows }
}

/**
 * Whether a charm tile should be treated as out of stock.
 * Missing inventory data or unknown keys default to in stock (fail open).
 * Stock is tracked per charm variant, so the lookup uses the charm's OWN
 * metal (from charms.js) — never the selected base metal. A gold-only charm
 * (e.g. WWJD) can sit on a silver bracelet and must still track gold stock.
 * @param {string} charmName
 * @param {string} charmMetal - the charm's own metal ('silver' | 'gold')
 * @param {Record<string, InventoryEntry> | null | undefined} inventoryMap
 */
export function isCharmOutOfStock(charmName, charmMetal, inventoryMap) {
  if (!inventoryMap || Object.keys(inventoryMap).length === 0) return false

  const entry = inventoryMap[inventoryKey(charmName, charmMetal)]
  if (!entry) return false

  return !entry.inStock
}

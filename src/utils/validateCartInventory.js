import {
  getCharmStockState,
  inventoryKey,
  resolveCatalogProductForInventory,
  INVENTORY_OUTAGE_MESSAGE,
  AVAILABILITY_UNAVAILABLE_LABEL,
  OUT_OF_STOCK_LABEL,
} from './inventory.js'
import { isInventoryAuthoritative } from '../lib/inventory.js'
import { logInventoryDiagnostic } from '../lib/inventoryDiagnostics.js'

/**
 * @typedef {{ id: string, quantity?: number, name?: string }} CartLikeItem
 * @typedef {{ charms?: Array<{ id?: string } | null> } | null} BraceletBuildLike
 * @typedef {{
 *   id: string,
 *   name: string,
 *   reason: 'unknown' | 'out_of_stock' | 'insufficient_qty',
 *   label: string,
 * }} UnavailableCartItem
 */

/**
 * Validate paid cart lines (+ optional bracelet build slots) against authoritative inventory.
 * Free filler links are excluded. Never treats unverified inventory as available.
 *
 * @param {{
 *   items: CartLikeItem[],
 *   braceletBuilds?: BraceletBuildLike[],
 *   inventoryResult: import('../lib/inventory.js').InventoryResult | null | undefined,
 * }} args
 * @returns {{
 *   ok: boolean,
 *   reason: string | null,
 *   message: string | null,
 *   unavailableItems: UnavailableCartItem[],
 * }}
 */
export function validateCartInventory({ items, braceletBuilds = [], inventoryResult }) {
  if (!isInventoryAuthoritative(inventoryResult)) {
    logInventoryDiagnostic('checkout_blocked_inventory', {
      reason: inventoryResult?.reason ?? inventoryResult?.status ?? 'unverified',
    })
    return {
      ok: false,
      reason: 'inventory_unverified',
      message: INVENTORY_OUTAGE_MESSAGE,
      unavailableItems: [],
    }
  }

  const map = inventoryResult.map
  const status = inventoryResult.status

  /** @type {Map<string, { id: string, name: string, needed: number }>} */
  const tallies = new Map()

  /**
   * @param {string} productId
   * @param {number} qty
   */
  function addNeed(productId, qty = 1) {
    if (typeof productId !== 'string' || !productId || qty <= 0) return
    const product = resolveCatalogProductForInventory(productId)
    if (!product) {
      const prev = tallies.get(productId)
      tallies.set(productId, {
        id: productId,
        name: productId,
        needed: (prev?.needed ?? 0) + qty,
      })
      return
    }
    if (product.isFiller) return

    const prev = tallies.get(product.id)
    tallies.set(product.id, {
      id: product.id,
      name: product.name,
      needed: (prev?.needed ?? 0) + qty,
    })
  }

  for (const item of items ?? []) {
    const qty = Number.isInteger(item?.quantity) ? item.quantity : 1
    addNeed(item?.id, qty)
  }

  // Bracelet builds are layout/metadata only. Paid quantities come from `items`.
  // Still scan builds so free fillers are explicitly skipped if someone passes
  // build-only validation in tests — but never double-count when items exist.
  if (!Array.isArray(items) || items.length === 0) {
    for (const build of braceletBuilds ?? []) {
      if (!Array.isArray(build?.charms)) continue
      for (const charm of build.charms) {
        if (charm?.id) addNeed(charm.id, 1)
      }
    }
  }

  /** @type {UnavailableCartItem[]} */
  const unavailableItems = []

  for (const tally of tallies.values()) {
    const product = resolveCatalogProductForInventory(tally.id)
    if (!product) {
      unavailableItems.push({
        id: tally.id,
        name: tally.name,
        reason: 'unknown',
        label: AVAILABILITY_UNAVAILABLE_LABEL,
      })
      continue
    }

    const state = getCharmStockState(product.name, product.metal, map, {
      status,
      productId: product.id,
    })

    if (state === 'unknown') {
      unavailableItems.push({
        id: product.id,
        name: product.name,
        reason: 'unknown',
        label: AVAILABILITY_UNAVAILABLE_LABEL,
      })
      continue
    }

    if (state === 'out_of_stock') {
      unavailableItems.push({
        id: product.id,
        name: product.name,
        reason: 'out_of_stock',
        label: OUT_OF_STOCK_LABEL,
      })
      continue
    }

    const entry = map[inventoryKey(product.name, product.metal)]
    const availableQty = entry?.qty ?? 0
    if (tally.needed > availableQty) {
      unavailableItems.push({
        id: product.id,
        name: product.name,
        reason: 'insufficient_qty',
        label: OUT_OF_STOCK_LABEL,
      })
    }
  }

  if (unavailableItems.length > 0) {
    logInventoryDiagnostic('checkout_blocked_inventory', {
      reason: 'items_unavailable',
      unavailableCount: unavailableItems.length,
    })
    const names = unavailableItems.map((item) => item.name).join(', ')
    return {
      ok: false,
      reason: 'items_unavailable',
      message: `Some items are no longer available: ${names}. Your cart was preserved — remove or replace them to continue.`,
      unavailableItems,
    }
  }

  return {
    ok: true,
    reason: null,
    message: null,
    unavailableItems: [],
  }
}

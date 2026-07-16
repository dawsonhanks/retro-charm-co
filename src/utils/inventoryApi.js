import { logInventoryMismatches } from './inventory.js'

/**
 * Fetch live inventory from /api/inventory.
 * On any failure returns an empty map (fail open — everything in stock).
 * @returns {Promise<Record<string, { inStock: boolean }>>}
 */
export async function fetchInventory() {
  try {
    const res = await fetch('/api/inventory', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.warn('[inventory] request failed:', res.status)
      return {}
    }

    const data = await res.json()
    const inventory = data?.inventory

    if (!inventory || typeof inventory !== 'object') {
      console.warn('[inventory] response missing inventory map')
      return {}
    }

    return inventory
  } catch (error) {
    console.warn('[inventory] network error:', error)
    return {}
  }
}

/**
 * Fetch inventory once and log catalog ↔ sheet mismatches to the console.
 * @returns {Promise<{ inventory: Record<string, { inStock: boolean }>, unmatchedCharms: string[], orphanSheetRows: string[] }>}
 */
export async function fetchInventoryWithMismatchReport() {
  const inventory = await fetchInventory()
  const { unmatchedCharms, orphanSheetRows } = logInventoryMismatches(inventory)
  return { inventory, unmatchedCharms, orphanSheetRows }
}

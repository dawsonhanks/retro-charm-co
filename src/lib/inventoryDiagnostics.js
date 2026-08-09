/**
 * Privacy-safe inventory diagnostics.
 * Never log customer details, emails, or full cart payloads.
 */

/** @typedef {'inventory_source_unavailable' | 'inventory_product_missing' | 'inventory_stale' | 'checkout_blocked_inventory' | 'inventory_recovered'} InventoryDiagnosticEvent */

const loggedMissingIds = new Set()

/**
 * @param {InventoryDiagnosticEvent} event
 * @param {Record<string, string | number | boolean | null | undefined>} [detail]
 */
export function logInventoryDiagnostic(event, detail = {}) {
  const safe = {}
  for (const [key, value] of Object.entries(detail)) {
    if (value == null) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value
    }
  }
  console.warn(`[inventory] ${event}`, safe)
}

/**
 * Log a missing catalog↔inventory product once per session/process (by internal id).
 * @param {string} productId
 */
export function logMissingInventoryProduct(productId) {
  const id = String(productId ?? '').trim()
  if (!id || loggedMissingIds.has(id)) return
  loggedMissingIds.add(id)
  logInventoryDiagnostic('inventory_product_missing', { productId: id })
}

/** Test helper — clears the once-per-id missing-product set. */
export function resetInventoryDiagnosticState() {
  loggedMissingIds.clear()
}

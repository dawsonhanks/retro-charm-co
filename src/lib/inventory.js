import { supabase } from './supabase'

/**
 * @typedef {Object} InventoryRow
 * @property {string} name
 * @property {string} metal
 * @property {number} qty_in_stock
 */

/**
 * Fetch live inventory from the Supabase "inventory" table.
 * On any failure returns an empty array so the UI fails open (everything
 * stays selectable rather than falsely showing as sold out).
 * @returns {Promise<InventoryRow[]>}
 */
export async function getInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('name, metal, qty_in_stock')

  if (error) {
    console.warn('[inventory] Supabase error:', error.message)
    return []
  }

  return data ?? []
}

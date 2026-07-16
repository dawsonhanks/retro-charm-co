import { parseInventoryCsv } from '../src/utils/inventory.js'

const CACHE_TTL_MS = 60_000

/** @type {{ map: Record<string, { inStock: boolean }> | null, expiresAt: number }} */
let cache = { map: null, expiresAt: 0 }

async function loadInventoryMap() {
  const now = Date.now()
  if (cache.map && now < cache.expiresAt) {
    return cache.map
  }

  const csvUrl = process.env.INVENTORY_CSV_URL
  if (!csvUrl) {
    console.warn('[inventory] INVENTORY_CSV_URL is not configured — returning empty map')
    return {}
  }

  const response = await fetch(csvUrl, {
    headers: { Accept: 'text/csv,text/plain,*/*' },
  })

  if (!response.ok) {
    throw new Error(`Inventory CSV fetch failed (${response.status})`)
  }

  const csvText = await response.text()
  const map = parseInventoryCsv(csvText)

  cache = {
    map,
    expiresAt: now + CACHE_TTL_MS,
  }

  return map
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const inventory = await loadInventoryMap()
    return res.status(200).json({ inventory })
  } catch (error) {
    console.error('[inventory] Failed to load inventory:', error)
    // Fail open — empty map means every charm is treated as in stock.
    return res.status(200).json({ inventory: {} })
  }
}

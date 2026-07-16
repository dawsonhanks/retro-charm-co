import { parseInventoryCsv } from '../src/utils/inventory.js'

const CACHE_TTL_MS = 60_000
const RETRY_DELAY_MS = 400

/** @type {{ map: Record<string, { inStock: boolean }> | null, expiresAt: number }} */
let cache = { map: null, expiresAt: 0 }

/**
 * Last successfully fetched map, kept indefinitely so transient Google
 * failures (e.g. intermittent 401s on published-sheet URLs) serve slightly
 * stale data instead of an empty map (which reads as "everything in stock").
 * @type {Record<string, { inStock: boolean }> | null}
 */
let lastGoodMap = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchCsvOnce(csvUrl) {
  const response = await fetch(csvUrl, {
    headers: { Accept: 'text/csv,text/plain,*/*' },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Inventory CSV fetch failed (${response.status})`)
  }

  return response.text()
}

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

  let csvText
  try {
    csvText = await fetchCsvOnce(csvUrl)
  } catch (firstError) {
    // Published Google Sheet URLs intermittently reject server-side fetches;
    // one short retry clears most transient 401/5xx responses.
    console.warn(`[inventory] First fetch attempt failed (${firstError.message}) — retrying once`)
    await sleep(RETRY_DELAY_MS)
    csvText = await fetchCsvOnce(csvUrl)
  }

  const map = parseInventoryCsv(csvText)

  cache = {
    map,
    expiresAt: now + CACHE_TTL_MS,
  }
  lastGoodMap = map

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
    if (lastGoodMap) {
      // Serve the last known-good inventory rather than an empty map so a
      // transient Google failure doesn't flip out-of-stock charms back on.
      console.warn('[inventory] Serving last known-good inventory (stale)')
      return res.status(200).json({ inventory: lastGoodMap })
    }
    // Fail open — empty map means every charm is treated as in stock.
    return res.status(200).json({ inventory: {} })
  }
}

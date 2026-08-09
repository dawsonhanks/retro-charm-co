import { charms, BASE_OPTIONS, isFillerCharm } from '../data/charms.js'
import {
  inventoryKey,
  rowsToInventoryMap,
  INVENTORY_OUTAGE_MESSAGE,
} from '../utils/inventory.js'
import { logInventoryDiagnostic } from './inventoryDiagnostics.js'
import { isInventoryEmergencyFailOpen, shouldUseMockInventory } from './inventoryConfig.js'

/** @typedef {import('../utils/inventory.js').InventoryRow} InventoryRow */
/** @typedef {import('../utils/inventory.js').InventoryMap} InventoryMap */

/**
 * @typedef {'ready' | 'unavailable' | 'unconfigured' | 'mock'} InventoryFetchStatus
 * @typedef {{
 *   status: InventoryFetchStatus,
 *   rows: InventoryRow[],
 *   map: InventoryMap,
 *   fetchedAt: number | null,
 *   reason?: string,
 *   message?: string,
 * }} InventoryResult
 */

export const INVENTORY_FETCH_TIMEOUT_MS = 8000
export const INVENTORY_STALE_AFTER_MS = 5 * 60 * 1000
export const INVENTORY_RETRY_BACKOFF_MS = Object.freeze([2000, 5000, 15000, 30000])

export { INVENTORY_OUTAGE_MESSAGE, isInventoryEmergencyFailOpen, shouldUseMockInventory }

function buildMockRows() {
  /** @type {InventoryRow[]} */
  const rows = []
  for (const charm of charms) {
    if (isFillerCharm(charm)) continue
    rows.push({ name: charm.name, metal: charm.metal, qty_in_stock: 99 })
  }
  for (const base of BASE_OPTIONS) {
    rows.push({ name: base.label, metal: base.metal, qty_in_stock: 99 })
  }
  return rows
}

/**
 * @param {number} ms
 * @param {typeof fetch} fetchImpl
 * @param {string} url
 * @param {RequestInit} init
 */
async function fetchWithTimeout(ms, fetchImpl, url, init) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch live inventory (fail-safe). Production never fail-opens on missing env.
 *
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   env?: Record<string, string | undefined> | ImportMetaEnv,
 *   now?: number,
 *   timeoutMs?: number,
 *   isDev?: boolean,
 * }} [options]
 * @returns {Promise<InventoryResult>}
 */
export async function getInventory(options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
  const env = options.env ?? (typeof import.meta !== 'undefined' ? import.meta.env : {})
  const now = options.now ?? Date.now()
  const timeoutMs = options.timeoutMs ?? INVENTORY_FETCH_TIMEOUT_MS
  const isDev = options.isDev ?? Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV)

  if (shouldUseMockInventory(env, { isDev })) {
    const rows = buildMockRows()
    return {
      status: 'mock',
      rows,
      map: rowsToInventoryMap(rows),
      fetchedAt: now,
      reason: 'mock',
    }
  }

  const supabaseUrl = String(env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? '').replace(/\/$/, '')
  const supabaseKey = String(
    env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  )

  if (!supabaseUrl || !supabaseKey) {
    logInventoryDiagnostic('inventory_source_unavailable', { reason: 'unconfigured' })
    return {
      status: 'unconfigured',
      rows: [],
      map: {},
      fetchedAt: null,
      reason: 'unconfigured',
      message: INVENTORY_OUTAGE_MESSAGE,
    }
  }

  try {
    const url = `${supabaseUrl}/rest/v1/inventory?select=name,metal,qty_in_stock`
    const res = await fetchWithTimeout(timeoutMs, fetchImpl, url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!res.ok) {
      logInventoryDiagnostic('inventory_source_unavailable', {
        reason: 'http_error',
        status: res.status,
      })
      return {
        status: 'unavailable',
        rows: [],
        map: {},
        fetchedAt: null,
        reason: 'http_error',
        message: INVENTORY_OUTAGE_MESSAGE,
      }
    }

    let data
    try {
      data = await res.json()
    } catch {
      logInventoryDiagnostic('inventory_source_unavailable', { reason: 'invalid_json' })
      return {
        status: 'unavailable',
        rows: [],
        map: {},
        fetchedAt: null,
        reason: 'invalid_json',
        message: INVENTORY_OUTAGE_MESSAGE,
      }
    }

    if (!Array.isArray(data)) {
      logInventoryDiagnostic('inventory_source_unavailable', { reason: 'invalid_response' })
      return {
        status: 'unavailable',
        rows: [],
        map: {},
        fetchedAt: null,
        reason: 'invalid_response',
        message: INVENTORY_OUTAGE_MESSAGE,
      }
    }

    const rows = /** @type {InventoryRow[]} */ (
      data.map((row) => ({
        name: String(row?.name ?? ''),
        metal: String(row?.metal ?? ''),
        qty_in_stock: Number(row?.qty_in_stock),
      }))
    )

    return {
      status: 'ready',
      rows,
      map: rowsToInventoryMap(rows),
      fetchedAt: now,
    }
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    logInventoryDiagnostic('inventory_source_unavailable', {
      reason: aborted ? 'timeout' : 'network_error',
    })
    return {
      status: 'unavailable',
      rows: [],
      map: {},
      fetchedAt: null,
      reason: aborted ? 'timeout' : 'network_error',
      message: INVENTORY_OUTAGE_MESSAGE,
    }
  }
}

/**
 * Whether a fetch result is authoritative enough to sell against.
 * @param {InventoryResult | null | undefined} result
 */
export function isInventoryAuthoritative(result) {
  return result?.status === 'ready' || result?.status === 'mock'
}

/**
 * @param {number | null | undefined} fetchedAt
 * @param {number} [now]
 * @param {number} [staleAfterMs]
 */
export function isInventoryStale(fetchedAt, now = Date.now(), staleAfterMs = INVENTORY_STALE_AFTER_MS) {
  if (fetchedAt == null || !Number.isFinite(fetchedAt)) return true
  return now - fetchedAt > staleAfterMs
}

/**
 * @param {InventoryMap} map
 * @param {string} name
 * @param {string} metal
 */
export function lookupInventoryEntry(map, name, metal) {
  return map?.[inventoryKey(name, metal)] ?? null
}

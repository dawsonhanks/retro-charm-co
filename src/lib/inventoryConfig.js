/**
 * Inventory environment policy helpers (no fetch — safe to import from utils).
 */

function readEnv(env) {
  if (env) return env
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env
  try {
    // Node / API routes — access via globalThis so browser eslint does not require `process`.
    return globalThis.process?.env ?? {}
  } catch {
    return {}
  }
}

/**
 * Explicit emergency fail-open. Never inferred from a missing env var.
 * Client (Vite DEV): VITE_INVENTORY_EMERGENCY_FAIL_OPEN=true
 * Server / production emergency: INVENTORY_EMERGENCY_FAIL_OPEN=true
 * @param {Record<string, string | undefined> | ImportMetaEnv | NodeJS.ProcessEnv} [env]
 * @param {{ isDev?: boolean }} [opts]
 */
export function isInventoryEmergencyFailOpen(env, opts = {}) {
  const source = readEnv(env)

  const serverFlag = String(source.INVENTORY_EMERGENCY_FAIL_OPEN ?? '').trim() === 'true'
  const clientFlag = String(source.VITE_INVENTORY_EMERGENCY_FAIL_OPEN ?? '').trim() === 'true'

  if (!serverFlag && !clientFlag) return false

  // Production server: only the non-VITE flag counts (documented emergency).
  if (serverFlag) return true

  // Client Vite flag: only in development — never production fail-open via VITE_*.
  const isDev =
    opts.isDev === true || Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV)
  return isDev && clientFlag
}

/**
 * Local mock inventory — only when explicitly configured in development.
 * @param {Record<string, string | undefined> | ImportMetaEnv} [env]
 * @param {{ isDev?: boolean }} [opts]
 */
export function shouldUseMockInventory(env, opts = {}) {
  const source = readEnv(env)
  const mode = String(source.VITE_INVENTORY_MODE ?? '').trim().toLowerCase()
  if (mode !== 'mock') return false
  if (opts.isDev === true) return true
  return Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV)
}

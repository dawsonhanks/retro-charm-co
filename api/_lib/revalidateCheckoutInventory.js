/**
 * Server-side authoritative inventory fetch for checkout revalidation.
 * Uses SUPABASE_URL + service role (or anon) — never fail-opens on missing env.
 */
import { getInventory, isInventoryAuthoritative } from '../../src/lib/inventory.js'
import { validateCartInventory } from '../../src/utils/validateCartInventory.js'
import { isInventoryEmergencyFailOpen } from '../../src/lib/inventoryConfig.js'

/**
 * @param {{
 *   items: Array<{ id: string, quantity?: number }>,
 *   braceletBuilds?: unknown[],
 *   fetchImpl?: typeof fetch,
 *   env?: NodeJS.ProcessEnv,
 * }} args
 */
export async function revalidateCheckoutInventory({
  items,
  braceletBuilds = [],
  fetchImpl = fetch,
  env = process.env,
}) {
  if (isInventoryEmergencyFailOpen(env)) {
    console.warn('[inventory] emergency_fail_open_active', { scope: 'checkout' })
    // Documented emergency override only — not default. Skips stock blocking.
    return {
      ok: true,
      inventoryResult: {
        status: 'ready',
        rows: [],
        map: {},
        fetchedAt: Date.now(),
        reason: 'emergency_fail_open',
      },
      validation: { ok: true, reason: null, message: null, unavailableItems: [] },
      createdPaymentLinkAllowed: true,
    }
  }

  const inventoryResult = await getInventory({
    fetchImpl,
    env,
    isDev: false,
  })

  const validation = validateCartInventory({
    items,
    braceletBuilds,
    inventoryResult,
  })

  return {
    ok: validation.ok,
    inventoryResult,
    validation,
    createdPaymentLinkAllowed: validation.ok && isInventoryAuthoritative(inventoryResult),
  }
}

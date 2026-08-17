/**
 * Allocate Supabase inventory so each prebuilt best-seller bracelet can sell
 * UNITS complete styles independently (shared parts get summed demand).
 *
 * Dry-run (default): print allocation table + SQL to paste in Supabase.
 * Apply: npx vite-node scripts/set-prebuilt-bundle-stock.mjs --apply
 *   Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (loaded from .env / .env.local).
 *
 * Run: npm run stock:prebuilts
 *      npm run stock:prebuilts -- --apply
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getCharmById } from '../src/data/charms.js'
import { BEST_SELLER_BUNDLES, getBundleBase } from '../src/data/bundles.js'

loadEnvFiles(['.env.local', '.env'])

const UNITS = 10
const APPLY = process.argv.includes('--apply')

/**
 * Load KEY=VALUE pairs from dotenv-style files into process.env (no overwrite).
 * @param {string[]} files
 */
function loadEnvFiles(files) {
  for (const file of files) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    const text = readFileSync(path, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] == null || process.env[key] === '') {
        process.env[key] = value
      }
    }
  }
}
/**
 * @typedef {{ name: string, metal: string, qty: number, reasons: string[] }} AllocRow
 */

/**
 * @returns {Map<string, AllocRow>}
 */
function computeAllocation() {
  /** @type {Map<string, AllocRow>} */
  const byKey = new Map()

  /**
   * @param {string} name
   * @param {string} metal
   * @param {number} add
   * @param {string} reason
   */
  function addSum(name, metal, add, reason) {
    const key = `${name}|${metal}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { name, metal, qty: add, reasons: [reason] })
      return
    }
    existing.qty += add
    existing.reasons.push(reason)
  }

  /**
   * @param {string} name
   * @param {string} metal
   * @param {number} floor
   * @param {string} reason
   */
  function ensureFloor(name, metal, floor, reason) {
    const key = `${name}|${metal}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { name, metal, qty: floor, reasons: [reason] })
      return
    }
    if (existing.qty < floor) existing.qty = floor
    if (!existing.reasons.includes(reason)) existing.reasons.push(reason)
  }

  // Pass 1: sum demand for each complete style (base + primary charms).
  for (const bundle of BEST_SELLER_BUNDLES) {
    const base = getBundleBase(bundle)
    if (!base) {
      throw new Error(`Bundle ${bundle.id} has unknown baseId ${bundle.baseId}`)
    }
    addSum(base.label, base.metal, UNITS, `${bundle.id}:base`)

    for (const charmId of bundle.charmIds) {
      const charm = getCharmById(charmId)
      if (!charm) throw new Error(`Bundle ${bundle.id} references unknown charm ${charmId}`)
      addSum(charm.name, charm.metal, UNITS, `${bundle.id}:${charmId}`)
    }
  }

  // Pass 2: substitution fallbacks floored at UNITS (do not inflate shared primaries).
  for (const bundle of BEST_SELLER_BUNDLES) {
    for (const [fromId, alts] of Object.entries(bundle.substitutions ?? {})) {
      for (const altId of alts) {
        const alt = getCharmById(altId)
        if (!alt) throw new Error(`Bundle ${bundle.id} substitution ${fromId} → unknown ${altId}`)
        ensureFloor(alt.name, alt.metal, UNITS, `${bundle.id}:sub:${altId}`)
      }
    }
  }

  return byKey
}

/**
 * @param {AllocRow[]} rows
 */
function buildSql(rows) {
  const values = rows
    .map((r) => `  (${sqlString(r.name)}, ${sqlString(r.metal)}, ${r.qty})`)
    .join(',\n')
  return `-- Prebuilt best-seller allocation: ${UNITS} complete units per style
-- Shared parts are summed across styles; substitution fallbacks floored at ${UNITS}.
-- Requires unique (name, metal) on public.inventory. If upsert fails, add:
--   create unique index if not exists inventory_name_metal_uidx on public.inventory (name, metal);

insert into public.inventory (name, metal, qty_in_stock)
values
${values}
on conflict (name, metal) do update
  set qty_in_stock = excluded.qty_in_stock;
`
}

/**
 * @param {string} value
 */
function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * @param {AllocRow[]} rows
 */
async function applyViaSupabase(rows) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) {
    console.error(
      'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Paste the SQL below into the Supabase SQL editor, or re-run with those env vars set:\n' +
        '  npm run stock:prebuilts -- --apply',
    )
    console.log('\n' + buildSql(rows))
    process.exit(1)
  }

  const endpoint = `${url}/rest/v1/inventory?on_conflict=name,metal`
  const body = rows.map((r) => ({
    name: r.name,
    metal: r.metal,
    qty_in_stock: r.qty,
  }))

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase upsert failed (${res.status}): ${text}`)
  }

  console.log(`Applied ${rows.length} inventory rows via Supabase REST.`)
}

function main() {
  const map = computeAllocation()
  const rows = [...map.values()].sort((a, b) => a.name.localeCompare(b.name) || a.metal.localeCompare(b.metal))

  console.log(`Prebuilt stock allocation (${UNITS} units × ${BEST_SELLER_BUNDLES.length} styles)\n`)
  console.log('name'.padEnd(36) + 'metal'.padEnd(8) + 'qty'.padStart(4) + '  reasons')
  console.log('-'.repeat(80))
  for (const row of rows) {
    console.log(
      row.name.padEnd(36) +
        row.metal.padEnd(8) +
        String(row.qty).padStart(4) +
        '  ' +
        row.reasons.join(', '),
    )
  }

  const silverBase = rows.find((r) => r.name === 'Silver Bracelet' && r.metal === 'silver')
  const goldBase = rows.find((r) => r.name === 'Gold Bracelet' && r.metal === 'gold')
  console.log('\nSanity checks:')
  console.log(`  Silver Bracelet (silver): ${silverBase?.qty ?? 'MISSING'} (expect 20)`)
  console.log(`  Gold Bracelet (gold): ${goldBase?.qty ?? 'MISSING'} (expect 20)`)

  const sql = buildSql(rows)
  const sqlPath = resolve(process.cwd(), 'scripts/sql/set-prebuilt-bundle-stock.sql')
  writeFileSync(sqlPath, sql)
  console.log(`\nWrote ${sqlPath}`)

  if (!APPLY) {
    console.log('\nDry-run only. SQL to run in Supabase:\n')
    console.log(sql)
    console.log('To apply with service role: npm run stock:prebuilts -- --apply')
    return
  }

  return applyViaSupabase(rows)
}

const result = main()
if (result && typeof result.then === 'function') {
  result.catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

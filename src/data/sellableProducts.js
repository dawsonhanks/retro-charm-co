/**
 * Shared sellable catalog for checkout, inventory, and Shop add-to-cart.
 * Bracelet charms/bases stay in charms.js; accessories live in their own files
 * and are registered here so create-checkout / webhook / inventory can resolve them.
 */
import { charms, BASE_OPTIONS, getCharmById, isFillerCharm } from './charms.js'
import { BAG_CHARMS } from './bagCharms.js'
import { KEYCHAINS } from './keychains.js'
import { TOOLS } from './tools.js'

/** Inventory metal for products that are not silver/gold bracelet hardware. */
export const ACCESSORY_INVENTORY_METAL = 'accessory'

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   price: number,
 *   metal: string,
 *   image?: string | null,
 *   kind: 'charm' | 'base' | 'bag-charm' | 'keychain' | 'tool',
 *   isFiller?: boolean,
 * }} SellableProduct
 */

/** @type {SellableProduct[]} */
export const ACCESSORY_PRODUCTS = [
  ...BAG_CHARMS.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    metal: ACCESSORY_INVENTORY_METAL,
    image: item.image,
    kind: /** @type {const} */ ('bag-charm'),
  })),
  ...KEYCHAINS.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    metal: item.metal,
    image: item.image,
    kind: /** @type {const} */ ('keychain'),
  })),
  ...TOOLS.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    metal: ACCESSORY_INVENTORY_METAL,
    image: item.image,
    kind: /** @type {const} */ ('tool'),
  })),
]

/** @type {Map<string, SellableProduct>} */
const BY_ID = new Map()

for (const charm of charms) {
  BY_ID.set(charm.id, {
    id: charm.id,
    name: charm.name,
    price: charm.price,
    metal: charm.metal,
    image: charm.image ?? null,
    kind: 'charm',
    isFiller: isFillerCharm(charm),
  })
}

for (const base of BASE_OPTIONS) {
  BY_ID.set(base.id, {
    id: base.id,
    name: base.label,
    price: base.price,
    metal: base.metal,
    image: base.image,
    kind: 'base',
    isFiller: false,
  })
}

for (const product of ACCESSORY_PRODUCTS) {
  BY_ID.set(product.id, product)
}

/**
 * @param {string} id
 * @returns {SellableProduct | null}
 */
export function getSellableProduct(id) {
  if (typeof id !== 'string' || !id) return null
  return BY_ID.get(id) ?? null
}

/**
 * Canonical checkout map: id → { name, price }.
 * @returns {Map<string, { name: string, price: number }>}
 */
export function getCanonicalCheckoutItems() {
  /** @type {Map<string, { name: string, price: number }>} */
  const map = new Map()
  for (const product of BY_ID.values()) {
    if (product.isFiller) continue
    map.set(product.id, { name: product.name, price: product.price })
  }
  return map
}

/**
 * Find sellable product(s) by Square line-item display name.
 * @param {string} name
 * @returns {SellableProduct[]}
 */
export function findSellableProductsByName(name) {
  const needle = String(name ?? '').trim()
  if (!needle) return []
  return [...BY_ID.values()].filter((p) => !p.isFiller && p.name === needle)
}

export { getCharmById, BASE_OPTIONS }

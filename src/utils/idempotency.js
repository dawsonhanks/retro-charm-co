// Produces a stable key for a given cart state so that retrying the *same*
// checkout request (e.g. a flaky network response, or a double-click that
// slips past the disabled-button guard) reuses the same Square idempotency
// key instead of creating a second payment link. Any real change to the
// cart (different items or quantities) naturally produces a different key.
export function hashCartItems(items) {
  const normalized = items
    .map(({ id, quantity }) => `${id}:${quantity}`)
    .sort()
    .join('|')

  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }

  return `cart-${hash.toString(16)}-${normalized.length}`
}

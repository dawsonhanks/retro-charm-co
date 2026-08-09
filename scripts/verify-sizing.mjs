import { getCharmCapacity, SIZE_PRESETS, SIZE_OPTIONS, parseCharmCountInput } from '../src/data/charms.js'
import {
  addCharmToLinkOrder,
  createInitialLinkOrder,
  getCharmsFromLinkOrder,
  resizeLinkOrder,
} from '../src/utils/braceletLinks.js'
import { getCharmById } from '../src/data/charms.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const fakeCharms = [
  getCharmById('s-heart-red'),
  getCharmById('s-dice'),
  getCharmById('s-smiley-face'),
]

assert(fakeCharms.every(Boolean), 'Expected catalog charms for resize tests')

// Presets exist and map to SIZE_OPTIONS lengths
for (const preset of SIZE_PRESETS) {
  const option = SIZE_OPTIONS.find((o) => o.charmCount === preset.charmCount)
  assert(option, `Preset ${preset.id} charmCount must exist in SIZE_OPTIONS`)
}

// Build a 20-slot bracelet with 3 charms mid-track
let order = createInitialLinkOrder(20)
for (const charm of fakeCharms) {
  order = addCharmToLinkOrder(order, charm)
}
assert(getCharmsFromLinkOrder(order).length === 3, 'Should have 3 charms')
assert(order.length === 20, 'Should start at 20 slots')

// Grow to Large (23) — charms preserved, plains appended
const grown = resizeLinkOrder(order, 23)
assert(grown.ok, 'Grow should succeed')
assert(grown.linkOrder.length === 23, 'Grown length 23')
assert(
  getCharmsFromLinkOrder(grown.linkOrder)
    .map((c) => c.id)
    .sort()
    .join(',') ===
    fakeCharms
      .map((c) => c.id)
      .sort()
      .join(','),
  'Charm ids preserved on grow',
)

// Shrink to Small capacity (17) — charms preserved
const shrunk = resizeLinkOrder(grown.linkOrder, 17)
assert(shrunk.ok, 'Shrink to 17 should succeed with 3 charms')
assert(shrunk.linkOrder.length === 17, 'Shrunk length 17')
assert(getCharmsFromLinkOrder(shrunk.linkOrder).length === 3, 'Still 3 charms after shrink')

// Too small — do not delete charms
const blocked = resizeLinkOrder(shrunk.linkOrder, 2)
assert(!blocked.ok, 'Resize below charm count should fail')
assert(blocked.overflow === 1, 'Overflow should be 1 when 3 charms into 2 slots')
assert(getCharmsFromLinkOrder(blocked.linkOrder).length === 3, 'Original charms untouched on failure')

// Custom size parse
assert(parseCharmCountInput('12') === 12, 'Custom 12 ok')
assert(parseCharmCountInput('9') == null, 'Below min rejected')
assert(parseCharmCountInput('31') == null, 'Above max rejected')

// Watch capacity
assert(getCharmCapacity(20, 'silver-watch') === 15, 'Watch reserve applied')
assert(getCharmCapacity(20, 'silver') === 20, 'Classic capacity')

console.log(
  JSON.stringify(
    {
      ok: true,
      presets: SIZE_PRESETS.map((p) => `${p.label}:${p.charmCount}`),
      grow: grown.linkOrder.length,
      shrink: shrunk.linkOrder.length,
      blockedOverflow: blocked.overflow,
    },
    null,
    2,
  ),
)

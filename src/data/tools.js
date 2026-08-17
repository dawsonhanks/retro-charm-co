/**
 * Bracelet-building tools — standalone accessories (NOT bracelet links),
 * so they live here instead of in charms.js and never enter the Charm Studio.
 *
 * Photos live in /public/images/tools/.
 */

/** @typedef {{ id: string, name: string, price: number, image: string | null, subtitle?: string }} Tool */

/** @type {Tool[]} */
export const TOOLS = [
  {
    id: 'tool-builder',
    name: 'Builder Tool',
    price: 4.95,
    image: '/images/tools/builder-tool.webp',
    subtitle: 'Charm opener',
  },
]

export const TOOL_PRICE_FROM = Math.min(...TOOLS.map((t) => t.price))

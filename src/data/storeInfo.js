/**
 * Owner-editable store information for Shipping, Returns, Materials & Care, FAQ,
 * trust panels, and footer/checkout policy links.
 *
 * Update copy here — page components render from this file and should not hardcode
 * business policies. Values that are still unconfirmed use null (or a TODO_* token)
 * so customer-facing UI can fall back without inventing a policy.
 *
 * Shipping dollars / fulfillment timeframe stay authoritative in `./shipping.js`.
 */

import {
  FLAT_RATE_SHIPPING,
  formatFlatRateShippingLabel,
  getCustomerFacingFulfillmentCopy,
} from './shipping'
import { instagram } from './social'

/** Shared YouTube sizing / assembly tutorial used on Returns and Materials pages. */
export const ASSEMBLY_TUTORIAL = {
  href: 'https://www.youtube.com/watch?v=rEOQaibeUWY',
  text: 'Italian charm bracelet assembly tutorial',
  /** Accessible name including new-tab disclosure for screen readers. */
  ariaLabel: 'Italian charm bracelet assembly tutorial (opens in a new tab)',
}

/** Sentinel built at runtime so placeholder strings are not shipped as customer copy. */
export const POLICY_TODO_TOKEN = ['TODO', 'OWNER', 'CONFIRM'].join('_')

/**
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isPolicyPlaceholder(value) {
  if (value == null) return true
  const trimmed = String(value).trim()
  if (!trimmed) return true
  const upper = trimmed.toUpperCase()
  return (
    upper === POLICY_TODO_TOKEN ||
    upper.startsWith('TODO') ||
    upper.includes('OWNER_CONFIRM') ||
    upper.includes('UPDATE_ME')
  )
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function getConfirmedCopy(value) {
  if (isPolicyPlaceholder(value)) return null
  return String(value).trim()
}

// ── Contact (known) ─────────────────────────────────────────────────────────

export const CONTACT = {
  email: 'retro.charm.co.ut@gmail.com',
  /** How customers should reach us for order questions. */
  methodLabel: 'Email',
  instagramHandle: instagram.handle,
  instagramUrl: instagram.url,
  /** Short line used across trust / policy pages. */
  get summary() {
    return `Email ${this.email} — we reply as soon as we can.`
  },
}

// ── Info page routes (nav + sitemap) ────────────────────────────────────────

/** @typedef {{ path: string, label: string, shortLabel: string, title: string, description: string }} InfoPageMeta */

/** @type {InfoPageMeta[]} */
export const INFO_PAGES = [
  {
    path: '/shipping',
    label: 'Shipping',
    shortLabel: 'Shipping',
    title: 'Shipping | RetroCharm Co',
    description:
      'Flat $6 USPS shipping, 3–5 business day processing, U.S. destinations, and delivery help for RetroCharm Co orders.',
  },
  {
    path: '/returns',
    label: 'Returns & Exchanges',
    shortLabel: 'Returns',
    title: 'Returns & Exchanges | RetroCharm Co',
    description:
      'Return eligibility, damaged-order help, and how to contact RetroCharm Co about your order.',
  },
  {
    path: '/materials',
    label: 'Materials & Care',
    shortLabel: 'Materials',
    title: 'Materials & Care | RetroCharm Co',
    description:
      'Stainless steel materials, gold-tone and silver-tone finishes, water and care guidance, and sizing for RetroCharm Co bracelets.',
  },
  {
    path: '/faq',
    label: 'FAQ',
    shortLabel: 'FAQ',
    title: 'FAQ | RetroCharm Co',
    description:
      'Answers about building bracelets, shipping, materials, sizing, checkout, and contacting RetroCharm Co.',
  },
]

export const FOOTER_POLICY_LINKS = INFO_PAGES.map(({ path, label }) => ({ to: path, label }))

export const CHECKOUT_POLICY_LINKS = [
  { to: '/shipping', label: 'Shipping' },
  { to: '/returns', label: 'Returns' },
  { to: '/materials', label: 'Materials' },
  { to: '/faq', label: 'FAQ' },
]

// ── Shipping content ────────────────────────────────────────────────────────

export const SHIPPING_INFO = {
  intro:
    'Online orders ship from Utah after your bracelet is built to your Charm Studio selections.',
  /** Pulled from shipping.js — do not duplicate the dollar amount here. */
  get flatRateLabel() {
    return formatFlatRateShippingLabel(FLAT_RATE_SHIPPING)
  },
  flatRateDetail:
    'Shipping is a flat $6 per order, regardless of the number of bracelets or charms purchased.',
  processing: {
    /** Short line shared with trust panels via shipping.js. */
    get timeframe() {
      return getCustomerFacingFulfillmentCopy()
    },
    lead: 'Orders ship within 3–5 business days. Business days do not include weekends or federal holidays.',
    detail:
      'This is the time required to prepare and ship the order. USPS delivery time begins after the order has shipped and may vary by destination.',
    delayPolicy:
      'If we cannot ship within the promised timeframe, we will contact you with a revised shipping date and give you the choice to accept the delay or cancel for a full refund.',
  },
  /** @deprecated Prefer `processing.timeframe` — kept for older callers. */
  get processingTimeframe() {
    return this.processing.timeframe
  },
  /** @deprecated Prefer `processing.detail`. */
  get processingDetail() {
    return this.processing.detail
  },
  destinations: {
    summary:
      'We currently ship through USPS to addresses within the United States, including:',
    includes: [
      'All 50 states',
      'PO Boxes',
      'APO and FPO addresses',
      'U.S. territories',
    ],
    international: 'We do not currently ship internationally.',
  },
  tracking:
    'Customer-facing tracking is not currently provided. Customers will receive confirmation when their order has shipped.',
  nonArrival: {
    lead: 'If your order has not arrived within 14 business days after shipment confirmation, contact RetroCharm Co.',
    replacement:
      'After confirming that the shipping address entered at checkout was correct, we will resend the order once at no additional cost.',
    addressNote:
      'This replacement coverage does not apply when an incomplete or incorrect address was entered at checkout. Contact us as soon as possible if you notice an address error.',
  },
  taxNote: 'Sales tax is calculated by Square at checkout based on the shipping address you enter.',
  contactNote: `Questions about an order in transit? ${CONTACT.summary}`,
  get contactEmail() {
    return CONTACT.email
  },
}

// ── Returns & exchanges ─────────────────────────────────────────────────────

export const RETURNS_INFO = {
  intro:
    'Every RetroCharm Co bracelet is assembled to order. Because each bracelet is made specifically for its customer, custom bracelets and ready-made bundles are final sale except when an order arrives damaged, defective, or different from what was ordered.',
  sizing: {
    lead:
      'Italian charm bracelets can be resized at home by adding or removing links. Customers can follow this',
    tutorial: ASSEMBLY_TUTORIAL,
    paragraphs: [
      'Sizing preferences do not qualify for a return, refund, or complimentary resizing.',
      'Customers who do not want to resize their bracelet at home may contact RetroCharm Co to request paid mail-in resizing. All resizing fees and shipping costs are the customer’s responsibility and will be disclosed for approval before the bracelet is mailed.',
      'Mail-in resizing must be authorized in advance. RetroCharm Co is not responsible for bracelets mailed without prior approval.',
      'Damage caused during at-home adjustment is not considered a product defect. Contact us if you need assistance before adjusting your bracelet.',
    ],
  },
  damagedOrder: {
    summary:
      'Contact us within 7 calendar days of delivery if your order arrives damaged, defective, or different from what you ordered.',
    includeIntro: 'Include:',
    include: [
      'Your order number',
      'A description of the problem',
      'Clear photographs showing the issue',
    ],
    resolution:
      'If the problem resulted from shipping damage, a product defect, or our fulfillment error, RetroCharm Co will cover the necessary shipping costs and provide an appropriate repair, replacement, or refund.',
  },
  cancellations: {
    paragraphs: [
      'Contact us as soon as possible if you need to cancel or change an order. Requests made within 12 hours of purchase will generally be accepted.',
      'After assembly has begun, cancellations and changes are not guaranteed.',
      'If we cannot ship within the promised timeframe, we will notify you and offer the choice to accept the revised shipping date or cancel for a full refund to the original payment method.',
    ],
  },
  returnAuthorization:
    'Contact RetroCharm Co before mailing any product. Unauthorized returns or resizing shipments may be refused or returned to the sender.',
  refundTiming: {
    paragraphs: [
      'Approved refunds are issued to the original payment method. Processing time after issuance depends on the customer’s bank or payment provider.',
      'Original shipping charges are nonrefundable unless the refund results from shipping damage, a defect, an incorrect order, or another RetroCharm Co error.',
    ],
  },
  /** Uses the shared CONTACT email — do not hardcode a different address here. */
  get contactEmail() {
    return CONTACT.email
  },
  contactNote: CONTACT.summary,
}

// ── Materials & care ────────────────────────────────────────────────────────

export const MATERIALS_INFO = {
  intro:
    'Materials, everyday wear, finish expectations, and sizing for RetroCharm Co stainless steel bracelets.',
  materials: {
    paragraphs: [
      'RetroCharm Co bracelet bases, charms, dangle charms, and watch bands are made from stainless steel in gold-tone and silver-tone finishes.',
      'Our jewelry is not solid gold or solid silver. We do not advertise a specific plating method because one has not been confirmed by the supplier.',
    ],
  },
  /** Finish options shown to customers — tone language only, not solid metal claims. */
  availableFinishes: [
    {
      id: 'silver',
      label: 'Silver-tone',
      note: 'Stainless steel finish across bases, charms, dangle charms, and watch bands.',
    },
    {
      id: 'gold',
      label: 'Gold-tone',
      note: 'Stainless steel finish across bases, charms, dangle charms, and watch bands.',
    },
  ],
  waterAndWear: {
    summary:
      'Our stainless-steel pieces are designed to withstand normal exposure to water and sweat.',
    careIntro: 'To keep your bracelet looking its best:',
    careTips: [
      'Dry it after prolonged water or sweat exposure',
      'Rinse and dry it after contact with saltwater or chlorinated water',
      'Avoid direct contact with perfume, lotion, household cleaners, and harsh chemicals',
      'Store it in a dry place when it is not being worn',
      'Avoid pulling or bending links with excessive force',
    ],
  },
  finishAndTarnishing: {
    paragraphs: [
      'Stainless steel is resistant to tarnishing during ordinary wear, but cosmetic finish wear may occur over time. Wear can vary based on water, chemicals, friction, storage, and individual use.',
      'Water resistance does not guarantee that the cosmetic finish will remain unchanged indefinitely.',
    ],
  },
  sizing: {
    lead: 'Italian charm bracelets can be adjusted at home by adding or removing links. Follow our',
    tutorial: ASSEMBLY_TUTORIAL,
    contactNote: 'Contact RetroCharm Co before attempting an adjustment if you need assistance.',
  },
  /** Compact trust-panel line — materials fact, not a plating or purity claim. */
  trustPanelLabel: 'Stainless steel · gold-tone & silver-tone',
  contactNote: `Material or care questions? ${CONTACT.summary}`,
  get contactEmail() {
    return CONTACT.email
  },
}

// ── Square checkout trust (payment processing only) ─────────────────────────

export const CHECKOUT_TRUST = {
  /** Short trust-panel line — payment security, not a product guarantee. */
  shortLabel: 'Secure checkout powered by Square',
  detail:
    'You complete payment on Square’s secure checkout. Square processes your payment; RetroCharm Co is responsible for the products and fulfillment.',
  cartNote:
    'Checkout opens Square’s secure payment page. Square does not manufacture or guarantee RetroCharm Co products.',
}

// ── Concise trust panel (Charm Studio + cart) ───────────────────────────────

/**
 * Compact assurances shown near add-to-cart / checkout.
 * Built from confirmed store facts only.
 */
export function getTrustPanelItems() {
  const fulfillment = getCustomerFacingFulfillmentCopy()
  /** @type {{ id: string, label: string, to?: string }[]} */
  const items = [
    {
      id: 'shipping',
      label: formatFlatRateShippingLabel(FLAT_RATE_SHIPPING),
      to: '/shipping',
    },
  ]
  if (fulfillment) {
    items.push({ id: 'fulfillment', label: fulfillment, to: '/shipping' })
  }
  items.push(
    {
      id: 'square',
      label: CHECKOUT_TRUST.shortLabel,
    },
    {
      id: 'materials',
      label: MATERIALS_INFO.trustPanelLabel,
      to: '/materials',
    },
    {
      id: 'returns',
      label: 'Returns help',
      to: '/returns',
    },
  )
  return items
}

// ── FAQ entries (shared by /faq and Find Us accordion) ──────────────────────

/**
 * @typedef {{ id: string, question: string, answer: string }} FaqEntry
 */

/** @type {FaqEntry[]} */
export const FAQ_ENTRIES = [
  {
    id: 'how-it-works',
    question: 'How does this work?',
    answer:
      'Pick a starter bracelet as your base, then choose as many individual charms as you like. Add your favorites to cart and place your order online in minutes.',
  },
  {
    id: 'add-later',
    question: 'Can I add charms later?',
    answer:
      'Absolutely. Italian charm bracelets are designed to be expandable, so you can come back anytime and order more charms to keep building your stack.',
  },
  {
    id: 'tarnish',
    question: 'Will the charms tarnish over time?',
    answer:
      'Stainless steel is resistant to tarnishing during ordinary wear, but cosmetic finish wear may occur over time depending on water, chemicals, friction, storage, and use. Full Materials & Care details are on that page.',
  },
  {
    id: 'sizing',
    question: 'What sizes are available?',
    answer:
      'Choose by link count in Charm Studio. Presets cover Small, Medium, and Large wrist ranges, and the expandable link design makes it easy to get a comfortable fit. Open Charm Studio for the full size chart and photo guide.',
  },
  {
    id: 'shipping-cost',
    question: 'How much is shipping?',
    answer: `${SHIPPING_INFO.flatRateDetail} ${SHIPPING_INFO.processing.lead} Full details are on the Shipping page.`,
  },
  {
    id: 'shipping-destinations',
    question: 'Where do you ship?',
    answer: `${SHIPPING_INFO.destinations.summary} ${SHIPPING_INFO.destinations.includes.join('; ')}. ${SHIPPING_INFO.destinations.international}`,
  },
  {
    id: 'shipping-tracking',
    question: 'Do you provide tracking?',
    answer: SHIPPING_INFO.tracking,
  },
  {
    id: 'materials',
    question: 'What are the bracelets made of?',
    answer:
      'Bracelet bases, charms, dangle charms, and watch bands are stainless steel in gold-tone and silver-tone finishes. They are not solid gold or solid silver, and we do not advertise a specific plating method. See Materials & Care for water, finish, and sizing guidance.',
  },
  {
    id: 'returns',
    question: 'What is your return policy?',
    answer: `Custom bracelets and ready-made bundles are final sale except when an order arrives damaged, defective, or different from what was ordered. Sizing preferences do not qualify for a return. Full details are on the Returns & Exchanges page — email ${CONTACT.email} within 7 days of delivery if something is wrong.`,
  },
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer:
      'Online checkout is powered by Square’s secure payment page. At markets we take cash, card (via Square), and Venmo when needed.',
  },
  {
    id: 'build-time',
    question: 'How long does it take to build a bracelet?',
    answer:
      'Most people finish building their bracelet in about 10–15 minutes, but you can take your time and customize every detail.',
  },
  {
    id: 'contact',
    question: 'How do I contact you?',
    answer: `${CONTACT.summary} You can also reach us on Instagram at ${CONTACT.instagramHandle}.`,
  },
]

/**
 * Fallback paragraph when a policy field is still a TODO / null.
 * @param {string} topic
 * @returns {string}
 */
export function unconfirmedPolicyNote(topic) {
  return `${topic} is still being finalized. ${CONTACT.summary}`
}

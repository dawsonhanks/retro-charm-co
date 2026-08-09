/**
 * Canonical ecommerce funnel event names.
 * Shared by client (`src/lib/analytics.js`) and server webhook tracking.
 * Keep names stable — they appear in the Vercel Analytics dashboard.
 */
export const AnalyticsEvent = Object.freeze({
  HOMEPAGE_VIEWED: 'homepage_viewed',
  CREATE_BRACELET_CLICKED: 'create_bracelet_clicked',
  BUILDER_OPENED: 'builder_opened',
  BASE_SELECTED: 'base_selected',
  SIZE_SELECTED: 'size_selected',
  CHARM_ADDED: 'charm_added',
  CHARM_REMOVED: 'charm_removed',
  BUNDLE_VIEWED: 'bundle_viewed',
  BUNDLE_ADDED: 'bundle_added',
  CART_VIEWED: 'cart_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  /** Client: user returned from Square with our redirect token — NOT payment proof. */
  CHECKOUT_RETURNED: 'checkout_returned',
  /**
   * Server only: Square webhook `payment.updated` with status COMPLETED.
   * Do not fire this from the order-confirmation page.
   */
  PURCHASE_COMPLETED: 'purchase_completed',
  EMAIL_SIGNUP_COMPLETED: 'email_signup_completed',
})

/** @typedef {typeof AnalyticsEvent[keyof typeof AnalyticsEvent]} AnalyticsEventName */

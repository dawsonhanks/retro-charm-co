import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { FLAT_RATE_SHIPPING, getCustomerFacingFulfillmentCopy, SHIPPING_LINE_ITEM_NAME } from '../data/shipping'
import { CartItemThumbnail } from './CartItemThumbnail'
import { BraceletBuildsPreview } from './BraceletBuildsPreview'
import { CartItemQuantityControls, RemoveCartItemButton } from './RemoveCartItemButton'
import { PolicyLinks } from './PolicyLinks'
import { CustomerProofNearCta } from './CustomerProof'
import { TrustPanel } from './TrustPanel'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, cartTotal, braceletBuilds } = useCart()
  const reduceMotion = useReducedMotion()
  const closeButtonRef = useRef(null)
  const panelRef = useRef(null)
  const titleId = useId()
  const hasItems = items.length > 0
  // Flat-rate shipping is charged once per order, not per bracelet build.
  const orderTotal = cartTotal + FLAT_RATE_SHIPPING
  const fulfillmentCopy = getCustomerFacingFulfillmentCopy()

  function handleCheckout() {
    onClose()
    navigate('/cart')
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  const panelTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 320, damping: 32 }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[60] bg-jscolors-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-[70] flex h-screen w-full max-w-md flex-col border-l border-jscolors-gold/35 bg-jscolors-cream shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={panelTransition}
          >
            <div className="flex items-center justify-between border-b border-jscolors-gold/30 px-5 py-4">
              <h2 id={titleId} className="font-display text-xl font-semibold text-jscolors-ink">
                Your Cart
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-jscolors-gold/50 text-jscolors-ink transition hover:bg-jscolors-pink/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
                aria-label="Close cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <BraceletBuildsPreview builds={braceletBuilds} className="mb-4" />
              {hasItems ? (
                <>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-jscolors-gold/30 bg-white/60 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <CartItemThumbnail item={item} />
                          <div className="min-w-0 flex-1">
                            <p className="font-display font-semibold text-jscolors-ink">{item.name}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-ink/60">
                              {item.metal}
                            </p>
                            <p className="mt-2 font-semibold text-jscolors-blue">{formatPrice(item.price)} each</p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                              <CartItemQuantityControls
                                itemName={item.name}
                                quantity={item.quantity}
                                onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                              />
                              <RemoveCartItemButton
                                itemName={item.name}
                                onClick={() => removeItem(item.id)}
                              />
                            </div>
                          </div>
                          <p className="shrink-0 pt-0.5 text-sm font-semibold text-jscolors-blue">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <CustomerProofNearCta className="mt-6" heading="Customers love these details" />
                  <TrustPanel className="mt-3" compact />
                  <PolicyLinks className="mt-3" />
                </>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-jscolors-ink/70">Your cart is empty.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/create')
                    }}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-jscolors-cta px-6 py-2.5 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
                  >
                    Build a bracelet
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-jscolors-gold/30 px-5 py-4">
              {hasItems ? (
                <>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between text-jscolors-ink/80">
                      <span>Subtotal</span>
                      <span className="font-semibold text-jscolors-blue">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-jscolors-ink/80">
                      <span>{SHIPPING_LINE_ITEM_NAME}</span>
                      <span className="font-semibold text-jscolors-blue">{formatPrice(FLAT_RATE_SHIPPING)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-medium text-jscolors-ink">Estimated total before tax</span>
                    <span className="font-display text-xl font-semibold text-jscolors-blue">{formatPrice(orderTotal)}</span>
                  </div>
                  {fulfillmentCopy && (
                    <p className="mt-2 text-xs text-jscolors-ink/65">
                      {fulfillmentCopy}. Shipping is charged once per order.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-jscolors-ink/65">Add a bracelet to see shipping and totals.</p>
              )}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!hasItems}
                className="mt-4 w-full rounded-full bg-jscolors-cta px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasItems ? 'Proceed to Checkout' : 'Cart is empty'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

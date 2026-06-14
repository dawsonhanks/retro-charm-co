import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, cartTotal } = useCart()

  function handleCheckout() {
    onClose()
    navigate('/cart')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[60] bg-jscolors-navy/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-jscolors-gold/35 bg-jscolors-cream shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-jscolors-gold/30 px-5 py-4">
              <h2 className="font-display text-xl font-semibold text-jscolors-navy">Your Cart</h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-jscolors-gold/50 text-jscolors-navy transition hover:bg-jscolors-pink/35"
                aria-label="Close cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="py-12 text-center text-jscolors-navy/70">Your cart is empty.</p>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-jscolors-gold/30 bg-white/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-semibold text-jscolors-navy">{item.name}</p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-navy/60">
                            {item.metal}
                          </p>
                          <p className="mt-2 font-semibold text-jscolors-charcoal">{formatPrice(item.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-jscolors-navy/60 transition hover:bg-jscolors-pink/35 hover:text-jscolors-navy"
                          aria-label={`Remove ${item.name}`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-jscolors-gold/50 text-jscolors-navy transition hover:bg-jscolors-gold/15"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center font-semibold text-jscolors-navy">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-jscolors-gold/50 text-jscolors-navy transition hover:bg-jscolors-gold/15"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-jscolors-gold/30 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-jscolors-navy/80">Total</span>
                <span className="font-display text-xl font-semibold text-jscolors-navy">{formatPrice(cartTotal)}</span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="mt-4 w-full rounded-full bg-jscolors-navy px-6 py-3 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proceed to Checkout
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

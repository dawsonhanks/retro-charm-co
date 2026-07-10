import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { CartDrawer } from './CartDrawer.jsx'

const links = [
  { to: '/', label: 'Home' },
  { to: '/create', label: 'Charm Studio' },
  { to: '/find-us', label: 'Find Us' },
  { to: '/about', label: 'About' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { cartCount } = useCart()

  return (
    <header className="sticky top-0 z-50 border-b border-jscolors-gold/35 bg-jscolors-cream/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4" aria-label="Main">
        <Link to="/" className="group flex items-center gap-2 font-display text-lg font-semibold text-jscolors-navy md:text-xl">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-jscolors-gold/80 bg-[#f6eef1] text-[#b08a4e] transition group-hover:border-jscolors-navy">
            ✦
          </span>
          <span className="text-balance">RetroCharm Co</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-jscolors-navy text-jscolors-cream' : 'text-jscolors-navy/90 hover:bg-jscolors-pink/35 hover:text-jscolors-navy'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-jscolors-gold/50 text-jscolors-navy transition hover:bg-jscolors-pink/35"
            aria-label="Open cart"
            aria-expanded={cartOpen}
            onClick={() => setCartOpen((o) => !o)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-jscolors-pink px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-jscolors-gold/50 text-jscolors-navy md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
          <span className="sr-only">Open menu</span>
          <span className="relative h-5 w-6">
            <motion.span
              className="absolute left-0 top-0 block h-0.5 w-6 rounded-full bg-current"
              animate={open ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            />
            <motion.span
              className="absolute left-0 top-[9px] block h-0.5 w-6 rounded-full bg-current"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="absolute left-0 top-[18px] block h-0.5 w-6 rounded-full bg-current"
              animate={open ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            />
          </span>
          </button>
        </div>
      </nav>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-jscolors-gold/30 bg-jscolors-cream md:hidden"
          >
            <ul className="flex flex-col px-4 py-4">
              {links.map(({ to, label }, i) => (
                <motion.li
                  key={to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  <NavLink
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-base font-medium ${
                        isActive ? 'bg-jscolors-navy text-jscolors-cream' : 'text-jscolors-navy hover:bg-jscolors-pink/35'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

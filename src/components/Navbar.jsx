import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/find-us', label: 'Find Us' },
  { to: '/about', label: 'About' },
  { to: '/shop', label: 'Shop' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-jscolors-navy/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4" aria-label="Main">
        <Link to="/" className="group flex items-center gap-2 font-display text-lg font-semibold text-jscolors-cream md:text-xl">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-jscolors-gold/80 bg-jscolors-charcoal/50 text-jscolors-gold transition group-hover:border-jscolors-gold">
            ✦
          </span>
          <span className="text-balance">
            Retro Charm Co <span className="text-jscolors-pink">2.0</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-jscolors-pink text-white' : 'text-jscolors-cream/85 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-jscolors-gold/40 text-jscolors-cream md:hidden"
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
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/10 bg-jscolors-navy md:hidden"
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
                        isActive ? 'bg-jscolors-pink text-white' : 'text-jscolors-cream hover:bg-white/10'
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

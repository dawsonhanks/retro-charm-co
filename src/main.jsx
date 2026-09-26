import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'

// A page chunk can 404 if the browser has an older build loaded and a new
// deploy has since replaced the hashed asset files (e.g. someone had the
// site open across a deploy, then clicked into a lazy-loaded route). Vite's
// dynamic-import wrapper emits this event when that happens; without this
// handler the failed import throws with nothing to catch it this early,
// leaving a blank page. Reload once to pick up the current build; the guard
// avoids a reload loop if the site is genuinely broken.
window.addEventListener('vite:preloadError', () => {
  const key = 'rcw-preload-reload-attempted'
  if (!window.sessionStorage.getItem(key)) {
    window.sessionStorage.setItem(key, '1')
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </MotionConfig>
    </HelmetProvider>
  </StrictMode>,
)

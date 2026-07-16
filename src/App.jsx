import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'
import { NextMarketBanner } from './components/NextMarketBanner'
import { ScrollToTop } from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'

const Create = lazy(() => import('./pages/Create.jsx'))
const FindUs = lazy(() => import('./pages/FindUs.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.jsx'))

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16" role="status" aria-live="polite">
      <img
        src="/images/brand/retro-charm-icon-mark.webp"
        alt=""
        width={56}
        height={44}
        className="h-12 w-auto animate-pulse object-contain opacity-90"
      />
      <span className="sr-only">Loading page</span>
    </div>
  )
}

function Shell() {
  const { pathname } = useLocation()
  const showMarketBanner = pathname === '/find-us'

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-clip bg-jscolors-cream">
      <Navbar />
      {showMarketBanner ? <NextMarketBanner /> : null}
      <main className="min-w-0 flex-1" id="main-content">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          {/* Old build-and-checkout flow was retired in favor of a single cart (CartContext).
              Redirect any existing /shop links/bookmarks straight to the real cart. */}
          <Route path="shop" element={<Navigate to="/cart" replace />} />
          <Route path="create" element={<Create />} />
          <Route path="find-us" element={<FindUs />} />
          <Route path="about" element={<About />} />
          <Route path="cart" element={<Cart />} />
          <Route path="order-confirmation" element={<OrderConfirmation />} />
        </Route>
      </Routes>
    </>
  )
}

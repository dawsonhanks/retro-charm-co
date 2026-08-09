import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'
import { NextMarketBanner } from './components/NextMarketBanner'
import { ScrollToTop } from './components/ScrollToTop.jsx'
import { AnalyticsBootstrap } from './components/AnalyticsBootstrap.jsx'
import Home from './pages/Home.jsx'

const Create = lazy(() => import('./pages/Create.jsx'))
const FindUs = lazy(() => import('./pages/FindUs.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.jsx'))
const Shipping = lazy(() => import('./pages/Shipping.jsx'))
const Returns = lazy(() => import('./pages/Returns.jsx'))
const Materials = lazy(() => import('./pages/Materials.jsx'))
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

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
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[100] -translate-y-[220%] rounded-full bg-jscolors-cta px-4 py-2 text-sm font-semibold text-jscolors-cream shadow-lg transition focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
      >
        Skip to main content
      </a>
      <Navbar />
      {showMarketBanner ? <NextMarketBanner /> : null}
      <main className="min-w-0 flex-1" id="main-content" tabIndex={-1}>
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
      <Analytics debug={import.meta.env.DEV} />
      <AnalyticsBootstrap />
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
          <Route path="shipping" element={<Shipping />} />
          <Route path="returns" element={<Returns />} />
          <Route path="materials" element={<Materials />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}

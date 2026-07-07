import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'
import { NextMarketBanner } from './components/NextMarketBanner'
import Home from './pages/Home.jsx'
import Create from './pages/Create.jsx'
import FindUs from './pages/FindUs.jsx'
import About from './pages/About.jsx'
import Cart from './pages/Cart.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'

function Shell() {
  const { pathname } = useLocation()
  const showMarketBanner = pathname === '/find-us'

  return (
    <div className="flex min-h-dvh flex-col bg-jscolors-cream">
      <Navbar />
      {showMarketBanner ? <NextMarketBanner /> : null}
      <main className="flex-1" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
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
  )
}

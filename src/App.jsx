import { Routes, Route, Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'
import { NextMarketBanner } from './components/NextMarketBanner'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Create from './pages/Create.jsx'
import FindUs from './pages/FindUs.jsx'
import About from './pages/About.jsx'
import Cart from './pages/Cart.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'

function Shell() {
  return (
    <div className="flex min-h-dvh flex-col bg-jscolors-cream">
      <Navbar />
      <NextMarketBanner />
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
        <Route path="shop" element={<Shop />} />
        <Route path="create" element={<Create />} />
        <Route path="find-us" element={<FindUs />} />
        <Route path="about" element={<About />} />
        <Route path="cart" element={<Cart />} />
        <Route path="order-confirmation" element={<OrderConfirmation />} />
      </Route>
    </Routes>
  )
}

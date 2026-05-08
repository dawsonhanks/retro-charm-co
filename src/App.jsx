import { Routes, Route, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Gallery from './pages/Gallery.jsx'
import FindUs from './pages/FindUs.jsx'
import About from './pages/About.jsx'

function AnimatedOutlet() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
        id="main-content"
      >
        <Outlet />
      </motion.main>
    </AnimatePresence>
  )
}

function Shell() {
  return (
    <div className="flex min-h-dvh flex-col bg-jscolors-cream">
      <Navbar />
      <AnimatedOutlet />
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
        <Route path="gallery" element={<Gallery />} />
        <Route path="find-us" element={<FindUs />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  )
}

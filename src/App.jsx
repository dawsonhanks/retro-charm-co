import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Shop = lazy(() => import('./pages/Shop.jsx'))
const Gallery = lazy(() => import('./pages/Gallery.jsx'))
const FindUs = lazy(() => import('./pages/FindUs.jsx'))
const About = lazy(() => import('./pages/About.jsx'))

function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-jscolors-cream/80">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-jscolors-gold border-t-jscolors-pink" role="status" aria-label="Loading page" />
    </div>
  )
}

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
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
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

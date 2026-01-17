import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Marquee from './components/Marquee'
import Hero from './components/Hero'
import LatestDrop from './components/LatestDrop'
import CartDrawer from './components/CartDrawer'
import ProductPage from './components/ProductPage'
import AboutSection from './components/AboutSection'
import ContactPage from './components/ContactPage'
import WelcomeOverlay from './components/WelcomeOverlay'


function HomePage() {
  return (
    <>
      <Hero />
      <main>
        <LatestDrop />
        <AboutSection />
      </main>
    </>
  )
}

function App() {
  return (
    <div className="app-container">
      <WelcomeOverlay />

      <Marquee />
      <Navbar />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </div>
  )
}

export default App

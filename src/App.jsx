import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

import AboutSection from './components/AboutSection';
import AboutPage from './components/AboutPage';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProductPage from './components/ProductPage';

import WelcomeOverlay from './components/WelcomeOverlay';
import ProductGrid from './components/ProductGrid'; // NEW: Import ProductGrid

function HomePage() {
  return (
    <>
      <Hero />
      <main>
        <ProductGrid /> {/* NEW: Render the ProductGrid here */}

        <AboutSection />
        <CtaSection />
      </main>
    </>
  );
}

function App() {
  return (
    <div className="app-container">
      <WelcomeOverlay />
      <Navbar />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product/:id" element={<ProductPage />} />

      </Routes>
      <Footer />
    </div>
  );
}

export default App;

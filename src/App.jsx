import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AnnouncementBar from './components/AnnouncementBar';

import AboutPage from './components/AboutPage';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import ProductPage from './components/ProductPage';
import WelcomeOverlay from './components/WelcomeOverlay';
import ProductGrid from './components/ProductGrid';
import Chatbot from './components/Chatbot';

function HomePage() {
  return (
    <>
      <Hero />
      <main>
        <ProductGrid />

        <CtaSection />
      </main>
    </>
  );
}

function App() {
  return (
    <div className="app-container">
      <WelcomeOverlay />
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
      <Chatbot />
      <Footer />
    </div>
  );
}

export default App;

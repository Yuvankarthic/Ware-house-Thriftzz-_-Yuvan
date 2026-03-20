import { Switch, Route, useLocation } from 'react-router-dom';
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
import Shop from './pages/Shop';

import AdminRoot from './admin/AdminRoot';

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
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin" component={AdminRoot} />
      </Switch>
    );
  }

  return (
    <div className="app-container">
      <WelcomeOverlay />
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/shop" component={Shop} />
        <Route path="/about" component={AboutPage} />
        <Route path="/product/:id" component={ProductPage} />
      </Switch>
      <Chatbot />
      <Footer />
    </div>
  );
}

export default App;

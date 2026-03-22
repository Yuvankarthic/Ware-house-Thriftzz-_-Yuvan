import { useEffect } from 'react';
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
import ProductGrid from './components/ProductGrid';
import Chatbot from './components/Chatbot';
import Shop from './pages/Shop';
import CategoryPage from './pages/CategoryPage';
import TrackOrderPage from './pages/TrackOrderPage';
import ThankYouPage from './pages/ThankYouPage';
import WelcomeOverlay from './components/WelcomeOverlay';

import AdminRoot from './admin/AdminRoot';
import { trackVisit, trackEvent } from './utils/activityTracker';

function HomeAndShopPage() {
  return (
    <>
      <Hero />
      <Shop />
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

  useEffect(() => {
    const page = location.pathname === '/' ? 'welcome' : location.pathname.replace(/^\//, '') || 'homepage';
    trackVisit(page);
    trackEvent('page_visit', null, page);
  }, [location.pathname]);

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin" component={AdminRoot} />
      </Switch>
    );
  }

  if (location.pathname === '/') {
    return <WelcomeOverlay />;
  }

  return (
    <div className="app-container">
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />
      <Switch>
        <Route exact path="/" component={HomeAndShopPage} />
        <Route exact path="/shop" component={HomeAndShopPage} />
        <Route path="/shop/:category" component={CategoryPage} />
        <Route path="/track-order" component={TrackOrderPage} />
        <Route path="/thank-you" component={ThankYouPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/product/:id" component={ProductPage} />
      </Switch>
      <Chatbot />
      <Footer />
    </div>
  );
}

export default App;

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'
import './styles/animations.css'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { SiteSettingsProvider } from './context/SiteSettingsContext.jsx'

const API = import.meta.env.VITE_API_URL
const ping = () => fetch(`${API}/health`).catch(() => {})
ping()
setInterval(ping, 13 * 60 * 1000)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SiteSettingsProvider>
      <BrowserRouter>
        <CartProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </CartProvider>
      </BrowserRouter>
    </SiteSettingsProvider>
  </React.StrictMode>,
)

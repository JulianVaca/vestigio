import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './styles/fonts.css'
import './styles/global.css'
import './styles/v22.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { MotionProvider } from './context/MotionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <MotionProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </MotionProvider>
    </HashRouter>
  </StrictMode>,
)

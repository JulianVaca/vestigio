import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/inter'
import './styles/global.css'
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

import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Toast from './components/Toast.jsx'
import PageTransition from './components/PageTransition.jsx'
import Home from './pages/Home.jsx'

// Code splitting: cada página se descarga sólo cuando se visita.
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const Product = lazy(() => import('./pages/Product.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Museum = lazy(() => import('./pages/Museum.jsx'))
const Brand = lazy(() => import('./pages/Brand.jsx'))
const Sneakers = lazy(() => import('./pages/Sneakers.jsx'))
const SneakerDetail = lazy(() => import('./pages/SneakerDetail.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  const location = useLocation()
  const isMuseum = location.pathname.startsWith('/museo')

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <Header overlay={isMuseum} />
      <PageTransition key={location.pathname}>
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/producto/:id" element={<Product />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/nosotros" element={<About />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/museo" element={<Museum />} />
            <Route path="/marca" element={<Brand />} />
            <Route path="/sneakers" element={<Sneakers />} />
            <Route path="/sneakers/:id" element={<SneakerDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        {!isMuseum && <Footer />}
      </PageTransition>
      <Toast />
    </>
  )
}

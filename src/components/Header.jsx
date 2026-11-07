import { memo, useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from './Logo.jsx'
import { CartIcon, MenuIcon, CloseIcon, MotionIcon, StillIcon } from './Icons.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { runCartAcrossScreen } from '../lib/flyToCart.js'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/museo', label: 'Museo 3D' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/sneakers', label: 'Sneakers' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

/**
 * Header: se oculta al bajar (deja espacio al contenido) y reaparece al subir.
 * Usa rAF + refs para que el evento scroll no provoque trabajo en React salvo cuando cambia el umbral.
 */
const Header = memo(function Header({ overlay }) {
  const { count } = useCart()
  const { reduced, toggle } = useMotionPref()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const stateRef = useRef({ lastY: 0, scrolled: false, hidden: false, ticking: false })
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    const st = stateRef.current
    const update = () => {
      st.ticking = false
      const y = window.scrollY
      const nextScrolled = y > 40
      const nextHidden = y > 300 && y > st.lastY + 2
      const revealUp = y < st.lastY - 4 || y <= 300
      st.lastY = y

      if (nextScrolled !== st.scrolled) {
        st.scrolled = nextScrolled
        setScrolled(nextScrolled)
      }
      if (nextHidden && !st.hidden) {
        st.hidden = true
        setHidden(true)
      } else if (revealUp && st.hidden) {
        st.hidden = false
        setHidden(false)
      }
    }
    const onScroll = () => {
      if (!st.ticking) {
        st.ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  const handleCartClick = (e) => {
    e.preventDefault()
    runCartAcrossScreen(reduced)
    if (location.pathname !== '/carrito') {
      navigate('/carrito')
    }
  }

  // Páginas con hero oscuro (ciprés): header claro hasta hacer scroll
  const onDarkHero = location.pathname === '/' || location.pathname === '/sneakers'
  const solid = scrolled || overlay

  return (
    <header
      className={`header ${solid ? 'header--solid' : ''} ${onDarkHero && !solid && !open ? 'header--on-dark' : ''} ${hidden && !open ? 'header--hidden' : ''} ${overlay ? 'header--overlay' : ''}`}
    >
      <div className="header__inner container">
        <Link to="/" className="header__logo" aria-label="VESTIGIO, ir al inicio">
          <Logo animated />
        </Link>

        <nav className="header__nav" aria-label="Principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className="nav-link">
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="nav-link__line"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <button
            className="icon-btn motion-toggle-btn"
            onClick={toggle}
            aria-pressed={reduced}
            aria-label={
              reduced
                ? 'Línea horizontal (movimiento reducido activo): clic para activar animaciones'
                : 'Onda de movimiento: clic para pausar o reducir animaciones'
            }
            title={
              reduced
                ? 'Animaciones en pausa (línea horizontal) · Clic para activar movimiento'
                : 'Animaciones activas · Clic para modo estático (línea horizontal)'
            }
          >
            {reduced ? <StillIcon /> : <MotionIcon />}
          </button>
          <a
            href="#/carrito"
            onClick={handleCartClick}
            className="icon-btn cart-btn"
            id="cart-icon"
            aria-label={`Carrito de compras, ${count} productos`}
            title="Ver carrito"
          >
            <CartIcon />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  className="cart-btn__badge"
                  initial={{ scale: 0.4, y: -6 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 14 }}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </a>
          <button
            className="icon-btn menu-btn"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Menú móvil"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul>
              {links.map((l, i) => (
                <motion.li
                  key={l.to}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <NavLink to={l.to} end={l.to === '/'}>
                    <span className="mobile-menu__num">0{i + 1}</span> {l.label}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
})

export default Header

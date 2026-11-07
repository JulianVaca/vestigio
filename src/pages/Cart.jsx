import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, animate } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../data/products.js'
import QtyStepper from '../components/QtyStepper.jsx'
import { TrashIcon, ArrowIcon, CloseIcon } from '../components/Icons.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'

const FREE_SHIPPING = 400000
const SHIPPING = 18000

/** Cifra que "rueda" hasta su nuevo valor: el usuario percibe el cambio de total. */
function AnimatedPrice({ value }) {
  const ref = useRef(null)
  const prev = useRef(value)
  const { reduced } = useMotionPref()
  useEffect(() => {
    const node = ref.current
    if (reduced) {
      node.textContent = formatPrice(value)
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (node.textContent = formatPrice(Math.round(v))),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, reduced])
  return <span ref={ref}>{formatPrice(value)}</span>
}

export default function Cart() {
  const { items, subtotal, setQty, remove, clear, count } = useCart()
  const [checkout, setCheckout] = useState(false)
  const shipping = subtotal >= FREE_SHIPPING || subtotal === 0 ? 0 : SHIPPING
  const progress = Math.min(1, subtotal / FREE_SHIPPING)

  return (
    <main id="main" className="page container">
      <header className="page__head">
        <p className="eyebrow">Bóveda & Adquisición</p>
        <h1 className="h1">
          Tu <em>carrito</em>
        </h1>
      </header>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="cart">
          <ul className="cart__list">
            <AnimatePresence initial={false}>
              {items.map((l) => (
                <motion.li
                  key={`${l.id}-${l.size}`}
                  className="cart-line"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: 60,
                    height: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    marginBottom: 0,
                    transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] },
                  }}
                >
                  <Link to={`/producto/${l.id}`} className="cart-line__img">
                    <img src={l.product.img.replace('.webp', '-sm.webp')} alt={l.product.name} width="420" height="560" />
                  </Link>
                  <div className="cart-line__info">
                    <h2 className="cart-line__name">
                      <Link to={`/producto/${l.id}`}>{l.product.name}</Link>
                    </h2>
                    <p className="cart-line__meta">
                      {l.product.brand} · {l.product.color} · Talla {l.size}
                    </p>
                    <p className="cart-line__unit">{formatPrice(l.product.price)} c/u</p>
                  </div>
                  <QtyStepper value={l.qty} min={0} onChange={(q) => setQty(l.id, l.size, q)} label={`Cantidad de ${l.product.name}`} />
                  <p className="cart-line__total">{formatPrice(l.qty * l.product.price)}</p>
                  <button className="icon-btn cart-line__remove" onClick={() => remove(l.id, l.size)} aria-label={`Quitar ${l.product.name}`}>
                    <TrashIcon width={18} height={18} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="summary" aria-label="Resumen del pedido">
            <h2 className="summary__title">Resumen de orden</h2>
            <div className="shipping-bar">
              <p>
                {progress >= 1
                  ? '¡Cuentas con envío asegurado gratuito!'
                  : `Te faltan ${formatPrice(FREE_SHIPPING - subtotal)} para envío asegurado gratis`}
              </p>
              <div className="shipping-bar__track">
                <motion.div
                  className="shipping-bar__fill"
                  initial={false}
                  animate={{ scaleX: progress }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
            <dl className="summary__rows">
              <div>
                <dt>Subtotal ({count})</dt>
                <dd>
                  <AnimatedPrice value={subtotal} />
                </dd>
              </div>
              <div>
                <dt>Envío asegurado</dt>
                <dd>{shipping ? formatPrice(shipping) : 'Gratis'}</dd>
              </div>
              <div className="summary__total">
                <dt>Total</dt>
                <dd>
                  <AnimatedPrice value={subtotal + shipping} />
                </dd>
              </div>
            </dl>
            <button className="btn btn--primary btn--block" onClick={() => setCheckout(true)}>
              Proceder al despacho <ArrowIcon width={18} height={18} />
            </button>
            <p className="summary__note">Incluye certificado numerado de autenticidad VESTIGIO y empaque de archivo.</p>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {checkout && <Checkout total={subtotal + shipping} onClose={() => setCheckout(false)} onDone={() => clear()} />}
      </AnimatePresence>
    </main>
  )
}

function EmptyCart() {
  return (
    <div className="empty">
      <svg className="empty__hanger" viewBox="0 0 120 80" aria-hidden="true">
        <path
          d="M60 22c0-6 4-9 8-9s7 3 7 7c0 5-4 6-7 8l-8 5L8 62h104L60 33"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <h2 className="h2">Tu carrito está vacío</h2>
      <p>Las cinco salas del pórtico siguen abiertas. Explora nuestras 30 piezas de archivo.</p>
      <div className="empty__actions">
        <Link to="/museo" className="btn btn--primary">
          Recorrer el museo 3D
        </Link>
        <Link to="/catalogo" className="btn btn--ghost">
          Ver catálogo (30)
        </Link>
      </div>
    </div>
  )
}

function Checkout({ total, onClose, onDone }) {
  const [step, setStep] = useState('form') // form | done
  const [order] = useState(() => `VG-${Math.floor(100000 + Math.random() * 900000)}`)
  const dialogRef = useRef(null)

  useEffect(() => {
    const prev = document.activeElement
    dialogRef.current?.querySelector('input, button')?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    setStep('done')
    onDone()
  }

  return (
    <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={dialogRef}
        className="modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="icon-btn modal__close" onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>
        {step === 'form' ? (
          <form onSubmit={submit} className="form">
            <h2 id="checkout-title" className="h2">
              Despacho asegurado
            </h2>
            <p className="form__note">Total a procesar: {formatPrice(total)} · Incluye seguro de transporte y sello de autenticidad.</p>
            <label className="field">
              <input required name="name" placeholder=" " autoComplete="name" />
              <span>Nombre completo</span>
            </label>
            <label className="field">
              <input required type="email" name="email" placeholder=" " autoComplete="email" />
              <span>Correo electrónico</span>
            </label>
            <label className="field">
              <input required name="city" placeholder=" " autoComplete="address-level2" />
              <span>Ciudad y dirección de entrega</span>
            </label>
            <button className="btn btn--primary btn--block" type="submit">
              Confirmar adquisición
            </button>
          </form>
        ) : (
          <div className="success">
            <svg className="success__check" viewBox="0 0 80 80" aria-hidden="true">
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="var(--c-accent)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              />
              <motion.path
                d="M24 41l11 11 22-24"
                fill="none"
                stroke="var(--c-text)"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.6, ease: 'easeOut' }}
              />
            </svg>
            <h2 id="checkout-title" className="h2">
              ¡Orden confirmada!
            </h2>
            <p>
              Certificado de despacho <strong>{order}</strong>. Hemos enviado los detalles de seguimiento y el certificado digital
              de autenticidad a tu correo.
            </p>
            <Link to="/catalogo" className="btn btn--ghost" onClick={onClose}>
              Seguir explorando el archivo
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

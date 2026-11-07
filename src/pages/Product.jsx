import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getProduct, products, formatPrice, rooms } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import ProductCard from '../components/ProductCard.jsx'
import QtyStepper from '../components/QtyStepper.jsx'
import { CheckIcon, CubeIcon, PlusIcon, ArrowLeftIcon } from '../components/Icons.jsx'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'
import NotFound from './NotFound.jsx'

export default function Product() {
  const { id } = useParams()
  const product = getProduct(id)
  if (!product) return <NotFound />
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }) {
  const scope = useRef(null)
  const imgRef = useRef(null)
  const { add } = useCart()
  const { reduced } = useMotionPref()
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [state, setState] = useState('idle') // idle | error | adding | done
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [openDetail, setOpenDetail] = useState(0)
  useScrollAnimations(scope)

  const related = products.filter((p) => p.id !== product.id && (p.room === product.room || p.category === product.category)).slice(0, 4)
  const fallback = products.filter((p) => p.id !== product.id).slice(0, 4)

  const handleAdd = async () => {
    if (!size) {
      setState('error')
      setTimeout(() => setState('idle'), 600)
      return
    }
    setState('adding')
    await new Promise((r) => setTimeout(r, reduced ? 0 : 280)) // anticipación breve
    flyToCart(imgRef.current, reduced)
    add(product.id, size, qty)
    setState('done')
    setTimeout(() => setState('idle'), 1800)
  }

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ active: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <main id="main" ref={scope} className="page container">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/catalogo">
          <ArrowLeftIcon width={16} height={16} /> Catálogo
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
      </nav>

      <div className="pdp">
        <div
          className={`pdp__media ${zoom.active && !reduced ? 'is-zoom' : ''}`}
          onPointerMove={onMove}
          onPointerLeave={() => setZoom((z) => ({ ...z, active: false }))}
        >
          <motion.img
            ref={imgRef}
            src={product.img}
            alt={`${product.name} en color ${product.color}, vista frontal`}
            width="720"
            height="960"
            style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }}
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)' }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          />
          <span className="pdp__room">{rooms[product.room].name}</span>
        </div>

        <div className="pdp__info">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
          >
            {[
              <p key="e" className="eyebrow">{product.category}</p>,
              <h1 key="h" className="h1 pdp__title">{product.name}</h1>,
              <p key="p" className="pdp__price">{formatPrice(product.price)}</p>,
              <p key="d" className="pdp__desc">{product.description}</p>,
            ].map((el) => (
              <motion.div key={el.key} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}>
                {el}
              </motion.div>
            ))}
          </motion.div>

          <p className="pdp__color">
            <span className="swatch swatch--lg" style={{ background: product.hex }} aria-hidden="true" /> Color: <strong>{product.color}</strong>
          </p>

          <fieldset className={`sizes ${state === 'error' ? 'is-error' : ''}`}>
            <legend>
              Talla {state === 'error' && <span className="sizes__hint" role="alert">· Elige una talla</span>}
            </legend>
            <motion.div
              className="sizes__row"
              animate={state === 'error' && !reduced ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
            >
              {product.sizes.map((s) => (
                <label key={s} className={`size ${size === s ? 'size--active' : ''}`}>
                  <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} className="sr-only" />
                  {size === s && <motion.span layoutId="size-pill" className="size__pill" transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
                  <span className="size__label">{s}</span>
                </label>
              ))}
            </motion.div>
          </fieldset>

          <div className="pdp__buy">
            <QtyStepper value={qty} onChange={setQty} label={`Cantidad de ${product.name}`} />
            <motion.button
              className={`btn btn--primary btn--add is-${state}`}
              onClick={handleAdd}
              disabled={state === 'adding'}
              whileTap={{ scale: 0.96 }}
              animate={state === 'adding' && !reduced ? { scaleX: 0.97, scaleY: 1.04 } : { scaleX: 1, scaleY: 1 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={state === 'done' ? 'done' : 'add'}
                  className="btn__content"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {state === 'done' ? (
                    <>
                      <CheckIcon width={18} height={18} /> Añadido
                    </>
                  ) : (
                    <>
                      <PlusIcon width={18} height={18} /> Añadir al carrito
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          <Link to={`/museo?obra=${product.id}`} className="pdp__museum">
            <CubeIcon width={18} height={18} /> Ver esta pieza en el museo 3D
          </Link>

          <div className="accordion">
            {[
              { title: 'Composición y origen', body: <ul>{product.details.map((d) => <li key={d}>{d}</li>)}</ul> },
              { title: 'Envíos y devoluciones', body: <p>Envío gratis desde $400.000 en Colombia. Cambios hasta 30 días después de la compra (simulada).</p> },
              { title: 'Cuidado', body: <p>Lavar en frío, secar a la sombra. Cada prenda incluye una ficha de conservación como las piezas de museo.</p> },
            ].map((item, i) => (
              <div key={item.title} className="accordion__item">
                <button className="accordion__btn" aria-expanded={openDetail === i} onClick={() => setOpenDetail(openDetail === i ? -1 : i)}>
                  {item.title}
                  <motion.span animate={{ rotate: openDetail === i ? 45 : 0 }} aria-hidden="true">
                    <PlusIcon width={18} height={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openDetail === i && (
                    <motion.div
                      className="accordion__panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="accordion__inner">{item.body}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section" aria-labelledby="related-title">
        <div className="section__head" data-reveal>
          <h2 id="related-title" className="h2">
            En la misma <em>sala</em>
          </h2>
        </div>
        <div className="grid grid--4" data-reveal-stagger>
          {(related.length ? related : fallback).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </main>
  )
}

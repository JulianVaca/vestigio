import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getProduct, products, formatPrice, rooms } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import ProductCard from '../components/ProductCard.jsx'
import QtyStepper from '../components/QtyStepper.jsx'
import SizeSelector from '../components/SizeSelector.jsx'
import { CheckIcon, CubeIcon, PlusIcon, ArrowLeftIcon, TagIcon } from '../components/Icons.jsx'
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
      setTimeout(() => setState('idle'), 700)
      return
    }
    setState('adding')
    await new Promise((r) => setTimeout(r, reduced ? 0 : 220))
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
          <ArrowLeftIcon width={16} height={16} /> Catálogo & Racks
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/catalogo?cat=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span aria-hidden="true">/</span>
        <span>{product.brand}</span>
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
            alt={`${product.name} (${product.brand}) en color ${product.color}`}
            width="840"
            height="1120"
            style={{
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
            }}
            initial={reduced ? { opacity: 0 } : { scale: 1.04, opacity: 0 }}
            animate={
              reduced
                ? { opacity: 1 }
                : {
                    scale: zoom.active ? 1.65 : 1,
                    opacity: 1,
                  }
            }
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="pdp__room">{rooms[product.room].name}</span>
        </div>

        <div className="pdp__info">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
          >
            {[
              <p key="e" className="eyebrow">{product.brand} · {product.era}</p>,
              <h1 key="h" className="h1 pdp__title">{product.name}</h1>,
              <p key="p" className="pdp__price">{formatPrice(product.price)}</p>,
              <p key="d" className="pdp__desc">{product.description}</p>,
            ].map((el) => (
              <motion.div
                key={el.key}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                {el}
              </motion.div>
            ))}
          </motion.div>

          <p className="pdp__color">
            <span className="swatch swatch--lg" style={{ background: product.hex }} aria-hidden="true" /> Color:{' '}
            <strong>{product.color}</strong>
          </p>

          <SizeSelector
            product={product}
            value={size}
            onChange={(s) => {
              setSize(s)
              if (state === 'error') setState('idle')
            }}
            error={state === 'error'}
            reduced={reduced}
          />

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
                      <CheckIcon width={18} height={18} /> Añadido al carrito
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

          {product.room === 4 && (
            <Link to={`/sneakers/${product.id}`} className="pdp__museum pdp__market">
              <TagIcon width={18} height={18} /> Ver precios por talla e historial en el Mercado de Sneakers
            </Link>
          )}
          <Link to={`/museo?obra=${product.id}`} className="pdp__museum">
            <CubeIcon width={18} height={18} /> Ver prenda colgada en el rack 3D de la {rooms[product.room].name}
          </Link>

          <div className="accordion">
            {[
              {
                title: 'Confección y detalles del atelier',
                body: (
                  <ul>
                    {product.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                ),
              },
              {
                title: 'Envíos asegurados y devoluciones',
                body: (
                  <p>
                    Envío asegurado sin costo en pedidos superiores a $400.000 COP a nivel nacional e internacional.
                    Cambios de talla y devoluciones garantizadas durante los primeros 30 días.
                  </p>
                ),
              },
              {
                title: 'Diseño original y conservación',
                body: (
                  <p>
                    Cada prenda y par de calzado de VESTIGIO es un diseño original patronado desde cero en nuestro atelier,
                    entregado en funda guardapolvo de algodón orgánico con certificado numerado.
                  </p>
                ),
              },
            ].map((item, i) => (
              <div key={item.title} className="accordion__item">
                <button
                  className="accordion__btn"
                  aria-expanded={openDetail === i}
                  onClick={() => setOpenDetail(openDetail === i ? -1 : i)}
                >
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
            En el mismo <em>rack de sala</em>
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

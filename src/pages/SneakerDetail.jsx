import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, m as motion } from 'framer-motion'
import { formatPrice } from '../data/products.js'
import { sneakers, getMarket, formatPct, formatDate, loadOffers, saveOffer } from '../data/market.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import SizeSelector from '../components/SizeSelector.jsx'
import PriceChart from '../components/PriceChart.jsx'
import { VerifiedSeal } from '../components/Ornaments.jsx'
import { ArrowLeftIcon, CheckIcon, TagIcon } from '../components/Icons.jsx'
import NotFound from './NotFound.jsx'

const VIEWS = [
  { id: 'side', label: 'Lateral' },
  { id: 'mirror', label: 'Medial' },
  { id: 'detail', label: 'Detalle' },
]

export default function SneakerDetail() {
  const { id } = useParams()
  const product = sneakers.find((s) => s.id === id)
  if (!product) return <NotFound />
  return <SneakerView key={product.id} product={product} />
}

function SneakerView({ product }) {
  const m = getMarket(product)
  const { add } = useCart()
  const { reduced } = useMotionPref()
  const [size, setSize] = useState(null)
  const [view, setView] = useState('side')
  const [mode, setMode] = useState('buy') // buy | offer
  const [error, setError] = useState(false)
  const [done, setDone] = useState(false)
  const [offers, setOffers] = useState(loadOffers)
  const [offerValue, setOfferValue] = useState('')
  const [offerMsg, setOfferMsg] = useState(null)
  const stageRef = useRef(null)
  const imgRef = useRef(null)

  const prices = useMemo(
    () => Object.fromEntries(m.sizes.map((s) => [s.size, s.ask ? formatPrice(s.ask) : null])),
    [m],
  )
  const sizeData = size ? m.sizes.find((s) => s.size === size) : null
  const ask = sizeData?.ask ?? m.lowestAsk
  const bid = sizeData?.bid ?? m.highestBid
  const myOffer = size ? offers[`${product.id}:${size}`] : null
  const related = sneakers.filter((s) => s.id !== product.id).slice(0, 4)

  // Inclinación 3D del sneaker con el cursor (sin re-render: variables CSS)
  const onTilt = (e) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = stageRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    stageRef.current.style.setProperty('--ry', `${px * 14}deg`)
    stageRef.current.style.setProperty('--rx', `${-py * 10}deg`)
  }
  const resetTilt = () => {
    stageRef.current?.style.setProperty('--ry', '0deg')
    stageRef.current?.style.setProperty('--rx', '0deg')
  }

  const requireSize = () => {
    if (size) return true
    setError(true)
    setTimeout(() => setError(false), 700)
    return false
  }

  const buy = () => {
    if (!requireSize()) return
    flyToCart(imgRef.current, reduced)
    add(product.id, size, 1, sizeData.ask)
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }

  const submitOffer = (e) => {
    e.preventDefault()
    if (!requireSize()) return
    const amount = Math.round(Number(String(offerValue).replace(/\D/g, '')) / 1000) * 1000
    const min = Math.round((sizeData.ask ?? m.lowestAsk) * 0.6)
    if (!amount || amount < min) {
      setOfferMsg({ type: 'error', text: `La oferta mínima para ${size} es ${formatPrice(min)}.` })
      return
    }
    if (sizeData.ask && amount >= sizeData.ask) {
      setOfferMsg({ type: 'info', text: `Tu oferta iguala o supera el precio más bajo: puedes comprar ya por ${formatPrice(sizeData.ask)}.` })
      return
    }
    setOffers(saveOffer(product.id, size, amount))
    setOfferMsg({
      type: 'ok',
      text: amount > sizeData.bid ? '¡Ahora tienes la oferta más alta del mercado! Vigente por 30 días.' : 'Oferta registrada. Vigente por 30 días.',
    })
    setOfferValue('')
  }

  return (
    <main id="main" className="page container sneaker">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/sneakers">
          <ArrowLeftIcon width={16} height={16} /> Mercado de Sneakers
        </Link>
        <span aria-hidden="true">/</span>
        <span>{m.silhouette}</span>
      </nav>

      <header className="sneaker__head">
        <div>
          <p className="eyebrow">
            {product.brand} · SKU {m.sku}
          </p>
          <h1 className="h1 sneaker__title">{product.name}</h1>
          <p className="sneaker__colorway">{product.color}</p>
        </div>
        <ul className="sneaker__badges">
          <li>
            <VerifiedSeal className="sneaker__seal" /> Verificado en 23 puntos
          </li>
          <li>Nuevo · Caja original</li>
        </ul>
      </header>

      <div className="sneaker__grid">
        <div className="sneaker__visual">
          <div
            ref={stageRef}
            className={`sneaker__stage is-${view}`}
            onPointerMove={onTilt}
            onPointerLeave={resetTilt}
          >
            <span className="sneaker__spot" aria-hidden="true" />
            <img
              ref={imgRef}
              className="sneaker__img"
              src={product.img}
              alt={`${product.name}, vista ${VIEWS.find((v) => v.id === view).label.toLowerCase()}`}
              width="840"
              height="1120"
              fetchpriority="high"
            />
            <span className="sneaker__shadow" aria-hidden="true" />
          </div>
          <div className="seg sneaker__views" role="group" aria-label="Vista del sneaker">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={`seg__btn ${view === v.id ? 'is-active' : ''}`}
                aria-pressed={view === v.id}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <aside className="buybox" aria-label="Comprar u ofertar">
          <div className="seg buybox__mode" role="tablist" aria-label="Modo de compra">
            <button role="tab" aria-selected={mode === 'buy'} className={`seg__btn ${mode === 'buy' ? 'is-active' : ''}`} onClick={() => setMode('buy')}>
              Comprar
            </button>
            <button role="tab" aria-selected={mode === 'offer'} className={`seg__btn ${mode === 'offer' ? 'is-active' : ''}`} onClick={() => setMode('offer')}>
              Hacer oferta
            </button>
          </div>

          <div className="buybox__price">
            <span className="buybox__label">
              {mode === 'buy' ? (size ? `Comprar ya · ${size}` : 'Desde') : size ? `Oferta más alta · ${size}` : 'Oferta más alta'}
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong
                key={`${mode}-${size}`}
                className="buybox__amount"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {formatPrice(mode === 'buy' ? ask : bid)}
              </motion.strong>
            </AnimatePresence>
            <span className="buybox__retail">Precio de lista {formatPrice(m.retail)}</span>
          </div>

          <SizeSelector
            product={product}
            value={size}
            onChange={(s) => {
              setSize(s)
              setOfferMsg(null)
            }}
            error={error}
            compact
            reduced={reduced}
            prices={prices}
            name="sneaker-size"
            layoutKey="sneaker-pill"
          />

          {mode === 'buy' ? (
            <motion.button className="btn btn--gold btn--block buybox__cta" onClick={buy} whileTap={{ scale: 0.97 }}>
              {done ? (
                <>
                  <CheckIcon width={18} height={18} /> Añadido al carrito
                </>
              ) : size ? (
                `Comprar por ${formatPrice(ask)}`
              ) : (
                'Selecciona tu talla'
              )}
            </motion.button>
          ) : (
            <form className="offer" onSubmit={submitOffer}>
              <label className="offer__field">
                <span>Tu oferta (COP)</span>
                <input
                  inputMode="numeric"
                  value={offerValue}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setOfferValue(digits ? Number(digits).toLocaleString('es-CO') : '')
                  }}
                  placeholder={formatPrice(Math.round(bid * 1.02 / 1000) * 1000)}
                />
              </label>
              <button type="submit" className="btn btn--primary btn--block">
                <TagIcon width={18} height={18} /> Registrar oferta
              </button>
              {myOffer && <p className="offer__mine">Tu oferta activa para {size}: {formatPrice(myOffer.amount)}</p>}
              {offerMsg && (
                <p className={`offer__msg offer__msg--${offerMsg.type}`} role="status">
                  {offerMsg.text}
                </p>
              )}
            </form>
          )}

          <dl className="buybox__mini">
            <div>
              <dt>Última venta</dt>
              <dd>
                {formatPrice(m.lastSale)}{' '}
                <span className={m.change >= 0 ? 'is-up' : 'is-down'}>
                  {m.change >= 0 ? '▲' : '▼'} {formatPct(m.change)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Ofertas activas</dt>
              <dd>{sizeData ? sizeData.asks : m.sizes.reduce((s, x) => s + x.asks, 0)} vendedores</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="sneaker__stats" aria-label="Datos de mercado">
        {[
          ['Rango 12 meses', `${formatPrice(m.low52)} – ${formatPrice(m.high52)}`],
          ['Prima sobre lista', formatPct(m.premium)],
          ['Volatilidad', `${(m.volatility * 100).toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`],
          ['Ventas totales', m.sales.toLocaleString('es-CO')],
          ['Precio de lista', formatPrice(m.retail)],
          ['Lanzamiento', formatDate(new Date(`${m.release}T12:00:00`).getTime(), { day: 'numeric', month: 'long', year: 'numeric' })],
        ].map(([k, v]) => (
          <div key={k} className="stat">
            <span className="stat__k">{k}</span>
            <span className="stat__v">{v}</span>
          </div>
        ))}
      </section>

      <div className="sneaker__market">
        <PriceChart history={m.history} retail={m.retail} title="Precio de reventa" />

        <section className="sales" aria-labelledby="sales-title">
          <h3 id="sales-title" className="pchart__title">
            Últimas ventas
          </h3>
          <table className="sales__table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Talla</th>
                <th scope="col">Precio</th>
              </tr>
            </thead>
            <tbody>
              {m.recentSales.map((s, i) => (
                <tr key={i}>
                  <td>{formatDate(s.t)}</td>
                  <td>{s.size}</td>
                  <td>{formatPrice(s.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="sneaker__about">
        <div>
          <h2 className="h2">
            Sobre el <em>modelo</em>
          </h2>
          <p>{product.description}</p>
          <ul className="sneaker__details">
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <ol className="authsteps" aria-label="Proceso de autenticación">
          {[
            ['Recepción', 'El par llega sellado a nuestro atelier en Bogotá.'],
            ['Inspección en 23 puntos', 'Costuras, materiales, horma, etiquetas y caja.'],
            ['Sello VESTIGIO', 'Precinto numerado y certificado de autenticidad.'],
            ['Despacho asegurado', 'Entrega con seguimiento en 24–72 h.'],
          ].map(([t, d], i) => (
            <li key={t}>
              <span className="authsteps__n">{String(i + 1).padStart(2, '0')}</span>
              <strong>{t}</strong>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="related-sneakers">
        <div className="section__head">
          <h2 id="related-sneakers" className="h2">
            También en el <em>mercado</em>
          </h2>
        </div>
        <ul className="market__grid market__grid--4">
          {related.map((s) => {
            const rm = getMarket(s)
            return (
              <li key={s.id}>
                <Link to={`/sneakers/${s.id}`} className="mtile">
                  <span className="mtile__media">
                    <img src={s.img.replace('.webp', '-sm.webp')} alt={s.name} width="420" height="560" loading="lazy" />
                  </span>
                  <span className="mtile__name">{s.name}</span>
                  <span className="mtile__label">Precio más bajo</span>
                  <span className="mtile__price">{formatPrice(rm.lowestAsk)}</span>
                  <span className={`mtile__change ${rm.change >= 0 ? 'is-up' : 'is-down'}`}>
                    {rm.change >= 0 ? '▲' : '▼'} {formatPct(rm.change)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}

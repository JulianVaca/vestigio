import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { products, rooms, getProduct, formatPrice } from '../data/products.js'
import { sneakers, getMarket, formatPct } from '../data/market.js'
import ProductCard from '../components/ProductCard.jsx'
import BoutiqueRack from '../components/BoutiqueRack.jsx'
import { OliveBranch } from '../components/Ornaments.jsx'
import { ArrowIcon, CubeIcon } from '../components/Icons.jsx'
import { useScrollAnimations, onFirstInteraction } from '../hooks/useScrollAnimations.js'
import { useMotionPref } from '../context/MotionContext.jsx'
import '../styles/home.css'

const HERO_PIECES = ['bbc-icecream-varsity', 'offwhite-caravaggio-varsity', 'bape-m65-laurel', 'raf-riot-bomber'].map(
  getProduct,
)
const SIDE_LEFT = getProduct('sneaker-bapesta-marble')
const SIDE_RIGHT = getProduct('base-doric-hoodie')
const HERO_MS = 5200

/** Arco lateral menor de la columnata (imagen ligera -sm, sin prioridad). */
function SideArch({ product, side }) {
  return (
    <Link to={`/producto/${product.id}`} className={`colonnade__arch colonnade__arch--${side}`} aria-label={product.name}>
      <img
        src={product.img.replace('.webp', '-sm.webp')}
        alt=""
        width="420"
        height="560"
        fetchpriority="low"
        decoding="async"
      />
      <span className="colonnade__caption">{product.name.split('«')[1]?.split('»')[0] ?? product.name}</span>
    </Link>
  )
}

/**
 * Columnata «tríptico»: arco central con la prenda destacada y dos arcos menores
 * sobre un estilóbato de travertino, separados por columnas con capitel dorado.
 */
function HeroColonnade({ reduced }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => setArmed(true), 4000)
    const off = onFirstInteraction(() => setArmed(true))
    return () => {
      clearTimeout(t)
      off()
    }
  }, [reduced])

  useEffect(() => {
    if (!armed || paused) return
    // No cambies diapositivas fuera de pantalla: evita trabajo en pestañas ocultas.
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setI((v) => (v + 1) % HERO_PIECES.length)
    }, HERO_MS)
    return () => clearInterval(id)
  }, [armed, paused])

  const n = HERO_PIECES.length
  const prev = (i - 1 + n) % n
  const next = (i + 1) % n
  const mounted = armed ? new Set([i, prev, next]) : new Set([0])
  const p = HERO_PIECES[i]

  return (
    <div
      className="hero__media colonnade"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <OliveBranch className="colonnade__olive colonnade__olive--l" />
      <OliveBranch className="colonnade__olive colonnade__olive--r" flip />

      <div className="colonnade__row">
        <SideArch product={SIDE_LEFT} side="left" />
        <span className="colonnade__column" aria-hidden="true" />
        <div className="colonnade__arch colonnade__arch--main atrium__niche">
          <span className="atrium__glow" aria-hidden="true" />
          {HERO_PIECES.map((piece, k) =>
            mounted.has(k) ? (
              <img
                key={piece.id}
                className={`atrium__piece ${k === i ? 'is-active' : ''}`}
                src={piece.img}
                srcSet={`${piece.img.replace('.webp', '-sm.webp')} 420w, ${piece.img} 840w`}
                sizes="(max-width: 860px) 60vw, 26vw"
                alt={k === i ? `${piece.name} en el arco central de la columnata` : ''}
                aria-hidden={k !== i}
                width="840"
                height="1120"
                fetchpriority={k === 0 ? 'high' : 'low'}
                decoding="async"
              />
            ) : null,
          )}
        </div>
        <span className="colonnade__column" aria-hidden="true" />
        <SideArch product={SIDE_RIGHT} side="right" />
      </div>
      <div className="colonnade__stylobate" aria-hidden="true" />

      <Link to={`/producto/${p.id}`} className="atrium__tag colonnade__tag">
        <span className="atrium__tag-inner">
          <span className="atrium__tag-kicker">Arco central · {String(i + 1).padStart(2, '0')}</span>
          <span className="atrium__tag-name">{p.name}</span>
          <span className="atrium__tag-price">{formatPrice(p.price)}</span>
        </span>
        <ArrowIcon width={18} height={18} />
      </Link>

      <div className="atrium__dots" role="group" aria-label="Elegir pieza destacada">
        {HERO_PIECES.map((piece, k) => (
          <button
            key={piece.id}
            type="button"
            className={k === i ? 'is-active' : ''}
            aria-label={`Ver ${piece.name}`}
            aria-pressed={k === i}
            onClick={() => {
              setArmed(true)
              setI(k)
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Portada compacta: una fila de prendas (una por sala de ropa) y otra de sneakers, en pestañas.
const featuredGarments = [0, 6, 12, 18].map((i) => products[i])
const featuredSneakers = sneakers.slice(0, 4)
const FEATURED_TABS = [
  { id: 'prendas', label: 'Prendas', to: '/catalogo', cta: 'Ver las 30 prendas' },
  { id: 'sneakers', label: 'Sneakers', to: '/sneakers', cta: 'Ver el mercado completo' },
]
// En el perchero de portada cuelgan ocho prendas, dos por sala de ropa.
const rackPieces = [0, 3, 6, 9, 12, 15, 18, 21].map((i) => products[i])
const corridorFrames = [products[0], products[6], products[12], products[18], products[24], products[27]]

/** Piezas destacadas en pestañas: lo mismo que antes ocupaba dos secciones, en una sola fila. */
function Featured() {
  const [tab, setTab] = useState('prendas')
  const current = FEATURED_TABS.find((t) => t.id === tab)

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = tab === 'prendas' ? 'sneakers' : 'prendas'
    setTab(next)
    document.getElementById(`featured-tab-${next}`)?.focus()
  }

  return (
    <section className="section section--tight container" aria-labelledby="featured-title">
      <div className="section__head featured__head" data-reveal>
        <div>
          <p className="eyebrow">Selección de las 5 Salas</p>
          <h2 id="featured-title" className="h2">
            Piezas <em>destacadas</em>
          </h2>
        </div>
        <div className="featured__nav">
          <div className="chips" role="tablist" aria-label="Tipo de pieza destacada" onKeyDown={onKeyDown}>
            {FEATURED_TABS.map((t) => (
              <button
                key={t.id}
                id={`featured-tab-${t.id}`}
                type="button"
                role="tab"
                className={`chip ${t.id === tab ? 'chip--active' : ''}`}
                aria-selected={t.id === tab}
                aria-controls="featured-panel"
                tabIndex={t.id === tab ? 0 : -1}
                onClick={() => setTab(t.id)}
              >
                {t.id === tab && <span className="chip__bg" />}
                <span className="chip__label">{t.label}</span>
              </button>
            ))}
          </div>
          <Link to={current.to} className="link-arrow">
            {current.cta} <ArrowIcon width={18} height={18} />
          </Link>
        </div>
      </div>

      <div id="featured-panel" role="tabpanel" aria-labelledby={`featured-tab-${tab}`} data-reveal>
        {tab === 'prendas' ? (
          <div className="grid grid--4 featured__row">
            {featuredGarments.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <ul className="grid grid--4 featured__row">
            {featuredSneakers.map((s) => {
              const m = getMarket(s)
              return (
                <li key={s.id}>
                  <Link to={`/sneakers/${s.id}`} className="mtile">
                    <span className="mtile__media">
                      <img
                        src={s.img.replace('.webp', '-sm.webp')}
                        alt=""
                        width="420"
                        height="560"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="mtile__name">{s.name}</span>
                    <span className="mtile__label">Precio más bajo</span>
                    <span className="mtile__price">{formatPrice(m.lowestAsk)}</span>
                    <span className={`mtile__change ${m.change >= 0 ? 'is-up' : 'is-down'}`}>
                      {m.change >= 0 ? '▲' : '▼'} {formatPct(m.change)} esta semana
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const scope = useRef(null)
  const { reduced } = useMotionPref()
  useScrollAnimations(scope)

  return (
    <main id="main" ref={scope} className="home">
      {/* ───────────── HERO «ATRIO ÁUREO»: nicho en arco con la prenda destacada ───────────── */}
      <section className="hero atrium" aria-labelledby="hero-title">
        <div className="atrium__bg" aria-hidden="true" />

        <div className="atrium__grid container">
          <div className="hero__content atrium__content">
            <p className="atrium__eyebrow">
              <span className="atrium__rule" aria-hidden="true" />
              Maison VESTIGIO · Bogotá · Colección Áurea
            </p>
            <h1 id="hero-title" className="atrium__title">
              <span className="hero__line">
                <span>Streetwear</span>
              </span>
              <span className="hero__line">
                <span>
                  con <em>historia.</em>
                </span>
              </span>
            </h1>
            <p className="atrium__lead">
              Treinta prendas de autor patronadas desde cero en nuestro atelier, entre columnas de travertino, olivos
              mediterráneos y herrajes de oro viejo.
            </p>
            <div className="atrium__actions">
              <Link to="/catalogo" className="btn btn--gold">
                Explorar la colección <ArrowIcon width={18} height={18} />
              </Link>
              <Link to="/museo" className="btn btn--ghost btn--on-dark">
                <CubeIcon width={18} height={18} /> Tienda-museo 3D
              </Link>
            </div>
            <dl className="atrium__stats">
              <div>
                <dt>Prendas de autor</dt>
                <dd>30</dd>
              </div>
              <div>
                <dt>Salas temáticas</dt>
                <dd>05</dd>
              </div>
              <div>
                <dt>Sneakers verificados</dt>
                <dd>06</dd>
              </div>
            </dl>
          </div>

          <HeroColonnade reduced={reduced} />
        </div>

        <div className="meander" aria-hidden="true" />
      </section>

      {/* ───────────── MARQUEE ───────────── */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              Atelier VESTIGIO · 30 Prendas Originales · Racks Interactivos de Tienda · Sastrería Ágora · Gráfica Cosmos · Camuflaje Botánico · Volumen Monolito · Calzado Pedestal ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ───────────── MANIFIESTO (compacto) ───────────── */}
      <section className="manifesto manifesto--compact container" aria-label="Manifiesto" data-reveal>
        <p className="eyebrow">Manifiesto del Atelier</p>
        <p className="manifesto__text">
          No seguimos tendencias efímeras; esculpimos prendas originales que perduran como la piedra.
        </p>
        <p className="manifesto__note">
          Cada pieza nace desde cero en nuestro atelier, entre travertino, bronce cepillado y botánica mediterránea.
        </p>
      </section>

      {/* ───────────── PERCHERO INTERACTIVO EN PORTADA ───────────── */}
      <div className="container">
        <BoutiqueRack
          items={rackPieces}
          title="Perchero de Selección · 8 Piezas Clave"
          subtitle="Arrastra el riel, pasa el cursor para abrir las prendas y haz clic en una para descolgarla."
        />
      </div>

      {/* ───────────── DESTACADOS: prendas y sneakers en pestañas ───────────── */}
      <Featured />

      {/* ───────────── MUSEO 3D + SALAS ───────────── */}
      <section className="teaser teaser--compact" aria-labelledby="teaser-title">
        <div className="corridor" aria-hidden="true">
          <div className="corridor__track" style={{ transform: 'translate3d(0, 0, 260px)' }}>
            {corridorFrames.map((p, i) => (
              <div
                key={p.id}
                className={`corridor__frame corridor__frame--${i % 2 ? 'right' : 'left'}`}
                style={{ '--z': `${-i * 260}px` }}
              >
                <img
                  src={p.img.replace('.webp', '-sm.webp')}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="420"
                  height="560"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="teaser__content container" data-reveal>
          <p className="eyebrow">Flagship 3D · Cinco salas</p>
          <h2 id="teaser-title" className="h2">
            Recorre los <em>racks en 3D</em>
          </h2>
          <p className="teaser__text">
            Las 30 prendas cuelgan de racks de bronce en cinco salas de travertino. Elige una sala y entra directo.
          </p>
          <Link to="/museo" className="btn btn--primary">
            <CubeIcon width={18} height={18} /> Entrar a la tienda-museo 3D
          </Link>
          <ol className="room-chips" aria-label="Salas del museo">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link to={`/museo?sala=${r.id}`} className="room-chip" title={r.text}>
                  <span className="room-chip__num">0{r.id + 1}</span>
                  <span className="room-chip__name">{r.name.split('·')[1]}</span>
                  <ArrowIcon className="room-chip__arrow" width={16} height={16} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── CTA (compacto) ───────────── */}
      <section className="cta cta--compact container" data-reveal>
        <div>
          <h2 className="h2">
            ¿Buscas asesoría de <em>talla o estilo</em>?
          </h2>
          <p>Agenda una cita con nuestra sastrería urbana o consulta por envíos asegurados.</p>
        </div>
        <Link to="/contacto" className="btn btn--ghost">
          Contactar al atelier <ArrowIcon width={18} height={18} />
        </Link>
      </section>
    </main>
  )
}

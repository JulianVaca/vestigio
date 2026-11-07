import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { products, rooms, getProduct, formatPrice } from '../data/products.js'
import { sneakers, getMarket, formatPct } from '../data/market.js'
import ProductCard from '../components/ProductCard.jsx'
import BoutiqueRack from '../components/BoutiqueRack.jsx'
import { OliveBranch } from '../components/Ornaments.jsx'
import { ArrowIcon, CubeIcon } from '../components/Icons.jsx'
import { useScrollAnimations, loadGsap } from '../hooks/useScrollAnimations.js'
import { useMotionPref } from '../context/MotionContext.jsx'

const HERO_PIECES = ['bbc-icecream-varsity', 'offwhite-caravaggio-varsity', 'base-doric-hoodie', 'bape-m65-laurel'].map(getProduct)
const HERO_MS = 5200

/** Nicho en arco de travertino con la prenda destacada colgada en percha dorada. */
function HeroNiche({ reduced }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduced || paused) return
    const id = setInterval(() => setI((v) => (v + 1) % HERO_PIECES.length), HERO_MS)
    return () => clearInterval(id)
  }, [reduced, paused])

  const p = HERO_PIECES[i]
  return (
    <div
      className="hero__media atrium__stage"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <OliveBranch className="atrium__olive atrium__olive--l" />
      <OliveBranch className="atrium__olive atrium__olive--r" flip />
      <div className="atrium__niche">
        <span className="atrium__glow" aria-hidden="true" />
        {HERO_PIECES.map((piece, k) => (
          <img
            key={piece.id}
            className={`atrium__piece ${k === i ? 'is-active' : ''}`}
            src={piece.img}
            srcSet={`${piece.img.replace('.webp', '-sm.webp')} 420w, ${piece.img} 840w`}
            sizes="(max-width: 860px) 70vw, 34vw"
            alt={k === i ? `${piece.name} en el nicho de exhibición` : ''}
            aria-hidden={k !== i}
            width="840"
            height="1120"
            fetchpriority={k === 0 ? 'high' : 'low'}
            loading={k === 0 ? 'eager' : 'lazy'}
            decoding={k === 0 ? 'sync' : 'async'}
          />
        ))}
      </div>
      <div className="atrium__plinth" aria-hidden="true" />

      <Link to={`/producto/${p.id}`} className="atrium__tag">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={p.id}
            className="atrium__tag-inner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <span className="atrium__tag-kicker">Pieza en nicho · {String(i + 1).padStart(2, '0')}</span>
            <span className="atrium__tag-name">{p.name}</span>
            <span className="atrium__tag-price">{formatPrice(p.price)}</span>
          </motion.span>
        </AnimatePresence>
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
            onClick={() => setI(k)}
          />
        ))}
      </div>
    </div>
  )
}

const manifesto =
  'No seguimos tendencias efímeras; esculpimos prendas originales que perduran como la piedra. En VESTIGIO cada pieza nace desde cero en nuestro atelier dialogando con la arquitectura griega de travertino, el bronce cepillado y la vida botánica del Mediterráneo.'

export default function Home() {
  const scope = useRef(null)
  const { reduced } = useMotionPref()
  useScrollAnimations(scope)

  useEffect(() => {
    if (reduced) return
    let ctx
    let onMove
    let cancelled = false

    loadGsap().then(({ gsap }) => {
      if (cancelled || !scope.current) return
      ctx = gsap.context(() => {
        gsap.to('.hero__content', {
          yPercent: -30,
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        })
        gsap.to('.hero__media', {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        })

        gsap.fromTo(
          '.manifesto__word',
          { color: '#A39C8E' },
          {
            color: '#161917',
            stagger: 0.05,
            ease: 'none',
            scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 45%', scrub: true },
          },
        )

        gsap.fromTo(
          '.corridor__track',
          { z: -200 },
          {
            z: 1500,
            ease: 'none',
            scrollTrigger: { trigger: '.teaser', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          },
        )
      }, scope)

      const media = scope.current.querySelector('.hero__media')
      const fine = window.matchMedia('(pointer: fine)').matches
      if (fine && media) {
        const xTo = gsap.quickTo(media, 'x', { duration: 1.2, ease: 'power3.out' })
        const yTo = gsap.quickTo(media, 'y', { duration: 1.2, ease: 'power3.out' })
        onMove = (e) => {
          xTo((e.clientX / window.innerWidth - 0.5) * -14)
          yTo((e.clientY / window.innerHeight - 0.5) * -10)
        }
        window.addEventListener('pointermove', onMove)
      }
    })

    return () => {
      cancelled = true
      if (onMove) window.removeEventListener('pointermove', onMove)
      ctx?.revert()
    }
  }, [reduced])

  const featured = [
    products[0],
    products[6],
    products[12],
    products[18],
    products[24],
    products[26],
    products[27],
    products[28],
  ]
  const corridorFrames = [products[0], products[6], products[12], products[18], products[24], products[27]]

  return (
    <main id="main" ref={scope}>
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

          <HeroNiche reduced={reduced} />
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

      {/* ───────────── MANIFIESTO ───────────── */}
      <section className="manifesto container" aria-label="Manifiesto">
        <p className="eyebrow">Manifiesto del Atelier</p>
        <p className="manifesto__text">
          {manifesto.split(' ').map((w, i) => (
            <span key={i} className="manifesto__word">
              {w}{' '}
            </span>
          ))}
        </p>
      </section>

      {/* ───────────── PERCHERO INTERACTIVO EN PORTADA ───────────── */}
      <div className="container">
        <BoutiqueRack
          items={featured}
          title="Perchero de Selección · 8 Piezas Clave"
          subtitle="Desliza las perchas como en nuestra boutique física o entra al catálogo completo para recorrer los 5 racks."
        />
      </div>

      {/* ───────────── DESTACADOS ───────────── */}
      <section className="section container" aria-labelledby="featured-title">
        <div className="section__head" data-reveal>
          <div>
            <p className="eyebrow">Selección de las 5 Salas</p>
            <h2 id="featured-title" className="h2">
              Piezas <em>destacadas</em>
            </h2>
          </div>
          <Link to="/catalogo" className="link-arrow">
            Ver las 30 prendas en racks <ArrowIcon width={18} height={18} />
          </Link>
        </div>
        <div className="grid grid--4" data-reveal-stagger>
          {featured.map((p, idx) => (
            <ProductCard key={p.id} product={p} priority={idx < 4} />
          ))}
        </div>
      </section>

      {/* ───────────── MERCADO DE SNEAKERS (teaser) ───────────── */}
      <section className="market-teaser" aria-labelledby="market-title">
        <div className="container">
          <div className="section__head" data-reveal>
            <div>
              <p className="eyebrow eyebrow--light">Mercado Pedestal · Autenticidad verificada</p>
              <h2 id="market-title" className="h2">
                Sneakers con <em>precio de mercado</em>
              </h2>
            </div>
            <Link to="/sneakers" className="link-arrow link-arrow--light">
              Ver el mercado completo <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <ul className="market-teaser__list" data-reveal-stagger>
            {sneakers.slice(0, 3).map((s) => {
              const m = getMarket(s)
              return (
                <li key={s.id}>
                  <Link to={`/sneakers/${s.id}`} className="mtile mtile--dark">
                    <span className="mtile__media">
                      <img src={s.img.replace('.webp', '-sm.webp')} alt="" width="420" height="560" loading="lazy" />
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
        </div>
      </section>

      {/* ───────────── TEASER MUSEO (corredor CSS 3D) ───────────── */}
      <section className="teaser" aria-labelledby="teaser-title">
        <div className="corridor" aria-hidden="true">
          <div className="corridor__track">
            {corridorFrames.map((p, i) => (
              <div
                key={p.id}
                className={`corridor__frame corridor__frame--${i % 2 ? 'right' : 'left'}`}
                style={{ '--z': `${-i * 320}px` }}
              >
                <img src={p.img.replace('.webp', '-sm.webp')} alt="" loading="lazy" width="420" height="560" />
              </div>
            ))}
            <div className="corridor__floor" />
          </div>
        </div>
        <div className="teaser__content container" data-reveal>
          <p className="eyebrow">Flagship 3D · Racks de Bronce, Travertino & Olivos</p>
          <h2 id="teaser-title" className="h2">
            Recorre los <em>racks en 3D</em>
          </h2>
          <p className="teaser__text">
            Cinco salas luminosas en piedra travertino y granito griego donde las 30 prendas cuelgan de racks arquitectónicos de
            bronce. Acércate a cualquier perchero, pasa de una prenda a otra y añade tu talla al carrito.
          </p>
          <Link to="/museo" className="btn btn--primary">
            <CubeIcon width={18} height={18} /> Entrar a la tienda-museo 3D
          </Link>
        </div>
      </section>

      {/* ───────────── SALAS ───────────── */}
      <section className="section container" aria-labelledby="rooms-title">
        <div className="section__head" data-reveal>
          <div>
            <p className="eyebrow">Plano del showroom · 30 prendas originales</p>
            <h2 id="rooms-title" className="h2">
              Cinco <em>salas</em>
            </h2>
          </div>
        </div>
        <ol className="rooms" data-reveal-stagger>
          {rooms.map((r) => {
            const items = products.filter((p) => p.room === r.id)
            return (
              <li key={r.id} className="rooms__item">
                <Link to={`/museo?sala=${r.id}`} className="rooms__link">
                  <span className="rooms__num">0{r.id + 1}</span>
                  <span className="rooms__name">{r.name.split('·')[1]}</span>
                  <span className="rooms__text">{r.text}</span>
                  <span className="rooms__thumbs" aria-hidden="true">
                    {items.slice(0, 3).map((p) => (
                      <img key={p.id} src={p.img.replace('.webp', '-sm.webp')} alt="" loading="lazy" width="420" height="560" />
                    ))}
                  </span>
                  <ArrowIcon className="rooms__arrow" />
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="cta container" data-reveal>
        <h2 className="h2">
          ¿Buscas asesoría de <em>talla o estilo</em>?
        </h2>
        <p>Agenda una cita personalizada con nuestro equipo de sastrería urbana o solicita información sobre envíos asegurados.</p>
        <Link to="/contacto" className="btn btn--ghost">
          Contactar al atelier <ArrowIcon width={18} height={18} />
        </Link>
      </section>
    </main>
  )
}

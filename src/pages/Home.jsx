import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { products, rooms } from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import BoutiqueRack from '../components/BoutiqueRack.jsx'
import { ArrowIcon, CubeIcon } from '../components/Icons.jsx'
import { useScrollAnimations, loadGsap } from '../hooks/useScrollAnimations.js'
import { useMotionPref } from '../context/MotionContext.jsx'

const base = import.meta.env.BASE_URL
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
          yPercent: 18,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        })

        gsap.fromTo(
          '.manifesto__word',
          { color: '#A39C8E' },
          {
            color: '#181B19',
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
          xTo((e.clientX / window.innerWidth - 0.5) * -24)
          yTo((e.clientY / window.innerHeight - 0.5) * -16)
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
      {/* ───────────── HERO EN ALTA RESOLUCIÓN ───────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__media">
          <img
            className="hero__img"
            src={`${base}img/hero-hd.webp`}
            srcSet={`${base}img/hero-sm.webp 960w, ${base}img/hero.webp 1920w, ${base}img/hero-hd.webp 2560w`}
            sizes="100vw"
            alt="Sala arquitectónica de VESTIGIO con columnas griegas, olivos mediterráneos y piezas originales de streetwear"
            width="2560"
            height="1440"
            fetchpriority="high"
          />
          <div className="hero__shade" />
        </div>

        <div className="hero__content container">
          <p className="hero__eyebrow eyebrow">Atelier VESTIGIO · 30 Diseños Originales · 5 Salas</p>
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line">
              <span>Streetwear con</span>
            </span>
            <span className="hero__line">
              <span>
                <em>historia.</em>
              </span>
            </span>
          </h1>
          <p className="hero__lead">
            Treinta prendas originales creadas desde cero en nuestro atelier y exhibidas en percheros interactivos de bronce entre
            columnas griegas de travertino y olivos mediterráneos.
          </p>
          <div className="hero__actions">
            <Link to="/museo" className="btn btn--primary">
              <CubeIcon width={18} height={18} /> Entrar a la tienda-museo 3D
            </Link>
            <Link to="/catalogo" className="btn btn--ghost hero__ghost-btn">
              Recorrer los racks <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <span>Desliza</span>
          <i />
        </div>
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

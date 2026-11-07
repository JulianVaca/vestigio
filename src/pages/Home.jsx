import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { products, rooms } from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import { ArrowIcon, CubeIcon } from '../components/Icons.jsx'
import { useScrollAnimations, loadGsap } from '../hooks/useScrollAnimations.js'
import { useMotionPref } from '../context/MotionContext.jsx'

const base = import.meta.env.BASE_URL
const manifesto =
  'No vendemos tendencias efímeras; custodiamos reliquias contemporáneas. En VESTIGIO dialogan el archivo de diseñador, Billionaire Boys Club, A Bathing Ape, Yeezy y los sneakers que escribieron la historia de la calle con la permanencia del granito griego y la vida botánica del Mediterráneo.'

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
          { color: '#6E7A73' },
          {
            color: '#F2EFE9',
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

  // Seleccionamos 8 piezas representativas de las 5 salas para la portada
  const featured = [
    products[0], // Raf Simons Bomber
    products[6], // BBC Astronaut Hoodie
    products[12], // BAPE Shark Granite Camo
    products[18], // Yeezy Dove Hoodie
    products[24], // Air Jordan 1 1985 Relic
    products[26], // BAPE STA Marble & Olive
    products[27], // Yeezy 700 Wave Runner
    products[28], // Off-White x AJ1 The Ten
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
            alt="Visitante en hoodie oversize y pantalón sastre frente a una vitrina con un torso de mármol griego y un sneaker de archivo en un pórtico de granito con olivos"
            width="2560"
            height="1440"
            fetchpriority="high"
          />
          <div className="hero__shade" />
        </div>

        <div className="hero__content container">
          <p className="hero__eyebrow eyebrow">Exposición 01 · Ágora & Archivo · 30 Piezas</p>
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
            Treinta piezas curadas entre columnas de granito griego y jardines botánicos: archivo de Diseñador, Billionaire Boys
            Club, BAPE, Yeezy y los sneakers que definieron una era.
          </p>
          <div className="hero__actions">
            <Link to="/museo" className="btn btn--primary">
              <CubeIcon width={18} height={18} /> Entrar al museo 3D
            </Link>
            <Link to="/catalogo" className="btn btn--ghost">
              Explorar las 30 piezas <ArrowIcon width={18} height={18} />
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
              Ágora & Archivo · 30 Piezas Autenticadas · Diseñador · Billionaire Boys Club · A Bathing Ape · Yeezy · Sneakers de Culto · Envíos Asegurados ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ───────────── MANIFIESTO ───────────── */}
      <section className="manifesto container" aria-label="Manifiesto">
        <p className="eyebrow">Manifiesto Curatorial</p>
        <p className="manifesto__text">
          {manifesto.split(' ').map((w, i) => (
            <span key={i} className="manifesto__word">
              {w}{' '}
            </span>
          ))}
        </p>
      </section>

      {/* ───────────── DESTACADOS ───────────── */}
      <section className="section container" aria-labelledby="featured-title">
        <div className="section__head" data-reveal>
          <div>
            <p className="eyebrow">Selección de las 5 Salas</p>
            <h2 id="featured-title" className="h2">
              Reliquias <em>destacadas</em>
            </h2>
          </div>
          <Link to="/catalogo" className="link-arrow">
            Ver las 30 piezas <ArrowIcon width={18} height={18} />
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
          <p className="eyebrow">Pórtico 3D en Granito & Botánica</p>
          <h2 id="teaser-title" className="h2">
            Camina por el <em>archivo</em>
          </h2>
          <p className="teaser__text">
            Cinco salas de arquitectura griega en granito con olivos y laureles, treinta obras interactivas y esculturas en tiempo
            real. Abre cada pieza para inspeccionar su marquilla tejida, elegir tu talla y añadirla al carrito.
          </p>
          <Link to="/museo" className="btn btn--primary">
            <CubeIcon width={18} height={18} /> Iniciar recorrido 3D
          </Link>
        </div>
      </section>

      {/* ───────────── SALAS ───────────── */}
      <section className="section container" aria-labelledby="rooms-title">
        <div className="section__head" data-reveal>
          <div>
            <p className="eyebrow">Plano del museo · 30 obras</p>
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
          ¿Buscas una pieza <em>específica</em>?
        </h2>
        <p>Agenda una cita privada en nuestro showroom o solicita asesoría de tallas, autenticidad y envíos asegurados.</p>
        <Link to="/contacto" className="btn btn--ghost">
          Contactar curaduría <ArrowIcon width={18} height={18} />
        </Link>
      </section>
    </main>
  )
}

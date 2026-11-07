import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { products, rooms } from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import { ArrowIcon, CubeIcon } from '../components/Icons.jsx'
import { useScrollAnimations, loadGsap } from '../hooks/useScrollAnimations.js'
import { useMotionPref } from '../context/MotionContext.jsx'

const base = import.meta.env.BASE_URL
const manifesto =
  'No hacemos temporadas, hacemos exposiciones. Cada prenda de VESTIGIO nace de un fragmento: una columna partida, un pigmento desvanecido, una pátina de bronce. Ropa pensada para durar más que la tendencia que la vio nacer.'

export default function Home() {
  const scope = useRef(null)
  const { reduced } = useMotionPref()
  useScrollAnimations(scope)

  // Animaciones de scroll del hero, manifiesto y corredor 3D (cargadas tras el primer pintado)
  useEffect(() => {
    if (reduced) return
    let ctx
    let onMove
    let cancelled = false

    loadGsap().then(({ gsap }) => {
      if (cancelled || !scope.current) return
      ctx = gsap.context(() => {
        // Al hacer scroll el titular se aleja y la imagen se queda atrás (profundidad)
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

        // 2. MANIFIESTO — las palabras se "iluminan" al ritmo de la lectura
        // Parte de #7A7369 (contraste 4.6:1 sobre #0E0D0C, cumple WCAG AA) hasta #EFE9DF (16.4:1)
        gsap.fromTo(
          '.manifesto__word',
          { color: '#7A7369' },
          {
            color: '#EFE9DF',
            stagger: 0.05,
            ease: 'none',
            scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 45%', scrub: true },
          },
        )

        // 3. CORREDOR — avanzamos por una galería CSS 3D con el scroll
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

      // Parallax sutil del hero con el puntero (sólo dispositivos con mouse)
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

  const featured = products.slice(0, 4)
  const corridorFrames = [...products.slice(0, 6)]

  return (
    <main id="main" ref={scope}>
      {/* ───────────── HERO ───────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__media">
          <img
            className="hero__img"
            src={`${base}img/hero.webp`}
            srcSet={`${base}img/hero-sm.webp 800w, ${base}img/hero.webp 1600w`}
            sizes="100vw"
            alt="Una mujer con abrigo color arena observa una columna antigua en una sala de museo en penumbra"
            width="1600"
            height="893"
            fetchpriority="high"
          />
          <div className="hero__shade" />
        </div>

        <div className="hero__content container">
          <p className="hero__eyebrow eyebrow">Colección 01 · Ruinas Suaves</p>
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line">
              <span>Moda que</span>
            </span>
            <span className="hero__line">
              <span>
                se <em>exhibe.</em>
              </span>
            </span>
          </h1>
          <p className="hero__lead">
            Ocho piezas inspiradas en fragmentos de la historia. Recórrelas en nuestro museo 3D o explóralas en el catálogo.
          </p>
          <div className="hero__actions">
            <Link to="/museo" className="btn btn--primary">
              <CubeIcon width={18} height={18} /> Entrar al museo 3D
            </Link>
            <Link to="/catalogo" className="btn btn--ghost">
              Ver catálogo <ArrowIcon width={18} height={18} />
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
              Nueva exposición · Ruinas Suaves · Hecho en Colombia · Envíos gratis desde $400.000 · Recorrido 3D ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ───────────── MANIFIESTO ───────────── */}
      <section className="manifesto container" aria-label="Manifiesto">
        <p className="eyebrow">Manifiesto</p>
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
            <p className="eyebrow">Sala I y II</p>
            <h2 id="featured-title" className="h2">
              Piezas <em>destacadas</em>
            </h2>
          </div>
          <Link to="/catalogo" className="link-arrow">
            Todo el catálogo <ArrowIcon width={18} height={18} />
          </Link>
        </div>
        <div className="grid grid--4" data-reveal-stagger>
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
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
                <img src={p.img.replace('.webp', '-sm.webp')} alt="" loading="lazy" width="400" height="533" />
              </div>
            ))}
            <div className="corridor__floor" />
          </div>
        </div>
        <div className="teaser__content container" data-reveal>
          <p className="eyebrow">Experiencia interactiva</p>
          <h2 id="teaser-title" className="h2">
            Camina por la <em>colección</em>
          </h2>
          <p className="teaser__text">
            Cuatro salas, ocho piezas y una escultura textil que respira. Arrastra para mirar, toca el suelo para caminar y abre
            cada prenda para añadirla al carrito sin salir del museo.
          </p>
          <Link to="/museo" className="btn btn--primary">
            <CubeIcon width={18} height={18} /> Iniciar recorrido
          </Link>
        </div>
      </section>

      {/* ───────────── SALAS ───────────── */}
      <section className="section container" aria-labelledby="rooms-title">
        <div className="section__head" data-reveal>
          <div>
            <p className="eyebrow">Plano del museo</p>
            <h2 id="rooms-title" className="h2">
              Cuatro <em>salas</em>
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
                    {items.map((p) => (
                      <img key={p.id} src={p.img.replace('.webp', '-sm.webp')} alt="" loading="lazy" width="400" height="533" />
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
          ¿Prefieres <em>conversar</em>?
        </h2>
        <p>Agenda una visita privada al atelier o pregúntanos por tallas y envíos.</p>
        <Link to="/contacto" className="btn btn--ghost">
          Escríbenos <ArrowIcon width={18} height={18} />
        </Link>
      </section>
    </main>
  )
}

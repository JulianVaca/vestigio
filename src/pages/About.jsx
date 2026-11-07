import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'
import { ArrowIcon } from '../components/Icons.jsx'

const base = import.meta.env.BASE_URL

const values = [
  {
    n: '01',
    t: 'El archivo como templo',
    d: 'Tratamos cada pieza histórica de streetwear —desde el Harajuku de los 2000 hasta la sastrería deconstruida— con el rigor de un museo arqueológico.',
  },
  {
    n: '02',
    t: 'Autenticidad verificada',
    d: 'Inspeccionamos costuras, gramajes, marquillas tejidas y procedencia de cada prenda de Diseñador, BBC, BAPE, Yeezy y cada par de colección.',
  },
  {
    n: '03',
    t: 'Permanencia mineral',
    d: 'Nuestra arquitectura en granito griego y botánica mediterránea celebra objetos diseñados para resistir el paso de las décadas.',
  },
]

const timeline = [
  {
    y: 'Fase I · Búsqueda',
    t: 'Curaduría internacional',
    d: 'Localizamos piezas de archivo en coleccionistas privados de Tokio, Nueva York, Amberes, Milán y Bogotá.',
  },
  {
    y: 'Fase II · Peritaje',
    t: 'Verificación de marquilla',
    d: 'Autenticación microscópica de etiquetas tejidas, lavados minerales, herrajes y cajas originales.',
  },
  {
    y: 'Fase III · Conservación',
    t: 'Restauración y archivo',
    d: 'Acondicionamiento textil en atmósfera controlada y registro fotográfico en nuestro estudio de granito.',
  },
  {
    y: 'Fase IV · Exhibición',
    t: 'Pórtico 3D y despacho',
    d: 'Presentación en nuestras cinco salas virtuales e internacionales con envío asegurado puerta a puerta.',
  },
]

const team = [
  { name: 'Dirección Curatorial', r: 'Archivo Diseñador & Avant-Garde', d: 'Especialistas en Raf Simons, Rick Owens, Maison Margiela y sastrería contemporánea.' },
  { name: 'Archivo Harajuku & NYC', r: 'Billionaire Boys Club & BAPE', d: 'Curaduría de primeras ediciones de Pharrell Williams, NIGO y Sk8thing.' },
  { name: 'División Monolito & Calzado', r: 'Yeezy & Sneakers Históricos', d: 'Peritaje de siluetas Yeezy Season y pares fundacionales desde 1985.' },
  { name: 'Arquitectura Digital', r: 'Museo 3D & Experiencia', d: 'Diseño espacial helénico, conservación y atención privada a coleccionistas.' },
]

export default function About() {
  const scope = useRef(null)
  useScrollAnimations(scope)

  return (
    <main id="main" ref={scope} className="page">
      <header className="page__head container" data-reveal>
        <p className="eyebrow">Casa Curatorial VESTIGIO</p>
        <h1 className="h1 h1--xl">
          Vestimos la <em>historia</em>.
        </h1>
        <p className="page__lead">
          VESTIGIO es una galería y tienda de archivo dedicada a preservar las piezas más influyentes del streetwear y la moda de
          diseñador contemporánea, exhibidas en un diálogo permanente con la arquitectura clásica griega.
        </p>
      </header>

      <figure className="about-hero">
        <div className="about-hero__frame">
          <img
            data-parallax="0.25"
            src={`${base}img/atelier.webp`}
            alt="Mesa de curaduría con muestras textiles, marquillas de archivo y fragmentos escultóricos"
            width="1200"
            height="800"
            loading="lazy"
          />
        </div>
        <figcaption className="container">Nuestro laboratorio de archivo y conservación textil.</figcaption>
      </figure>

      <section className="section container" aria-labelledby="values-title">
        <h2 id="values-title" className="h2" data-reveal>
          Tres <em>pilares</em>
        </h2>
        <div className="values" data-reveal-stagger>
          {values.map((v) => (
            <article key={v.n} className="value">
              <span className="value__n">{v.n}</span>
              <h3>{v.t}</h3>
              <p>{v.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section container" aria-labelledby="process-title">
        <h2 id="process-title" className="h2" data-reveal>
          Proceso de <em>curaduría</em>
        </h2>
        <ol className="timeline" data-reveal-stagger>
          {timeline.map((t) => (
            <li key={t.y}>
              <span className="timeline__y">{t.y}</span>
              <h3>{t.t}</h3>
              <p>{t.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section container" aria-labelledby="team-title">
        <h2 id="team-title" className="h2" data-reveal>
          Departamentos del <em>archivo</em>
        </h2>
        <ul className="team" data-reveal-stagger>
          {team.map((m, i) => (
            <li key={m.r} className="team__card">
              <span className="team__avatar" aria-hidden="true">
                {['I', 'II', 'III', 'IV'][i]}
              </span>
              <h3>{m.name}</h3>
              <p className="team__role">{m.r}</p>
              <p>{m.d}</p>
            </li>
          ))}
        </ul>
        <div className="about-links" data-reveal>
          <Link to="/marca" className="link-arrow">
            Explorar identidad y paleta griega <ArrowIcon width={18} height={18} />
          </Link>
        </div>
      </section>
    </main>
  )
}

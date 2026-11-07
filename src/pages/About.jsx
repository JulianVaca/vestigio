import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'
import { ArrowIcon } from '../components/Icons.jsx'

const base = import.meta.env.BASE_URL

const values = [
  { n: '01', t: 'Piezas, no temporadas', d: 'Lanzamos colecciones cortas, como exposiciones, que permanecen disponibles hasta agotarse.' },
  { n: '02', t: 'Hecho cerca', d: 'Talleres en Bogotá y Medellín. Conocemos a cada persona que corta y cose nuestras prendas.' },
  { n: '03', t: 'Fichas de conservación', d: 'Cada prenda trae su ficha: origen, materiales y cómo cuidarla para que dure décadas.' },
]

const timeline = [
  { y: 'Semana 1', t: 'Propuesta y marca', d: 'Concepto, público, moodboard y referentes de motion.' },
  { y: 'Semana 2', t: 'Diseño de interfaz', d: 'Wireframes, diseño en Figma y guía de marca.' },
  { y: 'Semana 3', t: 'Motion design', d: 'Guía de movimiento, prototipo animado y museo 3D original.' },
  { y: 'Semana 4', t: 'Desarrollo y pruebas', d: 'Integración, Lighthouse, pruebas en móvil y publicación.' },
]

const team = [
  { r: 'Líder de proyecto y UX', d: 'Planeación, investigación y wireframes' },
  { r: 'Diseño visual', d: 'Identidad, interfaz y piezas gráficas' },
  { r: 'Motion design', d: 'Guía de movimiento y museo 3D' },
  { r: 'Desarrollo', d: 'Implementación, animación y publicación' },
]

export default function About() {
  const scope = useRef(null)
  useScrollAnimations(scope)

  return (
    <main id="main" ref={scope} className="page">
      <header className="page__head container" data-reveal>
        <p className="eyebrow">Nosotros</p>
        <h1 className="h1 h1--xl">
          Vestimos lo que <em>queda</em>.
        </h1>
        <p className="page__lead">
          VESTIGIO es una marca ficticia de moda contemporánea para personas de 20 a 35 años que visitan museos, coleccionan
          libros de arte y prefieren tener pocas prendas, pero memorables.
        </p>
      </header>

      <figure className="about-hero">
        <div className="about-hero__frame">
          <img
            data-parallax="0.25"
            src={`${base}img/atelier.webp`}
            alt="Mesa de trabajo del atelier con muestras de tela terracota, arena y oliva, bocetos, tijeras y un busto de yeso"
            width="1200"
            height="800"
            loading="lazy"
          />
        </div>
        <figcaption className="container">El atelier, donde cada colección empieza como un fragmento.</figcaption>
      </figure>

      <section className="section container" aria-labelledby="values-title">
        <h2 id="values-title" className="h2" data-reveal>
          Tres <em>principios</em>
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
          Cómo construimos <em>este sitio</em>
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
          El <em>equipo</em>
        </h2>
        <ul className="team" data-reveal-stagger>
          {team.map((m, i) => (
            <li key={m.r} className="team__card">
              <span className="team__avatar" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
              <h3>Integrante {i + 1}</h3>
              <p className="team__role">{m.r}</p>
              <p>{m.d}</p>
            </li>
          ))}
        </ul>
        <div className="about-links" data-reveal>
          <Link to="/marca" className="link-arrow">
            Ver la guía de marca <ArrowIcon width={18} height={18} />
          </Link>
        </div>
      </section>
    </main>
  )
}

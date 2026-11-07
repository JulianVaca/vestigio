import { useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'

// Paleta «Helénico Botánico Áureo» (v2.2). El oro brillante es sólo ornamento;
// el texto dorado usa Oro Antiguo Texto para cumplir WCAG AA sobre marfil.
const BG = '#F5F1E8'
const DARK = '#0F1A14'
const palette = [
  { name: 'Marfil Pentélico', hex: '#F5F1E8', use: 'Fondo principal luminoso', on: DARK },
  { name: 'Ciprés Nocturno', hex: '#0F1A14', use: 'Hero, mercado de sneakers y secciones de lujo', on: BG },
  { name: 'Laurel Profundo', hex: '#23432F', use: 'Acción principal y botánica', on: BG },
  { name: 'Oro Antiguo', hex: '#B8964F', use: 'Sólo ornamento: herrajes, grecas, bordes', on: DARK },
  { name: 'Oro Claro', hex: '#DCC48E', use: 'Texto y cifras sobre Ciprés', on: DARK },
  { name: 'Oro Antiguo Texto', hex: '#7A5A22', use: 'Precios y etiquetas doradas sobre marfil', on: BG },
  { name: 'Basalto', hex: '#161917', use: 'Tipografía principal', on: BG },
  { name: 'Piedra de Olivo', hex: '#50574F', use: 'Texto secundario', on: BG },
]

// Contraste WCAG 2.x
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const motionTokens = [
  { name: 'Deslizamiento Rack', css: 'spring(290, 28)', spring: true, use: 'Física de las perchas al recorrer los racks de tienda' },
  { name: 'Telón Helénico', css: 'cubic-bezier(0.76, 0, 0.24, 1)', ease: [0.76, 0, 0.24, 1], dur: 0.5, use: 'Transiciones de sala y menús con peso arquitectónico' },
  { name: 'Carrera Carrito', css: 'cubic-bezier(0.22, 0.88, 0.38, 1)', ease: [0.22, 0.88, 0.38, 1], dur: 0.78, use: 'Sprint dinámico del carrito frente a la pantalla' },
  { name: 'Cápsula al Carrito', css: 'spring(600, 14)', spring: true, use: 'Vuelo de la prenda desde la percha al carrito' },
]

function EaseDemo({ token }) {
  const [on, setOn] = useState(false)
  return (
    <button className="ease-demo" onClick={() => setOn((v) => !v)} aria-label={`Reproducir curva ${token.name}`}>
      <span className="ease-demo__track">
        <motion.span
          className="ease-demo__rail"
          animate={{ x: on ? '100%' : '0%' }}
          transition={token.spring ? { type: 'spring', stiffness: 290, damping: 24 } : { duration: token.dur, ease: token.ease }}
        >
          <span className="ease-demo__dot" />
        </motion.span>
      </span>
    </button>
  )
}

export default function Brand() {
  const { reduced } = useMotionPref()
  return (
    <main id="main" className="page container brand">
      <header className="page__head">
        <p className="eyebrow">Sistema de Diseño · Helénico Botánico Áureo</p>
        <h1 className="h1">
          Identidad <em>VESTIGIO</em>
        </h1>
        <p className="page__lead">
          Marfil de mármol pentélico y laurel profundo para el día a día; ciprés nocturno y oro antiguo para los momentos de
          lujo. El oro se usa como joyería: poco, en líneas y herrajes, nunca como fondo de texto.
        </p>
      </header>

      <section className="brand__grid">
        <article className="brand__block brand__block--logo">
          <h2 className="brand__label">Logotipo</h2>
          <div className="brand__logos">
            <div className="brand__logo-box">
              <Logo animated />
            </div>
            <div className="brand__logo-box brand__logo-box--light">
              <Logo />
            </div>
          </div>
          <p>
            La «V» es un pórtico dórico apoyado sobre un estilóbato en hoja de olivo: el espacio donde dialogan la arquitectura
            clásica y nuestras 30 prendas originales de autor.
          </p>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Tipografía</h2>
          <p className="brand__type-display">
            Fraunces <em>Italic</em>
          </p>
          <p className="brand__type-meta">Display · titulares monumentales e inscripciones de sala</p>
          <p className="brand__type-body">Inter — interfaz de percheros, tallas, precios y fichas del atelier.</p>
          <p className="brand__type-meta">Alojadas localmente con carga instantánea.</p>
        </article>

        <article className="brand__block brand__block--wide">
          <h2 className="brand__label">Paleta Helénico Botánico Áureo (Contraste WCAG)</h2>
          <ul className="palette">
            {palette.map((c) => (
              <li key={c.hex} className="palette__item">
                <span className="palette__swatch" style={{ background: c.hex }} />
                <strong>{c.name}</strong>
                <code>{c.hex}</code>
                <span className="palette__use">{c.use}</span>
                <span className="palette__ratio">
                  {c.on === DARK ? 'sobre Ciprés' : 'sobre Marfil'} {contrast(c.hex, c.on).toFixed(1)}:1
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Diseño de Autor & Tienda</h2>
          <ul className="brand__list">
            <li>
              <strong>Prendas creadas desde cero.</strong> Cada una de las 30 piezas es un diseño original de nuestro atelier.
            </li>
            <li>
              <strong>Racks interactivos en 2D y 3D.</strong> Explora la ropa colgada en percheros de bronce tanto en el catálogo como en la tienda 3D.
            </li>
            <li>
              <strong>Arquitectura luminosa.</strong> La piedra travertino realza las texturas de las telas sin oscurecer los detalles.
            </li>
          </ul>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Movimiento {reduced && '(modo estático activo)'}</h2>
          <ul className="tokens">
            {motionTokens.map((t) => (
              <li key={t.name}>
                <div>
                  <strong>{t.name}</strong> <code>{t.css}</code>
                  <p>{t.use}</p>
                </div>
                <EaseDemo token={t} />
              </li>
            ))}
          </ul>
          <p className="brand__type-meta">Toca cada barra para previsualizar la curva cinética.</p>
        </article>
      </section>
    </main>
  )
}

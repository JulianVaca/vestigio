import { useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'

const palette = [
  { name: 'Travertino Ático', hex: '#F3EFE6', use: 'Fondo principal luminoso de la tienda-museo' },
  { name: 'Basalto Griego', hex: '#181B19', use: 'Tipografía principal y contraste de alto impacto' },
  { name: 'Hoja de Olivo Egeo', hex: '#2D5A40', use: 'Acción principal, botánica y acentos de sala' },
  { name: 'Bronce Helénico', hex: '#8C662C', use: 'Barras de los racks, perchas y precios' },
  { name: 'Piedra de Olivo', hex: '#525954', use: 'Texto secundario y descripciones técnicas' },
  { name: 'Granito Griego Claro', hex: '#EAE4D7', use: 'Superficies de tarjetas, pedestales y racks' },
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
        <p className="eyebrow">Sistema de Diseño · Travertino, Granito & Botánica</p>
        <h1 className="h1">
          Identidad <em>VESTIGIO</em>
        </h1>
        <p className="page__lead">
          Paleta luminosa inspirada en el mármol travertino griego, el granito claro pulido, el bronce cepillado de los racks de
          tienda y los olivos mediterráneos.
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
          <h2 className="brand__label">Paleta Flagship: Travertino, Granito & Olivo (Contraste WCAG)</h2>
          <ul className="palette">
            {palette.map((c) => {
              const onTravertine = contrast(c.hex, '#F3EFE6')
              const onBasalt = contrast(c.hex, '#181B19')
              return (
                <li key={c.hex} className="palette__item">
                  <span className="palette__swatch" style={{ background: c.hex }} />
                  <strong>{c.name}</strong>
                  <code>{c.hex}</code>
                  <span className="palette__use">{c.use}</span>
                  <span className="palette__ratio">
                    {c.hex !== '#F3EFE6' && `sobre Travertino ${onTravertine.toFixed(1)}:1`}
                    {c.hex === '#F3EFE6' && `sobre Basalto ${onBasalt.toFixed(1)}:1`}
                  </span>
                </li>
              )
            })}
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

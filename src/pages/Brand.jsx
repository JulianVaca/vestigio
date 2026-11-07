import { useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'

const palette = [
  { name: 'Carbón', hex: '#0E0D0C', use: 'Fondo principal, "la sala oscura"' },
  { name: 'Hueso', hex: '#EFE9DF', use: 'Texto y superficies claras' },
  { name: 'Terracota', hex: '#D9643A', use: 'Acción principal, acentos' },
  { name: 'Oro viejo', hex: '#C9A45C', use: 'Detalles, precios destacados' },
  { name: 'Piedra', hex: '#A39C91', use: 'Texto secundario' },
  { name: 'Grafito', hex: '#201D1A', use: 'Tarjetas y paneles' },
]

// Contraste WCAG 2.x
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const motionTokens = [
  { name: 'Entrada', css: 'cubic-bezier(0.22, 1, 0.36, 1)', ease: [0.22, 1, 0.36, 1], dur: 0.6, use: 'Elementos que llegan: rápido al inicio, se posan suave' },
  { name: 'Telón', css: 'cubic-bezier(0.76, 0, 0.24, 1)', ease: [0.76, 0, 0.24, 1], dur: 0.5, use: 'Transiciones de página y menús: peso y solemnidad' },
  { name: 'Recorrido', css: 'power2.inOut', ease: [0.45, 0, 0.55, 1], dur: 1.4, use: 'Cámara del museo: acelera y frena como un visitante' },
  { name: 'Rebote', css: 'spring(600, 14)', spring: true, use: 'Feedback del carrito: confirma la acción con energía' },
]

function EaseDemo({ token }) {
  const [on, setOn] = useState(false)
  return (
    <button className="ease-demo" onClick={() => setOn((v) => !v)} aria-label={`Reproducir curva ${token.name}`}>
      <span className="ease-demo__track">
        <motion.span
          className="ease-demo__rail"
          animate={{ x: on ? '100%' : '0%' }}
          transition={token.spring ? { type: 'spring', stiffness: 600, damping: 14 } : { duration: token.dur, ease: token.ease }}
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
        <p className="eyebrow">Guía de marca · 1 página</p>
        <h1 className="h1">
          Identidad <em>VESTIGIO</em>
        </h1>
        <p className="page__lead">
          Moda contemporánea inspirada en fragmentos arqueológicos. Público: 20–35 años, urbano, amante del arte y el diseño,
          que compra menos pero mejor.
        </p>
      </header>

      <section className="brand__grid">
        <article className="brand__block brand__block--logo">
          <h2 className="brand__label">Logotipo</h2>
          <div className="brand__logos">
            <div className="brand__logo-box"><Logo animated /></div>
            <div className="brand__logo-box brand__logo-box--light"><Logo /></div>
          </div>
          <p>La “V” es un pórtico partido apoyado sobre una línea terracota: el pedestal donde se exhibe la pieza. Área de respeto: la altura de la V.</p>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Tipografía</h2>
          <p className="brand__type-display">Fraunces <em>Italic</em></p>
          <p className="brand__type-meta">Display · titulares, cifras grandes · serif variable con carácter editorial</p>
          <p className="brand__type-body">Inter — texto de interfaz, botones y párrafos. Legible en pantallas pequeñas.</p>
          <p className="brand__type-meta">Ambas con licencia SIL Open Font License, alojadas localmente.</p>
        </article>

        <article className="brand__block brand__block--wide">
          <h2 className="brand__label">Paleta y contraste (WCAG)</h2>
          <ul className="palette">
            {palette.map((c) => {
              const onDark = contrast(c.hex, '#0E0D0C')
              const onLight = contrast(c.hex, '#EFE9DF')
              return (
                <li key={c.hex} className="palette__item">
                  <span className="palette__swatch" style={{ background: c.hex }} />
                  <strong>{c.name}</strong>
                  <code>{c.hex}</code>
                  <span className="palette__use">{c.use}</span>
                  <span className="palette__ratio">
                    {c.hex !== '#0E0D0C' && `sobre Carbón ${onDark.toFixed(1)}:1`}
                    {c.hex === '#0E0D0C' && `sobre Hueso ${onLight.toFixed(1)}:1`}
                  </span>
                </li>
              )
            })}
          </ul>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Tono de voz</h2>
          <ul className="brand__list">
            <li><strong>Curador, no vendedor.</strong> Contamos el origen de cada pieza.</li>
            <li><strong>Pausado.</strong> Frases cortas, sin mayúsculas gritadas ni urgencia falsa.</li>
            <li><strong>Cercano.</strong> Tuteamos: “recorre”, “elige”, “escríbenos”.</li>
          </ul>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Movimiento {reduced && '(reducido activo)'}</h2>
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
          <p className="brand__type-meta">Toca cada barra para ver la curva.</p>
        </article>
      </section>
    </main>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'

const palette = [
  { name: 'Granito Abisal', hex: '#121514', use: 'Fondo principal del pórtico y salas' },
  { name: 'Mármol Pentélico', hex: '#F2EFE9', use: 'Texto principal y relieves claros' },
  { name: 'Laurel Botánico', hex: '#5E9E7E', use: 'Acción principal, plantas y acentos' },
  { name: 'Bronce de Delfos', hex: '#C8B07A', use: 'Precios, marquillas y foco de teclado' },
  { name: 'Ceniza de Olivo', hex: '#A3ADA6', use: 'Texto secundario y piedra erosionada' },
  { name: 'Granito Labrado', hex: '#242B28', use: 'Tarjetas, pedestales y paneles' },
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
  { name: 'Zoom Marquilla', css: 'cubic-bezier(0.22, 1, 0.36, 1)', ease: [0.22, 1, 0.36, 1], dur: 0.75, use: 'Zoom-out desde la marquilla tejida al elegir la talla' },
  { name: 'Telón Helénico', css: 'cubic-bezier(0.76, 0, 0.24, 1)', ease: [0.76, 0, 0.24, 1], dur: 0.5, use: 'Transiciones de sala y menús con peso arquitectónico' },
  { name: 'Carrera Carrito', css: 'cubic-bezier(0.22, 0.88, 0.38, 1)', ease: [0.22, 0.88, 0.38, 1], dur: 0.78, use: 'Sprint dinámico del carrito frente a la pantalla' },
  { name: 'Sello Archivo', css: 'spring(600, 14)', spring: true, use: 'Cápsula 3D y rebote del carrito al añadir una pieza' },
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
        <p className="eyebrow">Sistema de Diseño · Estilo Griego & Botánica</p>
        <h1 className="h1">
          Identidad <em>VESTIGIO</em>
        </h1>
        <p className="page__lead">
          Paleta inspirada en el granito helénico, el mármol del Pentélico y la vegetación mediterránea (olivos, laureles y
          musgo), diseñada para exhibir archivo de streetwear e historia.
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
            La «V» es un pórtico dórico apoyado sobre un estilóbato en verde laurel botánico: el pedestal donde dialogan la
            antigüedad clásica y el streetwear de culto.
          </p>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Tipografía</h2>
          <p className="brand__type-display">
            Fraunces <em>Italic</em>
          </p>
          <p className="brand__type-meta">Display · titulares monumentales e inscripciones de sala</p>
          <p className="brand__type-body">Inter — interfaz, marquillas técnicas, precios y fichas de conservación.</p>
          <p className="brand__type-meta">Alojadas localmente con carga instantánea.</p>
        </article>

        <article className="brand__block brand__block--wide">
          <h2 className="brand__label">Paleta Griega: Granito & Plantas (Contraste WCAG)</h2>
          <ul className="palette">
            {palette.map((c) => {
              const onDark = contrast(c.hex, '#121514')
              const onLight = contrast(c.hex, '#F2EFE9')
              return (
                <li key={c.hex} className="palette__item">
                  <span className="palette__swatch" style={{ background: c.hex }} />
                  <strong>{c.name}</strong>
                  <code>{c.hex}</code>
                  <span className="palette__use">{c.use}</span>
                  <span className="palette__ratio">
                    {c.hex !== '#121514' && `sobre Granito ${onDark.toFixed(1)}:1`}
                    {c.hex === '#121514' && `sobre Mármol ${onLight.toFixed(1)}:1`}
                  </span>
                </li>
              )
            })}
          </ul>
        </article>

        <article className="brand__block">
          <h2 className="brand__label">Curaduría & Tono</h2>
          <ul className="brand__list">
            <li>
              <strong>Rigor histórico.</strong> Documentamos el año, diseñador y contexto cultural de cada prenda y sneaker.
            </li>
            <li>
              <strong>Arquitectura natural.</strong> El granito tallado y el follaje botánico enmarcan cada pieza sin saturar.
            </li>
            <li>
              <strong>Interacción táctil.</strong> Marquilla tejida interactiva y carrito dinámico.
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

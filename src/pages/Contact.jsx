import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'
import { useMotionPref } from '../context/MotionContext.jsx'
import { CheckIcon } from '../components/Icons.jsx'

const topics = ['Asesoría de Tallas', 'Envíos Asegurados', 'Cita en Showroom', 'Consignación de Archivo', 'Prensa']

function validate(data) {
  const errors = {}
  if (!data.name.trim()) errors.name = 'Escribe tu nombre'
  if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = 'Escribe un correo válido'
  if (data.message.trim().length < 10) errors.message = 'Cuéntanos un poco más (mín. 10 caracteres)'
  return errors
}

export default function Contact() {
  const scope = useRef(null)
  const { reduced } = useMotionPref()
  const [data, setData] = useState({ name: '', email: '', topic: topics[0], message: '' })
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(0)
  const [sent, setSent] = useState(false)
  useScrollAnimations(scope)

  const update = (e) => setData((d) => ({ ...d, [e.target.name]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const errs = validate(data)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setShake((s) => s + 1)
      e.currentTarget.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus()
      return
    }
    setSent(true)
  }

  return (
    <main id="main" ref={scope} className="page container">
      <header className="page__head" data-reveal>
        <p className="eyebrow">Concierge & Showroom</p>
        <h1 className="h1">
          Hablemos <em>de archivo</em>
        </h1>
        <p className="page__lead">
          Nuestro equipo de curadores responde en menos de 24 horas hábiles. Agenda una cita privada para conocer las piezas en
          persona o solicitar medidas exactas de marquilla.
        </p>
      </header>

      <div className="contact">
        <div className="contact__form">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                className="form"
                noValidate
                onSubmit={submit}
                exit={{ opacity: 0, y: -20 }}
                animate={shake && !reduced ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                transition={{ duration: 0.45 }}
              >
                <Field name="name" label="Nombre completo" value={data.name} onChange={update} error={errors.name} />
                <Field name="email" type="email" label="Correo electrónico" value={data.email} onChange={update} error={errors.email} />
                <fieldset className="topics">
                  <legend>Motivo de consulta</legend>
                  <div className="chips">
                    {topics.map((t) => (
                      <label key={t} className={`chip ${data.topic === t ? 'chip--active' : ''}`}>
                        <input type="radio" name="topic" value={t} checked={data.topic === t} onChange={update} className="sr-only" />
                        {data.topic === t && <motion.span layoutId="topic-bg" className="chip__bg" />}
                        <span className="chip__label">{t}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Field name="message" label="Mensaje o pieza de interés" textarea value={data.message} onChange={update} error={errors.message} />
                <button className="btn btn--primary" type="submit">
                  Enviar solicitud a curaduría
                </button>
                <p className="form__note">Atención personalizada y confidencial para coleccionistas y clientes.</p>
              </motion.form>
            ) : (
              <motion.div key="ok" className="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} role="status">
                <span className="success__icon">
                  <CheckIcon width={32} height={32} />
                </span>
                <h2 className="h2">Gracias, {data.name.split(' ')[0]}</h2>
                <p>
                  Tu consulta sobre «{data.topic}» ha sido asignada a un curador. Te responderemos a {data.email}.
                </p>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setSent(false)
                    setData({ name: '', email: '', topic: topics[0], message: '' })
                  }}
                >
                  Enviar otra consulta
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="contact__info" data-reveal-stagger>
          <div>
            <h2 className="footer__title">Showroom & Galería</h2>
            <p>
              Calle 70A # 9-42, Chapinero Alto, Bogotá
              <br />
              Martes a sábado · 11:00 – 19:30
            </p>
          </div>
          <div>
            <h2 className="footer__title">Concierge Directo</h2>
            <p>
              curaduria@vestigio.co
              <br />
              +57 (601) 742 8900
            </p>
          </div>
          <div>
            <h2 className="footer__title">Comunidad & Archivo</h2>
            <p>@vestigio.archive</p>
          </div>
        </aside>
      </div>
    </main>
  )
}

function Field({ name, label, error, textarea, ...rest }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <Tag
        name={name}
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-err` : undefined}
        rows={textarea ? 5 : undefined}
        {...rest}
      />
      <span>{label}</span>
      <AnimatePresence>
        {error && (
          <motion.em
            id={`${name}-err`}
            className="field__error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.em>
        )}
      </AnimatePresence>
    </label>
  )
}

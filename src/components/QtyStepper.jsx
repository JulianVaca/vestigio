import { AnimatePresence, motion } from 'framer-motion'
import { MinusIcon, PlusIcon } from './Icons.jsx'

/** Selector de cantidad: el número sale y entra en la dirección del cambio. */
export default function QtyStepper({ value, onChange, min = 1, max = 9, label = 'Cantidad' }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Restar uno">
        <MinusIcon width={16} height={16} />
      </button>
      <span className="qty__value" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.18 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Sumar uno">
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  )
}

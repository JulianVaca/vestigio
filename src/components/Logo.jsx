/**
 * Logotipo VESTIGIO: una "V" construida como un arco/pórtico partido
 * y una línea terracota que actúa como pedestal.
 * `animated` dibuja el trazo (stroke-dashoffset) al cargar.
 */
export default function Logo({ animated = false, className = '', title = 'VESTIGIO' }) {
  return (
    <span className={`logo ${animated ? 'logo--animated' : ''} ${className}`}>
      <svg className="logo__mark" viewBox="0 0 40 40" aria-hidden="true">
        <path className="logo__v" d="M7 6 L20 33 L33 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="miter" />
        <path className="logo__base" d="M6 37 H34" stroke="var(--c-accent)" strokeWidth="2.4" />
      </svg>
      <span className="logo__word">{title}</span>
    </span>
  )
}

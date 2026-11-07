// Ornamentos helénico-botánicos en SVG (trazo dorado): rama de olivo, greca y sello.

export function OliveBranch({ className = '', flip = false }) {
  const leaves = [
    [30, 150, -38],
    [46, 128, 32],
    [52, 108, -42],
    [70, 90, 28],
    [74, 70, -46],
    [92, 54, 24],
    [96, 34, -50],
    [114, 22, 18],
  ]
  return (
    <svg
      className={`olive ${className}`}
      viewBox="0 0 160 180"
      fill="none"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M14 176 C40 140, 70 90, 128 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="17"
          ry="5.2"
          transform={`rotate(${r} ${x} ${y})`}
          fill={i % 3 === 0 ? 'currentColor' : 'none'}
          fillOpacity={i % 3 === 0 ? 0.18 : 0}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
      <circle cx="58" cy="122" r="3.2" fill="currentColor" fillOpacity="0.55" />
      <circle cx="84" cy="80" r="2.6" fill="currentColor" fillOpacity="0.55" />
    </svg>
  )
}

/** Sello circular «Verificado» del mercado de sneakers. */
export function VerifiedSeal({ className = '' }) {
  return (
    <svg className={`seal ${className}`} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
      <path d="M22 33 l7 7 l14 -16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

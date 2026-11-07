// Íconos SVG propios (trazo 1.5px, esquinas rectas) para mantener el peso bajo.
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  'aria-hidden': true,
}

export const BagIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)
export const MenuIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 8h18M3 16h18" />
  </svg>
)
export const CloseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
)
export const ArrowIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
)
export const ArrowLeftIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </svg>
)
export const PlusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const MinusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
)
export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
)
export const MotionIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12c3-6 6 6 9 0s6 6 9 0" />
  </svg>
)
export const StillIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h18" />
  </svg>
)
export const CubeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
  </svg>
)
export const TrashIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
)
export const PlayIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M7 5l12 7-12 7V5Z" />
  </svg>
)
export const PauseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 5v14M16 5v14" />
  </svg>
)

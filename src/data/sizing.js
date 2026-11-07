// Sistema de tallas de VESTIGIO: tablas de medidas por tipo de prenda, calce,
// existencias por talla y recomendador de talla («Encuentra tu talla»).

/** Hash determinista (FNV-1a) para que las existencias sean estables entre visitas. */
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Familia de tabla de medidas según el tipo de prenda. */
export function sizeFamily(product) {
  if (product.garmentType?.startsWith('sneaker')) return 'sneakers'
  if (product.garmentType === 'pants') return product.sizes.some((s) => /^\d+$/.test(s)) ? 'denim' : 'pants'
  return 'tops'
}

/** Calce de cada patronaje: 0 = ajustado · 0.5 = fiel a la talla · 1 = amplio. */
const FIT = {
  bomber: 0.55,
  coat: 0.68,
  hoodie: 0.8,
  varsity: 0.5,
  blazer: 0.42,
  tee: 0.74,
  pants: 0.55,
  'sneaker-high': 0.42,
  'sneaker-low': 0.5,
}
export function fitOf(product) {
  const value = FIT[product.garmentType] ?? 0.5
  let label = 'Fiel a la talla'
  let advice = 'Elige tu talla habitual.'
  if (value >= 0.66) {
    label = 'Corte amplio (boxy)'
    advice = 'Patronaje holgado: si prefieres un calce clásico, baja una talla.'
  } else if (value <= 0.44) {
    label = 'Calce ceñido'
    advice = product.garmentType?.startsWith('sneaker')
      ? 'Horma estrecha: si tienes el pie ancho, sube media talla.'
      : 'Corte entallado: si estás entre dos tallas, elige la mayor.'
  }
  return { value, label, advice }
}

/** Tablas de medidas en centímetros. */
export const SIZE_TABLES = {
  tops: {
    columns: ['Pecho', 'Largo', 'Hombro', 'Manga'],
    note: 'Medidas de la prenda en plano, de costura a costura.',
    rows: {
      XS: [104, 66, 50, 58],
      S: [110, 68, 52, 59],
      M: [116, 70, 54, 60],
      L: [122, 72, 56, 61],
      XL: [128, 74, 58, 62],
      'S/M': [114, 69, 53, null],
      'L/XL': [126, 73, 57, null],
    },
  },
  pants: {
    columns: ['Cintura', 'Tiro', 'Largo', 'Bota'],
    note: 'Cintura medida sin estirar; largo desde la cintura hasta el bajo.',
    rows: {
      XS: [70, 28, 100, 20],
      S: [74, 29, 102, 21],
      M: [80, 30, 104, 22],
      L: [86, 31, 106, 23],
      XL: [92, 32, 108, 24],
    },
  },
  denim: {
    columns: ['Cintura', 'Tiro', 'Largo', 'Bota'],
    note: 'Denim selvedge sin prelavado: puede encoger hasta 1 cm tras el primer lavado en frío.',
    rows: {
      30: [78, 30, 104, 21],
      32: [82, 31, 106, 22],
      34: [87, 32, 108, 23],
      36: [92, 33, 110, 24],
    },
  },
  sneakers: {
    columns: ['US', 'UK', 'Pie (cm)'],
    note: 'Mide tu pie al final del día, del talón al dedo más largo.',
    rows: {
      'EU 40': ['7', '6', 25],
      'EU 41': ['8', '7', 25.5],
      'EU 42': ['8.5', '7.5', 26.5],
      'EU 43': ['9.5', '8.5', 27.5],
      'EU 44': ['10', '9', 28],
    },
  },
}

/** Columnas que se expresan en longitud (convertibles a pulgadas). */
export const LENGTH_COLUMNS = new Set(['Pecho', 'Largo', 'Hombro', 'Manga', 'Cintura', 'Tiro', 'Bota', 'Pie (cm)'])

/**
 * Existencias simuladas de forma determinista por prenda y talla.
 * 'out' = agotado · 'low' = últimas unidades · 'ok' = disponible.
 * Siempre queda al menos una talla disponible.
 */
export function stockOf(product) {
  const map = {}
  product.sizes.forEach((s) => {
    const h = hashString(`${product.id}:${s}`) % 100
    map[s] = h < 11 ? { state: 'out', units: 0 } : h < 30 ? { state: 'low', units: 1 + (h % 3) } : { state: 'ok', units: 4 + (h % 9) }
  })
  if (product.sizes.every((s) => map[s].state === 'out')) map[product.sizes[0]] = { state: 'low', units: 2 }
  return map
}

/* ───────────────────────── Recomendador de talla ───────────────────────── */

const LETTERS = ['XS', 'S', 'M', 'L', 'XL']

/**
 * Devuelve la talla recomendada para un producto según el perfil del visitante.
 * profile = { height, weight, pref: 'ajustado' | 'regular' | 'amplio', foot }
 */
export function recommendSize(product, profile) {
  if (!profile) return null
  const family = sizeFamily(product)

  if (family === 'sneakers') {
    const foot = Number(profile.foot)
    if (!foot) return null
    const rows = SIZE_TABLES.sneakers.rows
    const narrow = fitOf(product).value <= 0.44
    const target = foot + (narrow ? 0.6 : 0.3)
    const match = product.sizes.find((s) => rows[s] && rows[s][2] >= target)
    return match ?? product.sizes[product.sizes.length - 1]
  }

  const h = Number(profile.height)
  const w = Number(profile.weight)
  if (!h || !w) return null

  // Índice base por peso, corregido por estatura
  let idx = w < 58 ? 0 : w < 66 ? 1 : w < 76 ? 2 : w < 87 ? 3 : 4
  if (h >= 186 && idx < 4) idx += 1
  if (h <= 160 && idx > 0) idx -= 1

  // Preferencia de calce frente al patronaje de la prenda
  const fit = fitOf(product).value
  if (profile.pref === 'ajustado' && fit >= 0.66) idx -= 1
  if (profile.pref === 'amplio' && fit <= 0.6) idx += 1
  if (profile.pref === 'regular' && fit >= 0.78) idx -= 1
  idx = Math.max(0, Math.min(4, idx))

  if (family === 'denim') {
    const denim = ['30', '30', '32', '34', '36'][idx]
    return product.sizes.includes(denim) ? denim : product.sizes[Math.min(product.sizes.length - 1, Math.max(0, idx - 1))]
  }

  if (product.sizes.includes('S/M')) return idx <= 2 ? 'S/M' : 'L/XL'

  // Ajusta a las tallas realmente fabricadas
  const wanted = LETTERS[idx]
  if (product.sizes.includes(wanted)) return wanted
  const available = product.sizes.map((s) => LETTERS.indexOf(s)).filter((i) => i >= 0)
  if (!available.length) return null
  const closest = available.reduce((a, b) => (Math.abs(b - idx) < Math.abs(a - idx) ? b : a))
  return LETTERS[closest]
}

/* ───────────────────────── Perfil persistido del visitante ───────────────────────── */
const FIT_KEY = 'vestigio-fit-profile'
export function loadFitProfile() {
  try {
    return JSON.parse(localStorage.getItem(FIT_KEY) || 'null')
  } catch {
    return null
  }
}
export function saveFitProfile(profile) {
  try {
    localStorage.setItem(FIT_KEY, JSON.stringify(profile))
  } catch {
    /* almacenamiento bloqueado: el recomendador sigue funcionando en memoria */
  }
}

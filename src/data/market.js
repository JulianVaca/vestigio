// Mercado de Sneakers «Pedestal»: precios de reventa por talla, historial de ventas
// y métricas de mercado para el calzado de la Sala V.
// Los datos se generan de forma determinista por modelo (misma semilla → mismos valores)
// hasta conectar el inventario real del backend.
import { products } from './products.js'
import { hashString } from './sizing.js'

export const sneakers = products.filter((p) => p.room === 4)

const META = {
  'sneaker-aj1-chicago': { sku: 'VST-P5-085', release: '2025-03-14', silhouette: 'Caña alta', trend: 0.22 },
  'sneaker-yeezy-350-turtledove': { sku: 'VST-P5-350', release: '2025-05-02', silhouette: 'Caña baja', trend: 0.08 },
  'sneaker-bapesta-marble': { sku: 'VST-P5-PNT', release: '2025-06-20', silhouette: 'Caña baja', trend: 0.04 },
  'sneaker-yeezy-700-waverunner': { sku: 'VST-P5-700', release: '2025-08-08', silhouette: 'Caña baja', trend: 0.12 },
  'sneaker-offwhite-aj1': { sku: 'VST-P5-ARQ', release: '2025-10-31', silhouette: 'Caña alta', trend: 0.31 },
  'sneaker-dunk-pigeon': { sku: 'VST-P5-PAL', release: '2026-01-23', silhouette: 'Caña baja', trend: -0.05 },
}

/** PRNG mulberry32. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n) => Math.round(n / 1000) * 1000
const DAY = 86400000
const cache = new Map()

export function getMarket(product) {
  if (cache.has(product.id)) return cache.get(product.id)
  const meta = META[product.id] ?? { sku: 'VST-P5-000', release: '2025-01-01', silhouette: 'Caña baja', trend: 0.1 }
  const rand = rng(hashString(product.id))
  const retail = product.price

  // Historial diario de 365 días: caminata aleatoria con tendencia hacia la prima del modelo
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const days = 365
  const history = []
  let price = retail * (1 + meta.trend * 0.25)
  const target = retail * (1 + meta.trend)
  for (let i = days; i >= 0; i--) {
    const drift = (target - price) * 0.012
    const noise = (rand() - 0.5) * retail * 0.022
    price = Math.max(retail * 0.72, price + drift + noise)
    history.push({ t: today.getTime() - i * DAY, price: round(price) })
  }
  const last = history[history.length - 1].price
  const prev = history[history.length - 8].price

  // Precio por talla: las tallas centrales son las más buscadas
  const center = (product.sizes.length - 1) / 2
  const sizes = product.sizes.map((size, i) => {
    const demand = 1 - Math.abs(i - center) / (center + 1)
    const ask = round(last * (0.94 + demand * 0.1 + (rand() - 0.5) * 0.05))
    const bid = round(ask * (0.84 + rand() * 0.08))
    const soldOut = rand() < 0.08
    return { size, ask: soldOut ? null : ask, bid, asks: soldOut ? 0 : 1 + Math.floor(rand() * 9) }
  })
  const asks = sizes.filter((s) => s.ask)
  const lowestAsk = Math.min(...asks.map((s) => s.ask))
  const highestBid = Math.max(...sizes.map((s) => s.bid))

  const yearPrices = history.map((h) => h.price)
  const mean = yearPrices.reduce((a, b) => a + b, 0) / yearPrices.length
  const sd = Math.sqrt(yearPrices.reduce((a, b) => a + (b - mean) ** 2, 0) / yearPrices.length)

  const recentSales = Array.from({ length: 10 }, (_, k) => {
    const s = product.sizes[Math.floor(rand() * product.sizes.length)]
    const base = sizes.find((x) => x.size === s)
    return {
      t: today.getTime() - Math.floor(k * 0.7 * DAY + rand() * DAY * 0.6),
      size: s,
      price: round((base.ask ?? last) * (0.95 + rand() * 0.07)),
    }
  })

  const market = {
    ...meta,
    retail,
    history,
    sizes,
    lowestAsk,
    highestBid,
    lastSale: last,
    change: (last - prev) / prev,
    premium: (last - retail) / retail,
    low52: Math.min(...yearPrices),
    high52: Math.max(...yearPrices),
    volatility: sd / mean,
    sales: 80 + Math.floor(rand() * 420),
    recentSales,
  }
  cache.set(product.id, market)
  return market
}

export const formatPct = (v, digits = 1) =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v * 100).toLocaleString('es-CO', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`

export const formatDate = (t, opts = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('es-CO', opts).format(new Date(t))

/* Ofertas del visitante (persistidas localmente) */
const OFFERS_KEY = 'vestigio-offers'
export function loadOffers() {
  try {
    return JSON.parse(localStorage.getItem(OFFERS_KEY) || '{}')
  } catch {
    return {}
  }
}
export function saveOffer(id, size, amount) {
  const all = loadOffers()
  all[`${id}:${size}`] = { amount, t: Date.now() }
  try {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(all))
  } catch {
    /* sin almacenamiento: la oferta queda sólo en esta sesión */
  }
  return all
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'

// Vite inyecta import.meta.env en el navegador; solo para estas pruebas en Node
// se reemplaza por una ruta base, sin alterar los archivos de la aplicación.
registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context)
    if (!url.endsWith('/src/data/products.js')) return result
    return {
      ...result,
      source: result.source.toString().replace('import.meta.env.BASE_URL', "'/'"),
    }
  },
})

const { products, rooms, categories, getProduct, formatPrice } = await import('../src/data/products.js')
const { getMarket, sneakers, formatDate, formatPct } = await import('../src/data/market.js')
const { exhibits, stations, roomCenter, HALL } = await import('../src/museum/layout.js')

// La regresión de datos usa como referencia los mismos cálculos que realizaba el proyecto original.
test('30 productos, identificadores únicos y resultados de búsqueda idénticos', () => {
  assert.equal(products.length, 30)
  assert.equal(new Set(products.map((p) => p.id)).size, 30)
  for (const product of products) {
    assert.equal(getProduct(product.id), products.find((p) => p.id === product.id))
  }
  assert.equal(getProduct('producto-que-no-existe'), undefined)
  assert.deepEqual(categories, ['Todo', ...new Set(products.map((p) => p.category))])
})

test('precios COP mantienen el formato original', () => {
  const formatOriginal = (value) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(value)
  for (const amount of [0, 1, 1250, 1100000, 4299000, 7899999.8, -1000, ...products.map((p) => p.price)]) {
    assert.equal(formatPrice(amount), formatOriginal(amount))
  }
})

test('formateo de fechas de los gráficos conserva idioma y opciones', () => {
  const opts = [
    { day: 'numeric', month: 'short' },
    { day: 'numeric', month: 'short', year: 'numeric' },
    { day: 'numeric', month: 'long', year: 'numeric' },
  ]
  for (const opt of opts) {
    for (const t of ['2026-11-15T12:00:00Z', '2025-01-20T12:00:00Z']) {
      assert.equal(formatDate(Date.parse(t), opt), new Intl.DateTimeFormat('es-CO', opt).format(new Date(t)))
    }
  }
})

test('las posiciones y orientación del museo coinciden con el algoritmo previo', () => {
  assert.equal(exhibits.length, 30)
  for (const [index, p] of products.entries()) {
    const inRoom = products.filter((q) => q.room === p.room)
    const k = inRoom.indexOf(p)
    const side = k % 2 === 0 ? -1 : 1
    const row = Math.floor(k / 2)
    const expected = {
      product: p,
      side,
      row,
      position: [side * (HALL.halfW - 0.06), 2, roomCenter(p.room) + (1 - row) * 4.6],
      rotationY: side === -1 ? Math.PI / 2 : -Math.PI / 2,
    }
    assert.deepEqual(exhibits[index], expected)
  }
  assert.equal(stations.filter((s) => s.productId).length, 30)
})

test('mercado de sneakers continúa disponible y estable', () => {
  assert.equal(rooms.length, 5)
  assert.equal(sneakers.length, 6)
  for (const item of sneakers) {
    const market = getMarket(item)
    assert.equal(market, getMarket(item))
    assert.equal(market.history.length, 366)
    assert.ok(market.sizes.length > 0)
    assert.equal(typeof formatPct(market.change), 'string')
  }
})

test('el HTML deja de solicitar fuentes desde node_modules', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf-8')
  assert.doesNotMatch(html, /href="[^"\n]*node_modules\//)
  assert.match(html, /imagesrcset=/)
})

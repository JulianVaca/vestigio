import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { getProduct } from '../data/products.js'

/**
 * Estado global del carrito de compras persistido en localStorage.
 * Cada línea es { id, size, qty }.
 */
const CartCtx = createContext(null)
const STORAGE_KEY = 'vestigio-cart'

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { id, size, qty = 1, price } = action
      const found = state.find((l) => l.id === id && l.size === size)
      if (found)
        return state.map((l) =>
          l === found ? { ...l, qty: Math.min(9, l.qty + qty), ...(price ? { price } : {}) } : l,
        )
      return [...state, { id, size, qty, ...(price ? { price } : {}) }]
    }
    case 'setQty':
      return state
        .map((l) => (l.id === action.id && l.size === action.size ? { ...l, qty: action.qty } : l))
        .filter((l) => l.qty > 0)
    case 'remove':
      return state.filter((l) => !(l.id === action.id && l.size === action.size))
    case 'clear':
      return []
    default:
      return state
  }
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return raw.filter((l) => getProduct(l.id))
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  // `price` opcional: precio de mercado (sneakers) distinto al precio de lista
  const add = useCallback((id, size, qty = 1, price) => {
    dispatch({ type: 'add', id, size, qty, price })
    const p = getProduct(id)
    setToast({ key: Date.now(), product: p, size })
  }, [])

  const value = useMemo(() => {
    const items = lines.map((l) => {
      const product = getProduct(l.id)
      return { ...l, product, unitPrice: l.price ?? product.price }
    })
    const count = lines.reduce((s, l) => s + l.qty, 0)
    const subtotal = items.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    return {
      items,
      count,
      subtotal,
      toast,
      add,
      setQty: (id, size, qty) => dispatch({ type: 'setQty', id, size, qty }),
      remove: (id, size) => dispatch({ type: 'remove', id, size }),
      clear: () => dispatch({ type: 'clear' }),
      dismissToast: () => setToast(null),
    }
  }, [lines, toast, add])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export const useCart = () => useContext(CartCtx)

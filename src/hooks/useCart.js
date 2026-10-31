import { useMemo, useSyncExternalStore } from 'react'
import { cartSnapshot, parseCart, subscribeCart, setCartQuantity } from '../utils/cartStorage'
export function useCart() {
  const raw = useSyncExternalStore(subscribeCart, cartSnapshot, () => '[]')
  const items = useMemo(() => parseCart(raw), [raw])
  return { items, count: items.reduce((sum, item) => sum + item.quantity, 0), setQuantity: setCartQuantity,
    add: (id) => setCartQuantity(id, (items.find((item) => item.id === id)?.quantity || 0) + 1) }
}

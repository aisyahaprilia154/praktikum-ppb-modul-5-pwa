import { MERCHANDISE, rupiah } from '../data/merchandise'
const KEY = 'bore_barrel_merch_cart_v1'
const EVENT = 'merch-cart-changed'
export const cartSnapshot = () => { try { return localStorage.getItem(KEY) || '[]' } catch { return '[]' } }
export function parseCart(raw) {
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    const quantities = new Map()
    for (const item of list) {
      if (!MERCHANDISE.some((product) => product.id === item.id) || !Number.isFinite(Number(item.quantity))) continue
      const quantity = Math.max(0, Math.min(99, Math.floor(Number(item.quantity))))
      if (quantity) quantities.set(item.id, Math.min(99, (quantities.get(item.id) || 0) + quantity))
    }
    return [...quantities].map(([id, quantity]) => ({ id, quantity }))
  } catch { return [] }
}
export function setCartQuantity(id, quantity) {
  if (!MERCHANDISE.some((product) => product.id === id)) throw new Error('This cart accepts merchandise only.')
  const list = parseCart(cartSnapshot()).filter((item) => item.id !== id)
  if (Number(quantity) > 0) list.push({ id, quantity: Number(quantity) })
  localStorage.setItem(KEY, JSON.stringify(parseCart(JSON.stringify(list))))
  window.dispatchEvent(new Event(EVENT))
}
export function subscribeCart(listener) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener('storage', listener) }
}
export function checkoutLink(items, phone = '') {
  const safe = parseCart(JSON.stringify(items))
  if (!safe.length || safe.length !== items.length) throw new Error('Add merchandise to your cart first.')
  const lines = safe.map((item) => {
    const product = MERCHANDISE.find((entry) => entry.id === item.id)
    return `${product.name} x${item.quantity} — ${rupiah(product.price * item.quantity)}`
  })
  const total = safe.reduce((sum, item) => sum + MERCHANDISE.find((entry) => entry.id === item.id).price * item.quantity, 0)
  const text = `Hi aku mau pesan merchandise praktikum:\n${lines.join('\n')}\nTotal: ${rupiah(total)}\n\nSimulasi praktikum PWA.`
  return `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

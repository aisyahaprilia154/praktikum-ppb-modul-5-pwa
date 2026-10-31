import { useState } from 'react'
import { ShoppingBag, Shirt, NotebookPen, Sticker, Minus, Plus, Trash2, MessageCircle } from 'lucide-react'
import { MERCHANDISE, rupiah } from '../data/merchandise'
import { useCart } from '../hooks/useCart'
import { checkoutLink } from '../utils/cartStorage'
const ICONS = { shirt: Shirt, notebook: NotebookPen, stickers: Sticker }

export default function CartPage() {
  const { items, add, setQuantity, count } = useCart()
  const [error, setError] = useState('')
  const total = items.reduce((sum, item) => sum + MERCHANDISE.find((product) => product.id === item.id).price * item.quantity, 0)
  const act = (action) => { try { action(); setError('') } catch { setError('Your browser could not save the cart. Free some storage and try again.') } }
  return <div className="feature-page">
    <section className="masthead"><p className="eyebrow">Practice shop</p><h1 className="display">Merchandise & Cart</h1>
      <p className="lede">T-shirts, notebooks, and stickers for the PWA checkout exercise.</p></section>
    {error && <p role="alert" className="form-error">{error}</p>}
    <section aria-labelledby="merch-title"><h2 id="merch-title">Choose merchandise</h2><div className="merch-grid">
      {MERCHANDISE.map((product) => { const Icon = ICONS[product.kind]; return <article className="merch-card" key={product.id}>
        <div className="merch-art"><Icon size={62} strokeWidth={1.2} /></div><h3>{product.name}</h3><p>{product.description}</p>
        <strong>{rupiah(product.price)}</strong><button type="button" className="btn btn--primary" onClick={() => act(() => add(product.id))}><Plus size={16} /> Add {product.name}</button>
      </article> })}
    </div></section>
    <section className="profile-card" aria-labelledby="cart-title"><div className="list-head"><h2 id="cart-title"><ShoppingBag size={22} /> Your cart</h2><span>{count} items</span></div>
      {!items.length ? <p>Your cart is empty. Choose merchandise above to start.</p> : <>
        <ul className="record-list">{items.map((item) => { const product = MERCHANDISE.find((entry) => entry.id === item.id); return <li key={item.id} className="record-row">
          <div className="record-copy"><strong>{product.name}</strong><span>{rupiah(product.price)} each</span></div>
          <div className="quantity-control"><button className="icon-btn" aria-label={`Decrease ${product.name}`} onClick={() => act(() => setQuantity(item.id, item.quantity - 1))}><Minus size={16} /></button>
            <output aria-label={`${product.name} quantity`}>{item.quantity}</output><button className="icon-btn" aria-label={`Increase ${product.name}`} disabled={item.quantity >= 99} onClick={() => act(() => setQuantity(item.id, item.quantity + 1))}><Plus size={16} /></button></div>
          <strong>{rupiah(product.price * item.quantity)}</strong><button className="icon-btn" aria-label={`Remove ${product.name}`} onClick={() => act(() => setQuantity(item.id, 0))}><Trash2 size={17} /></button>
        </li> })}</ul>
        <div className="cart-summary"><div><span>Total</span><strong>{rupiah(total)}</strong></div>
          <a className="btn btn--primary" href={checkoutLink(items, import.meta.env.VITE_WHATSAPP_NUMBER || '')} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Checkout via WhatsApp</a>
          <p className="form-hint">WhatsApp opens with the message prepared. Choose a recipient and review it before sending.</p></div>
      </>}
    </section>
  </div>
}

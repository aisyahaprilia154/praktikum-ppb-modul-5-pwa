import { Plus, ShoppingBag } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useCart } from '../hooks/useCart'
const ITEMS = [{ id: 'Catalog', label: 'Catalog' }, { id: 'Favorites', label: 'Favorites' }, { id: 'Profile', label: 'Profile' }, { id: 'Cart', label: 'Merch & Cart' }]
export default function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites(), cart = useCart()
  return <header className="header"><button className="header-brand-button" onClick={() => onTab('Catalog')} aria-label="Bore and Barrel home"><span className="header-logo-badge"><img src="/logo.png" alt="" /></span><span className="brand display">Bore & Barrel</span></button>
    <nav className="nav" aria-label="Main navigation">{ITEMS.map((item) => { const count = item.id === 'Cart' ? cart.count : item.id === 'Favorites' ? favorites.length : 0; return <button key={item.id} className={tab === item.id ? 'nav-link active' : 'nav-link'} aria-current={tab === item.id ? 'page' : undefined} onClick={() => onTab(item.id)}>{item.id === 'Cart' && <ShoppingBag size={15} />}{item.label}{count > 0 && <span className="nav-badge">{count}</span>}</button> })}</nav>
    <button className="btn btn--primary btn--sm header-cta" onClick={onNavigateCreate}><Plus size={15} /> Add Hardware</button>
  </header>
}

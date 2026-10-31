import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PWABadge from './components/PWABadge'
import ConfirmModal from './components/modals/ConfirmModal'
import SplashScreen from './components/common/SplashScreen'
import { useGunById } from './hooks/useGuns'
import gunService from './services/gunService'
import { loadDraft } from './utils/draftStorage'
import { navigate, readRoute } from './utils/routes'
import './App.css'
import './features.css'

const Catalog = lazy(() => import('./pages/Catalog'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage'))
const EditGunPage = lazy(() => import('./pages/EditGunPage'))
const GunDetail = lazy(() => import('./components/gun/GunDetail'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const subscribe = (listener) => { window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener) }
const snapshot = () => window.location.hash

function ProductRoute({ id, archive }) {
  const { gun, loading, error, refetch } = useGunById(id)
  if (loading) return <div className="state-box" role="status">Loading product…</div>
  if (error || !gun) return <div className="state-box"><h1>Product unavailable</h1><p>{error || 'Product not found.'}</p><button className="btn btn--outline" onClick={() => refetch()}>Try again</button><button className="btn btn--primary" onClick={() => navigate('catalog')}>Back to Catalog</button></div>
  return <GunDetail gun={gun} onBack={() => navigate('catalog')} onEdit={() => navigate(`edit/${encodeURIComponent(id)}`)} onDelete={archive} />
}

export default function App() {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '#/catalog'), route = readRoute(hash)
  const [showSplash, setShowSplash] = useState(true), [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false), [archiveError, setArchiveError] = useState(''), [notice, setNotice] = useState('')
  const go = (path) => { setNotice(''); navigate(path); window.scrollTo({ top: 0 }) }
  const select = (target, payload) => {
    if (target === 'Archive') { setArchiveTarget(payload); setArchiveError(''); return }
    if (target === 'Detail') go(`gun/${encodeURIComponent(payload.id)}`)
    else if (target === 'Edit') go(`edit/${encodeURIComponent(payload.id)}`)
    else go(target.toLowerCase())
  }
  const active = route.page === 'archive' || route.page === 'profile' ? 'Profile' : route.page === 'favorites' ? 'Favorites' : route.page === 'cart' ? 'Cart' : route.page === 'catalog' ? 'Catalog' : ''
  return <div className="shell">
    {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    <Header tab={active} onTab={(target) => go(target.toLowerCase())} onNavigateCreate={() => go('create')} />
    <main className="main">
      {notice && <p className="toast toast--success" role="status">{notice} <button className="link-btn" onClick={() => go('archive')}>View archive</button></p>}
      <Suspense fallback={<div className="state-box" role="status">Loading page…</div>}>
        {route.page === 'gun' ? <ProductRoute id={route.id} archive={(gun) => select('Archive', gun)} />
          : route.page === 'create' ? <CreateGunPage key={hash} initialDraft={route.resume ? loadDraft('create') : null} onBack={() => go('catalog')} onSuccess={() => go('catalog')} />
          : route.page === 'edit' ? <EditGunPage key={hash} gunId={route.id} initialDraft={route.resume ? loadDraft(route.id) : null} onBack={() => go('catalog')} onSuccess={() => go('catalog')} />
          : route.page === 'favorites' ? <FavoritesPage onSelectGun={(gun) => select('Detail', gun)} onNavigateCatalog={() => go('catalog')} />
          : route.page === 'profile' && route.id === 'edit' ? <EditProfilePage onBack={() => go('profile')} />
          : route.page === 'profile' ? <ProfilePage onReplaySplash={() => setShowSplash(true)} onEditProfile={() => go('profile/edit')} onArchive={() => go('archive')}
              onResumeDraft={(id) => go(id === 'create' ? 'create?resume=1' : `edit/${encodeURIComponent(id)}?resume=1`)} />
          : route.page === 'archive' ? <ArchivePage onBack={() => go('profile')} />
          : route.page === 'cart' ? <CartPage />
          : <Catalog onNavigate={select} />}
      </Suspense>
    </main>
    <ConfirmModal open={Boolean(archiveTarget)} title="Move product to archive?" message={archiveError || `Archive "${archiveTarget?.name}"? You can restore it later from Profile > Product archive.`} confirmLabel="Archive product" loading={archiving}
      onCancel={() => { if (!archiving) setArchiveTarget(null) }} onConfirm={async () => {
        if (!archiveTarget) return
        try { setArchiving(true); await gunService.deleteGun(archiveTarget.id); setArchiveTarget(null); navigate('catalog'); setNotice('Product moved to archive.') }
        catch (error) { setArchiveError(error.message || 'Could not archive the product.') }
        finally { setArchiving(false) }
      }} />
    <PWABadge /><Footer />
  </div>
}

import { ArrowLeft, Archive, RotateCcw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useArchivedGuns } from '../hooks/useGuns'
import gunService from '../services/gunService'

export default function ArchivePage({ onBack }) {
  const query = useArchivedGuns()
  const restore = useMutation({ mutationFn: (id) => gunService.restoreGun(id) })
  const records = query.data?.data || []
  return <div className="feature-page"><button className="detail-back" onClick={onBack}><ArrowLeft size={17} /> Back to Profile</button>
    <section className="masthead"><p className="eyebrow">Reversible removal</p><h1 className="display">Product archive</h1><p className="lede">Archived products stay in the database. Restore them to return them to the catalog.</p></section>
    {query.isLoading && <p role="status">Loading archive…</p>}{query.error && <p role="alert" className="form-error">{query.error.message} <button className="link-btn" onClick={() => query.refetch()}>Retry</button></p>}
    {restore.error && <p className="form-error" role="alert">{restore.error.message}</p>}
    {!query.data && query.fetchStatus === 'paused' ? <p>Reconnect to load the archive for the first time.</p> : !query.isLoading && !records.length && <div className="state-box"><Archive size={32} /><h2>No archived products</h2><p>Use Archive on a catalog card or product detail to move a record here.</p></div>}
    <ul className="record-list">{records.map((gun) => <li className="record-row archive-row" key={gun.id}>
      <img src={gun.image_url} alt={gun.name} loading="lazy" width={80} height={64} /><div className="record-copy"><strong>{gun.name}</strong><span>{gun.type} · Archived {new Date(gun.archived_at).toLocaleDateString()}</span></div>
      <button className="btn btn--outline" disabled={restore.isPending} onClick={() => restore.mutate(gun.id)}><RotateCcw size={16} /> Restore {gun.name}</button>
    </li>)}</ul>
  </div>
}

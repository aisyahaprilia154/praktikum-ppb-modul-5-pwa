import { useState } from 'react'
import { Shield, Pencil, Archive, FileText, Trash2, ArrowRight, Play, Copy } from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { getAllDraftIds, loadDraft, deleteDraft, formatDraftTime, getDraftTimestamp } from '../utils/draftStorage'
import About from './About'
import Contact from './Contact'

function draftsList() {
  return getAllDraftIds().map((id) => ({ id, data: loadDraft(id), savedAt: getDraftTimestamp(id) })).filter((draft) => draft.data)
    .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))
}
export default function ProfilePage({ onReplaySplash, onEditProfile, onResumeDraft, onArchive }) {
  const [profile] = useState(() => userService.getUserProfile()), [drafts, setDrafts] = useState(draftsList)
  const [copied, setCopied] = useState(false)
  const { favorites } = useFavorites()
  return <div className="profile-page">
    <section className="masthead"><p className="eyebrow">Your space</p><h1 className="display">Profile</h1><p className="lede">Your identity, saved drafts, archive, and project information.</p></section>
    <section className="profile-card" aria-labelledby="identity-title"><div className="profile-card-top">
      {profile.avatar ? <img className="profile-avatar" src={profile.avatar} alt={profile.username} loading="lazy" /> : <div className="profile-avatar avatar-placeholder"><Shield size={34} /></div>}
      <div className="record-copy"><h2 id="identity-title">{profile.username || 'Shooter'}</h2><p>{profile.bio || 'Add a short bio from Edit profile.'}</p></div>
      <button className="btn btn--outline" onClick={onEditProfile}><Pencil size={16} /> Edit profile</button></div>
      <div className="profile-id-row"><span className="mono-badge">{profile.userId}</span><button className="icon-btn" aria-label="Copy profile identifier" onClick={async () => { try { await navigator.clipboard.writeText(profile.userId); setCopied(true) } catch { setCopied(false) } }}><Copy size={15} /></button>{copied && <span role="status">Copied</span>}</div>
      <div className="profile-stats"><div><strong className="stat-val">{favorites.length}</strong><span className="stat-label"> Favorites</span></div><div><strong className="stat-val">{drafts.length}</strong><span className="stat-label"> Saved drafts</span></div></div>
    </section>
    <section className="profile-card" aria-labelledby="drafts-title"><div className="list-head"><h2 id="drafts-title"><FileText size={21} /> All saved drafts</h2><span>{drafts.length} drafts</span></div>
      {!drafts.length ? <p>No saved drafts yet. Choose Save Draft on a create or edit form.</p> : <ul className="record-list">{drafts.map((draft) => <li className="record-row" key={draft.id}>
        <div className="record-copy"><strong>{draft.data.formData?.name || (draft.id === 'create' ? 'New product draft' : `Product ${draft.id}`)}</strong><span>{draft.id === 'create' ? 'New product' : 'Edit product'} · {formatDraftTime(draft.savedAt)}</span></div>
        <button className="btn btn--outline btn--sm" onClick={() => onResumeDraft(draft.id)}>Continue draft <ArrowRight size={15} /></button>
        <button className="icon-btn" aria-label={`Delete draft ${draft.id}`} onClick={() => { deleteDraft(draft.id); setDrafts(draftsList()) }}><Trash2 size={17} /></button>
      </li>)}</ul>}
    </section>
    <section className="profile-card"><div className="record-row"><div className="record-copy"><h2><Archive size={21} /> Product archive</h2><p>Restore products removed from the active catalog.</p></div><button className="btn btn--outline" onClick={onArchive}>Open archive <ArrowRight size={16} /></button></div></section>
    <About /><Contact />
    <section><button className="btn btn--outline btn--sm" onClick={onReplaySplash}><Play size={14} /> Replay Intro</button></section>
  </div>
}

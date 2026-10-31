import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { productLink } from '../../utils/routes'

export default function ShareButton({ gun, compact = false }) {
  const [open, setOpen] = useState(false), [copied, setCopied] = useState(false)
  const url = productLink(gun.id)
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true) }
    catch { setCopied(false) }
  }
  return <div className="share-control">
    <button className={compact ? 'card-act-btn' : 'btn btn--outline'} type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Share link for ${gun.name}`}>
      <Share2 size={16} /> {!compact && 'Share link'}
    </button>
    {open && <div className="share-popover">
      <label htmlFor={`share-${gun.id}`}>Unique product link</label>
      <input id={`share-${gun.id}`} className="form-input" value={url} readOnly onFocus={(event) => event.target.select()} />
      <button type="button" className="btn btn--outline btn--sm" onClick={copy}>
        {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>}
  </div>
}

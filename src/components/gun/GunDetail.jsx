import { ArrowLeft, Star, Archive } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import ReviewSection from './ReviewSection'
import { useReviews } from '../../hooks/useReviews'
import { formatPrice, averageRating } from '../../utils/helpers'

export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const { reviews } = useReviews(gun.id)
  const average = averageRating(reviews)
  const serverItem = !String(gun.id).startsWith('local-')
  return <div className="detail">
    <button className="detail-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Back to Catalog</button>
    <div className="detail-hero"><img className="detail-img" src={gun.image_url || gun.image || '/guns/pistol.svg'} alt={gun.name} decoding="async" />
      <div className="detail-info"><h1 className="display">{gun.name}</h1><p className="type">{gun.type || gun.category}{gun.caliber ? ` · ${gun.caliber}` : ''}</p>
        <p className="price detail-price">{formatPrice(gun.price ?? gun.cook_time ?? 0)}</p>
        {average > 0 && <p className="detail-rating"><Star size={16} fill="var(--brass)" /> {average.toFixed(1)} ({reviews.length} reviews)</p>}
        <div className="detail-actions"><FavoriteButton gunId={gun.id} /><ShareButton gun={gun} />
          {serverItem && onEdit && <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>Edit</button>}
          {serverItem && onDelete && <button type="button" className="btn btn--outline" onClick={() => onDelete(gun)}><Archive size={16} /> Archive</button>}
        </div>
      </div>
    </div>
    <section className="detail-section"><h2>Description</h2><p>{gun.description || 'No description available.'}</p></section>
    {!!gun.ingredients?.length && <section className="detail-section"><h2>Specifications</h2><ul className="detail-specs">{gun.ingredients.map((spec, index) => <li key={spec.id || index}><strong>{spec.name}</strong> — {spec.quantity}</li>)}</ul></section>}
    {!!gun.steps?.length && <section className="detail-section"><h2>Assembly / Maintenance Steps</h2><ol className="detail-steps">{gun.steps.map((step, index) => <li key={step.id || index}>{step.instruction || step}</li>)}</ol></section>}
    <ReviewSection gunId={gun.id} />
  </div>
}

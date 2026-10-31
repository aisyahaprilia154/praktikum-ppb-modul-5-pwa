import { useState } from 'react'
import { Star, Send, Pencil, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useReviews, useReviewActions } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import ConfirmModal from '../modals/ConfirmModal'

export default function ReviewSection({ gunId }) {
  const { reviews, loading, error, refetch } = useReviews(gunId)
  const mutation = useReviewActions(gunId)
  const [editing, setEditing] = useState(null), [rating, setRating] = useState(5), [comment, setComment] = useState('')
  const [deleting, setDeleting] = useState(null), [feedback, setFeedback] = useState('')
  const userId = getUserIdentifier(), isLocal = String(gunId).startsWith('local-')
  const resetForm = () => { setEditing(null); setRating(5); setComment('') }
  const submit = async (event) => {
    event.preventDefault(); setFeedback('')
    try {
      await mutation.mutateAsync({ action: editing ? 'update' : 'create', id: editing?.id, data: { rating, comment } })
      setFeedback(editing ? 'Review updated.' : 'Review submitted.'); resetForm()
    } catch { /* mutation error is displayed below */ }
  }
  const react = async (id, vote) => { try { await mutation.mutateAsync({ action: 'vote', id, vote }) } catch { /* displayed below */ } }
  return <section className="detail-section" aria-labelledby="reviews-title">
    <h2 id="reviews-title">Reviews</h2>
    {!isLocal && <form onSubmit={submit} className="review-form" aria-label={editing ? 'Edit your review' : 'Write a review'}>
      <h3>{editing ? 'Edit your review' : 'Write a review'}</h3>
      <label htmlFor="review-rating" className="form-label">Rating</label>
      <select id="review-rating" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="form-select">
        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}
      </select>
      <label htmlFor="review-comment" className="form-label">Your review</label>
      <textarea id="review-comment" className="review-input" rows={3} maxLength={500} placeholder="Write your review…" value={comment} onChange={(event) => setComment(event.target.value)} />
      <div className="inline-actions"><button className="btn btn--primary" disabled={mutation.isPending}><Send size={16} />{mutation.isPending ? 'Saving…' : editing ? 'Save review' : 'Submit Review'}</button>
        {editing && <button type="button" className="btn btn--outline" onClick={resetForm}>Cancel edit</button>}</div>
    </form>}
    {isLocal && <p>Reviews are available for products loaded from the server.</p>}
    {feedback && <p role="status" className="form-success">{feedback}</p>}
    {mutation.error && <p role="alert" className="form-error">{mutation.error.message}</p>}
    {error && <p role="alert" className="form-error">{error} <button className="link-btn" onClick={() => refetch()}>Retry reviews</button></p>}
    {loading ? <p>Loading reviews…</p> : !reviews.length ? <p>No reviews yet. Be the first!</p> : <ul className="review-list">
      {reviews.map((review) => <li className="review-item" key={review.id} data-review-id={review.id}>
        <div className="review-head"><strong>{review.user_id === userId ? 'Your review' : review.user_identifier}</strong>
          <span className="review-stars-display" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.rating ? 'var(--brass)' : 'none'} stroke="var(--brass)" />)}</span></div>
        <p>{review.comment || 'Rating only'}</p><div className="review-toolbar">
          <button type="button" className={`reaction-btn ${review.my_vote === 1 ? 'selected' : ''}`} aria-label={`Thumbs up review ${review.id}`} aria-pressed={review.my_vote === 1} disabled={mutation.isPending} onClick={() => react(review.id, 1)}><ThumbsUp size={16} /> {review.likes}</button>
          <button type="button" className={`reaction-btn ${review.my_vote === -1 ? 'selected' : ''}`} aria-label={`Thumbs down review ${review.id}`} aria-pressed={review.my_vote === -1} disabled={mutation.isPending} onClick={() => react(review.id, -1)}><ThumbsDown size={16} /> {review.dislikes}</button>
          {review.user_id === userId && <><button type="button" className="btn btn--outline btn--sm" disabled={mutation.isPending} aria-label={`Edit review ${review.id}`} onClick={() => { setEditing(review); setRating(review.rating); setComment(review.comment); setFeedback('') }}><Pencil size={14} /> Edit review</button>
            <button type="button" className="btn btn--outline btn--sm" disabled={mutation.isPending} aria-label={`Delete review ${review.id}`} onClick={() => setDeleting(review)}><Trash2 size={14} /> Delete review</button></>}
        </div>
      </li>)}
    </ul>}
    <ConfirmModal open={Boolean(deleting)} title="Delete your review?" message="Your review and its reactions will be removed." confirmLabel="Delete review" loading={mutation.isPending} danger
      onCancel={() => setDeleting(null)} onConfirm={async () => {
        try { await mutation.mutateAsync({ action: 'delete', id: deleting.id }); if (editing?.id === deleting.id) resetForm(); setDeleting(null); setFeedback('Review deleted.') } catch { /* displayed above */ }
      }} />
  </section>
}

import { apiClient, IS_SUPABASE } from '../config/api'
import { getUserIdentifier } from './userService'
import { readReviewContent, writeReviewContent } from '../utils/metadata'

function normalizeReview(row, userId) {
  const { text, votes } = readReviewContent(row.comment)
  const values = Object.values(votes)
  return { ...row, comment: text, user_identifier: `Operator ${String(row.user_id || '').slice(0, 8)}`,
    likes: values.filter((value) => value === 1).length, dislikes: values.filter((value) => value === -1).length,
    my_vote: votes[userId] || 0 }
}
async function getRaw(id) {
  const rows = await apiClient.get('/rest/v1/reviews', { params: { id: `eq.${id}`, select: '*' } })
  if (!rows?.[0]) throw new Error('Review no longer exists.')
  return rows[0]
}
function validate(data) {
  if (!Number.isInteger(Number(data.rating)) || Number(data.rating) < 1 || Number(data.rating) > 5) throw new Error('Choose a rating from 1 to 5.')
  if (String(data.comment || '').length > 500) throw new Error('Review must be 500 characters or less.')
}
// Compare-and-swap prevents two reactions from silently overwriting each other.
async function changeContent(id, build) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const raw = await getRaw(id), payload = build(raw)
    const rows = await apiClient.patch('/rest/v1/reviews', payload, {
      params: { id: `eq.${id}`, comment: raw.comment == null ? 'is.null' : `eq.${raw.comment}` },
      headers: { Prefer: 'return=representation' },
    })
    if (rows?.[0]) return rows[0]
  }
  throw new Error('Review changed in another session. Please try again.')
}
class ReviewService {
  async getReviews(gunId, userId = getUserIdentifier()) {
    if (!IS_SUPABASE) return apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
    const rows = await apiClient.get('/rest/v1/reviews', { params: { product_id: `eq.${gunId}`, select: '*', order: 'created_at.desc' } })
    return { success: true, data: rows.map((row) => normalizeReview(row, userId)) }
  }
  async createReview(gunId, data) {
    validate(data)
    if (!IS_SUPABASE) return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, data)
    const userId = data.user_id || data.user_identifier || getUserIdentifier()
    const rows = await apiClient.post('/rest/v1/reviews', { product_id: Number(gunId), user_id: userId,
      rating: Number(data.rating), comment: writeReviewContent((data.comment || '').trim()) }, { headers: { Prefer: 'return=representation' } })
    return { success: true, data: normalizeReview(rows[0], userId) }
  }
  async updateReview(id, data, userId = getUserIdentifier()) {
    validate(data)
    if (!IS_SUPABASE) return apiClient.put(`/api/v1/reviews/${id}`, data)
    const row = await changeContent(id, (raw) => {
      if (raw.user_id !== userId) throw new Error('You can only edit your own review.')
      return { rating: Number(data.rating), comment: writeReviewContent((data.comment || '').trim(), readReviewContent(raw.comment).votes) }
    })
    return { success: true, data: normalizeReview(row, userId) }
  }
  async deleteReview(id, userId = getUserIdentifier()) {
    if (!IS_SUPABASE) return apiClient.delete(`/api/v1/reviews/${id}`)
    const raw = await getRaw(id)
    if (raw.user_id !== userId) throw new Error('You can only delete your own review.')
    await apiClient.delete('/rest/v1/reviews', { params: { id: `eq.${id}`, user_id: `eq.${userId}` } })
    return { success: true }
  }
  async voteReview(id, value, userId = getUserIdentifier()) {
    if (![1, -1].includes(value)) throw new Error('Invalid reaction.')
    if (!IS_SUPABASE) throw new Error('Reactions require the configured Supabase backend.')
    const row = await changeContent(id, (raw) => {
      const { text, votes } = readReviewContent(raw.comment)
      if (votes[userId] === value) delete votes[userId]
      else votes[userId] = value
      return { comment: writeReviewContent(text, votes) }
    })
    return { success: true, data: normalizeReview(row, userId) }
  }
}
export default new ReviewService()

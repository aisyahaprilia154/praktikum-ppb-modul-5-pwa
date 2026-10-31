import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reviewService from '../services/reviewService'
import { getUserIdentifier } from '../services/userService'

export function useReviews(gunId) {
  const userId = getUserIdentifier()
  const query = useQuery({ queryKey: ['reviews', String(gunId), userId],
    queryFn: () => reviewService.getReviews(gunId, userId), enabled: Boolean(gunId) && !String(gunId).startsWith('local-') })
  return { reviews: query.data?.data || [], loading: query.isLoading, error: query.error?.message || null, refetch: query.refetch }
}
export function useReviewActions(gunId) {
  const client = useQueryClient()
  const mutation = useMutation({ mutationFn: ({ action, id, data, vote }) => {
    if (action === 'create') return reviewService.createReview(gunId, { ...data, user_identifier: getUserIdentifier() })
    if (action === 'update') return reviewService.updateReview(id, data)
    if (action === 'delete') return reviewService.deleteReview(id)
    return reviewService.voteReview(id, vote)
  }, onSuccess: () => client.invalidateQueries({ queryKey: ['reviews', String(gunId)] }) })
  return mutation
}
export function useCreateReview() {
  const client = useQueryClient()
  const mutation = useMutation({ mutationFn: ({ gunId, data }) => reviewService.createReview(gunId, data),
    onSuccess: () => client.invalidateQueries({ queryKey: ['reviews'] }) })
  return { createReview: async (gunId, data) => {
    try { return (await mutation.mutateAsync({ gunId, data })).data } catch { return null }
  }, loading: mutation.isPending, error: mutation.error?.message || null, success: mutation.isSuccess }
}

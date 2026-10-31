import { useQuery } from '@tanstack/react-query'
import gunService from '../services/gunService'
import GUNS_LOCAL from '../data/guns'

export function useGuns(params = {}) {
  const query = useQuery({ queryKey: ['guns', 'list', params], queryFn: () => gunService.getGuns(params) })
  return { guns: query.data?.data || [], pagination: query.data?.pagination || null,
    loading: query.isPending && query.fetchStatus !== 'paused', error: query.error?.message || (!query.data && query.fetchStatus === 'paused' ? 'Offline. Showing the local sample catalog.' : null),
    refetch: query.refetch, fetching: query.isFetching }
}
export function useGunById(id) {
  const query = useQuery({ queryKey: ['guns', 'detail', String(id)], enabled: Boolean(id), queryFn: () => {
    if (String(id).startsWith('local-')) {
      const gun = GUNS_LOCAL[Number(String(id).slice(6))]
      if (!gun) throw new Error('Product not found.')
      return { success: true, data: { ...gun, id } }
    }
    return gunService.getGunById(id)
  } })
  return { gun: query.data?.data || null, loading: query.isPending && query.fetchStatus !== 'paused',
    error: query.error?.message || (!query.data && query.fetchStatus === 'paused' ? 'Reconnect to load this product for the first time.' : null), refetch: query.refetch }
}
export function useArchivedGuns() {
  return useQuery({ queryKey: ['guns', 'archive'], queryFn: () => gunService.getArchivedGuns() })
}

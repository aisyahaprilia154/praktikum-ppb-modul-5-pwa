import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import favoriteService from '../services/favoriteService'
import { getUserIdentifier } from '../services/userService'
const KEY = 'bore_barrel_favorites'
const idOf = (favorite) => typeof favorite === 'object' && favorite !== null ? (favorite.product_id ?? favorite.id ?? favorite.recipe_id) : favorite
function readLocal() {
  try { const parsed = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}
function writeLocal(items) { try { localStorage.setItem(KEY, JSON.stringify(items.map(idOf))) } catch { /* unavailable */ } }
export function useFavorites() {
  const userId = getUserIdentifier()
  const query = useQuery({ queryKey: ['favorites', userId], networkMode: 'always', queryFn: async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Offline')
      const result = await favoriteService.getFavorites(userId)
      if (!result.success) throw new Error(result.message)
      const data = (result.data || []).filter((item) => !item.archived_at)
      writeLocal(data)
      return { favorites: data, isLocal: false }
    } catch { return { favorites: readLocal(), isLocal: true } }
  } })
  return { favorites: query.data?.favorites || [], loading: query.isLoading, error: query.error?.message || null,
    isLocal: query.data?.isLocal || false, refetch: query.refetch }
}
export function useToggleFavorite() {
  const client = useQueryClient(), userId = getUserIdentifier()
  const mutation = useMutation({ networkMode: 'always', mutationFn: async (gunId) => {
    try {
      if (String(gunId).startsWith('local-') || (typeof navigator !== 'undefined' && !navigator.onLine)) throw new Error('Local item')
      const response = await favoriteService.toggleFavorite({ recipe_id: gunId, user_identifier: userId })
      if (!response.success) throw new Error(response.message)
      return { ...response.data, local: false }
    } catch {
      const ids = readLocal(), exists = ids.some((id) => String(id) === String(gunId))
      writeLocal(exists ? ids.filter((id) => String(id) !== String(gunId)) : [...ids, gunId])
      return { is_favorited: !exists, local: true }
    }
  }, onSuccess: async (result, gunId) => {
    if (result.local) client.setQueryData(['favorites', userId], { favorites: readLocal(), isLocal: true })
    else {
      const ids = readLocal().filter((id) => String(id) !== String(gunId))
      writeLocal(result.is_favorited ? [...ids, gunId] : ids)
      await client.invalidateQueries({ queryKey: ['favorites', userId] })
    }
  } })
  return { toggleFavorite: mutation.mutateAsync, loading: mutation.isPending, error: mutation.error?.message || null }
}
export function useIsFavorited(gunId) {
  const { favorites, loading } = useFavorites(), toggle = useToggleFavorite()
  return { isFavorited: favorites.some((favorite) => String(idOf(favorite)) === String(gunId)), loading: loading || toggle.loading,
    toggleFavorite: () => toggle.toggleFavorite(gunId) }
}
export { getUserIdentifier }

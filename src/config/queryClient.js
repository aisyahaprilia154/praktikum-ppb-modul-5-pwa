import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

export const queryClient = new QueryClient({ defaultOptions: {
  queries: { staleTime: 120_000, gcTime: 86400_000, retry: 1, refetchOnWindowFocus: false, networkMode: 'offlineFirst' },
  mutations: { retry: false, networkMode: 'always' },
} })

const CACHE_KEY = 'bore_barrel_queries_v1'
if (typeof window !== 'undefined') {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (saved && Date.now() - saved.savedAt < 86400_000) hydrate(queryClient, saved.state)
  } catch { /* corrupt or unavailable storage: keep the in-memory cache */ }
  let timer
  queryClient.getQueryCache().subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), state: dehydrate(queryClient) })) }
      catch { /* quota exceeded: in-memory caching remains available */ }
    }, 150)
  })
}

export const invalidateProducts = () => Promise.all([
  queryClient.invalidateQueries({ queryKey: ['guns'] }),
  queryClient.invalidateQueries({ queryKey: ['favorites'] }),
])

import { apiClient, IS_SUPABASE } from '../config/api'
import { invalidateProducts } from '../config/queryClient'
import { readProductMetadata, writeProductMetadata } from '../utils/metadata'

export function normalizeProduct(item) {
  if (!item) return null
  const { metadata, visible } = readProductMetadata(item.specs)
  const ingredients = Array.isArray(item.specs) ? visible.map((spec, index) => {
    if (typeof spec !== 'string') return spec
    const colon = spec.indexOf(':')
    return { id: `spec-${index}`, name: colon < 0 ? 'Specification' : spec.slice(0, colon).trim(), quantity: colon < 0 ? spec : spec.slice(colon + 1).trim() }
  }) : item.ingredients || []
  return { ...item, name: item.name || 'Hardware Piece', type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware', caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0), description: item.description || '',
    image_url: item.image_url || item.image || '/guns/pistol.svg', image: item.image_url || item.image || '/guns/pistol.svg',
    ingredients, archived_at: metadata.archived_at || item.deleted_at || null,
    difficulty: metadata.difficulty || item.difficulty || 'mudah', is_featured: metadata.is_featured ?? item.is_featured ?? false,
    steps: metadata.steps || item.steps || [],
  }
}
async function rawProduct(id) {
  const rows = await apiClient.get('/rest/v1/products', { params: { id: `eq.${id}`, select: '*' } })
  if (!rows?.[0]) throw new Error('Product not found.')
  return rows[0]
}
async function changed(result) { await invalidateProducts(); return result }
class GunService {
  async getGuns(params = {}) {
    if (!IS_SUPABASE) return apiClient.get('/api/v1/recipes', { params })
    const query = { select: '*', order: 'created_at.desc' }
    if (params.search) query.name = `ilike.*${params.search}*`
    if (params.category && params.category !== 'All') query.type = `eq.${params.category}`
    if (['name', 'price', 'created_at'].includes(params.sort_by)) query.order = `${params.sort_by}.${params.order === 'desc' ? 'desc' : 'asc'}`
    const rows = await apiClient.get('/rest/v1/products', { params: query })
    const list = (rows || []).map(normalizeProduct).filter((item) => !item.archived_at)
    const limit = Math.max(1, Number(params.limit) || 50), page = Math.max(1, Number(params.page) || 1)
    return { success: true, data: list.slice((page - 1) * limit, page * limit), pagination: { total: list.length, page, limit } }
  }
  async getGunById(id, { includeArchived = false } = {}) {
    if (!IS_SUPABASE) return apiClient.get(`/api/v1/recipes/${id}`)
    const product = normalizeProduct(await rawProduct(id))
    if (product.archived_at && !includeArchived) throw new Error('This product is archived. Restore it from Profile > Archive.')
    return { success: true, data: product }
  }
  async createGun(data) {
    if (!IS_SUPABASE) return changed(await apiClient.post('/api/v1/recipes', data))
    const specs = data.ingredients?.map((item) => `${item.name}: ${item.quantity}`) || data.specs || []
    const payload = { name: data.name, type: data.type || 'Pistol', caliber: data.caliber || 'Standard',
      price: Number(data.price ?? data.cook_time ?? 0), description: data.description || '', image_url: data.image_url || null,
      specs: writeProductMetadata(specs, { steps: data.steps || [], difficulty: data.difficulty || 'mudah', is_featured: Boolean(data.is_featured), archived_at: null }) }
    const rows = await apiClient.post('/rest/v1/products', payload, { headers: { Prefer: 'return=representation' } })
    return changed({ success: true, data: normalizeProduct(rows[0]) })
  }
  async updateGun(id, data) {
    if (!IS_SUPABASE) return changed(await apiClient.put(`/api/v1/recipes/${id}`, data))
    const existing = await rawProduct(id), payload = { updated_at: new Date().toISOString() }
    for (const key of ['name', 'type', 'caliber', 'description', 'image_url']) if (data[key] !== undefined) payload[key] = data[key]
    if (data.price !== undefined || data.cook_time !== undefined) payload.price = Number(data.price ?? data.cook_time)
    const metadata = { ...readProductMetadata(existing.specs).metadata }
    const visible = data.ingredients?.map((item) => `${item.name}: ${item.quantity}`) || data.specs || existing.specs || []
    for (const key of ['steps', 'difficulty', 'is_featured']) if (data[key] !== undefined) metadata[key] = data[key]
    payload.specs = writeProductMetadata(visible, metadata)
    const rows = await apiClient.patch('/rest/v1/products', payload, { params: { id: `eq.${id}` }, headers: { Prefer: 'return=representation' } })
    if (!rows[0]) throw new Error('Product could not be updated.')
    return changed({ success: true, data: normalizeProduct(rows[0]) })
  }
  patchGun(id, data) { return this.updateGun(id, data) }
  async getArchivedGuns() {
    if (!IS_SUPABASE) throw new Error('Archive requires the configured Supabase backend.')
    const rows = await apiClient.get('/rest/v1/products', { params: { select: '*', order: 'updated_at.desc' } })
    return { success: true, data: rows.map(normalizeProduct).filter((item) => item.archived_at) }
  }
  async setArchived(id, archived) {
    if (!IS_SUPABASE || String(id).startsWith('local-')) throw new Error('Only server records can be archived.')
    const existing = await rawProduct(id)
    const rows = await apiClient.patch('/rest/v1/products', {
      specs: writeProductMetadata(existing.specs, { archived_at: archived ? new Date().toISOString() : null }), updated_at: new Date().toISOString(),
    }, { params: { id: `eq.${id}` }, headers: { Prefer: 'return=representation' } })
    if (!rows[0]) throw new Error('Archive change could not be saved.')
    return changed({ success: true, data: normalizeProduct(rows[0]) })
  }
  // Product removal always moves to the reversible archive.
  deleteGun(id) { return this.setArchived(id, true) }
  restoreGun(id) { return this.setArchived(id, false) }
}
export default new GunService()

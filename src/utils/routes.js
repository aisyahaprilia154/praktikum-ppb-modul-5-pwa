export function productLink(id, origin = window.location.origin) {
  return `${origin}/#/gun/${encodeURIComponent(id)}`
}
export function readRoute(hash = '') {
  const [path, search = ''] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/')
  try { return { page: parts[0] || 'catalog', id: decodeURIComponent(parts[1] || ''), resume: new URLSearchParams(search).get('resume') === '1' } }
  catch { return { page: 'catalog', id: '', resume: false } }
}
export function navigate(path) { window.location.hash = `#/${path}` }

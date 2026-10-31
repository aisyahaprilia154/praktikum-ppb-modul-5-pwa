// Versioned metadata uses existing text fields in the teaching database.
// No privileged schema migration is needed; old records remain readable.
const PRODUCT_PREFIX = '__pwa_meta_v1__:'
const REVIEW_PREFIX = '__pwa_review_v1__:'

export function readProductMetadata(specs = []) {
  const metadata = {}, visible = []
  for (const value of specs || []) {
    if (typeof value === 'string' && value.startsWith(PRODUCT_PREFIX)) {
      try { Object.assign(metadata, JSON.parse(value.slice(PRODUCT_PREFIX.length))) }
      catch { visible.push(value) }
    } else visible.push(value)
  }
  return { metadata, visible }
}
export function writeProductMetadata(specs = [], patch = {}) {
  const { metadata, visible } = readProductMetadata(specs)
  return [...visible, PRODUCT_PREFIX + JSON.stringify({ ...metadata, ...patch })]
}
export function readReviewContent(comment) {
  if (typeof comment === 'string' && comment.startsWith(REVIEW_PREFIX)) {
    try {
      const parsed = JSON.parse(comment.slice(REVIEW_PREFIX.length))
      if (typeof parsed.text === 'string') return { text: parsed.text, votes: parsed.votes || {} }
    } catch { /* retain legacy review text */ }
  }
  return { text: comment || '', votes: {} }
}
export function writeReviewContent(text, votes = {}) {
  return REVIEW_PREFIX + JSON.stringify({ text, votes })
}

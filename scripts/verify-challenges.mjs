import assert from 'node:assert/strict'
import { createServer } from 'vite'

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key),
  get length() { return values.size }, key: (index) => [...values.keys()][index] ?? null,
}
const userId = crypto.randomUUID(), otherUser = crypto.randomUUID()
localStorage.setItem('bore_barrel_user_id', userId)
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let productId, reviewId
const checks = []
async function check(name, run) {
  try { await run(); checks.push({ name, pass: true }); console.log(`PASS ${name}`) }
  catch (error) { checks.push({ name, pass: false }); console.error(`FAIL ${name}: ${error.message}`) }
}
try {
  const { default: products } = await server.ssrLoadModule('/src/services/gunService.js')
  const { default: reviews } = await server.ssrLoadModule('/src/services/reviewService.js')
  const { apiClient } = await server.ssrLoadModule('/src/config/api.js')
  const { queryClient } = await server.ssrLoadModule('/src/config/queryClient.js')
  const { productLink, readRoute } = await server.ssrLoadModule('/src/utils/routes.js')
  const drafts = await server.ssrLoadModule('/src/utils/draftStorage.js')
  await check('1 Unique share links round-trip product IDs', async () => {
    const link = productLink('sample id', 'https://example.test')
    assert.equal(readRoute(new URL(link).hash).id, 'sample id')
    assert.equal(readRoute(new URL(link).hash).page, 'gun')
  })
  await check('Create isolated verification record with persistent form metadata', async () => {
    const result = await products.createGun({ name: `Challenge verification ${Date.now()}`, type: 'Shotgun', caliber: 'Sample', price: 123,
      ingredients: [{ name: 'Record', quantity: 'Test only' }], steps: ['Sample teaching note'], difficulty: 'sedang', image_url: '/guns/shotgun.svg' })
    productId = result.data.id
    const loaded = (await products.getGunById(productId)).data
    assert.deepEqual(loaded.steps, ['Sample teaching note'])
    assert.equal(loaded.ingredients.length, 1)
    assert.equal(loaded.difficulty, 'sedang')
  })
  await check('3 Query cache deduplicates reads and invalidates after mutation', async () => {
    let calls = 0
    const options = { queryKey: ['guns', 'verification', productId], queryFn: async () => { calls++; return products.getGunById(productId) } }
    await Promise.all([queryClient.fetchQuery(options), queryClient.fetchQuery(options)])
    await queryClient.fetchQuery(options)
    assert.equal(calls, 1)
    await products.updateGun(productId, { price: 234 })
    assert.equal(queryClient.getQueryState(options.queryKey).isInvalidated, true)
    assert.equal((await queryClient.fetchQuery(options)).data.price, 234)
    assert.equal(calls, 2)
  })
  await check('5 All drafts are listed, isolated, restored, and removable', async () => {
    drafts.saveDraft({ formData: { name: 'New draft' } }, 'create')
    drafts.saveDraft({ formData: { name: 'Edit draft' } }, String(productId))
    assert.deepEqual(drafts.getAllDraftIds().sort(), ['create', String(productId)].sort())
    assert.equal(drafts.loadDraft(String(productId)).formData.name, 'Edit draft')
    drafts.deleteDraft('create')
    assert.equal(drafts.getAllDraftIds().length, 1)
    drafts.clearAllDrafts()
    assert.equal(drafts.getAllDraftIds().length, 0)
  })
  await check('6 Soft delete keeps database record and restore returns it to catalog', async () => {
    await products.deleteGun(productId)
    assert.ok((await apiClient.get('/rest/v1/products', { params: { id: `eq.${productId}`, select: 'id' } })).length)
    assert.ok(!(await products.getGuns({ limit: 1000 })).data.some((item) => item.id === productId))
    assert.ok((await products.getArchivedGuns()).data.some((item) => item.id === productId))
    await assert.rejects(products.getGunById(productId), /archived/)
    await products.restoreGun(productId)
    assert.ok((await products.getGuns({ limit: 1000 })).data.some((item) => item.id === productId))
    assert.ok(!(await products.getArchivedGuns()).data.some((item) => item.id === productId))
  })
  await check('7 Review create/read/update and ownership checks', async () => {
    const result = await reviews.createReview(productId, { rating: 4, comment: 'Verification review', user_identifier: userId })
    reviewId = result.data.id
    assert.equal((await reviews.getReviews(productId, userId)).data[0].comment, 'Verification review')
    await assert.rejects(reviews.updateReview(reviewId, { rating: 2, comment: 'Not mine' }, otherUser), /own review/)
    await assert.rejects(reviews.deleteReview(reviewId, otherUser), /own review/)
    await reviews.updateReview(reviewId, { rating: 5, comment: 'Updated review' }, userId)
    assert.equal((await reviews.getReviews(productId, userId)).data[0].rating, 5)
  })
  await check('7 Reactions persist, switch, toggle off, and survive review edits', async () => {
    let result = await reviews.voteReview(reviewId, 1, otherUser)
    assert.equal(result.data.likes, 1)
    result = await reviews.voteReview(reviewId, -1, otherUser)
    assert.equal(result.data.likes, 0); assert.equal(result.data.dislikes, 1)
    await reviews.updateReview(reviewId, { rating: 3, comment: 'Text edit preserves vote' }, userId)
    const loaded = (await reviews.getReviews(productId, otherUser)).data[0]
    assert.equal(loaded.dislikes, 1); assert.equal(loaded.my_vote, -1)
    result = await reviews.voteReview(reviewId, -1, otherUser)
    assert.equal(result.data.dislikes, 0)
    assert.equal(result.data.comment, 'Text edit preserves vote')
    await Promise.all([reviews.voteReview(reviewId, 1, otherUser), reviews.voteReview(reviewId, 1, userId)])
    assert.equal((await reviews.getReviews(productId, userId)).data[0].likes, 2)
  })
  await check('7 Review delete removes only the test author record', async () => {
    await reviews.deleteReview(reviewId, userId)
    assert.ok(!(await reviews.getReviews(productId, userId)).data.some((item) => item.id === reviewId))
    reviewId = undefined
  })
  await check('8 Edited profile persists without changing identifier', async () => {
    const users = await server.ssrLoadModule('/src/services/userService.js')
    users.saveUserProfile({ username: 'Verification user', bio: 'Sample bio' })
    assert.equal(users.getUserProfile().bio, 'Sample bio')
    assert.equal(users.getUserProfile().userId, userId)
  })
  await check('9 Merchandise cart persists quantities and encodes WhatsApp message', async () => {
    globalThis.window = new EventTarget()
    const cart = await server.ssrLoadModule('/src/utils/cartStorage.js')
    cart.setCartQuantity('merch-notebook', 2)
    const items = cart.parseCart(cart.cartSnapshot())
    assert.equal(items[0].quantity, 2)
    const url = new URL(cart.checkoutLink(items))
    assert.equal(url.hostname, 'wa.me')
    assert.match(url.searchParams.get('text'), /Hi aku mau pesan/)
    assert.match(url.searchParams.get('text'), /Notebook x2/)
    assert.throws(() => cart.setCartQuantity(String(productId), 1), /merchandise only/)
    assert.throws(() => cart.checkoutLink([{ id: 'unknown', quantity: 1 }]))
    cart.setCartQuantity('merch-notebook', 0)
    assert.equal(cart.parseCart(cart.cartSnapshot()).length, 0)
    delete globalThis.window
  })
} finally {
  const { apiClient } = await server.ssrLoadModule('/src/config/api.js')
  if (reviewId) await apiClient.delete('/rest/v1/reviews', { params: { id: `eq.${reviewId}`, user_id: `eq.${userId}` } })
  if (productId) {
    await apiClient.delete('/rest/v1/products', { params: { id: `eq.${productId}` } })
    assert.equal((await apiClient.get('/rest/v1/products', { params: { id: `eq.${productId}`, select: 'id' } })).length, 0)
    console.log('PASS Isolated test data cleaned up')
  }
  const { queryClient } = await server.ssrLoadModule('/src/config/queryClient.js')
  queryClient.clear()
  await server.close()
}
console.log(`${checks.filter((item) => item.pass).length}/${checks.length} checks passed`)
if (checks.some((item) => !item.pass)) process.exitCode = 1

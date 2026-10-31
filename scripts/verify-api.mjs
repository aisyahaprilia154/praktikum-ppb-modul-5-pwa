import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Uses only a newly created test product; existing catalog records are untouched.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const results = []
let productId
let reviewId
const userId = crypto.randomUUID()
const check = async (name, run) => {
  try { await run(); results.push({ name, passed: true }); console.log(`PASS ${name}`) }
  catch (error) { results.push({ name, passed: false, error: error.message }); console.error(`FAIL ${name}: ${error.message}`) }
}

try {
  const { default: guns } = await server.ssrLoadModule('/src/services/gunService.js')
  const { default: reviews } = await server.ssrLoadModule('/src/services/reviewService.js')
  const { default: favorites } = await server.ssrLoadModule('/src/services/favoriteService.js')
  await check('Read catalog', async () => {
    const result = await guns.getGuns({ limit: 5 })
    assert.equal(result.success, true)
    assert.ok(Array.isArray(result.data))
  })
  await check('Create test product', async () => {
    const result = await guns.createGun({
      name: `PWA verification ${Date.now()}`, type: 'Shotgun', caliber: '12 Gauge',
      price: 123, description: 'Temporary application verification record',
      image_url: '/guns/shotgun.svg', ingredients: [{ name: 'Test', quantity: 'Sample' }],
    })
    productId = result.data?.id
    assert.ok(productId)
    assert.equal(result.data.type, 'Shotgun')
    assert.equal(result.data.price, 123)
  })
  if (productId) {
    await check('Read and update test product', async () => {
      const original = await guns.getGunById(productId)
      assert.equal(original.data.id, productId)
      await guns.updateGun(productId, { price: 234, caliber: 'Test caliber' })
      const updated = await guns.getGunById(productId)
      assert.equal(updated.data.price, 234)
      assert.equal(updated.data.caliber, 'Test caliber')
    })
    await check('Create and read review', async () => {
      const result = await reviews.createReview(productId, {
        user_identifier: userId, rating: 4, comment: 'Temporary verification review',
      })
      reviewId = result.data?.id
      assert.ok(reviewId)
      const list = await reviews.getReviews(productId)
      assert.ok(list.data.some((review) => review.id === reviewId))
    })
    if (reviewId) await check('Update and delete review', async () => {
      await reviews.updateReview(reviewId, { rating: 5, comment: 'Verification updated' }, userId)
      assert.equal((await reviews.getReviews(productId)).data.find((r) => r.id === reviewId).rating, 5)
      await reviews.deleteReview(reviewId, userId)
      assert.ok(!(await reviews.getReviews(productId)).data.some((r) => r.id === reviewId))
      reviewId = undefined
    })
    await check('Add, read, and remove favorite', async () => {
      assert.equal((await favorites.toggleFavorite({ recipe_id: productId, user_identifier: userId })).data.is_favorited, true)
      assert.ok((await favorites.getFavorites(userId)).data.some((item) => item.id === productId))
      assert.equal((await favorites.toggleFavorite({ recipe_id: productId, user_identifier: userId })).data.is_favorited, false)
      assert.equal((await favorites.getFavorites(userId)).data.length, 0)
    })
  }
  const storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  }
  const drafts = await server.ssrLoadModule('/src/utils/draftStorage.js')
  await check('Draft save, restore, and delete', async () => {
    assert.equal(drafts.saveDraft({ name: 'Draft test' }, 'verification'), true)
    assert.equal(drafts.loadDraft('verification').name, 'Draft test')
    assert.ok(drafts.getDraftTimestamp('verification'))
    drafts.deleteDraft('verification')
    assert.equal(drafts.hasDraft('verification'), false)
  })
  const users = await server.ssrLoadModule('/src/services/userService.js')
  await check('Profile persistence', async () => {
    const first = users.getUserIdentifier()
    assert.equal(users.getUserIdentifier(), first)
    users.saveUserProfile({ username: 'Verification', bio: 'Sample profile' })
    assert.equal(users.getUserProfile().username, 'Verification')
    assert.equal(users.getUserProfile().userId, first)
  })
  const { default: uploads } = await server.ssrLoadModule('/src/services/uploadService.js')
  await check('Image upload validation', async () => {
    await assert.rejects(uploads.uploadImage(new File(['sample'], 'sample.txt', { type: 'text/plain' })))
    await assert.rejects(uploads.uploadImage(new File([new Uint8Array(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })))
  })
  await check('Image upload or persistent fallback', async () => {
    globalThis.FileReader = class {
      readAsDataURL(file) {
        file.arrayBuffer().then((data) => {
          this.result = `data:${file.type};base64,${Buffer.from(data).toString('base64')}`
          this.onload?.()
        }).catch((error) => this.onerror?.(error))
      }
    }
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG1EAAAAASUVORK5CYII=', 'base64')
    const result = await uploads.uploadImage(new File([png], `verification-${Date.now()}.png`, { type: 'image/png' }))
    assert.equal(result.success, true)
    assert.ok(result.data.url.startsWith('https://') || result.data.url.startsWith('data:image/png;base64,'))
    if (result.data.url.startsWith('https://')) {
      const { apiClient } = await server.ssrLoadModule('/src/config/api.js')
      await apiClient.delete('/storage/v1/object/guns', { data: { prefixes: [result.data.filename] } })
    }
  })
} finally {
  if (productId) {
    const { apiClient } = await server.ssrLoadModule('/src/config/api.js')
    if (reviewId) await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
    await apiClient.delete(`/rest/v1/favorites?product_id=eq.${productId}&user_id=eq.${userId}`)
    await apiClient.delete(`/rest/v1/products?id=eq.${productId}`)
    assert.equal((await apiClient.get(`/rest/v1/products?id=eq.${productId}&select=id`)).length, 0)
    console.log('PASS Test data cleanup')
  }
  await server.close()
}
if (results.some((result) => !result.passed)) process.exitCode = 1

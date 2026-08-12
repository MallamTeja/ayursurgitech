import { Router } from 'express'
import multer from 'multer'
import { categories, orders, products, reviews, settings, getSettings } from '../lib/store.js'
import { recomputeProductRating } from '../lib/rating.js'
import { requireAdmin } from '../lib/auth.js'
import { uploadImage } from '../lib/storage.js'

const router = Router()

export const ORDER_STATUSES = ['paymentPending', 'placed', 'shipped', 'delivered', 'cancelled']

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const byOrder = (a, b) => a.order - b.order || cmp(a.name, b.name)
const newestFirst = (a, b) => cmp(new Date(b.createdAt), new Date(a.createdAt))

// 4 MB, not a round 8: Vercel rejects any request body over 4.5 MB before this code runs,
// so a larger cap here just moves the failure into production as an opaque platform error.
// The cap also stops an unbounded buffer OOMing the function. app.js states it in the 400.
export const UPLOAD_LIMIT_MB = 4
// memoryStorage: the buffer goes straight to lib/storage.js, nothing hits disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMIT_MB * 1024 * 1024 },
})

// POST /login is gone with the ops-desk sign-in — nothing mints a token any more.
// requireAdmin is now a pass-through (lib/auth.js); it stays mounted so restoring the gate
// is an edit to that one function and not a re-wiring of this file.
router.use(requireAdmin)

// ---------- categories ----------

// The panel's category list shows how many products sit in each category and subcategory.
// Counted by categoryId as well as by subcategoryId, so the number shown here agrees with
// the count in the 409 from DELETE below. This was two $group pipelines; over an array it
// is one filter.
router.get('/categories', async (_req, res) => {
  const [tree, all] = await Promise.all([categories.find(), products.find()])
  const count = (key, id) => all.filter((p) => p[key] === id).length

  res.json(
    tree.sort(byOrder).map((c) => ({
      ...c,
      productCount: count('categoryId', c._id),
      subcategories: c.subcategories.map((s) => ({ ...s, productCount: count('subcategoryId', s._id) })),
    })),
  )
})

router.post('/categories', async (req, res) => {
  res.status(201).json(await categories.insert(req.body))
})

router.put('/categories/:id', async (req, res) => {
  const category = await categories.findById(req.params.id)
  if (!category) return res.status(404).json({ error: 'Category not found' })

  // A PUT carries the whole subcategories array — that is how subcategories are edited.
  // Anything dropped from it must not orphan products.
  if (Array.isArray(req.body.subcategories)) {
    const kept = new Set(req.body.subcategories.map((s) => s._id).filter(Boolean))
    const dropped = category.subcategories.filter((s) => !kept.has(s._id)).map((s) => s._id)
    if (dropped.length) {
      const count = (await products.find((p) => dropped.includes(p.subcategoryId))).length
      if (count)
        return res.status(409).json({
          error: `Cannot remove that subcategory — ${count} product${count === 1 ? '' : 's'} still ${
            count === 1 ? 'uses' : 'use'
          } it. Move them first.`,
        })
    }
  }

  // the panel PUTs back the whole document; _id is not patchable, the store drops it
  res.json(await categories.updateById(category._id, req.body))
})

router.delete('/categories/:id', async (req, res) => {
  const category = await categories.findById(req.params.id)
  if (!category) return res.status(404).json({ error: 'Category not found' })

  const count = (await products.find({ categoryId: category._id })).length
  if (count)
    return res.status(409).json({
      error: `Cannot delete "${category.name}" — ${count} product${count === 1 ? '' : 's'} still in it. Move or delete them first.`,
    })

  await categories.deleteById(category._id)
  res.json({ ok: true })
})

// ---------- products ----------

router.get('/products', async (req, res) => {
  const q = req.query.q?.trim().toLowerCase()
  const [found, tree] = await Promise.all([
    products.find((p) => !q || p.name.toLowerCase().includes(q)),
    categories.find(), // six documents; cheaper than a join and easier to read
  ])
  // the table shows names, not ids — the ids stay on the payload for the edit form
  const catName = new Map(tree.map((c) => [c._id, c.name]))
  const subName = new Map(tree.flatMap((c) => c.subcategories.map((s) => [s._id, s.name])))

  res.json(
    found.sort(newestFirst).map((p) => ({
      ...p,
      categoryName: catName.get(p.categoryId) ?? null,
      subcategoryName: subName.get(p.subcategoryId) ?? null,
    })),
  )
})

router.post('/products', async (req, res) => {
  res.status(201).json(await products.insert(req.body))
})

router.put('/products/:id', async (req, res) => {
  const product = await products.updateById(req.params.id, req.body)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

router.delete('/products/:id', async (req, res) => {
  const product = await products.deleteById(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  await reviews.deleteMany((r) => r.productId === product._id)
  res.json({ ok: true })
})

// ---------- uploads ----------

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file was uploaded' })
  res.json(await uploadImage(req.file.buffer, req.file.originalname))
})

// ---------- reviews ----------

router.get('/reviews', async (req, res) => {
  const status = req.query.status || 'pending'
  const queue = (await reviews.find((r) => status === 'all' || r.status === status)).sort(newestFirst)

  // the moderation queue has to say which product a review is about, and link to it
  const byId = new Map((await products.find()).map((p) => [p._id, p]))

  res.json(
    queue.map((r) => ({
      ...r,
      productName: byId.get(r.productId)?.name ?? null,
      productSlug: byId.get(r.productId)?.slug ?? null,
    })),
  )
})

router.put('/reviews/:id', async (req, res) => {
  const { status } = req.body ?? {}
  if (!['pending', 'approved'].includes(status))
    return res.status(400).json({ error: "Status must be 'approved' or 'pending'" })

  const review = await reviews.updateById(req.params.id, { status })
  if (!review) return res.status(404).json({ error: 'Review not found' })
  await recomputeProductRating(review.productId)
  res.json(review)
})

router.delete('/reviews/:id', async (req, res) => {
  const review = await reviews.deleteById(req.params.id)
  if (!review) return res.status(404).json({ error: 'Review not found' })
  await recomputeProductRating(review.productId)
  res.json({ ok: true })
})

// ---------- orders ----------

router.get('/orders', async (req, res) => {
  const { status } = req.query
  res.json((await orders.find((o) => !status || o.status === status)).sort(newestFirst))
})

router.put('/orders/:id', async (req, res) => {
  const { status } = req.body ?? {}
  if (!ORDER_STATUSES.includes(status))
    return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` })

  const order = await orders.updateById(req.params.id, { status })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

// ---------- settings & stats ----------

router.put('/settings', async (req, res) => {
  const deliveryFee = Number(req.body?.deliveryFee)
  if (!Number.isInteger(deliveryFee) || deliveryFee < 0)
    return res.status(400).json({ error: 'Delivery fee must be a whole number of paise' })

  const current = await getSettings() // creates it if this is a fresh store
  res.json(await settings.updateById(current._id, { deliveryFee }))
})

// One screen, one request. This was five counts and a $group; it is now one pass each.
router.get('/stats', async (_req, res) => {
  const [allOrders, allProducts, allReviews] = await Promise.all([orders.find(), products.find(), reviews.find()])

  res.json({
    orderCount: allOrders.length,
    pendingOrders: allOrders.filter((o) => o.status === 'paymentPending' || o.status === 'placed').length,
    productCount: allProducts.length,
    outOfStockCount: allProducts.filter((p) => p.stockQty <= 0).length,
    pendingReviews: allReviews.filter((r) => r.status === 'pending').length,
    // revenue excludes cancelled orders; payment-pending ones still count, since payment
    // is stubbed and every real order in this demo starts there.
    revenuePaise: allOrders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.grandTotal, 0),
  })
})

export default router

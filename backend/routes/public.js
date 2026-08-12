import { Router } from 'express'
import { categories, products, reviews, getSettings } from '../lib/store.js'

const router = Router()

// Binary comparison, the same ordering Mongo's default collation gave.
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const byOrder = (a, b) => a.order - b.order || cmp(a.name, b.name)
const newestFirst = (a, b) => cmp(new Date(b.createdAt), new Date(a.createdAt))

// Sort keys are normalised to letters only, so price-asc / price_asc / priceAsc all land.
const SORTS = {
  newest: newestFirst,
  priceasc: (a, b) => a.price - b.price,
  pricedesc: (a, b) => b.price - a.price,
  nameasc: (a, b) => cmp(a.name, b.name),
  namedesc: (a, b) => cmp(b.name, a.name),
  rating: (a, b) => b.ratingAvg - a.ratingAvg,
}

router.get('/categories', async (_req, res) => {
  res.json((await categories.find()).sort(byOrder))
})

router.get('/products', async (req, res) => {
  const { category, subcategory, q, sort } = req.query
  const filters = []

  if (category || subcategory) {
    const cat = await categories.findOne(
      category ? { slug: category } : (c) => c.subcategories.some((s) => s.slug === subcategory),
    )
    const sub = subcategory && cat?.subcategories.find((s) => s.slug === subcategory)
    if (!cat || (subcategory && !sub)) return res.json({ items: [], total: 0 })
    filters.push((p) => p.categoryId === cat._id)
    if (sub) filters.push((p) => p.subcategoryId === sub._id)
  }
  // ponytail: substring scan, no text index. Fine for a catalogue this size; add a real
  // index on name + description when the catalogue outgrows a full scan.
  if (q?.trim()) {
    const needle = q.trim().toLowerCase()
    filters.push((p) => p.name.toLowerCase().includes(needle))
  }

  const found = await products.find((p) => filters.every((f) => f(p)))
  found.sort(SORTS[String(sort ?? '').toLowerCase().replace(/[^a-z]/g, '')] ?? SORTS.newest)

  // Cards need neither the description nor the rest of the gallery.
  const items = found.map(({ description, ...p }) => ({ ...p, images: (p.images ?? []).slice(0, 1) }))
  res.json({ items, total: items.length })
})

router.get('/products/:slug', async (req, res) => {
  const product = await products.findOne({ slug: req.params.slug })
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const [approved, cat] = await Promise.all([
    reviews.find((r) => r.productId === product._id && r.status === 'approved'),
    categories.findById(product.categoryId),
  ])
  const sub = cat?.subcategories.find((s) => s._id === product.subcategoryId)

  res.json({
    product,
    // The bearer token IS the user's _id (see lib/auth.js), so `userId` on a public page
    // is a live session credential. Stripped here, not merely unused by the frontend.
    reviews: approved.sort(newestFirst).map(({ userId, ...r }) => r),
    category: cat && { _id: cat._id, name: cat.name, slug: cat.slug },
    subcategory: sub && { _id: sub._id, name: sub.name, slug: sub.slug },
  })
})

router.get('/settings', async (_req, res) => {
  const { deliveryFee } = await getSettings()
  res.json({ deliveryFee })
})

export default router

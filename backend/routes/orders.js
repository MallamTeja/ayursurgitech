import { Router } from 'express'
import { orders, products, getSettings } from '../lib/store.js'
import { computeOrderTotals } from '../lib/pricing.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

// Steps 2, 3 and 4 of SPEC.md's POST /orders, shared verbatim with POST /quote so the
// figures on the checkout screen cannot drift from the figures on the created order.
// Reads only — no writes, no stock changes. Returns the priced lines plus one problem
// per offending item; the caller decides whether a problem is fatal.
async function priceCart(items) {
  // reload every product from the store. Whatever prices the client sent are ignored.
  const byId = new Map((await products.find()).map((p) => [p._id, p]))

  const problems = []
  const lines = []
  for (const line of items) {
    const productId = String(line.productId)
    const p = byId.get(productId)
    const qty = Number(line.qty)
    const problem = (message) => problems.push({ productId, message })

    // per-item limits. The client shows these messages verbatim.
    if (!p) {
      problem('This item is no longer available and was removed from the catalogue')
      continue // nothing to price
    }
    if (!Number.isInteger(qty) || qty < 1) {
      problem(`${p.name}: quantity must be a whole number`)
      continue // an unusable qty cannot be priced either
    }
    if (qty < p.minOrderQty) problem(`${p.name}: minimum order is ${p.minOrderQty} pieces`)
    else if (p.stockQty <= 0) problem(`${p.name} is out of stock`)
    else if (qty > p.stockQty) problem(`${p.name}: only ${p.stockQty} left in stock`)

    // priced even when it carries a problem, so checkout can show a total next to the fix
    lines.push({
      productId: p._id,
      name: p.name,
      image: p.images?.[0],
      unitPrice: p.price,
      qty,
      gstRate: p.gstRate,
      hsnCode: p.hsnCode,
    })
  }

  // every figure from stored prices, via the one pricing function
  const { deliveryFee } = await getSettings()
  return { totals: computeOrderTotals(lines, deliveryFee), problems }
}

// Public and side-effect free: the checkout screen sends the localStorage cart and renders
// exactly what comes back, so it never does money maths against stale cached prices.
router.post('/quote', async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [] // addressId is ignored
  const { totals, problems } = await priceCart(items)
  res.json({ ...totals, problems })
})

router.post('/orders', requireUser, async (req, res) => {
  const { addressId, items } = req.body ?? {}
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Your cart is empty' })

  // 1. the address must belong to this user
  const address = addressId && req.user.addresses.find((a) => a._id === String(addressId))
  if (!address) return res.status(400).json({ error: 'Choose a delivery address saved on your account' })

  // 2, 3 & 4. same code path as the quote the user was just shown
  const { totals, problems } = await priceCart(items)
  if (problems.length) return res.status(400).json({ error: problems[0].message, problems })

  // ponytail: steps 5 and 6 are not atomic. Two people buying the last unit at the same
  // instant can both succeed. Upgrade path: Mongo, with a session and
  // findOneAndUpdate({ _id, stockQty: { $gte: qty } }, { $inc: { stockQty: -qty } }),
  // which is the fix when concurrent traffic is real.

  // 5. decrement stock — sequentially, because each write rewrites the whole store
  for (const item of totals.items) {
    const p = await products.findById(item.productId)
    await products.updateById(item.productId, { stockQty: p.stockQty - item.qty })
  }

  // 6 & 7. snapshot everything into the order — prices and the whole address
  const order = await orders.insert({
    userId: req.user._id,
    userName: req.user.name,
    userPhone: req.user.phone,
    address: {
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
    },
    ...totals,
    status: 'paymentPending', // payments are stubbed
  })
  res.status(201).json(order)
})

router.get('/orders', requireUser, async (req, res) => {
  res.json((await orders.find({ userId: req.user._id })).sort(newestFirst))
})

router.get('/orders/:id', requireUser, async (req, res) => {
  const order = await orders.findById(req.params.id)
  if (!order || order.userId !== req.user._id) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

export default router

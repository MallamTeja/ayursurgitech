import { Router } from 'express'
import { products, reviews, users } from '../lib/store.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

const ADDRESS_REQUIRED = 'Address line 1, city, state, pincode and phone are all required'

// Create and update take the same seven fields and enforce the same five, so they read them
// the same way. Returns null when a required one is missing.
function readAddress(body) {
  const { label, line1, line2, city, state, pincode, phone } = body ?? {}
  if (!line1 || !city || !state || !pincode || !phone) return null
  return { label, line1, line2, city, state, pincode, phone }
}

router.post('/users/me/addresses', requireUser, async (req, res) => {
  const address = readAddress(req.body)
  if (!address) return res.status(400).json({ error: ADDRESS_REQUIRED })

  // the store assigns the new address its _id, the same way the subdocument schema did
  const updated = await users.updateById(req.user._id, {
    addresses: [...req.user.addresses, address],
  })
  res.status(201).json({ addresses: updated.addresses })
})

router.put('/users/me/addresses/:addressId', requireUser, async (req, res) => {
  const address = readAddress(req.body)
  if (!address) return res.status(400).json({ error: ADDRESS_REQUIRED })
  if (!req.user.addresses.some((a) => a._id === req.params.addressId))
    return res.status(404).json({ error: 'That address is not on your account' })

  // The _id is carried over deliberately. Checkout holds the chosen addressId in component
  // state, and re-keying the address under it would leave a checkout mid-flight pointing at
  // an address that no longer exists. Placed orders are unaffected either way — they snapshot
  // the whole address at the time they were created.
  const addresses = req.user.addresses.map((a) =>
    a._id === req.params.addressId ? { ...a, ...address } : a,
  )
  const updated = await users.updateById(req.user._id, { addresses })
  res.json({ addresses: updated.addresses })
})

router.delete('/users/me/addresses/:addressId', requireUser, async (req, res) => {
  const addresses = req.user.addresses.filter((a) => a._id !== req.params.addressId)
  if (addresses.length === req.user.addresses.length)
    return res.status(404).json({ error: 'That address is not on your account' })

  const updated = await users.updateById(req.user._id, { addresses })
  res.json({ addresses: updated.addresses })
})

router.post('/products/:id/reviews', requireUser, async (req, res) => {
  const { rating, text } = req.body ?? {}
  if (!rating || !text?.trim()) return res.status(400).json({ error: 'A rating and some text are both required' })

  const product = await products.findById(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (await reviews.findOne({ productId: product._id, userId: req.user._id }))
    return res.status(409).json({ error: 'You have already reviewed this product' })

  const review = await reviews.insert({
    productId: product._id,
    userId: req.user._id,
    userName: req.user.name,
    rating: Number(rating),
    text: text.trim(),
    status: 'pending', // an admin approves before it is public
  })
  res.status(201).json(review)
})

export default router

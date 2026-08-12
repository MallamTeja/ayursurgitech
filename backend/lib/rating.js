import { products, reviews } from './store.js'

// Approved reviews only. Called on approve and on delete, in the same request.
// This was a $group aggregation; over an array it is three lines.
export async function recomputeProductRating(productId) {
  const rated = await reviews.find((r) => r.productId === String(productId) && r.status === 'approved')
  const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
  await products.updateById(productId, {
    ratingAvg: rated.length ? Math.round(avg * 10) / 10 : 0,
    ratingCount: rated.length,
  })
}

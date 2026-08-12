// Vercel serverless entry. vercel.json rewrites every path here.
// No connect step any more: lib/store.js loads itself on first use and caches on
// globalThis, so a warm invocation reuses the store the same way it reused the pool.
import app from '../app.js'

export default app

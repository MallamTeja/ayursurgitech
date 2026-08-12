import express from 'express'
import cors from 'cors'
import publicRoutes from './routes/public.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import orderRoutes from './routes/orders.js'
import adminRoutes, { UPLOAD_LIMIT_MB } from './routes/admin.js'
import { UPLOADS_DIR } from './lib/storage.js'

const app = express()

// Vite takes the next free port when 5173 is busy, so pinning one origin here means every
// fetch fails the moment that happens — and it surfaces as a generic network error, not as a
// CORS message, so it reads as "the backend is down" while the backend is running fine. Dev
// therefore allows any localhost port and the dev server can land wherever it likes;
// production allows exactly FRONTEND_URL. Auth is a bearer header rather than a cookie, so
// this list is not the security boundary — it is only what the browser will let through.
// SPEC section 7 covers the deployed version. Set FRONTEND_URL for a LAN IP or a real domain.
const DEV_ORIGINS = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/]
const origins = [
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS),
].filter(Boolean)

// Fail closed, not open: the only way this list is empty is production with FRONTEND_URL
// unset, and answering that with '*' would hand the API to every site on the internet. `false`
// sends no Access-Control-Allow-Origin at all, so a forgotten variable is a visibly broken
// frontend rather than a quietly public one. Dev always has DEV_ORIGINS, so it never lands here.
app.use(cors({ origin: origins.length ? origins : false }))
app.use(express.json({ limit: '1mb' }))

// The other half of lib/storage.js's no-Blob branch: it writes into UPLOADS_DIR and hands
// back an absolute URL under /uploads, so something has to serve that path or every locally
// uploaded product image is a broken image. express.static also sets the content type from
// the extension. On Vercel the Blob branch runs instead and this never gets hit.
app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/', (_req, res) => res.json({ service: 'ayursurgitech-api', ok: true }))

// Reachable at /api/health as well as /, because which of the two a deployment actually
// routes to the API is exactly what this endpoint exists to settle.
//
// `store` is the whole point: it reports which branch lib/store.js will take, so a deploy can
// answer "does the function see BLOB_READ_WRITE_TOKEN" from the outside in one request. Before
// this, the only symptom of a missing token was an ENOENT on mkdir from whichever write
// happened first, which reads as a path bug and sends you looking in the wrong place. It
// reports the boolean only — never the token, never any part of it.
const health = (_req, res) =>
  res.json({
    service: 'ayursurgitech-api',
    ok: true,
    // Mirrors lib/store.js's useBlob() exactly. It must keep mirroring it: a health check
    // that disagrees with the code it reports on is worse than no health check.
    store: process.env.BLOB_READ_WRITE_TOKEN
      ? 'blob (read-write token)'
      : process.env.BLOB_STORE_ID
        ? 'blob (OIDC + BLOB_STORE_ID)'
        : 'file (read-only on Vercel — writes will fail)',
    corsAllows: origins.length ? origins.map(String) : 'nothing — FRONTEND_URL is unset in production',
    nodeEnv: process.env.NODE_ENV || 'unset',
  })

app.get('/health', health)
app.get('/api/health', health)

app.use('/api', publicRoutes)
app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api', orderRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => res.status(404).json({ error: `No such route: ${req.method} ${req.path}` }))

// One error handler, so no route needs a try/catch. Express 5 forwards rejected promises
// from async handlers here on its own.
app.use((err, _req, res, _next) => {
  // lib/store.js tags the failures that used to be schema validators and unique indexes.
  if (err.status) return res.status(err.status).json({ error: err.message })
  if (err.name === 'MulterError')
    return res.status(400).json({
      error:
        err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Send the image in a form field named "file"'
          : err.code === 'LIMIT_FILE_SIZE'
            ? `That image is too large — the limit is ${UPLOAD_LIMIT_MB} MB. Resize it and try again.`
            : `Upload rejected: ${err.message}`,
    })

  console.error(err)
  res.status(500).json({ error: err.message || 'Something went wrong' })
})

export default app

import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The one place that knows where images live, the same shape lib/store.js has for the
// database. Two backends, chosen at runtime by whether a Blob token exists; callers get
// { url } and never learn which ran. Moving to GCS or S3 is an edit to this file alone.

export const UPLOADS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.data', 'uploads')

// Same gate as lib/store.js, same reason: a connected Blob store gives the deployment
// BLOB_STORE_ID and lets the SDK authenticate with Vercel's own VERCEL_OIDC_TOKEN. Checking
// only for a read-write token means a correctly configured deployment silently writes to a
// read-only local disk instead.
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

// Never trust an uploaded filename that still has a path in it. basename() alone is not
// enough because it is platform-aware: a Windows-style "..\..\evil" passes through it
// untouched on Linux. Collapsing every character outside this set removes both separators,
// so no upload can land outside UPLOADS_DIR on any platform. The timestamp prefix also
// means the final segment can never end up as "." or "..".
const safeName = (filename) => {
  const base = basename(String(filename ?? '')).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
  return `${Date.now()}-${base || 'upload'}`
}

export async function uploadImage(buffer, filename) {
  const name = safeName(filename)

  if (useBlob()) {
    const { put } = await import('@vercel/blob')
    // 'public' on purpose, while the database next door is 'private'. Images are the one
    // thing here that has to stay anonymously readable: the frontend drops this url straight
    // into <img src>, and routes/orders.js copies it into the order document, so a URL
    // needing a bearer token breaks every product page, and one that expires also rots
    // inside historical orders. Catalogue photos have nothing to protect. Both can live in
    // the one store because the SDK derives the host from access itself —
    // `${storeId}.${access}.blob.vercel-storage.com` — so they differ by hostname, not store.
    //
    // UNVERIFIED: whether a store configured Private accepts a public put. If it refuses,
    // this throws at upload time — loudly, before anything is persisted — and images need
    // their own public store, which is a token swap here and nothing else. Needs v2 (^2.7.0).
    const { url } = await put(`products/${name}`, buffer, { access: 'public' })
    return { url }
  }

  // ponytail: no Blob token, so images sit next to the JSON store and app.js serves that
  // directory with express.static, which also sets the content type from the extension.
  // The URL is absolute on purpose: the frontend is a different origin, so a bare
  // "/uploads/x.png" would resolve against Vite's port and 404 with a broken image.
  // BACKEND_URL is the knob for anything that is not plain localhost. Ceiling: these files
  // are local to one machine and are not in git, so they do not survive a deploy — that is
  // what the Blob branch above is for.
  await mkdir(UPLOADS_DIR, { recursive: true })
  await writeFile(join(UPLOADS_DIR, name), buffer)

  const origin = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`
  return { url: `${origin.replace(/\/+$/, '')}/uploads/${name}` }
}

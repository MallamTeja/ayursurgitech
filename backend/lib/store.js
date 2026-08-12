// The one place that knows where data lives. Same trick as lib/storage.js does for
// images: swapping the backing store is an edit to this file and nothing else. When
// Mongo comes back, it comes back here — the routes never learn about it.
//
// ponytail: the whole database is one JSON document, held in memory and rewritten whole on
// every mutation. Every access first compares the file's mtime against the one we loaded
// and re-reads if it moved, so a process never writes a snapshot that has been overtaken —
// `npm run seed` in a second terminal lands in a running dev server with no restart.
// The ceiling that remains, stated honestly:
//   - last write wins, per document. Two writers that both read, both compute and both
//     save inside the same instant still lose one of the two edits. That is small and
//     bounded: POST /orders decrementing stock is exactly this shape. What the mtime check
//     buys is that the loser forfeits its own edit and nothing else — before it, a stale
//     process rewrote the entire store and silently reverted everyone else's work.
//   - the mtime check is a staleness test, not a lock. Two writes inside the same
//     millisecond can carry the same stamp, and the second will not notice the first.
//   - rewriting the entire file per mutation stops being free somewhere in the low
//     thousands of documents.
//   - find() hands back live references, not copies. Treat them as read-only and mutate
//     through updateById, or you will edit the store behind its own back.
// At 27 products none of that is a compromise, it is just the right amount of code.
// Upgrade path: Mongo, landing in this file alone.

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_DELIVERY_FEE = 4000 // integer paise — ₹40

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '.data', 'db.json')
const BLOB_PATH = 'store/db.json'
const EMPTY = { users: [], categories: [], products: [], reviews: [], orders: [], settings: [] }

// Two ways to be authenticated against Blob, and this gate has to accept both.
//
// A Blob store connected to a Vercel project injects BLOB_STORE_ID and
// BLOB_WEBHOOK_PUBLIC_KEY — and no BLOB_READ_WRITE_TOKEN. The SDK pairs BLOB_STORE_ID with
// the VERCEL_OIDC_TOKEN that Vercel puts into every function and authenticates as the
// project, so a deployment needs no long-lived secret at all. A read-write token is now the
// fallback for running outside Vercel (a seed script on a laptop, CI), not the normal path.
//
// Checking only the token is what made a correctly connected production deployment fall
// through to the file backend and die on `mkdir` against a read-only filesystem — an error
// that reads like a path bug and sends you hunting in entirely the wrong place.
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

// ---------------------------------------------------------------------------
// backend A — a JSON file. No token, no account, works on `npm run dev`.
// ---------------------------------------------------------------------------

const fileMtime = async () => stat(FILE).then((s) => s.mtimeMs, () => 0)

async function fileRead() {
  cache.mtime = await fileMtime() // stamp first: a write landing between here and the
  try {                           // read only costs one redundant refresh later, never a missed one
    return JSON.parse(await readFile(FILE, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return null // first run
    throw err
  }
}

async function fileWrite(data) {
  await mkdir(dirname(FILE), { recursive: true })
  await writeFile(FILE, JSON.stringify(data, null, 2))
  cache.mtime = await fileMtime() // our own write must not look like somebody else's
}

// ---------------------------------------------------------------------------
// backend B — Vercel Blob, because Vercel's filesystem is read-only.
//
// This store is Private, which is what a document holding plain-text passwords needs.
// Blob grew a private tier after this file was written, so the old note here — "no private
// tier, `access: 'public'` behind an unguessable URL" — is simply out of date. Private
// blobs are not fetchable by URL: `get()` sends the read-write token as a bearer, which is
// why the read below is an SDK call and no longer a bare fetch of a public CDN URL.
//
// Needs @vercel/blob v2 (now on ^2.7.0). The whole 1.x line had no private tier at all —
// `access` was the literal 'public' and there was no authenticated read — and 1.1.1 was the
// last of it, which is why supporting a private store took a major bump rather than a patch.
//
// ponytail: still UNVERIFIED against the real store — no write has ever round-tripped. The
// read-after-write hazard is the one to watch: `useCache: false` appends `cache=0`, which
// the CDN honours for private blobs by serving from origin instead of the edge. That is
// aimed squarely at "a write followed immediately by a read returns the previous document",
// which for a read-modify-write store is silent data loss rather than a stale page. The
// intent is right; believe it when a deploy proves it, not before.
// ---------------------------------------------------------------------------

async function blobRead() {
  const { get } = await import('@vercel/blob')
  // A pathname (not a URL) lets the SDK derive the store from the token. null = 404 = first
  // run, the same contract fileRead() has for ENOENT. 304 needs an ifNoneMatch we never send.
  const res = await get(BLOB_PATH, { access: 'private', useCache: false })
  return res && new Response(res.stream).json()
}

async function blobWrite(data) {
  const { put } = await import('@vercel/blob')
  await put(BLOB_PATH, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

// ---------------------------------------------------------------------------
// load once, write back on mutation
// ---------------------------------------------------------------------------

// Vercel reuses the process between invocations; the old Mongoose cache lived here too.
const cache = (globalThis._store ??= { data: null, promise: null, mtime: 0 })

// Somebody else has written since we loaded — `npm run seed` in a second terminal locally,
// or another serverless instance in production — so take theirs before touching anything.
// Refilling the existing arrays rather than replacing cache.data keeps every reference
// handed out by find() valid, and makes two callers refreshing at once idempotent rather
// than a race.
//
// The Blob branch used to skip this entirely and return the cached copy forever, which made
// it far more dangerous than the local backend it was modelled on. Vercel keeps a function
// warm between invocations, so one instance served a snapshot that could be minutes stale —
// and because every mutation rewrites the WHOLE document, it then wrote that stale snapshot
// back, silently deleting everything every other instance had done in the meantime. A user
// registering while a bulk catalogue import ran, and finding their account gone, is exactly
// this: their write landed, then a write from an older snapshot erased it.
//
// Blob exposes no mtime, so there is no cheap staleness probe — the read is unconditional,
// one GET per request. That is the price of correctness here, and at this catalogue's size
// it is the right trade.
//
// ponytail: this narrows the window, it does not close it. Two instances that both read,
// both mutate and both write still lose one edit — the read-modify-write is not atomic.
// Upgrade path: a real database, landing in this file alone.
async function refresh() {
  if (!useBlob() && (await fileMtime()) === cache.mtime) return cache.data

  const raw = (useBlob() ? await blobRead() : await fileRead()) ?? {}
  for (const name of Object.keys(EMPTY)) {
    const list = cache.data[name]
    list.length = 0
    list.push(...(raw[name] ?? []))
  }
  return cache.data
}

async function ready() {
  if (cache.data) return refresh()
  // One shared promise resolving to one object: concurrent first requests must not each
  // build their own copy of the store and then race to install it.
  cache.promise ??= (useBlob() ? blobRead() : fileRead())
    .then((raw) => ({ ...EMPTY, ...(raw ?? {}) }))
    .catch((err) => {
      cache.promise = null // a transient read failure must not poison the process forever
      throw err
    })
  cache.data ??= await cache.promise
  return cache.data
}

const persist = () => (useBlob() ? blobWrite(cache.data) : fileWrite(cache.data))

// ---------------------------------------------------------------------------
// what the Mongoose schemas used to hold: defaults, required fields, the checks that
// were validators, and the uniqueness that was an index.
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString()

// `fields` is Mongoose strict mode: anything not listed is dropped on the way in. Without
// it the admin panel PUTs its own read model straight back — `categoryName` on a product,
// `productCount` on a subcategory — and those computed fields become stored fields that
// then show up in public responses.
const pick = (doc, fields) => {
  const out = doc._id === undefined ? {} : { _id: doc._id } // order addresses carry no _id

  for (const f of fields) if (f in doc) out[f] = doc[f]
  return out
}
// products reference subcategories by _id, and the frontend deletes addresses by _id,
// so every embedded row needs one — this is what the subdocument schemas did.
const embed = (rows, fields) => (rows ?? []).map((row) => pick({ _id: randomUUID(), ...row }, fields))

const ADDRESS = ['label', 'line1', 'line2', 'city', 'state', 'pincode', 'phone']

const SCHEMA = {
  users: {
    fields: ['name', 'phone', 'password', 'addresses', 'createdAt'],
    required: ['name', 'phone', 'password'],
    unique: ['phone'],
    defaults: () => ({ addresses: [], createdAt: now() }),
    normalize: (d) => ({ ...d, addresses: embed(d.addresses, ADDRESS) }),
  },
  categories: {
    fields: ['name', 'slug', 'image', 'order', 'subcategories'],
    required: ['name', 'slug'],
    unique: ['slug'],
    defaults: () => ({ order: 0, subcategories: [] }),
    normalize: (d) => ({ ...d, subcategories: embed(d.subcategories, ['name', 'slug']) }),
  },
  products: {
    // brand and mrp are in SPEC section 3 but were missing from the Mongoose schema, so
    // strict mode silently dropped them on every save. Listed here, they persist.
    fields: [
      'name', 'slug', 'description', 'images', 'brand', 'price', 'mrp', 'gstRate', 'hsnCode',
      'minOrderQty', 'stockQty', 'categoryId', 'subcategoryId', 'ratingAvg', 'ratingCount', 'createdAt',
    ],
    required: ['name', 'slug', 'description', 'price', 'gstRate', 'hsnCode', 'categoryId', 'subcategoryId'],
    unique: ['slug'],
    defaults: () => ({ images: [], minOrderQty: 1, stockQty: 0, ratingAvg: 0, ratingCount: 0, createdAt: now() }),
    // Slabs change by government notification, so this is a range, not an enum. But an
    // unchecked gstRate is a wrong number on an invoice — see SPEC section 2.
    check: (d) => (d.gstRate >= 0 && d.gstRate <= 100 ? null : 'GST rate must be a percentage between 0 and 100'),
  },
  reviews: {
    fields: ['productId', 'userId', 'userName', 'rating', 'text', 'status', 'createdAt'],
    required: ['productId', 'userId', 'userName', 'rating', 'text'],
    defaults: () => ({ status: 'pending', createdAt: now() }),
    check: (d) =>
      Number.isInteger(d.rating) && d.rating >= 1 && d.rating <= 5 ? null : 'Rating must be a whole number from 1 to 5',
  },
  orders: {
    fields: [
      'userId', 'userName', 'userPhone', 'address', 'items',
      'subtotal', 'gstTotal', 'deliveryFee', 'grandTotal', 'status', 'createdAt',
    ],
    required: ['userId'],
    defaults: () => ({ items: [], status: 'paymentPending', createdAt: now() }),
    normalize: (d) => ({ ...d, address: d.address && pick(d.address, ADDRESS) }),
  },
  settings: {
    fields: ['deliveryFee'],
    defaults: () => ({ deliveryFee: DEFAULT_DELIVERY_FEE }),
  },
}

const fail = (status, message) => {
  throw Object.assign(new Error(message), { status })
}

function collection(name) {
  const { fields, required = [], unique = [], defaults = () => ({}), normalize = (d) => d, check } = SCHEMA[name]
  const rows = async () => (await ready())[name]
  const shape = (doc) => normalize(pick(doc, fields))

  const matcher = (filter) =>
    typeof filter === 'function'
      ? filter
      : (d) => Object.entries(filter ?? {}).every(([k, v]) => String(d[k]) === String(v))

  const validate = (doc, siblings) => {
    const missing = required.filter((f) => doc[f] == null || doc[f] === '')
    if (missing.length) fail(400, missing.map((f) => `${f} is required`).join('. '))

    const problem = check?.(doc)
    if (problem) fail(400, problem)

    for (const key of unique)
      if (siblings.some((s) => s._id !== doc._id && s[key] === doc[key]))
        fail(409, `That ${key} is already taken`)
  }

  const api = {
    async find(filter) {
      return (await rows()).filter(matcher(filter))
    },
    async findOne(filter) {
      return (await rows()).find(matcher(filter)) ?? null
    },
    async findById(id) {
      return (await rows()).find((d) => d._id === String(id)) ?? null
    },
    async insert(doc) {
      return (await api.insertMany([doc]))[0]
    },
    async insertMany(docs) {
      const list = await rows()
      const created = docs.map((doc) => shape({ _id: randomUUID(), ...defaults(), ...doc }))
      const pool = list.concat(created)
      for (const doc of created) validate(doc, pool) // nothing is pushed until all pass
      list.push(...created)
      await persist()
      return created
    },
    async updateById(id, patch) {
      const list = await rows()
      const i = list.findIndex((d) => d._id === String(id))
      if (i === -1) return null

      const { _id, ...rest } = patch // _id is never patchable
      const updated = shape({ ...list[i], ...rest })
      validate(updated, list)
      list[i] = updated
      await persist()
      return updated
    },
    async deleteById(id) {
      const list = await rows()
      const i = list.findIndex((d) => d._id === String(id))
      if (i === -1) return null

      const [removed] = list.splice(i, 1)
      await persist()
      return removed
    },
    // no filter = wipe the collection, which is how the seed makes itself idempotent
    async deleteMany(filter) {
      const list = await rows()
      const kept = list.filter((d) => !matcher(filter)(d))
      const removed = list.length - kept.length
      list.length = 0
      list.push(...kept)
      await persist()
      return removed
    },
  }
  return api
}

export const users = collection('users')
export const categories = collection('categories')
export const products = collection('products')
export const reviews = collection('reviews')
export const orders = collection('orders')
export const settings = collection('settings')

// Exactly one document, _id 'settings'. Created on demand so no screen ever has to
// handle a missing one.
export async function getSettings() {
  return (await settings.findById('settings')) ?? settings.insert({ _id: 'settings' })
}

# AayursurgiTech — Specification

Ecommerce site for surgical pharma products, with an admin panel.
Single source of truth. Every build prompt references this file. If code and this
document disagree, this document is wrong — fix it here first, then the code.

---

## 1. Decisions already made (do not re-litigate)

| Area | Decision |
|---|---|
| Stack | `frontend/` = Vite + React + Tailwind v4. `backend/` = Express + Mongoose. Two Vercel projects. |
| Language | Plain JavaScript + JSX. No TypeScript. |
| Auth | Phone + password, stored as plain text. Token = the user's `_id`, sent as `Authorization: Bearer <id>`, kept in `localStorage`. |
| Admin auth | Fixed credentials in env. Successful login returns `ADMIN_TOKEN` from env. |
| Admin path | `/ops-desk`, not `/admin`. Path read from `VITE_ADMIN_PATH`. Admin routes are `React.lazy` so they compile to a chunk shoppers never download. |
| Scope | **Demo build.** No rate limiting, no sanitisation, no scalability work, no tests. No pagination — the catalogue is small enough to return whole. |
| Payments | Stubbed. Order is created with status `paymentPending`. No gateway. |
| Images | Uploaded to Vercel Blob through one adapter module, so GCS/S3 later is a one-file change. |
| Stock | `stockQty` is the only truth. "Out of stock" is computed, never stored. |
| GST | Per-product `gstRate` + `hsnCode`. Prices are stored **GST-exclusive**. |
| Delivery | One flat fee per order, set by admin in Settings. |
| Categories | Two levels. Subcategories embedded in the category document. |
| Quantity | Per-product `minOrderQty`. No pack multiples. |
| Reviews | Logged-in users submit; admin approves before anything is public. |
| Money | Stored as **integer paise**. Never a float. |
| Cart | Lives in `localStorage`. The server reprices everything at checkout. |
| Dark mode | Not built. |

### Known, deliberate holes

This is a demo. The following are accepted, not oversights. Each gets a `ponytail:`
comment at its site in code so the ceiling is documented where someone will find it.

- **The bearer token is just a user id.** Anyone can type another id and become that
  user. Upgrade path: sign it as a JWT — about five lines in `backend/lib/auth.js` and
  nothing else changes.
- **Passwords are plain text in Mongo.** Upgrade path: `bcrypt.hash` on register,
  `bcrypt.compare` on login. Two lines, one dependency.
- **No rate limiting. No sanitising. No validation beyond "is this field present".**
- **But no unauthenticated route may return a user `_id`.** Since the id *is* the token,
  publishing one hands out a working credential. The public review payload leaked exactly
  this and was fixed. The holes above are theoretical until an id escapes; a route that
  gives ids away turns them into a one-click account takeover, which is a different thing
  from what was signed off. Keep `userName` on public reviews, never `userId`.
- **No tests.** One exception, below.
- **No pagination anywhere.** Lists return everything. Fine at demo scale, and it
  removes a pile of frontend state.

### The two things that stay, even in a demo

Not security theatre — without these the demo is visibly broken, not merely insecure.

1. **Checkout reprices from the database, ignoring whatever the client sent.** The cart
   lives in `localStorage`, so its prices go stale the moment the admin edits a product.
   Trusting them means an order total that disagrees with the product page. This is a
   correctness fix, not a security one.
2. **The Mongoose connection is cached on `globalThis`.** Five lines. Without it, the
   Vercel deployment opens a new connection pool per cold start and Atlas starts
   refusing connections. The backend does not work deployed without this.

One test exists, because the money maths is the one thing a demo cannot get visibly
wrong: `backend/lib/pricing.test.js`, plain `node:assert`, no framework. It checks the
section 2 arithmetic against a few hand-computed orders.

---

## 2. Money rules

All prices, fees and totals are **integers in paise**. `24000` means ₹240.00.

- Admin types rupees in forms; the form multiplies by 100 on submit.
- One display helper, `formatINR(paise)`, is the only place a rupee string is produced.
- Use `font-variant-numeric: tabular-nums` wherever prices are listed, so columns align.

### Read this before wiring any payment gateway

Razorpay takes its `amount` in **paise** — the same unit this codebase already stores. When
that integration happens, `grandTotal` is passed **verbatim, with no conversion.**

Nearly every Razorpay tutorial on the internet writes `amount * 100`, because nearly every
application stores rupees. Whoever implements this will read those tutorials, see our code
passing a bare integer, conclude the `* 100` is missing, and add it. That charges every
customer one hundred times the correct amount, on real cards.

So: a `ponytail:` comment at the call site saying explicitly that the absence of `* 100` is
correct and must not be "fixed", a guard before the call asserting the amount is an integer
equal to `grandTotal` and at least 100 paise, and a re-check of the amount at verification
time. `formatINR` contains the only division by 100 in the codebase and must never sit
anywhere in the path of a value being sent to a gateway.

Full plan in `docs/RAZORPAY-LATER.md`.

### Stock decrement timing — decided, do not change yet

Stock decrements at **order creation** (section 4, step 5). That is correct today: payment
is stubbed, so creating the order *is* the terminal action and there is no abandonment path
to leak stock. It stays there.

When a real gateway lands, it must move into the same conditional update that flips
`paymentPending` → `placed`. Otherwise every closed payment modal permanently eats stock —
products go out of stock with no revenue and no order explaining why, and the client reports
it as a stock bug and is right. That same condition also makes duplicate webhook deliveries
idempotent for free, which matters because Razorpay guarantees at-least-once delivery.

**Do not move it early.** With payment stubbed, nothing ever reaches `placed` without an
admin doing it by hand, so relocating the decrement now means stock never moves at all and
the demo loses a behaviour it is specifically meant to demonstrate.

Two related quirks are also correct-for-now and wrong-with-a-gateway, both recorded in
`docs/RAZORPAY-LATER.md`: `PUT /admin/orders/:id` accepts any status transition (which is
the intended demo flow — the admin confirms payment manually), and `revenuePaise` counts
`paymentPending` orders (which stops a fresh demo reporting zero revenue).

### Order arithmetic — exactly this, in this order

Per line item:

```
lineSubtotal = unitPrice * qty                            // integer
lineGst      = Math.round(lineSubtotal * gstRate / 100)   // integer, round per line
```

Per order:

```
subtotal    = sum of every lineSubtotal
gstTotal    = sum of every lineGst
deliveryFee = settings.deliveryFee
grandTotal  = subtotal + gstTotal + deliveryFee
```

Round GST **per line item**, not once on the order subtotal. Rounding once at the end
produces totals that do not match a line-item invoice, which is what customers argue about.

### Where prices are shown

| Screen | Shows |
|---|---|
| Product card, product detail | Unit price only, with small `+ GST` text beside it. |
| Cart | Line subtotals and the cart subtotal. No GST, no delivery. |
| Checkout | Full breakdown: subtotal, **one GST row per distinct rate present**, delivery fee, grand total. |
| Order detail, admin order view | Full breakdown, plus `hsnCode` per line. |

This split is a hard requirement from the client: browsing shows the bare product
price; only checkout reveals GST and delivery.

### The GST row, resolved

The first draft said "GST (one line, with the rate)". That is impossible: `gstRate` is
per-product, and a cart mixing gauze at 12% with an item at 5% has no single rate. Mixed
carts will be routine, not an edge case.

**Resolution: one row per distinct GST rate present in the order**, each labelled with its
rate and carrying the summed GST for the lines at that rate.

```
Subtotal                    ₹3,440.00     8 × ₹240 @ 5%  +  4 × ₹380 @ 18%
GST (5%)                       ₹96.00
GST (18%)                     ₹273.60
Delivery                       ₹40.00
─────────────────────────────────────
Total                       ₹3,849.60
```

(This example previously used a 12% row, contradicting section 3 of this same document.
There is no 12% slab. Corrected.)

A single-rate cart therefore renders exactly one row reading `GST (12%)`, which is what the
original wording wanted. This is also how a real tax invoice summarises, and it changes no
arithmetic — the per-line rounding in section 2 is untouched, the rows are just a grouping
of `lineGst` by `gstRate`.

**Why this must be unambiguous, not merely tidy:** hospitals and clinics supplying exempt
healthcare services cannot claim input tax credit on consumables. For a large slice of this
audience GST is a real cost rather than a pass-through, so the breakdown is a number they
are actually paying, not a formality.

---

## 3. Data model

Six collections, defined by the `SCHEMA` table in `backend/lib/store.js`.

> **Mongoose is gone.** The user chose no MongoDB, so persistence is a JSON document store —
> `backend/.data/db.json` locally, Vercel Blob when a token is present, both behind
> `lib/store.js` as the single swap point. When Mongo returns it lands in that one file.
>
> Consequently **`_id` is a 36-character `randomUUID` string, not a 24-hex ObjectId.** Every
> `ObjectId` written below now means "opaque id string". Nothing may validate id *format* —
> a lookup miss is the only check that exists. Treat ids as opaque everywhere.

### `users`

```js
{
  name: String,          // required
  phone: String,         // required, unique, 10 digits
  password: String,      // required, PLAIN TEXT — see known holes
  addresses: [{
    _id: ObjectId,       // auto
    label: String,       // "Home", "Clinic" — optional
    line1: String,       // required
    line2: String,
    city: String,        // required
    state: String,       // required
    pincode: String,     // required, 6 digits
    phone: String        // required — contact for this delivery
  }],
  createdAt: Date
}
```

### `categories`

```js
{
  name: String,          // "Wound Care"
  slug: String,          // "wound-care", unique
  image: String,         // Blob URL, optional
  order: Number,         // manual sort, default 0
  subcategories: [{
    _id: ObjectId,       // auto — products reference THIS, not the slug
    name: String,        // "Gauze & Swabs"
    slug: String         // "gauze-swabs", unique within the parent
  }]
}
```

Products reference `subcategoryId`, never the slug. Renaming a subcategory must not
orphan products.

### `products`

```js
{
  name: String,          // required
  slug: String,          // required, unique
  description: String,   // required, plain text, newlines preserved
  images: [String],      // Blob URLs. images[0] is the card thumbnail.
  brand: String,         // optional. "Romsons", "3M", "Datar" — how buyers actually search
  price: Number,         // integer paise, GST-EXCLUSIVE, required
  mrp: Number,           // optional, integer paise. Struck-through list price.
  gstRate: Number,       // percent. Live slabs are 0 | 5 | 18. THERE IS NO 12% SLAB.
  hsnCode: String,       // required — printed on invoices
  minOrderQty: Number,   // default 1
  stockQty: Number,      // default 0. THE only stock truth.
  categoryId: ObjectId,     // required
  subcategoryId: ObjectId,  // required
  ratingAvg: Number,     // 0–5, one decimal. Recomputed on review approve/delete.
  ratingCount: Number,   // approved reviews only
  createdAt: Date
}
```

`inStock` is **not a field**. It is `stockQty > 0`, computed wherever needed.

#### GST rates — the 12% slab was abolished

The first draft of this document said `0 | 5 | 12 | 18`. That was wrong. India replaced the
four-tier structure at the **56th GST Council (3 Sep 2025)**, given effect by **Notification
9/2025-CTR dated 17 Sep 2025, in force 22 Sep 2025**. The structure is now a 5% merit rate,
an 18% standard rate, and a 40% de-merit rate for things this shop does not sell. **No 12%
schedule exists.** Only amendment since is 01/2026-CTR (1 May 2026), which touched beverages
only.

Practical effect: **effectively every surgical and medical good in this catalogue is 5%.**
The whole of heading 9018 — syringes, needles, cannulae, IV sets, BP monitors, stethoscopes,
surgical scissors, blades, forceps — sits at 5% with no exclusions and no price threshold.

Verified rates, HSN codes, and sources are in **`docs/GST-REFERENCE.md`**, read from the
gazette text rather than from commentary. Use it for the seed data and for the admin
dropdown. Note that nearly every online GST aggregator is still stale in the old direction —
ClearTax's own 9018 page still shows "5/12%" and discloses it hasn't been updated since a
2020 notification. **Any 12% figure anywhere in this project came from a stale page or from
memory and is a bug.**

Three traps that matter for this catalogue:

- **Surgical scissors are 5% under 9018 90 22; scissors as cutlery are 18% under 8213.**
  Same physical object, two slabs. A generic HSN lookup returns 8213 and overcharges every
  Mayo scissor you sell. Same trap for scalpel blades.
- **Rubber gloves are 5% (4015 12); plastic and vinyl gloves are 18% (3926).** Nitrile is
  Chapter 40, PVC is Chapter 39 — a 13-point swing on products that sit side by side.
- **Masks, gowns and drapes are textiles (Chapter 63/62), and their rate depends on price:**
  5% at or below ₹2,500 per piece, 18% above it. Because prices are stored GST-exclusive,
  the correct test is `price > 250000` paise — the threshold applies to taxable value, so
  storing exclusive prices makes this comparison right by accident.

The rate is deliberately stored **independently** of the HSN code and not derived from it.
Headings 4015, 9025 and 9027 each appear in both Schedule I and Schedule II with explicit
`[other than …]` exclusions, so the same HSN carries two different rates depending on
intended use. A model that derived rate from HSN could not represent surgical versus
household gloves at all.

> `ponytail:` a real tax invoice also needs an HSN-wise summary and a CGST/SGST split at half
> the rate each, or IGST at the full rate inter-state. Storing `gstRate` and `lineGst` per
> line is enough to compute all of that at render time, so this is a display change when it
> is needed. Until then the checkout breakdown is a price breakdown, not a tax invoice, and
> should not be described as one to the client.

### `reviews`

```js
{
  productId: ObjectId,   // required
  userId: ObjectId,      // required
  userName: String,      // snapshot at submit time
  rating: Number,        // 1–5 integer, required
  text: String,          // required
  status: String,        // 'pending' | 'approved'  — default 'pending'
  createdAt: Date
}
```

Public product pages return `status: 'approved'` only. On approve or delete, recompute
the parent product's `ratingAvg` and `ratingCount` in the same request.

### `orders`

Every price and the whole address are **snapshotted** into the order at creation.

```js
{
  userId: ObjectId,
  userName: String,      // snapshot
  userPhone: String,     // snapshot
  address: {             // snapshot — a plain object, NOT a reference
    label, line1, line2, city, state, pincode, phone
  },
  items: [{
    productId: ObjectId,
    name: String,        // snapshot
    image: String,       // snapshot
    unitPrice: Number,   // snapshot, paise
    qty: Number,
    gstRate: Number,     // snapshot
    hsnCode: String,     // snapshot
    lineSubtotal: Number,
    lineGst: Number
  }],
  subtotal: Number,
  gstTotal: Number,
  deliveryFee: Number,   // snapshot
  grandTotal: Number,
  status: String,        // 'paymentPending'|'placed'|'shipped'|'delivered'|'cancelled'
  createdAt: Date
}
```

**Snapshotting is not optional.** If an order referenced live products, changing a
price next month would silently rewrite last month's invoices.

### `settings`

Exactly one document, `_id: 'settings'`.

```js
{ _id: 'settings', deliveryFee: Number }   // integer paise
```

Seed it on first run. `GET /api/settings` creates it with a default if absent, so no
screen ever has to handle a missing settings document.

---

## 4. API

Base path `/api`. JSON in, JSON out. Errors: `{ error: "human readable message" }`
with a real status code — 400 validation, 401 auth, 404 missing, 409 conflict.

`Authorization: Bearer <token>` where token is a user `_id` or the admin token.
Middleware: `requireUser` sets `req.user`; `requireAdmin` compares against
`process.env.ADMIN_TOKEN`.

### Public

| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | Full tree, sorted by `order`. Powers the nav. |
| GET | `/products` | Query: `category`, `subcategory` (slugs), `q`, `sort`. Returns `{ items, total }`. No pagination. |
| GET | `/products/:slug` | Returns `{ product, reviews, category, subcategory }`. See pinned shapes below. |
| GET | `/settings` | `{ deliveryFee }`. Needed by checkout. |
| POST | `/quote` | `{ items: [{ productId, qty }] }` → the same totals shape `POST /orders` returns, plus `problems: [{ productId, message }]`. Writes nothing, decrements nothing. |

**`POST /quote` exists so the checkout screen does no money arithmetic at all.** The cart
lives in `localStorage`, so its prices go stale the moment an admin edits a product. If the
frontend computed the breakdown from those cached prices, its total would eventually
disagree with the total the server independently computes at order time — and the user would
watch the number change after pressing Place order.

With this route, checkout sends ids and quantities, renders exactly what comes back, and
divergence is structurally impossible rather than merely unlikely. It shares one code path
with `POST /orders`; if the two ever drift, the bug returns.

It also returns `problems` instead of a 400, so checkout can show "minimum order is 10
pieces" *before* the user commits rather than after.

`/products` list responses omit `description` and return only `images[0]` — keep the
payload small; the card does not need the rest.

### Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ name, phone, password }` | 409 if phone exists. Returns `{ token, user }`. |
| POST | `/auth/login` | `{ phone, password }` | 401 on mismatch. Returns `{ token, user }`. |
| GET | `/auth/me` | — | `requireUser`. Returns the user, including addresses, without the password. |

No logout route. The client drops the token.

### User

| Method | Path | Notes |
|---|---|---|
| POST | `/users/me/addresses` | Appends. Returns the updated address list. |
| DELETE | `/users/me/addresses/:addressId` | Returns the updated list. |
| POST | `/products/:id/reviews` | `{ rating, text }`. Creates as `pending`. One review per user per product — 409 on a second. |
| POST | `/orders` | See below. |
| GET | `/orders` | The caller's own orders, newest first. |
| GET | `/orders/:id` | 404 if it is not the caller's order. |

#### `POST /orders`

Request: `{ addressId, items: [{ productId, qty }] }`

The client's prices are **ignored entirely**. The server:

1. Loads the address from the user document. 400 if it is not theirs.
2. Loads every product fresh from Mongo. 400 naming any that vanished.
3. Validates `qty >= minOrderQty` and `qty <= stockQty`, per item. 400 naming the
   offending product and the actual limit — the client shows that message verbatim.
4. Computes every figure using the arithmetic in section 2, from database prices.
5. Decrements `stockQty` on each product.
6. Creates the order with `status: 'paymentPending'`.
7. Returns the created order.

> `ponytail:` steps 5 and 6 are not in a transaction. Two people buying the last unit
> at the same instant can both succeed. Upgrade path: a Mongo session with
> `findOneAndUpdate({ _id, stockQty: { $gte: qty } }, { $inc: { stockQty: -qty } })`,
> which is the fix when concurrent traffic is real.

### Admin — all `requireAdmin`

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/login` | `{ phone, password }` against `ADMIN_PHONE`/`ADMIN_PASSWORD`. Returns `{ token }`. |
| GET | `/admin/categories` | Like the public tree, plus `productCount` on every category **and** every subcategory. The category count is aggregated directly, not summed from its subcategories, so it agrees with the number `DELETE` reports in its 409. |
| POST/PUT/DELETE | `/admin/categories`, `/admin/categories/:id` | PUT accepts the whole `subcategories` array — that is how subcategories are edited. |
| POST/PUT/DELETE | `/admin/products`, `/admin/products/:id` | |
| GET | `/admin/products` | Includes out-of-stock and every field. Supports `q`. |
| POST | `/admin/upload` | `multipart/form-data`, field `file`. Returns `{ url }`. |
| GET | `/admin/reviews` | Query `status`. Default `pending`. |
| PUT | `/admin/reviews/:id` | `{ status: 'approved' }`. Recomputes product rating. |
| DELETE | `/admin/reviews/:id` | Recomputes product rating. |
| GET | `/admin/orders` | Query `status`. Newest first. |
| PUT | `/admin/orders/:id` | `{ status }`. Validate against the enum. |
| PUT | `/admin/settings` | `{ deliveryFee }`. |
| GET | `/admin/stats` | `{ orderCount, pendingOrders, productCount, outOfStockCount, pendingReviews, revenuePaise }`. One screen, one request. |

**Deleting a category** that still has products returns 409 with the product count.
Same for a subcategory inside a PUT. Do not orphan products.

### Pinned response shapes

The backend is built. These were ambiguous in the first draft of this document and are now
fixed. Frontend code reads from exactly these shapes — do not guess, and do not "fix" the
backend to match a different assumption.

```
GET  /products            → { items, total }        items omit `description`, carry images[0] only
GET  /products/:slug      → { product, reviews, category, subcategory }
GET  /categories          → [ category, ... ]       bare array
GET  /orders              → [ order, ... ]          bare array
GET  /settings            → { deliveryFee }
GET  /auth/me             → the user object, never including `password`
POST /auth/register|login → { token, user }
POST /admin/login         → { token }
POST /users/me/addresses  → { addresses }            the full updated list
DELETE .../addresses/:id  → { addresses }            the full updated list
POST /orders              → the created order
POST /products/:id/reviews→ the created review
POST /admin/upload        → { url }
GET  /admin/*  lists      → bare arrays
errors (any status)       → { error: "human readable message" }
```

**`sort` accepts:** `newest` (the default), `priceAsc`, `priceDesc`, `rating`, `nameAsc`,
`nameDesc`. Anything unrecognised falls back to `newest`. The backend normalises separators,
so `price-asc` and `price_asc` also work — frontend code should still send the camelCase form.

**`/admin/stats` definitions:** `revenuePaise` is the sum of `grandTotal` across every order
except `cancelled` — payment-pending orders count, because payment is stubbed and excluding
them would report zero revenue on a fresh demo. `pendingOrders` counts `paymentPending` plus
`placed`, i.e. everything not yet dispatched.

> `ponytail:` `/products/:slug` currently returns the product's fields twice — flat at the
> top level and again under `product` — because the backend was written against the earlier
> ambiguous wording. `product` is canonical. Prompt 06 deletes the flat copy once the
> frontend is confirmed to read only the nested one.

### Also true, decided during the backend build

- `GET /` (outside `/api`) is a health check, so a deploy can be confirmed alive.
- Uploads are capped at **4 MB**. An unbounded memory buffer OOMs a serverless function,
  and Vercel rejects any request body over 4.5 MB before your code ever runs. The backend
  was built with an 8 MB cap, which means a 6 MB upload passes multer locally and fails in
  production with an opaque platform error. **Prompt 06 must change this to 4 MB** and make
  the client-side error message say the size limit out loud.
- `PUT` handlers strip `_id` from the request body, because the admin panel sends whole
  documents back and Mongo rejects an attempt to modify `_id`.
- Seeded orders deliberately do **not** decrement `stockQty`; seeded stock is an opening
  balance. Only real orders move it.
- The backend runs Express 5, whose native async-rejection forwarding replaces try/catch in
  every route with one error handler in `app.js`.

---

## 5. Pages

### Shop

| Route | Content |
|---|---|
| `/` | Hero, category grid, a "New arrivals" row. |
| `/register`, `/login` | Name + phone + password / phone + password. |
| `/c/:categorySlug` | Subcategory chips, product grid, sort control. |
| `/c/:categorySlug/:subSlug` | Same, filtered. |
| `/p/:slug` | Image gallery, name, price + `+ GST`, stock state, quantity stepper honouring `minOrderQty`, description, reviews, review form when logged in. |
| `/search` | Results for `?q=`, using the same product grid. Empty state when nothing matches, including the searched term in the message. |
| `/cart` | Line items, quantity steppers, remove, subtotal, "Proceed to checkout". |
| `/checkout` | Address picker plus new-address form, order summary with the full price breakdown, "Place order". |
| `/order/:id` | Confirmation and the full order detail. |
| `/orders` | The user's order history. |

### Admin — all under `/ops-desk`

`/ops-desk/login`, `/ops-desk` (stats dashboard), `/ops-desk/categories`,
`/ops-desk/products`, `/ops-desk/products/new`, `/ops-desk/products/:id`,
`/ops-desk/orders`, `/ops-desk/orders/:id`, `/ops-desk/reviews`, `/ops-desk/settings`.

The path comes from `import.meta.env.VITE_ADMIN_PATH` with `ops-desk` as the fallback —
never hardcode it in a link. Admin routes load through `React.lazy` so they land in a
separate bundle chunk that a normal shopper never downloads.

> `ponytail:` renaming the path only stops bots and idle URL-guessing. The route string
> is still inside the JS bundle for anyone who opens devtools. The actual gate is
> `requireAdmin` on every `/api/admin/*` route — finding the URL yields a login form and
> nothing else.

### Behaviour that is not optional

- Every list has a real **empty state** — an icon, a sentence, and an action. Never a
  blank panel.
- Every fetch has a **loading state**. Skeletons that match the real layout on grids,
  a spinner inside the button on submits.
- Every fetch has an **error state** with a retry button. Never a silent blank screen.
- Out-of-stock products stay visible and browsable, with the add-to-cart control
  disabled and labelled. They are not hidden.
- Quantity below `minOrderQty` is refused at the stepper with the reason shown, not
  silently at checkout.
- The cart survives a page refresh.

---

## 6. Environment

`backend/.env`

```
MONGODB_URI=
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=changeme
ADMIN_TOKEN=any-long-random-string
BLOB_READ_WRITE_TOKEN=
FRONTEND_URL=http://localhost:5173
PORT=4000
```

`frontend/.env`

```
VITE_API_URL=http://localhost:4000/api
VITE_ADMIN_PATH=ops-desk
```

Commit `.env.example` for both. Never commit `.env`.

---

## 7. Deployment — two Vercel projects, one repo

**`docs/DEPLOY.md` is the operational guide** — a step-by-step walkthrough verified against
live Vercel, Atlas and Blob documentation. This section is only the architectural summary.

**Backend:** root directory `backend`. Express exported as a serverless handler;
`backend/vercel.json` rewrites every path to it. Env vars set in the Vercel dashboard.

**Frontend:** root directory `frontend`, framework preset Vite.

### The four traps, corrected

The first draft of this section was wrong or silent on all four.

1. **The frontend needs its own `vercel.json`** with a catch-all rewrite to `/index.html`.
   Vercel does **not** add this automatically for Vite. Without it, opening or refreshing
   `/p/gauze-swab` returns 404 and the site looks broken to anyone who shares a link.
   Vercel's filesystem lookup takes precedence over rewrites, so a `/(.*)` catch-all does
   not swallow `/assets/*`.

2. **`api/index.js` must not call `app.listen()` when deployed.** Guard it with
   `process.env.VERCEL`. `PORT=4000` is meaningless in production; it is a local-dev
   variable only.

3. **`VITE_*` variables are baked in at build time**, not read at runtime. Changing
   `VITE_API_URL` in the dashboard does nothing until you redeploy. It must also keep its
   `/api` suffix — pasting the bare backend URL 404s every request.

4. **Atlas network access must allow `0.0.0.0/0`.** Serverless functions have no fixed IP.
   This is not a hardening choice you can defer; without it nothing connects at all.
   MongoDB's own Vercel integration will add the entry and set `MONGODB_URI` for you.

The Mongoose connection **must** be cached on `globalThis` between invocations. Without it
every cold start opens a new pool and Atlas begins refusing connections. Together with
trap 4, these are the two ways this deployment shape fails hardest.

### CORS is a chicken-and-egg on the first deploy

The backend allows `FRONTEND_URL` only — a value that does not exist until the frontend has
deployed. So the order is: deploy backend → deploy frontend → set `FRONTEND_URL` on the
backend → redeploy backend. Consequence worth knowing: preview deployments of the frontend
get a different URL each time and therefore cannot call the production backend.

Because auth is a header and not a cookie, there is no cross-site cookie problem to solve.

### The SEO cost of this split, stated once

A Vite SPA ships an empty HTML shell; products render only after JavaScript runs.
Google will not reliably index product pages. If organic search ever matters, the fix
is moving the frontend to Next.js — the backend and the data model survive that move
untouched. Building it this way is a deliberate choice, recorded here so it is not
rediscovered as a surprise.

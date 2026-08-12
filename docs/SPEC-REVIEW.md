# SPEC review — pre-Wave-2 red team

Reviewed: `docs/SPEC.md`, `docs/DESIGN-SYSTEM.md`, `prompts/README.md`, `prompts/01`–`06`.
Nothing in `backend/` or `frontend/` was read; this is a review of the contract only.

**Verdict: Wave 2 is not safe to launch as written.** Findings S1-1 through S1-4 all resolve
to edits inside `frontend/src/lib/`, which Wave 2 is forbidden to touch. Three agents will
each hit them independently, and the only way any of them can proceed is to edit a prompt-02
file — which is the exact silent-overwrite failure the wave structure exists to prevent.

The fixes are small: **one paragraph in `prompts/02-frontend-shell.md`, one line in
`prompts/05-admin-panel.md`, and four sentences in `docs/SPEC.md` section 4.** All of them
land before Wave 2 starts, not after.

Two categories yielded nothing and are dismissed in one line each — see "Clean" at the end.

---

## S1 — Will cause lost work or wrong money. Fix before Wave 2 starts.

### S1-1. Five Wave-2 requirements can only be satisfied by editing `frontend/src/lib/`

`prompts/README.md:38` — *"Nobody reopens `App.jsx`. Nobody reopens `package.json`. Nobody
adds to `src/components/`."* — and each Wave-2 brief repeats *"Do not touch, for any reason:
… anything in `lib/`"* (`03:19`, `04:20`, `05:18`).

But prompt 02's specification of `src/lib/` (`02:56–72`) does not expose the surface that
prompts 04 and 05 are explicitly told to use. Five separate collisions, one root cause:

**(a) `useAuth` has no admin-token surface.**
`02:64` — *"`auth.jsx` AuthProvider + useAuth(). Holds `{ user, token, login, register,
logout }`."* Then `02:67` — *"Separate adminToken under its own localStorage key"* — but
`adminToken` is never added to the exported object.
`05:34` — *"`AdminLogin` posts to `/api/admin/login` and stores the returned token **via
`useAuth`'s separate admin key**."*
*Breaks:* there is no such setter and no such getter. Prompt 05 either edits
`src/lib/auth.jsx` (destroying whatever 02 wrote) or writes `localStorage` directly, and then
`AdminLayout`'s redirect-when-absent check reads a key nothing else knows about.
*Fix:* change `02:64` to `Holds { user, token, adminToken, login, register, logout,
adminLogin, adminLogout }`.

**(b) `lib/api.js` attaches exactly one token, and there are two.**
`02:57` — *"`api.js` fetch wrapper: prefixes VITE_API_URL, **attaches the bearer token** from
localStorage"* — singular. SPEC.md:244 confirms both kinds travel in the same header:
*"`Authorization: Bearer <token>` where token is a user `_id` or the admin token."*
*Breaks:* if `api.js` prefers the user token, every `/api/admin/*` call 401s. If it prefers
the admin token when present, then an admin who is also logged in as a shopper sends
`ADMIN_TOKEN` to `POST /orders`, `requireUser` finds no user with that `_id`, and checkout
401s. Either way one of prompts 04/05 is broken and neither may fix it. This is also the
mechanism behind prompt 06's *"Two sessions at once"* check (`06:56`) — it is guaranteed to
fail, and 06 will have to rewrite `api.js` under time pressure at the end.
*Fix:* `02:57` — `Exports get/post/put/del, each taking an options object; { admin: true }
sends the admin token instead of the user token.`

**(c) `lib/api.js` is JSON-only; the admin uploader needs multipart.**
`02:57` — *"parses JSON"*. `05:77` — *"Images: multi-file upload, one `POST
/api/admin/upload` per file"*, against a route that is *"`multipart/form-data`, field
`file`"* (SPEC.md:309).
*Breaks:* prompt 05 must either edit `api.js` or hand-roll a `fetch` with its own
auth-header logic, duplicating (b) and diverging from it.
*Fix:* add to `02:57` — `If the body is a FormData, pass it through untouched and set no
Content-Type.` Separately, `05:79` — *"Upload progress per file"* — is not achievable with
`fetch` at all (no upload progress events; that needs `XMLHttpRequest`). Change it to
*"a per-file pending / done / failed indicator"*.

**(d) Checkout can add an address but cannot store it.**
`04:56` — *"radio-style cards from `useAuth().user.addresses`"* and *"An 'Add new address'
form posts to `POST /api/users/me/addresses` and **selects the new address on success**"*.
The route *"Returns the updated address list"* (SPEC.md:274) — but `useAuth` exports no
`setUser` or `refreshUser` (`02:64`).
*Breaks:* the new list lives in Checkout's local state only. Navigate away and back, or land
on `/order/:id` and return, and the address is gone from the picker while sitting in Mongo.
Related: SPEC.md:264–265 says register and login *"Returns `{ token, user }`"* without
stating whether `user` includes `addresses`; only `/auth/me` promises them explicitly
(SPEC.md:266). A freshly-registered user goes to Checkout with `user.addresses` possibly
`undefined`, which is a crash, not an empty state.
*Fix:* `02:64` — add `refreshUser()` to the exported surface (it just re-calls
`GET /auth/me`). SPEC.md:264–265 — state that register/login return the same user shape as
`/auth/me`.

**(e) Cart lines carry no `slug`, and there is no product-by-id route.**
`02:68` — *"Lines are `{ productId, name, image, price, gstRate, minOrderQty, stockQty,
qty }`"*. `04:40` — *"Line items: thumbnail, **name linking to the product**"*. The product
route is `/p/:slug` (SPEC.md:333) and the only detail route is `GET /products/:slug`
(SPEC.md:254) — there is no `GET /products/:id`.
*Breaks:* Cart cannot build the link at all. It also makes S1-2 unfixable, because Checkout
has no key with which to re-fetch a cart product.
*Fix:* `02:68` — add `slug` to the cart line shape.

---

### S1-2. The checkout total is guaranteed to diverge from the server total, and nothing reconciles it

`04:67` — *"Compute the displayed figures with exactly the arithmetic in SPEC.md section 2 …
so the number on this screen matches what the server independently computes."*

The arithmetic matching is not the problem — the *inputs* are. `04:74` — *"The server
reprices from the database because the cart is `localStorage` and its prices go stale the
moment the admin edits a product."* Checkout's display maths runs on those same stale
`localStorage` prices. Identical formula, different `unitPrice`, different total.

*Breaks:* exactly the scenario prompt 06 is told to verify — `06:51` — *"the user should not
be shown a total that then changes on them without explanation."* As specified, they always
are, whenever a price moved. There is no route that reprices a cart before submission:
`GET /products` filters by category/subcategory/`q` only (SPEC.md:253), and there is no
by-id lookup (see S1-1e). Prompt 06 will be asked to fix an architectural hole with no
API to fix it against.

*Smallest fix:* one line in SPEC.md section 4 under Public —
`| GET | /products/by-ids | Query: ids (comma-separated). Same trimmed shape as /products. Lets checkout refresh cart prices before submitting. |`
and one line in `04`: *"On mount, refresh every cart line's price and stockQty from
`GET /api/products/by-ids`, then compute the breakdown from the refreshed values."*
Cheaper alternative if you would rather not add a route: have Checkout POST the order first
and show the server's returned breakdown as the confirmation — but that means the user
sees no total before committing, which is worse.

---

### S1-3. `formatINR` is prescribed as the value for the price *input* — it round-trips to a 100× error

`05:67` — *"The input shows rupees; convert with `rupeesToPaise` on submit and **render with
`formatINR` when loading an existing product**."*

`formatINR(paise)` produces `"₹240.00"` (SPEC.md:69, `02:61`). Feed that back through
`rupeesToPaise` and, with the obvious implementation:

```
rupeesToPaise("₹240.00")   -> NaN        // price becomes NaN in Mongo
rupeesToPaise("2,480.00")  -> 200        // ₹2,480 silently becomes ₹2.00
```

*Breaks:* editing any existing product corrupts its price — the precise bug `05:69` calls
*"the single most likely bug in this whole build"*, written into the instruction meant to
prevent it. It also violates SPEC.md:69: *"One display helper, `formatINR(paise)`, is the
only place a rupee string is produced"* — an input `value` is not a display string.
*Fix:* `05:67` — *"render `paise / 100` as the input value; `formatINR` is for display only,
never for a form value."* Same wording applies to `05:97` (AdminSettings delivery fee).
Also worth hardening `rupeesToPaise` at its own site (`02:61`) to reject non-numeric input
rather than return `NaN`, and using `<input type="number" step="0.01" min="0" required>` so
the browser refuses the bad input for free.

---

### S1-4. `sort` has no defined vocabulary — the sort control will be silently dead

SPEC.md:253 — *"Query: `category`, `subcategory` (slugs), `q`, `sort`."* No values are ever
enumerated. `03:37` establishes exactly one by example — `sort=newest` — and `03:48` demands
four: *"Sort control: Newest, Price low to high, Price high to low, Rating."*

*Breaks:* prompt 01 invents three strings, prompt 03 invents three different ones
(`price-asc` vs `priceAsc` vs `price_low`), and the control renders, changes the URL, and
reorders nothing. Silent, and nobody's Done-when catches it: `01:141` only tests
`?category=wound-care`, and `03:98` walks pages without asserting order.
*Fix:* SPEC.md:253 — `sort ∈ newest | price-asc | price-desc | rating. Default newest.
Unknown values fall back to newest.`

---

### S1-5. `images[0]` — field name and type are ambiguous, and two agents guess in parallel

SPEC.md:257 — *"`/products` list responses omit `description` and return only `images[0]`"*.

Two readings: the field stays `images` and is truncated to one element, or it becomes a
scalar `image`. Prompt 01 writes the backend and prompt 02 writes `ProductCard` at the same
time, from this one sentence, with no database to check against (`01:147`).
*Breaks:* a coin-flip on every product image on Home, Category and Search. Grids render with
broken images and it looks like a data problem, not a contract problem.
*Fix:* SPEC.md:257 — *"…return `images` truncated to a single element (`images: [url]`) —
the field name and array type are unchanged so `ProductCard` reads `images[0]` either way."*

---

## S2 — A screen cannot be built as specified, or two documents contradict

### S2-1. `AdminReviews` cannot render its own rows

`05:92` — *"Each row: **product name linking to the public page**, reviewer, stars, text,
date"*. The `reviews` schema (SPEC.md:176–185) has `productId` and nothing else about the
product, and `GET /admin/reviews` (SPEC.md:310) says only *"Query `status`. Default
`pending`."* No name, no slug, and the public link needs `/p/:slug`.
*Fix:* SPEC.md:310 — *"Populates `productId` with `{ _id, name, slug }`."*

### S2-2. `AdminCategories` product count has no source

`05:57` — *"list with name, slug, subcategory count, **product count**"*. `GET /categories`
returns the tree only (SPEC.md:252); there is no `GET /admin/categories` at all. The count
exists nowhere except inside the 409 delete message (SPEC.md:318).
*Fix:* SPEC.md:252 — *"Admin callers may pass `?counts=1` to include `productCount` per
category and per subcategory."* (Deriving it client-side from `GET /admin/products` also
works, but that route returns *"every field"* including full descriptions — a needless
payload just to count.)

### S2-3. `AdminProducts` has ids where it needs names

`05:62` — *"table: thumbnail, name, **category › subcategory**, price, stock, GST rate"*.
Products store `categoryId` / `subcategoryId` only (SPEC.md:164–165), and `GET
/admin/products` is not specified to populate them. Subcategories are embedded, so the
lookup is a scan of the category tree, not a `populate`.
*Fix:* one line at SPEC.md:308 — either *"…plus `categoryName` and `subcategoryName`"*, or
*"the admin joins these against `GET /categories`"*. Say which; do not leave it to the agent.

### S2-4. "GST (one line, with the rate)" is unrepresentable for the order prompt 04 must test

SPEC.md:99 — *"| Checkout | Full breakdown: subtotal, **GST (one line, with the rate)**,
delivery fee, grand total. |"*

There is no single rate in a mixed-rate cart. Prompt 01 seeds *"GST at 5% or 12% depending
on the item"* (`01:110`) and prompt 04's Done-when step 2 requires *"Add two products with
**different GST rates** to the cart"* (`04:112`). Prompt 04's own mock (`04:59–65`) quietly
drops the rate, contradicting the spec — its `₹2,480.00 → ₹297.60` is a pure-12% order.
*Breaks:* three agents each invent a label ("GST", "GST (mixed)", "GST 5% + 12%") and
prompt 06's consistency sweep has no rule to judge them against.
*Fix:* SPEC.md:99 — *"GST — one line, labelled with the rate when every line shares one rate,
otherwise just 'GST'."*

### S2-5. Four prompts link to a "full catalogue" page that does not exist

`03:32` (*"a primary CTA into the catalogue"*), `03:78` (*"a link back to the full
catalogue"*), `04:44` (*"`EmptyState` with a 'Browse catalogue' action"*), `04:95`
(*"`EmptyState` with a catalogue link"*). SPEC.md section 5 has no all-products route — only
`/c/:categorySlug`. `/search` with an empty `q` is explicitly *not* it: `03:79` — *"An empty
or missing `q` prompts for a search term rather than fetching."*
*Breaks:* each agent picks a different destination, and Home's hero CTA plausibly links to
Home. Worse: if you fix this by **adding a route, you must edit `App.jsx` after Wave 2 has
started** — the exact thing the wave structure forbids. Decide now.
*Fix (no new route):* define the destination as the header's category dropdown target — i.e.
all four link to the first category, or to `/` with the grid anchored. *Fix (new route,
before Wave 2):* add `| /c | All products, no category filter. |` to SPEC.md section 5 and
have prompt 02 wire it to the same `Category.jsx` prompt 03 already owns.

### S2-6. `AdminLayout` needs to be a route parent, and route parents live in `App.jsx`

`05:13` lists `AdminLayout.jsx` among prompt 05's files, and `05:35` — *"`AdminLayout`
redirects to the login screen when that token is absent"* — describes a wrapper around all
nine admin screens. The natural React Router shape is `<Route element={<AdminLayout/>}>` with
an `<Outlet/>`, which is a change to `App.jsx` (prompt 02's file). Prompt 02's routing
section (`02:105–112`) never mentions `AdminLayout`.
*Breaks:* prompt 05 either edits `App.jsx` (silent overwrite) or wraps each of its nine
screens individually. Both work; nobody says which, and if 02 *did* nest them and 05 also
wraps, the sidebar renders twice.
*Fix:* one line in `02:105` — *"Wrap all admin routes in a layout route rendering
`admin/AdminLayout.jsx`, which renders `<Outlet/>`."* Then say so in `05:35` too.

### S2-7. The 400-on-order message must be located by string-matching a product name

`04:78` — *"On 400, display the server's message verbatim **and next to the offending line
item**"*. SPEC.md:241 defines the error body as `{ error: "human readable message" }` and
nothing else. The only way to find the line is to substring-search the message for each
cart line's name — fragile, and it breaks on any product whose name is a substring of
another's.
*Fix:* SPEC.md:241 or the `POST /orders` section — *"Validation errors additionally carry
the offending `productId`: `{ error, productId }`."*

### S2-8. Wave 2's Done-when requires a seeded database the README says the agents do not have

`03:96`, `04:108` and `05:111` all open with *"With the backend running and seeded"*.
`prompts/README.md:60` puts that on the human: *"Create `backend/.env` … and put your MongoDB
connection string in `MONGODB_URI`"*, and `README.md:69` — *"The agents build against the
schema; they have no database to test against."*
*Breaks:* all three Wave-2 agents reach a verification block they cannot run. Each has an
escape hatch for chrome-devtools being unavailable (`03:108`, `04:126`, `05:127`) but none
for the database being unavailable, so the likely outcome is a silently skipped check or a
stalled agent.
*Fix:* either seed the database before launching Wave 2 (correct answer — it is a
prerequisite, not a nice-to-have), or add to each brief the same sentence prompt 01 has at
`01:147`: *"If you have no database, say so plainly rather than claiming the flows were
verified."*

---

## S3 — Design system: contrast claims and mandated failures

I recomputed all five stated ratios and every other pair the document assigns a use to
(WCAG 2.x relative luminance, sRGB).

| Pair | Doc claims | Actual | Doc's assigned use | Verdict |
|---|---|---|---|---|
| `copper-600` on `paper` | ~3.3 | **3.57** | large text only | number wrong, conclusion right |
| `copper-700` on `paper` | ~5.2 | **5.52** | small text | number wrong, conclusion right |
| `ink` on `paper` | ~14 | **13.56** | body | number wrong, conclusion right |
| `white` on `forest-700` | ~11 | **11.25** | header, primary button | fine |
| `ink-muted` on `paper` | ~5.3 | **5.07** | secondary text | optimistic; still passes 4.5 |

### S3-1. The accent button fails AA, and the document mandates it

`DESIGN-SYSTEM.md:126` — *"**Button, accent** — `copper-600` fill, white text … reserved for
the single most important action (Add to cart, Place order)."*

**white on `copper-600` = 3.79:1.** Button text is `text-base` / 1rem (`DESIGN-SYSTEM.md:68`),
which is normal text under WCAG — the bar is 4.5:1. So the two most important buttons in the
application fail AA. Not stated anywhere in the document.

Worse, `06:70` sends prompt 06 to fix this with an escape hatch that does not reach it:
*"Fix contrast failures using the design system's own escape hatch: small copper text becomes
`copper-700`, never a colour that isn't in the token set."* A white-on-copper **fill** is not
copper text. Prompt 06 will find the failure (it runs `a11y-debugging` on the product page
and checkout, `06:70`) and have no sanctioned move.
*Fix:* `DESIGN-SYSTEM.md:126` — accent button fill becomes `copper-700` (**white on
`copper-700` = 5.86:1**, passes). The token already exists; nothing else changes.

### S3-2. The out-of-stock badge fails AA, and the document mandates it

`DESIGN-SYSTEM.md:132` — *"**Stock badge** — … Out of stock: `line` fill, `ink-muted` text."*
**`ink-muted` on `line` = 4.08:1**, and badges are `text-xs` / 0.75rem
(`DESIGN-SYSTEM.md:66`). Normal-size text, needs 4.5.
*Fix:* use `ink` on `line` (**11.6:1**) — still neutral, still *"never red"*, still reads as
a fact rather than an error.

### S3-3. The cart count pill is nearly invisible against the header it sits on

`DESIGN-SYSTEM.md:140` — *"**Header** — `forest-700` … cart count as a `copper-600` pill."*
**`copper-600` on `forest-700` = 2.97:1** — below the 3:1 minimum for a UI component
boundary, so the pill barely separates from the header. And the digit inside it is white on
`copper-600` = **3.79:1** at `text-xs`, failing AA a second time in the same 20-pixel-wide
element.
*Fix:* white pill fill with `forest-700` text (11.25:1), or `copper-600` fill with `ink` text
(**5.1:1** on copper-600) — the latter keeps the copper accent the brand wants.

### S3-4. The document contradicts itself on the price colour

`DESIGN-SYSTEM.md:39` — *"Prices, which are large and bold → `copper-600` is fine."*
`DESIGN-SYSTEM.md:127` — *"**Price** — `copper-700`, Inter 600."*
Prompt 02 follows the second (`02:91`). The second is also the *correct* one: prices appear at
`text-lg` (*"prices in cart"*, `DESIGN-SYSTEM.md:69`), and 18px at weight 600 is **not** WCAG
"large text" — that needs 18.66px bold or 24px regular. At `text-lg`, `copper-600` (3.57:1)
fails.
*Fix:* delete the sentence at `DESIGN-SYSTEM.md:39`. `copper-700` everywhere for prices; the
contrast rule then reduces to *"copper text is always `copper-700`; `copper-600` is for fills
and the star glyphs only"*, which is simpler and has no exceptions to remember.
(`copper-600` stars on `paper` at 3.57:1 do clear the 3:1 non-text bar — those are fine.)

### S3-5. Two mandated colours are not in the token set

- `DESIGN-SYSTEM.md:141` — *"**Footer** — `forest-900`, **muted white** text."* There is no
  muted-white token, and `DESIGN-SYSTEM.md:8` forbids inventing one: *"Do not invent a
  colour … that is not on this page."* Three agents will each pick a different opacity.
  *Fix:* name it — `forest-100` on `forest-900` is **11.67:1** and already a token.
- **No order-status badge colours are defined at all.** `04:104` — *"Status badges use the
  design system's badge colours"* — for five statuses (`paymentPending`, `placed`, `shipped`,
  `delivered`, `cancelled`) against a palette of `forest-100`, `line` and `danger`. Prompts
  04, 05 and 06 all render status badges and will produce three different mappings. And an
  agent that decides it needs a sixth token has to edit `index.css`, which is prompt 02's.
  *Fix:* add a five-row status→token table to `DESIGN-SYSTEM.md` before Wave 2:
  `paymentPending`/`placed` → `line`+`ink`, `shipped` → `forest-100`+`forest-700`,
  `delivered` → `forest-700`+white, `cancelled` → `danger` tint. Any consistent mapping will
  do; the point is that one exists.

### S3-6. No radio or checkbox is specified, and checkout needs radios

`02:76` lists `Button Input Select Textarea` — no radio, no checkbox. `04:56` — *"radio-style
cards from `useAuth().user.addresses`"*, and page-local components are required to stay inside
the page file (`04:24`). So the address picker's radio styling is invented in `Checkout.jsx`
with no rule to match, and prompt 06's consistency sweep (`06:78`) has nothing to check it
against.
*Fix:* one line in `DESIGN-SYSTEM.md` Components — *"**Radio / checkbox** — 20px, 1px `line`
border, `forest-700` when checked, label to the right, whole row clickable, 44px tap
target."*

---

## S4 — Undefined behaviour and undefended states

Each of these is a state a screen can reach with nothing describing it. All are one-line
fixes; none blocks Wave 2 on its own.

1. **Cancelling an order does not restore stock.** `POST /orders` step 5 decrements
   (SPEC.md:292); `PUT /admin/orders/:id` accepts `cancelled` (SPEC.md:314) and says only
   *"Validate against the enum."* Inventory leaks on every cancellation, silently.
   *Fix:* one sentence at SPEC.md:314 — restore it, or declare it a known hole with a
   `ponytail:` comment, but say which.
2. **`pendingOrders` and `revenuePaise` are undefined over statuses.** SPEC.md:316. Is
   "pending" `paymentPending`, or everything before `shipped`? Does revenue include
   `cancelled` and `paymentPending` orders — i.e. money that never arrived? The dashboard's
   headline number is currently unspecified. And `05:50` — *"Pending orders … link to their
   filtered list"* — needs a concrete `?status=` value to link to.
3. **The out-of-stock dashboard tile cannot link to a filtered list.** `05:50` requires it;
   `GET /admin/products` supports only `q` (SPEC.md:308). No stock filter exists.
   *Fix:* add `?stock=out` to SPEC.md:308, or tell prompt 05 to filter client-side.
4. **`GET /products?category=<unknown-slug>` is undefined.** 404, or `{ items: [], total: 0 }`?
   `03:52` requires distinguishing them: *"An unknown slug shows a 'category not found' empty
   state"* versus `03:49`'s *"`EmptyState` when the category has no products"*. The page can
   tell them apart via the categories tree it already fetches for the chips — but say so.
5. **A user's own pending review is invisible to them.** `GET /products/:slug` returns
   approved reviews only (SPEC.md:188), so after a reload the review form reappears and
   submitting again returns 409. `03:71` handles the 409 gracefully, so it degrades
   acceptably rather than breaking — but it is a confusing state nobody described.
6. **No SPA deep-link fallback is specified or verified for the frontend.** SPEC.md section 7
   and `06:88–100` cover `backend/vercel.json` carefully and say nothing about the frontend.
   If Vercel's Vite preset does not add an index.html catch-all, refreshing `/p/some-slug` or
   any `/ops-desk/*` URL 404s in production — and every admin route is deep-linked by
   definition. *Fix:* add to `06` Part 5 — *"confirm a hard refresh on `/p/<slug>` and on an
   admin route serves the app, not a 404."*
7. **Multi-item order validation failures.** `POST /orders` step 2 says *"400 naming any that
   vanished"* (plural) and step 3 *"400 naming the offending product"* (singular). One error
   or a list? Undefined, and prompt 04 renders it per-line.
8. **`PUT /admin/settings` return shape is unspecified** (SPEC.md:315). `05:97` needs to
   confirm the save. One word: *"Returns the updated settings document."*
9. **Prompt 02's "no console errors" is unachievable as scoped.** `02:116` — *"`npm run dev`
   starts clean, no console errors and no warnings"* — while `02:131` says *"The backend may
   not be running while you work."* The Header fetches `GET /api/categories` on mount
   (`02:98`); with no backend that logs a network error the page cannot suppress.
   *Fix:* `02:116` — *"…no console errors other than the failed category fetch when the
   backend is down."*

---

## S5 — Cosmetic and documentation

1. **Three of the five stated contrast numbers are wrong** (table above: 3.3→3.57,
   5.2→5.52, 5.3→5.07, and 14→13.56). Every *conclusion* the document draws from them holds,
   so nothing built on them is wrong. Worth correcting so the next reader trusts the page —
   and note `ink-muted` on `paper` is 5.07, not the comfortable 5.3 claimed; that is the
   thinnest margin in the palette and it is the most-used secondary text pairing.
2. **Tailwind v4 `@theme` cannot express three things the design system states.**
   `02:36` says *"Tokens go in `src/index.css`: `@theme { …every token from
   DESIGN-SYSTEM.md }`"*. Taken literally:
   - `DESIGN-SYSTEM.md:95` defines a bare `--shadow:`. `--shadow` is not a v4 theme namespace
     key — the namespace is `--shadow-*` — so inside `@theme` it generates no utility.
     *Fix:* rename to `--shadow-card`, giving a real `shadow-card` utility.
   - *"use these seven sizes and no others"* (`DESIGN-SYSTEM.md:62`) and *"Radius: three
     values only"* (`:83`) are not enforceable by adding tokens — v4 ships `text-xs`
     through `text-9xl` and a full radius scale regardless. The scale also **skips `text-xl`
     and `text-4xl`**, which stay live at Tailwind's defaults, and it **redefines `text-3xl`
     (2rem vs v4's 1.875rem) and `text-5xl` (2.75rem vs 3rem)** — so an agent reaching for
     `text-xl` out of habit gets a silently off-scale size that prompt 06 then has to hunt.
     *Fix:* `02:36` — *"emit `--text-*: initial;` and `--radius-*: initial;` before defining
     the seven sizes and three radii, so off-scale utilities stop existing."*
   - *"Spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Nothing between."* (`:81`) — v4's
     spacing is a single `--spacing` multiplier that generates every multiple dynamically;
     `p-5` (20px) will always work. This is a convention prompt 06 must police, not a config
     it can enforce. Worth saying so in the document.
3. **Prompt 06 Part 4 would delete something prompt 03 is told to build.** `06:85` — *"Any
   GST or delivery figure shown on a listing, product page, or cart. Those belong to checkout
   alone."* But `03:59` requires the product page to show *"A small specification list: HSN
   code, **GST rate**, minimum order quantity, pieces available"*, and SPEC.md:97 requires the
   `+ GST` note on cards. A GST *rate* is a product specification; a GST *amount* is what the
   client wants hidden until checkout.
   *Fix:* `06:85` — *"Any GST **amount** or delivery figure…"*. The rate and the `+ GST`
   marker are explicitly allowed.
4. **`prompts/README.md`'s ownership table is incomplete.** Line 25 omits
   `frontend/.env.example`, which `02:13` claims, and the table never records that prompt 02
   creates the stub files in `src/pages/` and `src/admin/` that prompts 03/04/05 then own —
   the one temporal handoff in the whole plan is the one thing the table does not show.
5. **`formatINR`'s grouping is not pinned.** SPEC.md:69 gives only `"₹240.00"`, which does not
   distinguish Indian from Western grouping. They diverge at ₹1 lakh — `₹1,00,000.00` versus
   `₹100,000.00` — which the dashboard revenue tile (`05:48`) will reach immediately.
   *Fix:* `02:61` — *"`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`."*
   Verified: that produces `₹240.00`, `₹2,480.00`, `₹1,00,000.00`.
6. **`05:63` — *"Out-of-stock rows visually flagged"*** invites red, which
   `DESIGN-SYSTEM.md:133` forbids: *"**Never red.** Out of stock is a fact, not an error."*
   One word — *"neutrally flagged"* — closes it.

---

## Clean — checked, nothing found

**Route and file ownership is genuinely disjoint and complete.** I mapped all 12 shop routes
and all 10 admin routes in SPEC.md section 5 against the three Wave-2 briefs. 11 shop page
files (03 owns 5: Home, Category serving both `/c` shapes, Product, Search, NotFound; 04 owns
6: Login, Register, Cart, Checkout, OrderSuccess, Orders) plus 10 files under `src/admin/`
(ProductForm serving both `/products/new` and `/products/:id`, AdminLayout not a route). Every
route has exactly one owner; no file is claimed twice; no route is unowned. No Wave-2 brief
asks for a new dependency, so `package.json` is safe. The collisions are not in the route
table — they are in the `src/lib/` surface (S1-1), in `App.jsx` route nesting (S2-6), in
`index.css` tokens that do not exist (S3-5), and in the route that section 5 is missing
(S2-5).

**The section 2 money arithmetic is correct.** Worked by hand and verified numerically:

```
line A  ₹123.45 × 3 @ 5%   sub 37035  gst round(1851.75) = 1852
line B   ₹99.99 × 7 @ 12%  sub 69993  gst round(8399.16) = 8399
line C   ₹40.00 × 1 @ 0%   sub  4000  gst                =    0
subtotal 111028   gstTotal 10251   delivery 4000   grandTotal 125279
line-item invoice: Σ(lineSubtotal + lineGst) + delivery = 125279   ✓ identical
```

Per-line rounding then summing is exactly what a line-item invoice shows — the rule at
SPEC.md:90 is right and its stated rationale is real (3 lines of ₹10.02 × 2 @ 5% gives
GST 300 per-line versus 301 rounded once at the end). I also checked the float question:
`Math.round(lineSubtotal * gstRate / 100)` as written is exact — I enumerated all 140,000
exact-`.5` cases across rates 5/12/18 up to ₹20,000 line subtotals and found zero
mis-roundings, because the true quotient is representable. The multiply-then-divide **order
is load-bearing** though, and one thing is missing from the test list: `01:69` asks for *"a
single line item, a mixed-rate order, an amount that forces a rounding decision, and a
zero-GST line"* — every one of those passes under either rounding strategy. Add the case that
actually pins the rule: **three lines of `unitPrice 1002, qty 2, gstRate 5` must give
`gstTotal 300`, not 301.**

The two genuine money problems are not in the arithmetic. They are S1-3 (the `formatINR`
round-trip, a real 100× error) and S1-2 (stale cart inputs feeding correct maths).

---

## Fix list, in launch order

Before Wave 2 starts — these are the ones that cost ten times more after the code exists:

1. `prompts/02-frontend-shell.md:56–72` — expand the `src/lib/` surface: `adminToken` +
   `adminLogin`/`adminLogout` and `refreshUser` on `useAuth`; per-request token selection and
   FormData pass-through on `api.js`; `slug` on the cart line. **(S1-1)**
2. `prompts/05-admin-panel.md:67` — `paise / 100` as the input value, never `formatINR`.
   **(S1-3)**
3. `docs/SPEC.md:253, :257, :308, :310, :241` — pin the `sort` vocabulary, the `images[0]`
   shape, the admin product/category joins, review population, and `productId` on validation
   errors. **(S1-4, S1-5, S2-1, S2-2, S2-3, S2-7)**
4. `docs/SPEC.md` section 4 — add the cart-reprice lookup, and section 5 — decide the
   catalogue-index route now, while `App.jsx` is still prompt 02's to write. **(S1-2, S2-5)**
5. `docs/DESIGN-SYSTEM.md:126, :132, :140, :39, :141` — accent fill to `copper-700`,
   out-of-stock badge to `ink`, cart pill contrast, delete the copper-600-for-prices sentence,
   name the footer colour, add the order-status badge table. **(S3-1 … S3-5)**
6. Seed the database before launching, or give prompts 03/04/05 prompt 01's honest-reporting
   escape hatch. **(S2-8)**

Everything under S4 and S5 can be fixed by prompt 06 without anyone losing work.

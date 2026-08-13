# AayursurgiTech — Deployment

> ## Verified against the built code on 8 August 2026
>
> This guide was first written by a research agent **before the backend existed**, from
> SPEC §7 alone. It has now been walked step by step against the code as it actually
> shipped, and corrected. The single biggest correction:
>
> **There is no MongoDB. There is no Mongoose. There is no `MONGODB_URI`, and there is no
> `backend/lib/db.js`.** Persistence is a JSON document store in `backend/lib/store.js` —
> one JSON file at `backend/.data/db.json` locally, and **Vercel Blob** when
> `BLOB_READ_WRITE_TOKEN` is present. Every Atlas step in the original draft has been
> replaced. If you find a `MONGODB_URI` anywhere, it is a leftover, not a requirement.
>
> **What this deployment now depends on, in full:**
>
> | Dependency | Why it is load-bearing |
> |---|---|
> | `BLOB_READ_WRITE_TOKEN` | The **only** durable storage in production — holds both the database *and* the product images. Without it the deployed API has an empty catalogue and 500s on every write. §2, §6. |
> | `backend/vercel.json` | Rewrites every path to the function. Destination is **`/api/index.js`**. §3. |
> | `frontend/vercel.json` | SPA catch-all. Was absent at the 8 August verification and **has since been created**; §3 has the contents. Without it every deep link and refresh 404s. §3, §4. |
> | `FRONTEND_URL` on the backend | The entire production CORS allowlist. §11. |
> | `ADMIN_PHONE` / `ADMIN_PASSWORD` / `ADMIN_TOKEN` | The whole admin gate. §7. |
> | `globalThis._store` cache in `lib/store.js` | Survives warm invocations. Confirmed present. Troubleshooting. |
>
> Verified: `backend/api/index.js` exports the app and never calls `listen`. `npm test`
> passes. `backend/.env.example` and `frontend/.env.example` list every variable the code
> reads, with no real values.

Two Vercel projects, one Git repository.

| Project | Root Directory | Framework preset | What it is |
|---|---|---|---|
| `ayursurgitech-api` | `backend` | Other | Express, exported as a serverless handler from `api/index.js` |
| `ayursurgitech-web` | `frontend` | Vite | React SPA, static build in `dist/` |

Names are suggestions. Everything else in this table is not.

Follow the steps in order. The order matters twice: the backend must exist before
the frontend can be told where it is, and the frontend must exist before the
backend can be told to trust it. Step 11 closes that loop.

Every claim in this guide about Vercel behaviour was checked against the live
documentation on **7 August 2026**, and every claim about *this codebase* was checked
against the code on **8 August 2026**. The Blob store's own settings were read from the
Vercel CLI on **9 August 2026**, which retracted one thing this guide previously asserted
in several places — see the retraction in §2. Anything not confirmed any of those ways is
labelled **UNVERIFIED** and says what to do instead of trusting it.

---

## 0. Before you start

You need:

- The repository pushed to GitHub, with `backend/` and `frontend/` at the top level.
- A Vercel account, logged in at <https://vercel.com/dashboard>.
- **No database account.** Persistence is Vercel Blob, created inside the backend
  project at step 6. There is nothing to sign up for separately.
- `.env` committed nowhere. `.env.example` committed for both projects (SPEC §6).
  Verified: `git ls-files` tracks neither `.env` nor `node_modules`.

Do **not** deploy from the repository root as one project. Vercel builds one
Root Directory per project; a single project cannot build both an Express
function and a Vite SPA from sibling directories.

---

## 1. Where the data lives — there is no database server

**Corrected 8 August 2026.** This section used to walk you through creating a MongoDB
Atlas cluster and building a `MONGODB_URI`. **None of that applies.** The build dropped
MongoDB entirely; SPEC §3 records the same decision.

Everything persists through one module, `backend/lib/store.js`, which picks its backing
store at runtime from a single condition:

```js
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
```

| Token present? | Where the data goes | When |
|---|---|---|
| No | `backend/.data/db.json` — a plain JSON file on the local disk | `npm run dev` |
| Yes | Vercel Blob, one object at `store/db.json` | Deployed |

Product images work the same way through `backend/lib/storage.js`: Blob when the token
exists, `backend/.data/uploads/` served by `express.static` when it does not.

Consequences worth knowing before you deploy:

- **There is no connection string, no database user, no IP allowlist, no cluster.** The
  only credential in the whole persistence path is `BLOB_READ_WRITE_TOKEN`, and Vercel
  creates it for you in step 6.
- **`.data/` is gitignored**, so nothing you seeded or uploaded locally travels to
  production. Production starts empty and is seeded in step 12.
- The store is read whole into memory and **rewritten whole on every mutation**. Last
  write wins per document. `lib/store.js` documents that ceiling at the top of the file.
  Fine at this catalogue's size; it is the reason to move to a real database, when that
  day comes, and it lands in that one file.

There is nothing to do in this step. Go to step 2, which is the part that actually bites.

---

## 2. The read-only filesystem trap — why Blob is not optional

**This is not optional, and it is the reason a deployment that works locally fails in
production.** It replaces the old Atlas-allowlist section, and it is the same class of
failure: the thing that is invisible locally and fatal deployed.

**A Vercel Function's filesystem is read-only** apart from `/tmp`, and `/tmp` does not
survive between invocations. So on a deployed backend:

- `backend/.data/db.json` **cannot be written**. Every mutation — register, place order,
  approve a review, change the delivery fee — fails.
- `backend/.data/uploads/` **cannot be written**. Every admin image upload fails.
- Neither file is in the deployment anyway, because `.data/` is gitignored. So even reads
  find nothing: `lib/store.js` treats a missing file as a first run and hands back an
  empty store. **Your shop deploys with an empty catalogue and no error message.**

`BLOB_READ_WRITE_TOKEN` is what switches both modules onto Blob and makes all of that go
away. Set it (step 6) and the same code writes to Blob instead of the disk.

### Symptom table, so you recognise it

| What you see | What it means |
|---|---|
| Site loads, every grid shows its empty state, no errors | Blob token missing → empty store, reads succeeding against nothing |
| `500` on register / place order / any admin save | Blob token missing → `EROFS: read-only file system` on the write |
| Image upload returns a URL, image 404s | Blob token missing → URL points at a local path that does not exist deployed |

All three have the same one-line fix: set `BLOB_READ_WRITE_TOKEN` on the backend project
and redeploy.

### The tradeoff, stated honestly

> **Retracted and rewritten 9 August 2026.** The version of this subsection written on
> 8 August — taking its wording from the comment at the top of the Blob half of
> `lib/store.js` — claimed that **Vercel Blob has no private tier**, that the database
> therefore sat behind a publicly readable URL, and it walked through an attack: read the
> hostname off any product image, swap the path to `store/db.json`, download every user
> record and plain-text password. **That was wrong.** It is retracted here rather than
> quietly deleted, because anyone who read the earlier version may have acted on it.
> Vercel Blob supports private stores, this project's store is private, and the
> image-hostname walk does not apply to a private store — the object is not readable
> without credentials, so there is no URL to swap a path onto.

**The store, as it actually exists.** Read from `vercel blob get-store` on **9 August 2026**:

| | |
|---|---|
| Name | `ayursurgitech-db` |
| Store ID | `store_wGVq3nqI9KGXd0j8` |
| Access | **Private** |
| Base URL | `wgvq3nqi9kgxd0j8.private.blob.vercel-storage.com` |
| Region | `iad1` |
| Billing state | Active |
| Blob count | **0 — the store has never been written to** |

The last row is worth pausing on. Nothing has ever landed in this store, so every statement
in this guide about the deployed Blob path is still a statement about code, not about a run.
Step 13 is where that changes.

**The remaining risk, at its real size.** Passwords are still stored in plain text — SPEC §1
lists that under "known, deliberate holes", so it is agreed demo scope, not an accident. A
private store means they are **not world-readable**: without the store's credentials there is
nothing to fetch. What is left is that anyone holding `BLOB_READ_WRITE_TOKEN`, or with access
to the Vercel project that holds it, can read the whole store, passwords included. That is a
real exposure, and it is why the token belongs on the backend project and nowhere else
(step 7; step 10 point 5). It is also materially smaller than "publicly downloadable", which
is what this document used to say and must not be read as saying any more. The upgrade path
is unchanged and still cheap — `bcrypt.hash` on register, `bcrypt.compare` on login — it is
simply no longer the emergency the retracted passage described.

**A private store changes what the code has to ask for.** `lib/store.js` and `lib/storage.js`
both call `put(..., { access: 'public' })` on every write. That was the old assumption, from
when this guide believed public was the only option, and it does not match a private store.
The code is being corrected separately; what this document is responsible for is describing
the setup that actually exists — a **private** store — and flagging `access: 'public'` as the
superseded assumption wherever it appears below.

**UNVERIFIED — do the images live in this same store?** Both modules read the one
`BLOB_READ_WRITE_TOKEN`, so on the code's own logic they write to the same store, and the
prefix table in step 6 assumes that. The store's name (`ayursurgitech-db`) suggests it was
created for the database. Only one store was inspected on 9 August; whether a second store
exists for images was not checked. See step 6 for why a private store makes the image path
the open question.

> **UNVERIFIED — carried over from `lib/store.js`'s own comment.** The Blob half has never
> been run against real Blob storage. Reads go through Vercel's CDN, whose read-after-write
> behaviour has not been tested here. For a read-modify-write store, a stale read means
> **silent data loss**, not merely a stale page. Treat the deployed store as a
> demonstration, and verify writes land (step 13) rather than assuming they did.

---

## 3. Check the two `vercel.json` files before importing anything

Each project reads the `vercel.json` **inside its own Root Directory**. A
`vercel.json` at the repository root is read by neither project. This is the
single most common reason a rewrite "does nothing".

### `backend/vercel.json` — exists, verified, leave it alone

This is the file as it actually ships. The original draft of this guide guessed
`"destination": "/api"`; the real destination is **`/api/index.js`**, the file path:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index.js" }]
}
```

Every incoming path is routed to the function built from `backend/api/index.js`. There is
no `$schema` key and none is needed — it is an editor convenience, not a requirement.

Also verified in the same pass: **`backend/api/index.js` exports the app and never calls
`listen`.** It is three lines and one import. The local listener lives in a separate file,
`backend/index.js`, which Vercel never loads. See step 7 — the guard the original draft
worried about is unnecessary here, because of how the entry points are split.

### `frontend/vercel.json` — created 8 August 2026, verify it is still there

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Was verified absent on 8 August 2026, and created in the same pass.** The original draft
correctly predicted this would be the most likely thing to be missing, and it was right —
SPEC §7 trap 1 calls for it and nobody had created it. It now exists with exactly the
contents above; this step is a check rather than a task.

**Read section 4 before you decide this file is optional. It is not.** Without it, every
deep link and every refresh 404s, including `/ops-desk/*`, which makes the admin panel look
like it logs you out on refresh.

---

## 4. The SPA deep-link trap — why `frontend/vercel.json` exists

Deploy the Vite SPA with no `vercel.json` and this happens:

- Clicking through the app from the homepage to `/p/gauze-swab`: **works**.
- Pressing F5 on `/p/gauze-swab`: **404**.
- Pasting `https://yoursite.vercel.app/p/gauze-swab` into a fresh tab: **404**.
- Sending that link to the client: **404**, and it looks like the site is broken.
- `/ops-desk/products` on refresh: **404**, so the admin appears to log you out.

The cause is not a bug in your code. `vite build` produces exactly one HTML file,
`dist/index.html`, plus hashed assets in `dist/assets/`. There is no file at
`dist/p/gauze-swab/index.html`, because react-router invents that path in the
browser at runtime. When the browser asks Vercel's CDN for `/p/gauze-swab`
directly, the CDN looks in the build output, finds nothing, and returns 404 —
your JavaScript never loads, so react-router never gets a chance to handle it.

Vercel does **not** fix this automatically for the Vite preset. Verified: Vercel's
own `vercel.json` reference lists the catch-all rewrite as the documented way to
do it, and the community help threads on exactly this symptom all resolve to
adding it manually. Most frameworks Vercel supports use filesystem routing, so
Vercel cannot infer that your project is an SPA. You have to say so.

The fix, in `frontend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Now any path with no matching file serves `index.html`, the bundle loads,
react-router reads `window.location.pathname`, and renders the product page.

### Why this does not break your CSS and JS

`/(.*)` looks like it matches everything, including `/assets/index-a1b2c3.js`.
It does not swallow them, because on Vercel **precedence is given to the
filesystem before rewrites are applied**. A request for a path that really exists
in the build output is served from the build output; the rewrite only runs when
nothing matched. This is why the correct rule is a plain catch-all and why you do
not need to enumerate exceptions.

### Two variations, only if they apply to you

- If you ever set `"cleanUrls": true`, the destination must drop the extension:
  `"destination": "/index"`. Otherwise the rewrite silently stops matching.
- The negative-lookahead form you will find in blog posts,
  `"source": "/((?!api/).*)"`, exists to stop the catch-all eating a project's own
  `/api` routes. **You do not need it.** The frontend project has no API routes;
  the API is a separate Vercel project on a separate domain. Use the plain
  catch-all.

---

## 5. Create the backend project

1. Dashboard → make sure the right team is selected in the team switcher.
2. **Add New…** → **Project**.
3. Under **Import Git Repository**, click **Import** next to your repo.
4. **Before deploying**, click **Edit** next to **Root Directory** and choose
   `backend`. This is the step people skip; without it Vercel builds the repo
   root, finds no entry point, and you get a 404 on every path.
5. **Framework Preset**: **Other**.
6. Leave Build Command empty. There is nothing to build — Vercel bundles
   `api/index.js` as a function.
7. Name it something you will recognise, e.g. `ayursurgitech-api`.
8. **Do not click Deploy yet.** Do steps 6 and 7 first, or the first deployment
   will build without env vars and fail at runtime. If you already clicked
   Deploy, that is fine — you will redeploy at the end of step 7.

To change the Root Directory later: project → **Settings** → **Build and
Deployment** → scroll to **Root Directory**.

---

## 6. Create the Vercel Blob store and get `BLOB_READ_WRITE_TOKEN`

**This is now the most important step in the guide.** In the original draft the Blob store
held product images only, and losing it cost you pictures. In the build as it shipped it
holds **the images *and* the entire database** (step 1). Skip this step and you do not have
a degraded deployment, you have no persistence at all.

Do this from inside the **backend** project, so the token lands on the right
project automatically.

1. Open the backend project → **Storage** in the sidebar.
2. **Create Database** → choose **Blob**.
3. **Continue**, then choose the access mode. **The store already exists and is Private.**

   **Corrected 9 August 2026.** This step used to say set it to **Public**, and to say that
   Public was *the only option because Blob has no private tier*. Both halves were wrong —
   see the retraction in step 2. Blob has a private tier, and `vercel blob get-store`
   reports this project's store as `ayursurgitech-db` / `store_wGVq3nqI9KGXd0j8`, **Access:
   Private**, region `iad1`, currently empty. So for this project the step is a check, not a
   choice: Storage → open the store → confirm it still says Private, then jump to the token
   check below.

   Private is the right mode for a store whose main object is the database. The question it
   opens is images. SPEC §3 stores product images as blob URLs (`images: [String]`) rendered
   straight into `<img src="...">` in the shopper's browser, and a private store's objects
   are not readable by an anonymous browser. **UNVERIFIED — how images served out of a
   private store reach the browser has not been checked here.** Do not assume the `<img>`
   tags simply work; it is the first thing to test at step 13. Plausible shapes are serving
   image bytes through a function that holds the token, or a second Public store for images
   only — but that is reasoning, not a verified design.

   **The access mode cannot be changed after a store is created.** Carried over from the
   7 August documentation pass and *not* re-checked against the private-store feature, so
   treat it as likely rather than certain; if you need a different mode, plan on a new store.

   The code side, and the reason another pass is under way: `lib/storage.js` and
   `lib/store.js` both call `put(..., { access: 'public' })`, written against the old
   public-only assumption. That does not match a private store. The fix is happening in the
   code, not in this guide.

One store holds both, at two prefixes — from the code, since as of 9 August 2026 the store
is empty and neither prefix exists yet:

| Blob path | Written by | Contents |
|---|---|---|
| `store/db.json` | `lib/store.js` | Users, categories, products, reviews, orders, settings |
| `products/<timestamp>-<name>` | `lib/storage.js` | Uploaded product images |

4. Name it and select **Create a new Blob store**. The draft said to name it `Images`; the
   store that actually exists is named **`ayursurgitech-db`**, which is the better name now
   that it holds the database as well.
5. Choose the environments the token is injected into. **Production** and
   **Preview** are preselected. **Also tick Development** — `vercel env pull`
   reads the Development environment, and step 12 (seeding) plus any local
   upload testing needs the token.

Vercel then adds these variables to the project **for you**. You do not create
them by hand:

- `BLOB_READ_WRITE_TOKEN` — the long-lived static read/write token. **This is the
  one SPEC §6 names**, and the one `@vercel/blob` picks up from `process.env` with
  no configuration.
- `BLOB_STORE_ID` — identifies the store.
- `VERCEL_OIDC_TOKEN` — short-lived, auto-rotated; connected stores use
  OIDC-based auth by default and this is issued at runtime.

The last two are new and harmless. SPEC §6 lists only `BLOB_READ_WRITE_TOKEN`,
which is still created and still works — SPEC is incomplete here, not wrong.

Confirm it landed: backend project → **Environment Variables** → search
`BLOB_READ_WRITE_TOKEN`. If it is not there, the store was created at team level
without a project connection. Open the store → **Projects** tab → **Connect
Project**.

**Note the 4.5 MB ceiling.** `POST /api/admin/upload` (SPEC §4) is a server
upload: the file goes browser → your function → Blob. Vercel's maximum request
body size for a function is **4.5 MB**, and a larger file returns
`413 FUNCTION_PAYLOAD_TOO_LARGE` before your code runs. Fine for product photos.
If the client ever needs to upload something bigger, the fix is client uploads via
`@vercel/blob/client`, which bypass the function — a change to the one upload
adapter module SPEC §1 already isolates.

Verified in the code: `backend/routes/admin.js` sets `UPLOAD_LIMIT_MB = 4`, safely under
Vercel's 4.5 MB, and `app.js` turns multer's `LIMIT_FILE_SIZE` into a readable message
that names the limit. So an oversized upload is refused by your own code with a sentence
the admin can act on, rather than by the platform with an opaque 413.

---

## 7. Set the backend environment variables

Backend project → **Environment Variables** in the sidebar. For each one: enter
**Name**, enter **Value**, tick **Production** and **Preview**, click **Save**.

This table is checked against `backend/.env.example` and against every `process.env.` read
in `backend/`, on 8 August 2026. It is the complete list — there are no others.

| Name | Value | Where it comes from |
|---|---|---|
| `ADMIN_PHONE` | `9999999999` | You choose. 10 digits, matches the login form. SPEC §6 default. |
| `ADMIN_PASSWORD` | a real password | You choose. **Change it from `changeme`.** This is the whole admin gate. |
| `ADMIN_TOKEN` | e.g. output of `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"` | You generate. Any long random string. Returned to the admin client on login and compared by `requireAdmin` (SPEC §4). |
| `BLOB_READ_WRITE_TOKEN` | — | **Already set by step 6. Do not type this one in.** Without it there is no persistence at all — step 2. |
| `FRONTEND_URL` | leave until step 11 | The frontend's production URL, which does not exist yet. **In production this is the entire CORS allowlist.** See step 11. |
| `PORT` | **do not set** | Local-only. See below. |
| `BACKEND_URL` | **do not set** | Local-only. Read by `lib/storage.js` solely to build absolute URLs for locally-stored images — the branch that never runs when a Blob token exists. |
| `NODE_ENV` | **do not set** | Vercel sets it to `production` on deployments. Setting it by hand locally would switch off the dev CORS allowance and break your local frontend. |

**`MONGODB_URI` is gone.** The original draft's first row was a Mongo connection string.
Do not set it; nothing reads it. Same for anything named after Mongoose.

### `PORT` does not belong on Vercel

SPEC §6 lists `PORT=4000` because that is what `backend/.env` needs for
`npm run dev` locally. Deployed, there is no port: the Express app is bundled as a
function and invoked per request. Setting `PORT` in the Vercel dashboard changes
nothing.

**Related trap — checked, and the build already avoids it.** The draft warned that
`backend/api/index.js` might call `app.listen(...)` at module scope, and recommended an
`if (!process.env.VERCEL)` guard. Verified on 8 August 2026: **no guard is needed, because
the two entry points are separate files.**

```
backend/app.js        builds and exports the Express app. No listen.
backend/api/index.js  imports app, exports it. This is what Vercel bundles.
backend/index.js      imports app and calls listen. Local dev only; Vercel never loads it.
```

That is a cleaner solution than the guard, so SPEC §7 trap 2 is satisfied by structure
rather than by a conditional. Leave it as it is. If someone later collapses these files
back into one, the guard becomes necessary again.

### Sanity note on secrets

Values are encrypted at rest and visible to anyone with access to the project.
That is fine for this demo. Do not put anything in here you would mind a
collaborator reading.

One consequence, now that the Blob store is private (step 2): `BLOB_READ_WRITE_TOKEN` is
the *whole* boundary around the database, plain-text passwords included. Project access is
store access. Not a reason to panic — it is a demo with fixture data — but it is the reason
that token stays on the backend project and never becomes a `VITE_` variable (step 10).

---

## 8. Deploy the backend and write down its URL

1. Click **Deploy** (or **Deployments** → **Redeploy** if step 5 already
   deployed once).
2. Wait for the build. It should be quick — no build step, just bundling.
3. Copy the production URL from the project's Overview, e.g.
   `https://ayursurgitech-api.vercel.app`.

Smoke test, from your machine:

```bash
curl -i https://ayursurgitech-api.vercel.app/api/settings
```

You want `200` and `{"deliveryFee":<number>}`. Per SPEC §3, `GET /api/settings`
creates the settings document if it is absent, so a success here proves three
things at once: the rewrite reached Express, Express matched the path, and **the Blob
store accepted a write** — which is the most valuable of the three, because it is exactly
what step 2 says fails silently.

A second, cheaper check — the health route, which touches no storage at all:

```bash
curl -i https://ayursurgitech-api.vercel.app/
```

`{"service":"ayursurgitech-api","ok":true}` means the rewrite and the function are fine
even if `/api/settings` is failing. That splits a routing problem from a storage problem
in one request.

Interpret failures:

| Response | Meaning | Fix |
|---|---|---|
| `404` with Vercel's own 404 page | The rewrite did not fire, or Root Directory is wrong | Check `backend/vercel.json` exists **inside** `backend/`. Check Settings → Build and Deployment → Root Directory says `backend`. |
| `404` with `{"error":"No such route: ..."}` | The rewrite fired but Express did not match `/api/settings` | Path mismatch — see below. That wording is your app's own 404 handler in `app.js`. |
| `500`, `EROFS` in the logs | No Blob token; the write hit the read-only filesystem | Step 2, then step 6. |
| `200` but the shop is empty | Blob token missing, or the store was never seeded | Step 2, then step 12. |

**The path question.** With `"destination": "/api/index.js"`, the function receives the
**original** request path — `/api/settings`, not `/settings`. Vercel does not
strip the matched portion before forwarding, so the routes must be mounted to match.
**Verified in `backend/app.js`: they are** — `app.use('/api', publicRoutes)` and its
siblings, plus `app.use('/api/admin', adminRoutes)`. This is documented for Vercel's Services routing
("`GET /api/users` reaches the service as `/api/users`, not `/users`, so mount
your routes accordingly") and is the behaviour every Express-on-Vercel guide
relies on, but I could not find it stated for `api/`-directory functions
specifically — **treat the `curl` above as the actual verification**. If you get
your app's own 404 JSON, the mount prefix is the thing to change, not
`vercel.json`.

Do not continue until this curl returns 200. Everything after this depends on it.

---

## 9. Create the frontend project

1. Dashboard → **Add New…** → **Project**.
2. **Import** the **same repository** again. Vercel allows this; a repo can back
   several projects, capped by your plan's limit.
3. Click **Edit** next to **Root Directory** → choose `frontend`.
4. **Framework Preset**: **Vite**. Build Command `npm run build` and Output
   Directory `dist` are the preset defaults — leave them.
5. Name it e.g. `ayursurgitech-web`.
6. Set the environment variables (step 10) **before** deploying.

---

## 10. Set the frontend environment variables

Frontend project → **Environment Variables**. Tick **Production** and
**Preview** for both.

| Name | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://ayursurgitech-api.vercel.app/api` | The backend URL from step 8, **with `/api` on the end, no trailing slash**. |
| `VITE_ADMIN_PATH` | `ops-desk` | SPEC §5. Change it if you want a less guessable admin path; the code reads it and never hardcodes it. |

`VITE_API_URL` must end in `/api`. SPEC §6's local value is
`http://localhost:4000/api`, and the client builds request URLs by appending
`/products`, `/orders` and so on to it. Drop the `/api` and every single request
404s. Add a trailing slash and you get `//products`.

### `VITE_` variables are baked into the bundle at build time. They are not read at runtime.

Say it out loud once, because the failure mode is genuinely confusing.

Vite's documentation is explicit: `import.meta.env` constants are "statically
replaced at build time", and "variables prefixed with `VITE_` will be exposed in
client-side source code after Vite bundling". At build time `vite build` finds
every `import.meta.env.VITE_API_URL` and substitutes the literal string. The
deployed JavaScript contains `"https://ayursurgitech-api.vercel.app/api"` as text.
There is no lookup at runtime. There is nothing to look up.

Vercel's own documentation says the same thing from the other side: "Changes to
environment variables are not applied to previous deployments, they only apply to
new deployments. You must redeploy your project to update the value of any
variables you change."

**Where it bites:**

1. You deploy the frontend, notice `VITE_API_URL` was wrong, fix it in the Vercel
   dashboard, reload the site — and the old URL is still being requested. The
   dashboard shows the new value. The browser uses the old one. **You must
   redeploy.** Deployments → the latest one → **⋯** → **Redeploy**.
2. You add `VITE_API_URL` *after* the first deploy. That build ran without it, so
   `import.meta.env.VITE_API_URL` was replaced with `undefined` and the app fetches
   `undefined/products`. Redeploy.
3. You change the backend's domain, or add a custom domain, and update
   `VITE_API_URL`. Nothing changes until a redeploy.
4. Preview deployments build with the **Preview** values. If you only ticked
   Production, every preview points at `undefined`.
5. Corollary worth knowing: anything you put in a `VITE_` variable is **public**.
   It is sitting in the bundle in plain text. `ADMIN_TOKEN` must never become a
   `VITE_` variable. It is not one in SPEC §6 — keep it that way.

Rule of thumb: **any change to a `VITE_` variable requires a redeploy. No
exceptions.** Backend variables like `FRONTEND_URL` and `BLOB_READ_WRITE_TOKEN` are read
from `process.env` at request time, so they only need a redeploy because Vercel scopes
variables per deployment — but the `VITE_` ones could not work any other way.

Checked against `frontend/.env.example` and every `import.meta.env.` read in
`frontend/src/` on 8 August 2026: `VITE_API_URL` and `VITE_ADMIN_PATH` are the only two,
and both are listed. (`import.meta.env.DEV` also appears, in `pages/Checkout.jsx`, but
that is Vite's own built-in flag — there is nothing to set.)

---

## 11. Deploy the frontend, then close the CORS loop

### What the CORS code actually does — read this first

`backend/app.js` was changed after this guide was drafted. The real behaviour, verified on
8 August 2026:

```js
const DEV_ORIGINS = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/]
const origins = [
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS),
].filter(Boolean)

app.use(cors({ origin: origins.length ? origins : '*' }))
```

| `NODE_ENV` | `FRONTEND_URL` | Origins allowed |
|---|---|---|
| not production (local dev) | unset | **any** `localhost` / `127.0.0.1` port |
| not production (local dev) | set | that URL **plus** any `localhost` / `127.0.0.1` port |
| `production` (deployed) | set | **exactly** `FRONTEND_URL`, nothing else |
| `production` (deployed) | **unset** | **`*` — wide open.** See the warning below. |

Two things follow that the original draft could not have known:

1. **Locally you no longer need `FRONTEND_URL` at all.** Vite taking 5174 when 5173 is
   busy used to break every request with what looked like "the backend is down". Any
   localhost port is now allowed in dev, so that class of confusion is gone.

2. > **Deploying without `FRONTEND_URL` does not fail closed — it falls back to `*`.**
   > The list becomes empty and the wildcard applies, so *any* website on the internet can
   > call your API from a browser. You will not notice, because your own frontend works
   > perfectly. Step 11 is therefore not just about unblocking your site; it is what stops
   > the API being world-callable. Set it, and redeploy.

### The chicken and egg

SPEC §7: "CORS on the backend allows `FRONTEND_URL` only." True in production, which is
the case that matters here.

- The backend needs `FRONTEND_URL` = the frontend's production URL.
- The frontend's production URL does not exist until the frontend deploys.
- The frontend needs `VITE_API_URL` = the backend's URL, which is why the backend
  had to go first.

So the URLs are known in the order backend → frontend → backend-again. There is
no ordering that avoids one revisit. Resolve it like this:

1. **Deploy the frontend.** Click **Deploy**.
2. **Copy its production URL** from the Overview, e.g.
   `https://ayursurgitech-web.vercel.app`.
3. Open the site. **What you see here depends on whether `FRONTEND_URL` is set on the
   backend, and the draft of this guide got it wrong in one direction:**

   - **`FRONTEND_URL` not set at all** (the likely case, since step 7 told you to leave
     it): the site **works**. The allowlist is empty, so the code falls back to `*` and
     the browser is happy. This is the dangerous case — it looks finished and your API is
     world-callable. **Continue to step 4 anyway.**
   - **`FRONTEND_URL` set, but to the wrong origin** (trailing slash, `http` for `https`,
     a stale domain): the site looks broken, the product grid shows its error state, and
     the console says:

     > Access to fetch at 'https://ayursurgitech-api.vercel.app/api/products' from
     > origin 'https://ayursurgitech-web.vercel.app' has been blocked by CORS
     > policy: No 'Access-Control-Allow-Origin' header is present on the requested
     > resource.

     Do not start debugging the frontend. It is the string in `FRONTEND_URL`.
4. Go to the **backend** project → **Environment Variables** → add:

   | Name | Value |
   |---|---|
   | `FRONTEND_URL` | `https://ayursurgitech-web.vercel.app` |

   **Scheme included, no trailing slash, no path.** A CORS origin is
   `scheme://host[:port]` and nothing else. `https://ayursurgitech-web.vercel.app/`
   with the trailing slash does not string-match the `Origin` header the browser
   sends, and the request stays blocked with an error identical to having set
   nothing.
5. **Redeploy the backend.** Deployments → latest → **⋯** → **Redeploy**. The new
   variable does not reach the running deployment otherwise.
6. Reload the frontend. Products load.

Why no cookie problems: auth is an `Authorization` header in `localStorage`
(SPEC §1), not a cookie, so there is no `SameSite`, no `credentials: 'include'`,
and no third-party-cookie behaviour to work around. `Access-Control-Allow-Origin`
plus allowing the `Authorization` request header is the whole of it.

### Preview deployments will be CORS-blocked, and that is not a bug

Every preview deployment gets a fresh generated hostname
(`ayursurgitech-web-git-branch-team.vercel.app`). `FRONTEND_URL` holds exactly one
origin, so previews of the frontend cannot talk to the production backend. Three
honest options:

- **Do nothing.** Test on production. Correct for a demo, and what SPEC's scope
  section implies.
- Add a **Preview**-scoped `FRONTEND_URL` on the backend pointing at one specific
  preview URL, when you need to demo a branch.
- Widen the backend's CORS check to also accept origins ending in
  `.vercel.app` — a few lines in the CORS setup. It also means any Vercel-hosted
  page anywhere can call your API. Acceptable for a demo, and worth a
  `ponytail:` comment if you do it.

### Custom domain

If you later add a custom domain to the frontend (project → **Settings** →
**Domains**), you must update `FRONTEND_URL` on the backend **and redeploy the
backend**, or the new domain gets CORS-blocked while the old `.vercel.app` one
keeps working. Same trap in the other direction: a custom domain on the *backend*
means updating `VITE_API_URL` **and redeploying the frontend** (step 10).

---

## 12. Seed the production database

> ### ⚠️ The seed script wipes the store.
>
> **Verified path: `backend/seed.js`**, run by `npm run seed`. The original draft guessed
> `backend/scripts/seed.js`, which does not exist.
>
> It clears and repopulates the collections it seeds, then writes the whole document back.
> Pointed at your production Blob store it destroys the real catalogue and, depending on
> what it clears, real `orders`, `users` and `reviews` with it. **There is no undo and
> there are no backups** — the store is a single JSON object overwritten in place, which
> is a weaker position than a database with point-in-time recovery. Run it once, at the
> start, against an empty store. Never again once real orders exist.

There is no "run a script" button on Vercel. Vercel runs your build and your
functions; it does not give you a shell in production. So run the seed **from your
machine, with the production Blob token in the environment** — `lib/store.js` sees
`BLOB_READ_WRITE_TOKEN` and writes to Blob instead of your local `.data/db.json`.

Recommended, using the values Vercel already holds:

```bash
cd backend
npx vercel login
npx vercel link          # select the ayursurgitech-api project
npx vercel env pull .env.production.local --environment=production
```

That writes the production `BLOB_READ_WRITE_TOKEN` into `.env.production.local`. Check it
is gitignored — `vercel link` also creates a `.vercel/` directory, which should be
gitignored too. Both already are in this repo: `.gitignore` covers `.env` and `.vercel`.

Then run the seed with that file's variables loaded. On Node 20.6+ :

```bash
node --env-file=.env.production.local seed.js
```

Or pasting the token in for one command (Git Bash / PowerShell respectively):

```bash
BLOB_READ_WRITE_TOKEN='vercel_blob_rw_...' node seed.js
```

```powershell
$env:BLOB_READ_WRITE_TOKEN='vercel_blob_rw_...'; node seed.js
```

**Sanity check before you press enter:** if `BLOB_READ_WRITE_TOKEN` is *not* in the
environment, the seed silently rewrites your **local** `backend/.data/db.json` instead and
production stays empty. The command looks identical and succeeds either way. The curls
below are how you tell which one happened.

**Verify against the right database.** After seeding, `curl` the live API rather
than trusting the script's output:

```bash
curl -s https://ayursurgitech-api.vercel.app/api/categories
curl -s https://ayursurgitech-api.vercel.app/api/products
```

If the script printed success but these come back empty, the script wrote to your local
`.data/db.json` and not to Blob — the token was missing from the environment when you ran
it. Re-run with `.env.production.local` loaded.

---

## 13. Final verification

Walk this list on the production frontend URL. Each item catches a different one
of the traps above.

- [ ] `/` loads, categories and products visible. *(CORS + seed + `VITE_API_URL`)*
- [ ] Open a product, then **press F5**. The page still renders. *(SPA rewrite)*
- [ ] Paste a `/p/<slug>` URL into a brand-new tab. It renders. *(SPA rewrite)*
- [ ] `/search?q=gauze` returns results and shows the term in the empty state
      when nothing matches.
- [ ] Register a user, add to cart, **refresh**, cart survives. *(localStorage)*
- [ ] Checkout shows subtotal, GST, delivery fee, grand total, and the total
      matches the line items. *(seeded `settings.deliveryFee`)*
- [ ] `/ops-desk/login` loads on a **hard refresh**, and the admin credentials
      from step 7 work. *(SPA rewrite + `ADMIN_PHONE`/`ADMIN_PASSWORD`)*
- [ ] In `/ops-desk/products/new`, upload an image. **Check two things separately: that
      the upload succeeds, and that the image then renders.** The store is private
      (step 2), so the URL is on `wgvq3nqi9kgxd0j8.private.blob.vercel-storage.com`, not
      `*.public.blob.vercel-storage.com` as this checklist used to say. A successful upload
      whose image does not display is the open private-store question in step 6, not a
      token problem. *(`BLOB_READ_WRITE_TOKEN`, private-store read path)*
- [ ] Hard-refresh `/ops-desk/orders`. Still works. *(SPA rewrite)*
- [ ] Place an order as a shopper; it appears in `/ops-desk/orders` and stock
      went down.

---

## Troubleshooting

Two places to look, always:

- **Backend**: project → **Logs** (runtime logs, live). Function errors and
  stack traces land here, not in the browser.
- **Frontend**: the browser's devtools **Console** and **Network** tabs. Nothing
  useful is in Vercel's logs for a static build after it has built.

---

### "Blocked by CORS policy" / "No 'Access-Control-Allow-Origin' header"

The frontend loads, the shell renders, every list shows its error state, console
is full of CORS.

Check in this order:

1. **Exact string match — this is now the answer nearly every time.** Compare the `Origin`
   request header in the Network tab against `FRONTEND_URL`, character for character. Kill
   trailing slashes. Confirm `https` not `http`. Confirm no `/api` or other path snuck onto
   the end. Production matches this string and nothing else.

   Note the inversion versus the original draft, which put "is it set at all?" first: with
   the current code an **unset** `FRONTEND_URL` does not cause a CORS error, it falls back
   to `*` and everything works. So if you are reading a CORS error at all, the variable is
   set and it is set *wrong*. An unset one is a different and quieter problem — step 11.
2. **Did you redeploy the backend after setting it?** The running deployment
   holds the variables it was created with. Deployments → latest → **⋯** →
   **Redeploy**.
3. **Is `NODE_ENV` what you think?** Deployed, Vercel sets it to `production`, which drops
   the `localhost` allowances. That is intended. It also means a CORS error you can only
   reproduce in production is expected behaviour, not a deployment fault.
4. **Are you on a preview URL?** Preview hostnames differ from production and are
   not in `FRONTEND_URL`. See step 11.
5. **Custom domain added recently?** `FRONTEND_URL` still holds the old origin.
6. **Failing request is `OPTIONS`, not `GET`/`POST`.** Any request carrying an
   `Authorization` header triggers a CORS preflight. The backend must answer
   `OPTIONS` on that path with the allow headers, and `Authorization` must be in
   `Access-Control-Allow-Headers`. Standard `cors()` middleware handles this if
   it is mounted **before** the routes, not after.
7. **Response is a 500 and *also* has no CORS header.** Then CORS is a symptom,
   not the cause. Error responses that bypass the CORS middleware appear in the
   browser as CORS failures. Read the backend Logs; you are almost certainly looking at
   the missing-Blob-token failure in step 2 — an `EROFS` write error on a read-only
   filesystem, surfacing in the browser as a CORS message.

---

### 404 on refresh or on a pasted link

Only ever affects paths other than `/`, only on a full page load, never when
clicking within the app. `/p/gauze-swab` and `/ops-desk/products` are the ones
you will hit.

1. Does `frontend/vercel.json` exist, **inside `frontend/`**? A copy at the
   repository root is read by neither project. Section 3.
2. Is the rewrite `{ "source": "/(.*)", "destination": "/index.html" }`? Section 4.
3. Have you **deployed since adding it**? `vercel.json` is applied at build time.
4. Is the frontend project's **Root Directory** `frontend`? Settings → Build and
   Deployment → Root Directory.
5. Is `cleanUrls` set anywhere? If yes, the destination must be `/index`, not
   `/index.html`.
6. Is the 404 Vercel's page or your app's "not found" screen? Your app's screen
   means the rewrite is working correctly and it is a react-router route
   definition problem — a different bug entirely.
7. If `/` 404s too, this is not the SPA trap. Output Directory is wrong (`dist`
   for Vite) or the build produced nothing. Read the build log.

---

### The `globalThis` store cache — confirmed present, and what replaced the Mongo entry

This entry used to describe the uncached-Mongoose-connection failure: cold starts opening
a new pool each time until Atlas refused connections. SPEC §1 and §7 both name it as the
way this deployment shape breaks hardest.

**It no longer applies. There is no connection and no pool.** What SPEC's requirement
translates into for the store that actually shipped is the cache in `backend/lib/store.js`
— verified present on 8 August 2026:

```js
// Vercel reuses the process between invocations; the old Mongoose cache lived here too.
const cache = (globalThis._store ??= { data: null, promise: null, mtime: 0 })
```

The two properties SPEC cared about are both there:

- **It is on `globalThis`, not a module-level variable**, so it survives across invocations
  in a warm instance.
- **The in-flight `promise` is cached, not only the resolved data.** Two concurrent
  requests arriving during a cold start both find `data === null`; without the shared
  promise they would each load and then race to install their own copy. `ready()` caches
  the promise for exactly this reason, and clears it on failure so one transient read error
  does not poison the instance permanently.

So there is nothing to fix here. **What can still go wrong, in its place:**

1. **Every write 500s with `EROFS`** — no Blob token, writes hitting the read-only
   filesystem. Step 2. This is now the top failure mode of this deployment.
2. **A write appears to succeed and then vanishes.** Two invocations that both read, both
   modify and both save inside the same instant lose one of the two edits — the store is
   last-write-wins per document, and the mtime staleness check that protects the local file
   is skipped entirely on the Blob path. `lib/store.js` states this ceiling itself. At demo
   traffic it will not happen; it is not a bug to hunt, it is the design.
3. **A read returns the previous document just after a write.** Blob reads go through
   Vercel's CDN. This is the UNVERIFIED read-after-write concern in step 2, and for a
   read-modify-write store it means silent data loss rather than a stale page.

The honest summary: the cached-connection failure SPEC warns about is gone, and what
replaced it is a store with weaker concurrency guarantees than Mongo had. That is the
accepted trade of dropping the database, not a regression to repair here.

---

### Requests hang, then 504 `FUNCTION_INVOCATION_TIMEOUT`

**Correct a stale assumption first.** The Vercel Hobby limit that people remember
as 10 seconds is gone: with fluid compute, the current documented Node.js max
duration is **300s default and maximum on Hobby**, and 300s default / 800s max on
Pro. Nothing in this app should run for 300 seconds. So a timeout here is almost
never "the function needed more time" — it is a function **waiting on something
that is never going to answer**.

In order of likelihood, **rewritten for the store that actually shipped** — the first two
causes in the original draft were both Atlas, and neither can occur now:

1. **A Blob read that never returns.** `lib/store.js` fetches the store over HTTP with no
   timeout, so an unreachable or very slow Blob endpoint hangs the invocation instead of
   failing it. Check the backend Logs; there is no clean error to look for, which is
   precisely the problem.
2. **A leaked `app.listen()`** in the function keeping the invocation alive. Cannot happen
   in the current file layout — `api/index.js` only exports — but it returns the moment
   somebody merges `index.js` into it. Step 7.
3. **Genuinely slow work.** SPEC §1 chose no pagination, so `GET /products`
   returns the whole catalogue, and `lib/store.js` additionally rewrites the **entire**
   store on every mutation. Both are fine at demo scale. If the catalogue grows into
   thousands of documents, that is when to revisit — the upgrade path is a real database,
   not a bigger `maxDuration`.

Cold start latency itself is a few hundred milliseconds, not seconds. A slow
*first* request after idle is normal; a *timeout* is not, and raising
`maxDuration` in `vercel.json` will not fix any of the four causes above — it
just makes you wait longer for the same error.

If you do need to raise it for something specific, it is per-function in
`backend/vercel.json`:

```json
{
  "functions": { "api/index.js": { "maxDuration": 60 } }
}
```

---

### Image upload fails in the admin panel

Backend Logs will show something like "No token found" or
`BlobError: Access denied, please provide a valid token for this resource`.

1. **Is `BLOB_READ_WRITE_TOKEN` in the backend project's Environment Variables?**
   Step 6 adds it automatically *when the store is created from inside that
   project*. Create the store at team level and it is not connected to anything.
   Fix: open the store → **Projects** tab → connect the backend project.
2. **Is the token scoped to Production?** Open the variable and check which
   environments are ticked. A Preview-only token means production uploads fail.
3. **Did you redeploy the backend after the store was created?** The token is an
   env var like any other and only reaches new deployments.
4. **Is it on the wrong project?** A very easy mistake is connecting the store to
   the frontend project. The frontend never uploads anything — uploads go through
   `POST /api/admin/upload` on the backend. The token belongs on the backend, and
   nowhere else. It must never appear as a `VITE_` variable: that would publish a
   write token to your blob store in the JavaScript bundle.
5. **Failing locally but fine deployed?** `vercel env pull` reads the
   **Development** environment. If Development was not ticked at store creation:
   store → **Projects** tab → **⋯** next to the project → **Update Project
   Connection** → include **Development**. Then pull again.
6. **`413` in the browser, before any log line appears.** The file is over
   Vercel's **4.5 MB** request body limit. Not a token problem — resize the image,
   or move to client uploads. Section 6.
7. **Upload succeeds, image 404s or 403s when displayed.** **Rewritten 9 August 2026.**
   This entry used to treat a Private store as a misconfiguration to undo by creating a
   Public one. The store *is* private, deliberately (step 2), so this is the expected
   consequence rather than a mistake: a private store's objects are not readable by an
   anonymous browser, and `<img src="<blob url>">` is an anonymous browser. **UNVERIFIED —
   the supported way to display images out of a private store has not been checked here.**
   Do not "fix" it by recreating the store as Public; that would put the database back
   behind a world-readable URL, which is exactly what step 2 retracts. Section 6.

---

### Both projects rebuild on every push, even docs-only commits

Expected, and harmless. Vercel's "skip unaffected projects" optimisation requires
npm/yarn/pnpm/Bun **workspaces** with a lockfile at the repository root; this repo
has two independent directories, so every push counts as a global change and both
projects build. Two fast builds. Not worth restructuring the repo for.

---

### A change to `VITE_API_URL` or `VITE_ADMIN_PATH` had no effect

Redeploy the frontend. Read step 10 again. This is not a caching problem, not a
CDN problem, and clearing your browser cache will not help — the old value is
compiled into the deployed JavaScript file, and only a new build produces a file
containing the new one.

---

## Where SPEC §7 is incomplete or misleading

Recorded here rather than edited into SPEC, which is not this document's job.

1. **§7 never mentions the frontend's `vercel.json`.** It specifies one for the
   backend and stops. Without `frontend/vercel.json`, every deep link and every
   refresh 404s. That is section 4 of this guide and the single biggest gap.
2. **§6's `PORT=4000` is meaningless on Vercel.** It is correct for local dev.
   Harmless in the dashboard, but the related `app.listen()` guard is not
   optional. Step 7.
3. **§7 says "CORS on the backend allows `FRONTEND_URL` only" without noting the
   ordering.** Followed literally it is unsatisfiable on a first deploy — the
   value does not exist yet. The resolution is the backend → frontend →
   backend-again sequence in step 11, plus the consequence §7 does not draw:
   **preview deployments of the frontend cannot call the production backend.**
4. **§6 lists `BLOB_READ_WRITE_TOKEN` alone.** Vercel now also injects
   `BLOB_STORE_ID` and `VERCEL_OIDC_TOKEN` and prefers OIDC auth for connected
   stores. `BLOB_READ_WRITE_TOKEN` still exists and still works, so §6 is
   incomplete rather than wrong — but do not be alarmed by the extra variables,
   and do not delete them.
5. **§6 does not say that `VITE_API_URL` must keep its `/api` suffix in
   production.** The local value has it; it is easy to paste a bare backend URL
   into the dashboard and 404 every request. Step 10.
6. **Neither §4 nor §7 mentions Vercel's 4.5 MB request body limit**, which caps
   `POST /admin/upload`. Product photos are fine; a phone camera original at full
   resolution may not be. Section 6.
7. ~~**§7 does not mention the Atlas IP access list.**~~ **Withdrawn 8 August 2026** —
   there is no Atlas cluster and no allowlist. Superseded by point 8.

8. **§7, §6 and §1 are all written around MongoDB, which the build does not use.**
   This is the largest gap and the reason this guide needed a second pass:
   - **§1** says the stack is "Express + Mongoose". It is Express plus a JSON document
     store; there is no Mongoose dependency in `backend/package.json`.
   - **§1's "two things that stay"** names "the Mongoose connection is cached on
     `globalThis`". The requirement survives in spirit and is satisfied by
     `globalThis._store` in `lib/store.js`; the wording names a module that no longer
     exists. There is no `backend/lib/db.js`.
   - **§6** lists `MONGODB_URI` in `backend/.env`. Nothing reads it. It is absent from
     the real `.env.example`, correctly.
   - **§7** says "Atlas network access must allow `0.0.0.0/0` ... without it nothing
     connects at all", and calls it one of the two ways this shape fails hardest. Neither
     applies. The replacement top failure is a missing `BLOB_READ_WRITE_TOKEN` — section 2.

   SPEC §3 *does* carry a note recording that Mongoose is gone, so the document is
   internally inconsistent rather than uniformly stale: §3 was updated and §1, §6 and §7
   were not.

9. **§6 does not list `BACKEND_URL`**, which `lib/storage.js` reads. It only matters for
   local development with no Blob token, so it is a small gap — but `.env.example` now
   lists it and §6 still does not.

10. **Neither §6 nor §7 mentions that a production deploy with `FRONTEND_URL` unset
    serves CORS `*`.** §7 says the backend "allows `FRONTEND_URL` only", which describes
    the configured case and not the default one. Step 11.

11. **§3's image model assumes a publicly readable blob URL; the store is private.**
    Added 9 August 2026. §3 stores `images: [String]` as blob URLs and the frontend renders
    them directly in `<img src="...">`, which works for a public store and is the open
    question for a private one — steps 2, 6 and 13. Reported, not resolved: it may turn out
    §3 is fine and only the serving path changes. Related and smaller: §1's known-holes list
    still says "passwords are plain text **in Mongo**", naming a database this build does
    not have. The hole is real and in scope; only the location is stale.

Nothing in §7 is impossible. The shape it specifies is a standard, well-supported
Vercel deployment — but its persistence half now describes a database this project
does not have.

---

## Verification status of the claims in this guide

### Checked against the built code on **8 August 2026**

| Claim | Status |
|---|---|
| `backend/vercel.json` rewrites `/(.*)` → `/api/index.js` | **Confirmed.** Draft said `/api`; corrected. |
| `backend/api/index.js` exports the app, never calls `listen` | **Confirmed.** The `VERCEL` guard the draft recommended is unnecessary. |
| Routes mounted under `/api`, matching the un-stripped rewrite path | **Confirmed** in `app.js`. |
| The store caches on `globalThis` | **Confirmed** — `globalThis._store` in `lib/store.js`, promise included. |
| `backend/.env.example` lists every `process.env.` read | **Confirmed after a fix** — `BACKEND_URL` was missing and has been added. |
| `frontend/.env.example` lists every `import.meta.env.` read | **Confirmed.** |
| No secret hardcoded in `backend/` | **Confirmed.** Only literal is the seeded demo user's password in `seed.js`, which is fixture data. |
| `.gitignore` covers `node_modules`, `.env`, `dist`, `.vercel`; nothing sensitive tracked | **Confirmed** via `git ls-files` and `git check-ignore`. |
| `UPLOAD_LIMIT_MB` is 4, under Vercel's 4.5 MB | **Confirmed** in `routes/admin.js`. |
| CORS: any localhost port in dev, exactly `FRONTEND_URL` in production | **Confirmed**, plus the undocumented `*` fallback when unset. |
| `npm test` passes | **Confirmed** — `node lib/pricing.test.js`. |
| `frontend/vercel.json` exists | **FALSE — the file is absent.** Section 3. |
| Anything involving MongoDB, Mongoose, `MONGODB_URI`, `lib/db.js` | **FALSE — none of it exists.** Sections 1, 2. |
| `put(..., { access: 'public' })` in `lib/store.js` and `lib/storage.js` | **Confirmed present — and wrong for this store**, which is private. Being fixed in the code. Steps 2, 6. |

### Checked against the live Vercel project on **9 August 2026**

The first facts in this guide that come from the deployed project rather than from the code
or the docs. Source: `vercel blob get-store`.

| Claim | Status |
|---|---|
| Vercel Blob has no private tier | **FALSE.** It has one. Retracted in step 2. |
| The store is `ayursurgitech-db`, `store_wGVq3nqI9KGXd0j8`, region `iad1`, billing active | **Confirmed.** |
| The store's access mode is **Private**, base URL `wgvq3nqi9kgxd0j8.private.blob.vercel-storage.com` | **Confirmed.** |
| The database is publicly downloadable at `<host>/store/db.json` | **FALSE.** Private store; not anonymously readable. Retracted in step 2. |
| The store has ever been written to | **FALSE — blob count 0.** Nothing has landed in it, deployed or seeded. |
| Whether product images share this store or another | **Not checked.** Only this store was inspected. Step 2. |

### Checked against live documentation on **7 August 2026**

Still valid — these are Vercel and Vite behaviours, unaffected by the Mongo removal.
The Atlas entries at the end of this list are the exception and are now moot.

- Two projects from one repo; **Add New… → Project → Import**, **Edit** next to
  **Root Directory**, and later **Settings → Build and Deployment → Root
  Directory** — Vercel *Using Monorepos*.
- The SPA catch-all rewrite `/(.*)` → `/index.html`, and that Vercel does not
  apply it automatically for Vite — Vercel *vercel.json* reference (it is the
  documented SPA example) plus current community threads on the symptom.
- **Filesystem precedence over rewrites**, which is why the catch-all does not
  break `/assets/*` — Vercel routing docs.
- `cleanUrls: true` requiring `/index` instead of `/index.html`.
- `VITE_` variables "statically replaced at build time" and exposed in
  client-side source — Vite *Env Variables and Modes*.
- "Changes to environment variables ... only apply to new deployments. You must
  redeploy" — Vercel *Managing environment variables*.
- Environment variables live at project → **Environment Variables** in the
  sidebar, with per-environment scoping and a **Save** button.
- ~~Atlas `0.0.0.0/0`, its rolling restart, and the 500-connection cap on free clusters.~~
  **Moot as of 8 August 2026** — accurately researched, but this project has no Atlas
  cluster. Retained only so a future reader knows the claims were not wrong, merely
  aimed at a database that was removed.
- Blob: **Storage → Create Database → Blob**, name it, pick environments; Vercel
  then creates `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` and `VERCEL_OIDC_TOKEN`
  automatically; access mode is immutable after creation; `vercel env pull` reads
  the **Development** environment; the **Projects** tab → **Update Project
  Connection** fix — Vercel *Server Uploads with Vercel Blob* and *Vercel Blob*.
  **One item in this pass was wrong: "Blob has no private tier."** It does, and this
  project's store uses it — see step 2. The immutability of the access mode is from the
  same pass and has not been re-checked since; treat it as likely, not certain.
- Function limits: **4.5 MB** request body (`413 FUNCTION_PAYLOAD_TOO_LARGE`),
  Hobby max duration **300s default and maximum**, Pro 300s/800s, concurrency to
  30,000, `504 FUNCTION_INVOCATION_TIMEOUT` — Vercel *Functions Limits*.
- `maxDuration` per-function syntax in `vercel.json`; memory is set in the
  dashboard under **Functions**, not in `vercel.json`, when fluid compute is on.
- Express on Vercel becomes a single function and uses fluid compute by default;
  `express.static()` does **not** serve assets (use `public/**`) — Vercel
  *Express on Vercel*.
- Skipping unaffected monorepo projects requires npm/yarn/pnpm/Bun workspaces.
- `vercel.json` "should be created in your project's root directory", which with a
  Root Directory of `backend`/`frontend` means inside those directories.

**RESOLVED since the draft — these were UNVERIFIED and have now been checked against the
code:**

- ~~`app.listen()` inside `api/index.js`.~~ **Resolved:** it does not call `listen` at all;
  the local listener is a separate file. No guard needed. Step 7.
- ~~The exact seed script path and which collections it clears.~~ **Resolved:**
  `backend/seed.js`, via `npm run seed`. Not `scripts/seed.js`. Step 12.
- ~~Public vs Private Blob store.~~ ~~**Resolved:** both `lib/storage.js` and
  `lib/store.js` call `put(..., { access: 'public' })`, and Blob offers no private tier
  anyway. No conflict.~~ **This "resolution" was wrong and is withdrawn 9 August 2026.**
  Blob has a private tier; `vercel blob get-store` shows the real store as **Private**
  (`ayursurgitech-db` / `store_wGVq3nqI9KGXd0j8`). The `access: 'public'` calls in both
  modules therefore *are* a conflict with the store, and it is being fixed in the code.
  Steps 2 and 6.
- ~~Atlas UI labels.~~ **Moot** — no Atlas.

**STILL UNVERIFIED — from reasoning or convention, not documentation or a live run:**

- **That the function receives the original path** (`/api/settings`, not
  `/settings`) after the `/(.*)` → `/api/index.js` rewrite. Documented for Vercel
  *Services* ("`GET /api/users` reaches the service as `/api/users`") and it is
  what every Express-on-Vercel guide depends on, but not stated for
  `api/`-directory functions. **Verify with the `curl` in step 8**, and treat the
  route mount prefix as the thing to adjust if it comes back wrong.
- **`PORT` being simply ignored if set in the Vercel dashboard.** It is not a
  documented reserved variable name; the guidance here is to leave it out rather
  than rely on it being harmless.
- **The entire Blob half of `lib/store.js`.** Flagged by its own author's comment and
  never run against real Blob storage. Read-after-write behaviour through Vercel's CDN is
  untested, and for a read-modify-write store a stale read is silent data loss. **Nothing
  in this guide has been executed against a live Vercel deployment** — it is verified
  against the code and against Vercel's documentation, not against a running production
  environment. Confirmed from the other side on 9 August 2026: the store's blob count is
  **0**, so no write from any environment has ever landed. Step 13 is where you find out.
  Note that the same comment is the source of the "no private tier" claim retracted in
  step 2 — one wrong line in it does not make the read-after-write warning wrong, but it
  does mean the comment is not evidence on its own.
- **How an image stored in a private Blob store is displayed to an anonymous browser.**
  SPEC §3 assumes a plain blob URL in `<img src>`. That assumption predates the store being
  private and has not been re-checked. Steps 6 and 13.

# Razorpay — the plan, for when the client asks

Payment is stubbed today: `POST /api/orders` creates an order with `status: 'paymentPending'`
and no gateway is involved (SPEC §1, §4). This file is the execution plan for replacing that
stub with real Razorpay. It is a plan, not an implementation — no code in this repo has
changed.

Researched against Razorpay's live documentation on **2026-08-07**. Sources at the bottom.
Anything I could not confirm from the docs is marked **[unverified]** — check it before you
rely on it, because the checkout script and the Orders API have both changed shape over the
years and a confident stale instruction is worse than no instruction.

---

## 0. The one-paragraph version

Server creates a Razorpay order for `order.grandTotal` **paise exactly, no conversion**, and
returns its id to the browser. The browser opens Razorpay's hosted checkout with that id. On
success Razorpay hands the browser three values; the browser posts them to us; the server
recomputes an HMAC-SHA256 signature and only then moves the order from `paymentPending` to
`placed`. A webhook does the same job independently, because the browser cannot be trusted to
still be open. Roughly eleven files, most of a day in test mode, and nothing in the code
blocks on the client's KYC — only the two env values do.

---

## 1. Accounts and keys

### What can be done today, with no business registration

Sign up with an email or a 10-digit phone number and a password, verify the OTP, pick a
business type. That is it — **test mode is available before activation**: "you can access the
Test mode on the Dashboard to test and experience the products offered by Razorpay. Test mode
does not involve actual money transactions."

In test mode, available immediately:

- **Test API keys** — Dashboard → switch to *Test* mode → Account & Settings → API Keys →
  Generate Key. Test mode keys do **not** require the website-details step that live keys do.
- **The full Orders API, the real checkout script, and real signature verification.** The
  integration you build in test mode is the integration that ships. Nothing about the code
  changes when the keys change.
- **Test mode webhooks** — the dashboard lets you configure separate webhook URLs for Live and
  Test modes, each with its own secret.
- **Test payment instruments** — card `4111 1111 1111 1111` with any random CVV and any future
  expiry; on the mock OTP screen, an OTP of 4–10 digits succeeds and an OTP under 4 digits
  fails. UPI `success@razorpay` succeeds, `failure@razorpay` declines. Netbanking shows a mock
  bank page with explicit Success and Failure buttons.
  *(The card number appears in Razorpay's own search results and testing guides; I could not
  extract it verbatim from the canonical test-cards page in this pass — **[unverified in
  detail]**, but the CVV/expiry/OTP rules above are quoted from the docs. Re-check the page
  before your test pass; it costs thirty seconds.)*

**The key secret is shown exactly once**, at generation. "Once you generate the API Keys, only
the Key Id is visible on the Dashboard, not the Key secret." Put it straight into
`backend/.env` and the Vercel dashboard. Losing it means regenerating, which invalidates the
old pair.

So: the entire integration — every line of code, every manual test, the webhook handler, the
signature check — is buildable and testable today, by you, with no involvement from the client
and no KYC.

### What waits on the client

Live keys require **account activation (KYC)**, and separately **website verification**: "To
generate API keys in Live Mode, you must provide the website details where you will collect
payments," which takes up to 3 working days.

KYC documents depend on the client's business type:

| Business type | Documents Razorpay asks for |
|---|---|
| Individual / unregistered | Personal PAN, identity proof (Aadhaar, voter ID, or passport), bank details |
| Registered business | Business PAN, authorised signatory's PAN, identity proof, business documents (GST certificate or MSME certificate plus one more), bank details |

Worth saying to the client plainly: **a registered business is not strictly required** —
Razorpay activates unregistered individuals on a personal PAN. So if the client is an
individual practitioner rather than a registered company, this is not blocked, it is just a
different document set. Razorpay also deposits ₹1 into the nominated account to verify it; if
that fails they ask for a cancelled-cheque video or a branch-manager letter.

Activation timeline: the docs do not commit to a standard duration for self-serve onboarding;
assisted onboarding is quoted at "within 8 business hours."

**What is the client's, not yours:** the KYC submission, the bank account that money lands in,
the live keys themselves, and the pricing/MDR agreement. You should never hold the client's
live key secret longer than it takes to paste it into the Vercel dashboard — and preferably
they paste it themselves.

### Env vars this adds

`backend/.env` (and `.env.example`, and the Vercel backend project):

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

`frontend/.env` — **nothing**. The key id is public (it goes to the browser regardless), so
have `POST /api/orders` return it alongside the Razorpay order id. One fewer env var to
forget on one of the two Vercel projects, which is exactly the kind of thing that breaks a
deploy at 11pm.

### Dependency: none needed

`razorpay` (the official Node SDK) exists and exports `validatePaymentVerification` and
`validateWebhookSignature` helpers. You do not need it. What we actually use it for would be:

- one HTTP POST to `https://api.razorpay.com/v1/orders` with HTTP Basic auth
  (`key_id:key_secret`) — that is `fetch`, which is global in Node 18+;
- two HMAC-SHA256 hex digests — that is `node:crypto`.

That is about ten lines in `backend/lib/razorpay.js` versus a dependency and its transitive
tree in a serverless bundle. Matches the shape the repo already uses for Blob storage: one
small adapter module. Reach for the SDK only if you later want refunds, settlements, or
subscriptions, where the surface area actually justifies it.

---

## 2. The flow, end to end

```
browser                          our server                        Razorpay
   |                                  |                                |
   |-- POST /api/orders ------------->|                                |
   |   { addressId, items }           |                                |
   |                                  |-- reprice from Mongo (§2)      |
   |                                  |-- create our order,            |
   |                                  |   status: paymentPending       |
   |                                  |-- POST /v1/orders ------------>|
   |                                  |   { amount: grandTotal,        |
   |                                  |     currency: 'INR',           |
   |                                  |     receipt: <our order _id> } |
   |                                  |<---------- { id: order_xxx } --|
   |                                  |-- store razorpayOrderId        |
   |<-- { order, razorpayOrderId,     |                                |
   |      keyId } --------------------|                                |
   |                                                                   |
   |-- new Razorpay({...}).open() ------------------------------------->|
   |   ...customer pays on Razorpay's hosted checkout...               |
   |<-- handler({ razorpay_order_id, razorpay_payment_id,              |
   |             razorpay_signature }) --------------------------------|
   |                                  |                                |
   |-- POST /api/orders/:id/verify -->|                                |
   |   { the three values }           |-- HMAC check (server-side)     |
   |                                  |-- status -> placed             |
   |                                  |-- decrement stock              |
   |<-- { order } --------------------|                                |
   |                                  |                                |
   |                                  |<-- POST /api/webhooks/razorpay-|
   |                                  |    order.paid / payment.failed |
   |                                  |-- same state change, idempotent|
```

### 2.1 Server creates the Razorpay order

One POST, Basic auth, `Authorization: Basic base64(key_id:key_secret)`:

```
POST https://api.razorpay.com/v1/orders
{ "amount": <order.grandTotal>, "currency": "INR", "receipt": "<our order _id>",
  "notes": { "orderId": "<our order _id>" } }
```

- `amount` is **mandatory**, an integer in the smallest currency subunit. See §5 — it is our
  `grandTotal` with no arithmetic applied to it.
- `currency` is mandatory. `"INR"`.
- `receipt` is optional, **max 40 characters**. A Mongo ObjectId hex string is 24 — it fits.
- `notes` is optional, max 15 key-value pairs. Put our order id here as well as in `receipt`.
  The webhook payload carries `notes` through, which is how the webhook handler finds our
  order without a second API call.
- Minimum amount for INR is **100 paise (₹1)**. Any real order here clears that on the
  delivery fee alone, but it is the reason to keep the guard in §5.

Response contains `id` (`order_xxxxxxxx`). Store it on our order document. **Store it before
you return it to the browser** — the signature check in 2.4 must use the id from our
database, never the one the browser sends back.

### 2.2 Handing the id to the browser

`POST /api/orders` returns what it returns today, plus `razorpayOrderId` and `keyId`. No new
route, no second round trip.

### 2.3 The checkout script

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

One line in `frontend/index.html`. It exposes a global `Razorpay`. Do not npm-install a React
wrapper for this; the global is the documented integration and a wrapper is a dependency that
can rot against a script Razorpay updates server-side.

**Do not add a Subresource Integrity hash to this tag.** A linter or reviewer will suggest it —
SRI is the right instinct for a normal CDN script and the wrong one here. Razorpay updates
`checkout.js` at that same URL (payment-method changes, bank fixes), so a pinned `integrity`
hash means checkout silently stops loading the next time they push, and the failure looks like
"the Pay button does nothing." There is no versioned URL to pin instead. Loading Razorpay's
script from Razorpay's own domain is the documented integration; the trust boundary that
actually matters is the server-side signature check in §2.5, which holds regardless of what the
script does.

*(If the ~kilobytes on every page load ever bother anyone, inject the tag on first click in
`Checkout.jsx` and await its `onload`. Ten extra lines for a demo that has one checkout page —
not worth it yet.)*

Options object, from the docs:

```js
const rzp = new Razorpay({
  key: keyId,                  // from POST /api/orders
  amount: order.grandTotal,    // paise, verbatim — see §5
  currency: 'INR',
  order_id: razorpayOrderId,   // from POST /api/orders
  name: 'AyurSurgiTech',
  description: `Order ${order._id}`,
  prefill: { name: order.userName, contact: order.userPhone },
  notes: { orderId: order._id },
  theme: { color: '<brand colour from DESIGN-SYSTEM.md>' },
  handler: (res) => { /* 2.4 */ },
  modal: { ondismiss: () => { /* customer closed it; order stays paymentPending */ } },
});
rzp.on('payment.failed', (res) => { /* show res.error.description */ });
rzp.open();
```

`amount` and `currency` in the options are display values — the Razorpay order is the
authority on what is charged. Passing them anyway keeps the modal from flashing the wrong
figure. Note that `handler` and `redirect_on_completion` are alternatives: with
`redirect_on_completion: false` (the default) you get the handler callback and Razorpay shows
a retry option in the modal on failure. Handler callback is right for an SPA — a redirect
would blow away our React state.

### 2.4 The handler callback

Razorpay calls `handler` with exactly three fields:

- `razorpay_payment_id`
- `razorpay_order_id`
- `razorpay_signature`

The browser posts all three to `POST /api/orders/:id/verify`. **The browser does not decide
anything.** It does not set a status, it does not know whether the payment was accepted. It
posts three strings and re-renders whatever the server says.

### 2.5 Signature verification — on the server, always

```
expected = HMAC_SHA256( order_id + "|" + razorpay_payment_id , key_secret )   // hex digest
accept  = timingSafeEqual(expected, razorpay_signature)
```

Two details from the docs that are easy to get wrong:

1. **`order_id` must be the one from our database**, not the `razorpay_order_id` the browser
   just sent. The docs are explicit: "Retrieve the order_id from your server, but do not use
   the razorpay_order_id returned by Checkout." Using the browser's value makes the check
   self-consistent and therefore worthless — an attacker who fabricates all three fields
   passes it. Look up our order by the `:id` in the path, read the `razorpayOrderId` we
   stored in 2.1, and sign that.
2. The secret is `RAZORPAY_KEY_SECRET`. Not the webhook secret. They are different values and
   swapping them fails every check in a way that looks like a Razorpay outage.

Compare with `crypto.timingSafeEqual`, not `===`. It is the same number of lines.

**Why this is not skippable, even in a hurry, even in a demo.** Without it, "this order is
paid" is a claim made by the customer's browser. Anyone can open devtools and call our verify
endpoint with three made-up strings, or simply POST to it directly, and walk away with goods
for free. The docs say it plainly: "A failed signature check indicates a potentially
fraudulent or tampered payment. Reject the order entirely — do not fulfil it, do not retry and
do not treat it as a genuine payment." This is not in the same category as the deliberate
holes in SPEC §1. Plain-text passwords in a demo are embarrassing; an unverified payment
callback is a shop that gives away stock to anyone who reads its JavaScript. It is about
fifteen lines. Write the fifteen lines.

Also compare amounts while you are in there: the Razorpay order was created for
`order.grandTotal`, so confirm the amount Razorpay reports paid still equals
`order.grandTotal`, and refuse if not. Cheap insurance against a future refactor that lets the
two drift apart.

### 2.6 Capture

An authorised payment is not a captured payment. Money is only settled to the merchant on
capture, and **uncaptured payments are auto-refunded** — the docs say payments must move to
`captured` within 3 days of creation or they are refunded automatically to the customer.

Auto-capture is configured in the dashboard (Account & Settings → Payment Capture), and
"Orders API take precedence over the Payment Capture settings configured on the Dashboard."
Whether auto-capture is **on by default for a fresh account** is not stated in the docs —
**[unverified]**. Check the dashboard setting on the test account during the test pass, and
confirm `payment.captured` / `order.paid` actually fire for your test payments. If they do
not, that is the setting, not your code. Do not discover this in live mode.

Also note **late authorization**: if a bank is slow, Razorpay polls for up to 5 days and a
payment can move to `authorized` long after the customer gave up. Another reason for §3.

---

## 3. Webhooks

### Why the handler callback is not sufficient

The handler callback runs in the customer's browser. Everything that can end a browser session
ends it: the tab is closed on the bank's 3-D Secure page, the phone rings mid-UPI, the train
enters a tunnel, the battery dies, the customer taps "Done" in their UPI app and never returns
to Chrome. In all of those, **the money moved and our order is still `paymentPending`.**

That is the exact failure the client will call about: "the customer says they paid, my admin
panel says payment pending." Without a webhook there is no way for the server to ever learn
otherwise, and someone ends up reconciling by hand in the Razorpay dashboard.

The webhook is the server-to-server path that does not care about the browser. It is not
belt-and-braces; it is the authoritative path, and the handler callback is the fast path that
makes the confirmation screen appear instantly.

### Events that matter

| Event | Meaning | What we do |
|---|---|---|
| `order.paid` | The order's payment was captured; order marked paid. Payload carries both the payment and order entities, including our `notes.orderId`. | `paymentPending` → `placed`, decrement stock, record payment id. **This is the one to subscribe to.** |
| `payment.captured` | Funds captured. Fires on the same underlying action as `order.paid`, from the payment's point of view. | Redundant with `order.paid` for our purposes. Subscribing to both is harmless given the idempotency below, but one is enough. |
| `payment.failed` | The payment attempt failed. | Optional. Record the failure reason for the admin; leave the order `paymentPending` so the customer can retry (§4.6). |
| `payment.authorized` | Authorised, not captured. | Only needed if auto-capture is off. Note the docs' warning: the payment may already be captured by the time this fires, and its payload reflects the authorisation moment, not the capture. |

Lazy answer: subscribe to `order.paid` and `payment.failed`. Add more when something actually
needs them.

### Verifying the webhook

```
expected = HMAC_SHA256( raw_request_body , RAZORPAY_WEBHOOK_SECRET )   // hex digest
compare against the X-Razorpay-Signature header
```

- Different secret from §2.5. The webhook secret is whatever you type into the dashboard when
  creating the webhook.
- **The raw body.** The docs: "ensure that the webhook body passed as an argument is the raw
  webhook request body. Do not parse or cast the webhook request body." `JSON.parse` followed
  by `JSON.stringify` reorders keys and changes whitespace, and the signature will never match.
  In this codebase that means the global `express.json()` in `backend/app.js` must not eat this
  route's body first. Laziest fix that cannot be broken by route-ordering later:

  ```js
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
  ```

  One line, applies everywhere, no `express.raw` mount to get subtly wrong, and the parsed
  body stays available for reading the event. Costs one buffer per request, which at demo
  scale is nothing.

### Operational contract

- **Respond 2xx.** "Every event that receives a non-2xx response is considered an event
  delivery failure."
- **Within 5 seconds.** Slower and "the session is marked timeout" and the event is resent. Our
  handler is one Mongo update, so this is fine — but note that on Vercel a cold start plus a
  cold Mongo connection can approach that. This is another reason SPEC §7's `globalThis`
  connection cache is not optional.
- **Retries**: exponential backoff for 24 hours after the event timestamp. Webhooks are
  disabled if failures persist for 24 hours.
- **At-least-once delivery — duplicates happen.** The handler must be idempotent. Cheapest
  idempotency here: only act when `order.status === 'paymentPending'`, and make the update a
  conditional `findOneAndUpdate({ _id, status: 'paymentPending' }, ...)`. Duplicate deliveries
  and a race with the §2.5 verify route then both collapse to a no-op, and stock is decremented
  exactly once. This matters — without the condition, a duplicate `order.paid` decrements stock
  twice.
  Razorpay also sends a unique `x-razorpay-event-id` header per event if you ever want explicit
  dedupe storage; the status condition makes that unnecessary.
- CORS is irrelevant here — the request is server-to-server, and CORS is browser-enforced
  anyway. The `FRONTEND_URL`-only CORS config in SPEC §7 neither blocks nor protects this
  route. Its protection is the signature, full stop.

### Testing webhooks locally

You cannot point a webhook at `localhost`; it needs a public URL. Razorpay's docs specifically
note that **ngrok.io is blacklisted** and recommend `zrok` to tunnel a local app. The docs also
mention a default OTP `754081` when setting up a webhook endpoint in Test mode
(**[unverified — likely to change; treat as a hint, not a fact]**).

Cheapest path, and what I would actually do: build and test the verify route against the
deployed Vercel backend with test keys, where the URL is already public. The tunnel is only
worth setting up if you are debugging the handler line by line.

---

## 4. The diff against what exists today

Current state, from SPEC §4: `POST /api/orders` reprices from Mongo, validates quantities,
**decrements `stockQty`**, creates the order as `paymentPending`, and returns it. Status enum
is `paymentPending | placed | shipped | delivered | cancelled`. Orders are already created
before payment — which is exactly the right shape for this, and means the integration is
additive rather than a rewrite.

### 4.1 Status transitions

| Status | Today | After |
|---|---|---|
| `paymentPending` | Set at creation. Nothing ever moves it automatically. | Unchanged: set at creation. Now genuinely means "Razorpay order exists, not paid yet." |
| `placed` | Presumably set by an admin, or never. | **Set only by a verified payment** — §2.5 verify route or §3 webhook. Never by the browser, never by the admin. |
| `shipped`, `delivered` | Admin. | Admin. Unchanged. |
| `cancelled` | Admin. | Admin, plus the terminal state for an abandoned or failed payment (see 4.5). |

No enum change is required. That is the good news, and it is because the enum already had a
pre-payment state in it.

### 4.2 Backend, file by file

| File | Change | Rough size |
|---|---|---|
| `backend/lib/razorpay.js` | **New.** Three functions: `createOrder({ amount, receipt, notes })` (one `fetch` with Basic auth), `verifyPaymentSignature({ orderId, paymentId, signature })`, `verifyWebhookSignature({ rawBody, signature })`. Both verifiers are `crypto.createHmac('sha256', ...)` + `timingSafeEqual`. No SDK. | ~35 lines |
| `backend/models/Order.js` | Add a `payment` sub-object: `{ razorpayOrderId, razorpayPaymentId, verifiedAt, failureReason }`. Purely additive — existing documents just have it absent, and a demo needs no migration. | ~6 lines |
| `backend/routes/orders.js` | Three edits. (a) In `POST /orders`, after creating our order, call `createOrder` and save `payment.razorpayOrderId`; return `razorpayOrderId` and `keyId` alongside the order. (b) **Move the `stockQty` decrement out of this route** — see 4.4. (c) New `POST /orders/:id/verify`. | ~60 lines net |
| `backend/routes/webhooks.js` | **New.** `POST /api/webhooks/razorpay`: verify signature, switch on `event`, conditional `findOneAndUpdate`. Could live in `orders.js`, but a separate file keeps the "this route is unauthenticated and signature-gated" fact visible to the next reader — worth the one extra file. | ~40 lines |
| `backend/app.js` | The `express.json({ verify })` line from §3, and mounting the webhook router. | ~3 lines |
| `backend/routes/admin.js` | Two small guards, see 4.7. | ~6 lines |
| `backend/.env.example` | Three new vars. | 3 lines |
| `backend/lib/pricing.test.js` | One assertion that `grandTotal` is a positive integer ≥ 100 for the hand-computed orders. The existing test file already owns the money maths; this is the natural home. | ~3 lines |

Untouched: `lib/db.js`, `lib/auth.js`, `lib/storage.js`, `lib/pricing.js`, every other model,
`routes/public.js`, `routes/auth.js`, `routes/user.js`, `seed.js`, `vercel.json`.

### 4.3 Frontend, file by file

| File | Change | Rough size |
|---|---|---|
| `frontend/index.html` | The one `<script>` tag. | 1 line |
| `frontend/src/pages/Checkout.jsx` | "Place order" now: POST `/orders` → open Razorpay with the returned id → in `handler`, POST `/orders/:id/verify` → navigate to `/order/:id` on success. Plus `ondismiss` and `payment.failed` paths that navigate to `/order/:id` too, where the order shows as unpaid with a retry. The button's existing loading state covers the gap while the modal opens. | ~45 lines |
| `frontend/src/pages/OrderDetail.jsx` | If `status === 'paymentPending'`, show an unpaid banner and a "Pay now" button that reopens checkout using the stored `razorpayOrderId` (4.6). Otherwise show the payment id. | ~25 lines |
| `frontend/src/pages/Orders.jsx` | The status badge already renders `paymentPending`; consider labelling it "Payment pending" with an action. Optional. | ~5 lines |
| `frontend/src/admin/OrderDetail.jsx` | Show `payment.razorpayPaymentId` so the client can find the transaction in their Razorpay dashboard. This is the single most useful thing for support and it is one line of JSX. | ~5 lines |
| `frontend/src/lib/api.js` | Possibly one wrapper for the verify call, if that is the file's convention. | ~4 lines |

Untouched: every component, `lib/money.js`, `lib/cart.jsx`, `lib/auth.jsx`, all other pages,
all other admin screens.

`docs/SPEC.md` also needs updating when this ships — §1's Payments row, §3's `orders` schema,
§4's `POST /orders` description plus the two new routes, and §6's env block. Per SPEC's own
rule, the doc gets fixed first. Not this file's job, and not done here.

### 4.4 The thing that makes this awkward — stock is decremented before payment

**This is the one piece of feedback worth having now rather than later.**

Today `POST /orders` decrements `stockQty` at creation (SPEC §4, step 5). With no gateway that
is invisible: every order that gets created is an order that meant to happen, and a
`paymentPending` order that sits forever is a demo artefact nobody notices.

With a real gateway, **abandonment becomes the normal case.** A meaningful share of customers
open the Razorpay modal and close it. Each one of those permanently removes stock from the
catalogue. Run the demo for a week and products go "out of stock" with zero revenue and no
order to explain it. The client will report this as a stock bug, and they will be right.

Two ways out:

- **(a) Move the decrement to the payment-confirmed path.** Decrement in the verify route and
  in the webhook handler, inside the same conditional `findOneAndUpdate` that flips
  `paymentPending → placed`, so it happens exactly once regardless of which path wins. Both
  call sites share one small helper. Abandonment then costs nothing at all.
  The cost is that stock is no longer reserved during checkout, so two people can pay for the
  last unit — but SPEC §4 **already documents that exact race and its fix** (the conditional
  `$inc` upgrade path), so this does not introduce a new class of problem, it moves an
  already-accepted one. And it is strictly better than today: two payments for one unit is a
  refund, whereas a hundred abandoned carts is a dead catalogue.
- **(b) Keep the decrement at creation and restore it on cancel/expiry.** Correct reservation
  semantics, but it needs a sweeper for orders that are never paid and never cancelled — a
  cron, or a lazy "expire anything `paymentPending` older than 30 minutes" pass on some
  frequently-hit route. More moving parts, more state, and a background job in a serverless
  deployment that has none today.

**Recommendation: (a).** It is a smaller diff than (b), it deletes a failure mode instead of
adding machinery to manage it, and the race it exposes is one the spec already accepted in
writing. If the architect prefers reservation semantics, that is a legitimate call — but then
(b)'s sweeper needs to be in the plan and budgeted, not discovered during the integration.

Either way this decision should be made **before** the integration starts, because it changes
which route owns the decrement, and that is the difference between a clean afternoon and a
mid-task refactor.

### 4.5 There is no terminal "payment failed" state

The enum has no `paymentFailed`. Options:

- **Reuse `cancelled`.** Zero enum change, and the admin panel already understands it. The cost:
  the admin cannot tell "the customer changed their mind" from "the card was declined." For a
  demo, acceptable.
- **Add `paymentFailed`.** One line in `models/Order.js`, one entry in the admin status
  dropdown, one badge colour. Genuinely small.

Lazy default: reuse `cancelled`, and store the Razorpay failure reason in
`payment.failureReason` so the information is not lost even though the status is coarse. If the
client later asks "how many payments are failing," add the status then — the data to
reconstruct it is already on the document.

Note that nothing needs to actively fail an order. A `paymentPending` order that is never paid
can simply stay `paymentPending`; the admin can cancel it. Only adopt (b) above if you want
that to happen automatically.

### 4.6 Retrying a payment

Customer closes the browser mid-payment, comes back to `/orders`, wants to pay. Because the
order and its `razorpayOrderId` are both already stored, the retry needs **no new route**: have
`GET /orders/:id` include `payment.razorpayOrderId` and the key id when the status is
`paymentPending`, and let `OrderDetail.jsx` reopen the checkout with them. A Razorpay order can
accept multiple payment attempts until one succeeds.

How long an unpaid Razorpay order id remains usable is **[unverified]** — I did not find a
documented expiry. Assume it works for the demo, and if a stale id ever errors, the fallback is
a small route that creates a fresh Razorpay order for the same unchanged `grandTotal`. Do not
build that route until something needs it.

### 4.7 Two admin routes now need guards

- `PUT /admin/orders/:id` currently accepts any status in the enum. Once payment is real, an
  admin should not be able to move an order out of `paymentPending` to anything except
  `cancelled` — otherwise a mis-click marks an unpaid order `shipped`, and worse, sets `placed`
  on an order nobody paid for. Minimal fix: refuse `placed` from this route entirely (only a
  verified payment sets it), and from `paymentPending` allow only `cancelled`. Three lines.
- `GET /admin/stats` → `revenuePaise` should count paid orders only. Today, with everything
  `paymentPending`, whatever it sums is fine. After this change, summing unpaid orders inflates
  revenue with abandoned carts — and revenue is the number the client will screenshot. Exclude
  `paymentPending` and `cancelled`. One line.

### 4.8 What the existing design gets right, and it is most of it

Worth stating so nobody "improves" it during the integration:

- **Orders exist before payment.** No pending-payment side table, no reconciliation step. The
  Razorpay order attaches to a row that is already there. This is the design most integrations
  have to retrofit.
- **`grandTotal` is snapshotted at creation.** Both our order and the Razorpay order are frozen
  at the same figure at the same instant, so an admin editing a price mid-checkout cannot make
  the amount charged disagree with the amount invoiced. This is the single nastiest class of
  payment bug and the existing snapshot rule has already closed it.
- **Money is integer paise.** See §5 — this is why the amount mapping is a no-op.
- **Checkout reprices server-side.** The amount sent to Razorpay is derived from database
  prices, never from anything the client sent. Correct by construction.

---

## 5. Amounts — the paise question

**They line up exactly. There is no conversion. Pass `order.grandTotal` verbatim.**

- Razorpay: "Payment amount must be in the smallest currency sub-unit. For example, if the
  amount to be charged is ₹299, then pass 29900 in this field."
- SPEC §1 and §2: "Stored as **integer paise**. Never a float." `24000` means ₹240.00.

Same unit, same integer type. ₹240.00 is `24000` in our `grandTotal` and `24000` in Razorpay's
`amount`. The correct line of code is:

```js
amount: order.grandTotal   // already paise. No *100. No /100. No Math.round.
```

**The specific hazard, and it is a real one.** Almost every Razorpay tutorial, blog post, and
Stack Overflow answer writes `amount: amount * 100`, because almost every application stores
rupees. Whoever implements this will read those, and the `* 100` will look like the obvious
required idiom. It would charge every customer **one hundred times** the correct amount — a
₹240 order becomes ₹24,000, and it would be charged for real to a real card. That is not a bug
you fix with a hotfix; it is refunds, chargebacks, and a client who stops trusting the build.

Three cheap defences, all worth doing:

1. A `ponytail:` comment at the call site: `// ponytail: grandTotal is already paise —
   Razorpay wants paise. Multiplying by 100 here charges 100x. Do not "fix" this.`
2. A guard before the API call: `amount` is an integer, ≥ 100 (Razorpay's INR minimum is 100
   paise), and equal to `order.grandTotal` with nothing applied. It is one line and it fails
   loudly at the last point before money is involved.
3. In the verify route, confirm the amount Razorpay reports equals `order.grandTotal`. This
   catches drift after the fact rather than before the charge — it is a backstop, not the
   primary defence, which is why (2) matters more.

Note also the boundary that already exists and must not creep: `formatINR(paise)` in
`frontend/src/lib/money.js` is the only place in the codebase that divides by 100, and it
produces strings for humans. It must never be in the path of anything sent to Razorpay. The
Razorpay options object takes `order.grandTotal`, not a formatted string.

Non-INR is not in scope. If it ever is, note that three-decimal currencies (KWD, BHD, OMR) are
passed at 1000× with the last digit ignored, and zero-decimal ones (JPY) at 1×. Not our
problem today.

---

## 6. Estimate

### Buildable today, in test mode, with no client involvement

| Work | Files | Effort |
|---|---|---|
| `backend/lib/razorpay.js` + the two signature verifiers | 1 new | 45 min |
| Order model field, `POST /orders` changes, verify route, stock decrement moved | 2 edited | 1.5 h |
| Webhook route + `express.json({ verify })` | 1 new, 1 edited | 1 h |
| Admin guards + stats filter + `.env.example` | 2 edited | 20 min |
| `Checkout.jsx` — open checkout, handle success/dismiss/failed | 1 edited | 1.5 h |
| `OrderDetail.jsx` retry + payment display, admin order payment id, `index.html` | 4 edited | 45 min |
| Manual test pass: success card, failed OTP, closed modal, UPI success/failure, duplicate webhook | — | 1 h |
| `docs/SPEC.md` update | 1 edited | 30 min |

**~11 files (3 new, 8 edited). Roughly 7–8 hours — call it one focused day**, and less than that
if the stock-ownership decision in §4.4 is settled before you start rather than during. Nothing
here needs live keys.

The webhook half is the part most likely to overrun, and the overrun is almost always
environmental rather than logical: raw body, the 5-second timeout against a Vercel cold start,
or auto-capture being off so the expected event never fires. Test it against the deployed
backend with test keys rather than fighting a tunnel.

### Waits for live credentials

**No code.** The switch is two env values in the Vercel backend project and a live-mode webhook
registered against the deployed URL. Concretely:

| Step | Who | Effort |
|---|---|---|
| KYC + activation, website verification (up to 3 working days) | Client | Their lead time, not yours |
| Generate live keys, paste into Vercel backend env | Client, ideally | 10 min |
| Register the live-mode webhook URL + secret in the dashboard | You or client | 10 min |
| Confirm the auto-capture setting in live mode | You | 10 min |
| One real low-value end-to-end payment, then refund it | You | 20 min |
| Confirm the settlement bank account is the client's | Client | — |

**~1 hour of actual work**, gated entirely on the client's KYC. Which is the point of writing
this down now: when the client asks, the answer is "about a day, and I can build and test all
of it before your KYC clears," not "let me research it."

---

## Unverified — check before relying on

- Exact test card numbers. Rules for CVV/expiry/OTP are quoted from the docs; the card number
  `4111 1111 1111 1111` came from Razorpay search results and testing guides rather than a
  clean fetch of the canonical page.
- Whether auto-capture is enabled by default on a new account. The setting is documented; the
  default is not stated. Confirm in the dashboard during the test pass (§2.6).
- How long an unpaid Razorpay order id stays usable, for the retry flow in §4.6.
- The test-mode webhook setup OTP (`754081` per the docs at time of writing) — the kind of
  value that changes without notice.
- Razorpay's current pricing / MDR. Not researched; it is the client's commercial decision and
  it changes.

## Sources

- [Create an Order (Orders API)](https://razorpay.com/docs/api/orders/create/)
- [Standard Checkout — Integration Steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Node.js SDK — Integration Steps](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/)
- [About Webhooks](https://razorpay.com/docs/webhooks/)
- [Validate and Test Webhooks](https://razorpay.com/docs/webhooks/validate-test/)
- [Webhooks FAQs](https://razorpay.com/docs/webhooks/faqs/)
- [Payments Webhook Events](https://razorpay.com/docs/webhooks/payments/)
- [Orders Webhook Events](https://razorpay.com/docs/webhooks/orders/)
- [Test and Live Modes](https://razorpay.com/docs/payments/dashboard/test-live-modes/)
- [API Keys Generator](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/)
- [Set up a Razorpay Account](https://razorpay.com/docs/payments/set-up/)
- [Payment Capture Settings](https://razorpay.com/docs/payments/payments/capture-settings/)
- [Test Card Details](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Test UPI ID Details](https://razorpay.com/docs/payments/payments/test-upi-details/)
- [Web Integration — Troubleshooting & FAQs](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/troubleshooting-faqs/)

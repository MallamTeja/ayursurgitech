# AayursurgiTech — Design System

Direction: **Clinical Navy.** Deep navy primary, white page, muted copper accent.

Navy carries the trust a procurement officer is looking for; copper keeps it from being the
flat corporate blue every supplier defaults to. Navy and copper are near-complementary, so the
accent does more work here than it did against green — which makes the "one accent per screen"
rule matter more, not less.

> **This palette replaced a forest-green one.** The original direction was deliberately green
> so as not to "look like every other hospital-blue pharmacy", and the page background was
> deliberately an off-white `#FAF8F4`. Both were overridden on request. The tokens were renamed
> `forest-*` → `blue-*` rather than left holding blue values under green names.

This file is prescriptive. Values here go into `frontend/src/index.css` as Tailwind v4
`@theme` tokens and are used through Tailwind utilities. Do not invent a colour, a font
size, or a radius that is not on this page.

---

## Colour

```css
@theme {
  --color-blue-900: #0A2240;  /* footer, admin sidebar, deepest surfaces */
  --color-blue-700: #14406E;  /* PRIMARY — header, primary buttons */
  --color-blue-500: #2C6499;  /* hover, links, success, focus ring */
  --color-blue-100: #DCE6F2;  /* tints, badges, skeletons */

  --color-paper:      #FFFFFF;  /* page background */
  --color-shade:      #FAF8F4;  /* the only recess: alternating sections, zebra rows, hovers */
  --color-card:       #FFFFFF;
  --color-ink:        #2A2A28;  /* body text — never pure black */
  --color-ink-muted:  #6B6B63;  /* secondary text */
  --color-line:       #E5E0D6;  /* every border */

  --color-copper-600: #B87333;  /* accent — LARGE text and fills only */
  --color-copper-700: #96541F;  /* accent for SMALL text, and the accent button fill */
  --color-copper-800: #7A4318;  /* accent button HOVER only */
  --color-danger:     #A33A2A;
}
```

### Contrast — measured, not estimated

The first draft of this section carried ratios written from memory and three of the five were
wrong. Never write a ratio here you have not computed. Every row below was computed against the
current tokens, and re-computed when the palette went navy and the page went white:

| Pair | Ratio | Verdict |
|---|---|---|
| `ink` on `paper` | 14.38:1 | comfortable |
| `ink-muted` on `paper` | 5.37:1 | passes AA for body text |
| `white` on `blue-700` | 10.56:1 | comfortable — header, primary button |
| `white` on `blue-900` | 15.96:1 | comfortable — footer, admin sidebar |
| `blue-100` on `blue-900` | 12.65:1 | comfortable — footer body text |
| `blue-100` on `blue-700` | 8.37:1 | comfortable — sidebar nav |
| `blue-700` on `blue-100` | 8.37:1 | comfortable — badge text on a tint |
| `blue-500` on `blue-100` | 4.91:1 | passes AA — links on a tinted tile |
| `blue-500` on `paper` | 6.19:1 | passes AA — links, focus ring |
| `ink` on `blue-100` | 11.40:1 | comfortable — badges |
| `copper-700` on `paper` | 5.86:1 | passes AA — prices |
| `copper-600` on `paper` | 3.79:1 | **large text and fills only** |
| `white` on `copper-700` | 5.86:1 | passes AA — accent button |
| `white` on `copper-800` | 7.94:1 | comfortable — accent hover |
| `ink` on `line` | 10.93:1 | comfortable — out-of-stock badge |
| `danger` on `paper` | 6.57:1 | passes AA — errors |
| `ink` on `shade` | 13.56:1 | comfortable — text on a shaded band |
| `ink-muted` on `shade` | 5.07:1 | passes AA — secondary on a shaded band |

**`copper-600` is not a text colour.** Use it for fills — rating stars, decorative accents —
and nothing a user has to read at body size. Any copper text uses **`copper-700`**.

Prices included. 18px semibold is *not* "large text" by WCAG, which needs 18.66px bold or
24px regular. Prices are `copper-700`.

### Three failures this palette invites, and the fixes

Each of these is a combination the first draft actively prescribed.

1. **White on `copper-600` is 3.79:1 — it fails AA.** That was the accent button, so
   "Add to cart" and "Place order" both failed. **Accent buttons use `copper-700` fill**
   with white text. Note that the "use copper-700 for small text" rule does not rescue a
   white-on-copper *fill*; the fill itself had to change.

2. **A `copper-600` pill on the primary was 2.97:1 against the old green** — the cart count
   barely separated from the header, and the white digit inside it failed too. **The cart pill
   is a `paper` fill with `blue-700` digits.** Reads cleanly on navy and passes both ways.
   Copper on navy is a warmer pairing than copper on green was, which makes it *more* tempting
   here and no more legible: the rule stands.

3. **`ink-muted` on `line` is 4.08:1**, which fails at `text-xs` — that was the out-of-stock
   badge. **Use `ink` on `line`** for it.

Nothing else in this document was built on the wrong numbers; the conclusions all held. But
these three combinations were real failures that the document asserted were fine.

---

## Type

Two families. Never a third.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,SOFT,WONK,wght@9..144,0..100,0..1,500..600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Fraunces** — headings only (`h1`–`h3`, section titles, the logo wordmark).
  **`h1` is weight 600; `h2` and `h3` are 500.** Both weights were loaded but only 600 was
  ever used, so headings differed by size alone and half the font file was dead. Do not put
  `font-semibold` on an `h2` — that is the override that used to flatten this back out.
  Set `font-optical-sizing: auto`. Letter-spacing `-0.02em`.
- **`h1` carries `font-variation-settings: 'SOFT' 20, 'WONK' 1`** and nothing else does. SOFT
  rounds the terminals a little — warm rather than clinical, which is the brief — and WONK
  swaps in Fraunces' own splayed alternates. One page title, one voice; everything below it
  stays quiet.
- The font URL must request **`wght` as a range** (`...,500..600`), not as pinned values
  (`...,500;...,600`). Pinned weights make Google serve two static instances, which silently
  disables `font-optical-sizing` and puts SOFT and WONK out of reach.
- **Inter** — everything else: body, UI, labels, buttons, tables, prices.
  Weights 400, 500, 600.

Scale — use these seven sizes and no others:

| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75rem | badges, `+ GST`, helper text |
| `text-sm` | 0.875rem | secondary text, table cells, labels |
| `text-base` | 1rem | body, inputs, buttons |
| `text-lg` | 1.125rem | product card name, prices in cart |
| `text-2xl` | 1.5rem | section headings, product detail price |
| `text-3xl` | 2rem | page titles, `h1` on mobile |
| `text-5xl` | 2.75rem | hero `h1`, desktop only |

Line height 1.15 on headings, 1.6 on body. Uppercase labels get `+0.08em` tracking.
Prices always carry `font-variant-numeric: tabular-nums` so columns line up.

---

## Space, shape, depth

**Spacing:** 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Nothing between.

**Radius:** three values only.
`4px` inputs and buttons · `10px` cards and panels · `999px` pills and badges.

Uniform large radius on everything is the strongest tell of a generated interface.
Buttons stay tight at 4px; the softness lives on cards.

**Borders:** `1px solid var(--color-line)` is the default separator. Reach for a border
before a shadow.

**Shadow:** exactly one, and it is not on resting cards.

```css
--shadow: 0 1px 2px rgba(42,42,40,.05), 0 10px 30px -18px rgba(42,42,40,.18);
```

Allowed on: dropdowns, modals, the sticky mobile cart bar, a hovered product card.
Nowhere else. Resting cards use the border.

**Focus:** `outline: 2px solid var(--color-blue-500); outline-offset: 2px`. Never
`outline: none` without a replacement — keyboard users need to see where they are.

---

## Layout

Container `max-width: 1200px`, gutter 16px mobile / 24px from `md`.

Product grid: 2 columns mobile → 3 at `md` → 4 at `lg`. Two columns on mobile, not
one — surgical buyers scan a catalogue, they do not browse one hero card at a time.

Breakpoints are Tailwind defaults. Design mobile-first; every screen must work at
390px wide.

---

## Components

One line each. Follow them literally.

- **Button, primary** — `blue-700` fill, white text, radius 4, minimum height 44px
  (tap target), `blue-500` on hover.
- **Button, secondary** — transparent fill, 1px `line` border, `ink` text.
- **Button, accent** — `copper-700` fill, white text, **`copper-800` on hover**. **One per
  screen, maximum**, reserved for the single most important action (Add to cart, Place order,
  Order again on an order's own page). Not `copper-600` — white on that fails AA. The hover
  goes darker, never lighter: `copper-600` is the only lighter copper and it fails.
- **Price** — `copper-700`, Inter 600, tabular-nums, with `+ GST` beside it in
  `text-xs text-ink-muted`.
- **Product image** — white background, 1px `line` border, 1:1 aspect,
  `object-fit: contain` with 12px padding. Contain, never cover: these are products
  shot on white and cropping cuts the instrument in half.
- **Stock badge** — in stock: `blue-100` fill, `blue-700` text. Out of stock:
  `line` fill, **`ink`** text (not `ink-muted`, which fails at this size). **Never red.**
  Out of stock is a fact, not an error.
- **Status badge** — the five order statuses, rendered on four screens by three different
  agents, so the mapping lives here and nowhere else. `placed`, `shipped` and `delivered`
  use `blue-100` fill with `blue-700` text. `paymentPending` and `cancelled` are
  **neutral**: `line` fill, `ink` text. Neither is an error — with payment stubbed,
  `paymentPending` is the normal state of a brand-new order.
- **Rating** — filled `copper-600` stars, count beside in `text-sm text-ink-muted`.
- **Input** — white fill, 1px `line`, radius 4, height 44px, and a **visible label
  above it, always**. Placeholder text is never the label; it vanishes the moment
  someone types and they lose their place in a form.
- **Card** — `card` fill, 1px `line`, radius 10, no shadow at rest.
- **Header** — `blue-700`, white text, sticky, 64px tall. Logo wordmark in Fraunces,
  nav in Inter, cart count as a **`paper` pill with `blue-700` digits** — not
  `copper-600`, which barely separates from the navy.
- **Footer** — `blue-900` background, `blue-100` text, headings in white. "Muted white"
  was not a token and this document forbids invented colours.
- **Empty state** — a line icon, one plain sentence, one action button. Centred in the
  panel. Every list needs one.
- **Skeleton** — `blue-100` blocks in the real layout's shape, gentle pulse. Not a
  centred spinner on a blank page.
- **Quantity stepper** — `−  [ 24 ]  +`, 44px tall, typable field, clamped to
  `minOrderQty` and `stockQty`. When someone tries to go below the minimum, show
  *"Minimum order 10 pieces"* under it rather than silently snapping the number.

### The two front doors

`/` and `/products` are different pages with different jobs, and neither does the other's.

- **`/` is the landing page** — the company and its range. Terms of trade, what we supply, how
  ordering works, who we supply. **No products on it.** Category tiles are navigation into the
  range, not a shop. It used to carry a "new arrivals" grid, which made it a catalogue index
  with a headline on top and left the actual questions a buyer arrives with unanswered.
- **`/products` is the catalogue** — every line, with filters, sort and the two views.
- Both keep the header and the footer. A page without navigation is a section, not a page.

The landing page carries **one dark element** (the blue-900 terms panel in the hero) and
nothing else competes with it. Every claim on it must be one the app can back: trade pricing,
GST invoicing with HSN codes, 24–48h dispatch, per-product minimums, live stock. No
certifications, client counts or testimonials — inventing credentials is not a design choice.

### Catalogue listings

Every list of products — `/products`, a category, a search result — is the same three parts:
a `<CatalogueControls>` strip, then results, then an empty state. All three read their state
from `useCatalogue()`.

- **Controls strip** — bordered top and bottom, no fill. Count on the left ("18 of 44 products"
  once a filter is on), controls on the right: **In stock only** as a plain checkbox in the
  open, brand, sort, then the view toggle. Filters are client-side; sort is a server query
  parameter, because re-sorting a list the server already sorted is how the two disagree.
- **View toggle** — two buttons, grid and rows, in one bordered group. The choice is stored
  and applies to every list, not just the one it was made on.
- **Grid view** — the product card grid: 2 columns mobile → 3 at `md` → 4 at `lg`.
- **List view** — one row per product, and the view a buyer comparing thirty SKUs actually
  wants. Each spec cell carries its own uppercase `tracking-label` caption above a
  `tabular-nums` figure — **no header row**, which cannot survive being scrolled away from the
  rows it labels at 390px.

### Admin panel

Same tokens, denser presentation. Tables rather than cards, 36px rows,
`text-sm` throughout, sticky table headers. HSN codes, order ids and stock counts in
`ui-monospace` so they are scannable in a column. Sidebar in `blue-900`.

**Dashboard** — two sections, not one grid of equal tiles. *Needs attention* holds the three
queues an admin has to clear (pending orders, out of stock, pending reviews): each is a link,
`blue-100` fill with a `blue-700` border while there is work in it, plain `card` with
"Nothing waiting" once it is clear. *Totals* holds the three figures nobody acts on, smaller
and not linked. Weighting a queue the same as a total is what left the screen with no answer
to "what do I do now".

---

## Anti-rules

These are the marks of a templated or machine-made interface. Avoid all of them.

- No purple or blue gradients. No gradient buttons.
- No emoji standing in for icons.
- No third font family.
- No drop shadows on product photographs.
- No centre-aligned paragraphs of body text.
- No 16px+ radius on everything.
- No full-width auto-rotating hero carousel.
- No pure `#000` text. (The page background **is** pure white — decided deliberately, against
  this document's original rule. `shade` is what the old warm `paper` tone is for now, and it
  is the only recess: it separates a section band, a zebra row or a hover, nothing else.)
- No decorative icon next to every single label.

## Not being built

No dark mode. No animation library — transitions are `150ms ease` on colour and
`transform` only. No icon library beyond a handful of inline SVGs.

# AayursurgiTech Design System v1.0 — "Clinical Precision"

The implementation of [`docs/AayursurgiTech-Design-System-v1.0.md`](../../../../docs/AayursurgiTech-Design-System-v1.0.md).
Every token, component and rule here traces to a § of that document, and every place
this implementation departs from it says so in a comment and on the reference page.

**Live reference:** `npm run dev`, then <http://localhost:5173/design-system>

## Layout

```
DesignSystem/
  theme.css        Tokens, named text styles, density classes, scope resets.
                   Imported once by src/index.css. Read its header before adding a token.
  tokens.js        The tokens as data, plus contrast()/verdict() — what the reference
                   pages measure themselves with.
  icons.jsx        The only door Lucide comes through (§21, §32 Rule 6).
  format.js        ₹ paise → en-IN, dates, deltas. Part of the visual contract.
  dummy.js         Fixtures shaped like the real domain. No API calls anywhere.
  utils.js         cx, clamp, a11yWarn.
  index.js         Public surface — import from here.

  ui/              The system. 10 modules, ~60 exports.
    Button  Badge  Layout  Card  Form  Table  Product  Feedback  Overlay  Nav  Chart

  showcase/        Documentation about the system. Never import this from a real screen.
    DesignSystemApp.jsx   Shell + routes, lazy-loaded by App.jsx at /design-system/*
    kit.jsx               Section, Example, PropsTable, Swatch, DoDont, Decision
    pages/                14 reference pages
```

## Using it

```jsx
import { Button, DataTable, StatusBadge, Field, Input } from '@/components/DesignSystem';
```

Two rules that are not optional:

1. **Render inside `.ds-root`.** Every token and every reset is scoped to that class.
   Outside it, headings silently fall back to the shop's display serif — `index.css`
   puts Fraunces on `h1`–`h3` globally and `theme.css` only undoes that within scope.
2. **Status comes from the registry, never from a colour prop.** `ORDER_STATUS`,
   `PAYMENT_STATUS`, `QUOTE_STATUS`, `STOCK_STATUS`, `ENTITY_STATUS` each store label,
   tone and glyph together, which is how §4's "never colour alone" stays true.

## Two palettes now live in this repo

`index.css` carries the shipping shop's navy/copper theme (from `docs/DESIGN-SYSTEM.md`).
This system is the v1.0 B2B teal/navy direction. They are namespaced so they cannot
collide — this system owns `brand-`, `fg-`, `edge-`, `canvas`, `surface`; the shop keeps
`blue-`, `ink`, `line`, `paper`, `card`, `copper-`. Migrating the shop onto this system is
a separate decision that nothing here forces.

## Where this departs from the document

Four changes and two additions, all argued in full on the reference pages:

| | Why | Page |
|---|---|---|
| `success/warning/error/info-700` added | §4's own colours fail §24's AA as badge text — warning is 2.93:1 on its own tint. Same hues, walked down to 4.8:1+. | Colour |
| Teal text is `brand-700`, fills stay `brand-600` | §13's brand-600 is 4.31:1 on surface-2, which is where toolbars live. | Colour, Buttons |
| Captions use `fg-secondary` | §3.2 assigns `fg-muted` to caption text; at 12px it is 3.01:1. | Typography |
| `danger` button variant | §13 has no destructive variant and the admin panel deletes things. | Buttons |
| Four text styles: `type-label`, `type-metric`, `type-th`, `type-nav` | §6.1's dashboard table names sizes but not styles; the uppercase label in §15 and §19 has no style at all. | Typography |
| Density = 56 / 48 / 40px | §29 gives the three portals different densities and no numbers. | Foundations |

Also deliberate, and stated rather than omitted: **no photography** (§22 wants real product
images; placeholders hold the exact aspect ratio until they exist), **no dark mode**
(the document is silent; the reasoning is on the Colour page), **no charting library**
(four SVG primitives cover §20).

## Checks worth re-running after changes

```bash
npx vite build                    # compiles, and keeps the DS in its own lazy chunk
```

The reference pages measure their own contrast at render time — if a hex in `tokens.js`
stops passing AA, the swatch under it says so instead of continuing to claim compliance.

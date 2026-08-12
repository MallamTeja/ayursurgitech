// The only test in the project. Wrong money is the one bug a demo cannot survive.
// Run with `npm test`. Plain node:assert, no framework.
import assert from 'node:assert/strict'
import { computeOrderTotals } from './pricing.js'

// Rates used here are 0 / 5 / 18. There is no 12% slab — abolished 22 Sep 2025,
// see docs/GST-REFERENCE.md. A 12 appearing in this file again is a red flag.

// 1. single line item — ₹240 gauze × 10, 5% GST, ₹40 delivery
{
  const t = computeOrderTotals([{ unitPrice: 24000, qty: 10, gstRate: 5 }], 4000)
  assert.equal(t.items[0].lineSubtotal, 240000)
  assert.equal(t.items[0].lineGst, 12000)
  assert.equal(t.subtotal, 240000)
  assert.equal(t.gstTotal, 12000)
  assert.equal(t.deliveryFee, 4000)
  assert.equal(t.grandTotal, 256000)
}

// 2. mixed rates in one order — 5% and 18% together, the checkout case that
//    renders one GST row per distinct rate
{
  const t = computeOrderTotals(
    [
      { unitPrice: 95000, qty: 1, gstRate: 5 }, // insulin syringes, heading 9018
      { unitPrice: 38000, qty: 2, gstRate: 18 }, // vinyl gloves, heading 3926
    ],
    4000,
  )
  assert.deepEqual(
    t.items.map((i) => [i.lineSubtotal, i.lineGst]),
    [
      [95000, 4750],
      [76000, 13680],
    ],
  )
  assert.equal(t.subtotal, 171000)
  assert.equal(t.gstTotal, 18430)
  assert.equal(t.grandTotal, 193430)
  for (const v of [t.subtotal, t.gstTotal, t.grandTotal, ...t.items.flatMap((i) => [i.lineSubtotal, i.lineGst])])
    assert.ok(Number.isInteger(v), `${v} is not an integer`)
}

// 3. rounding is per line, then summed — NOT once on the order subtotal.
//    Two lines of 1050 paise at 5% are 52.5 each: 53 + 53 = 106.
//    Rounding the 2100 subtotal once gives 105. The invoice must say 106.
{
  const t = computeOrderTotals([
    { unitPrice: 1050, qty: 1, gstRate: 5 },
    { unitPrice: 1050, qty: 1, gstRate: 5 },
  ])
  assert.deepEqual(
    t.items.map((i) => i.lineGst),
    [53, 53],
  )
  assert.equal(t.gstTotal, 106)
  assert.notEqual(t.gstTotal, Math.round((t.subtotal * 5) / 100)) // 105 — the bug this guards
  assert.equal(t.deliveryFee, 0) // defaults to 0
  assert.equal(t.grandTotal, 2206)
}

// 3a. three identical lines, each 100.2 paise of GST: 100 × 3 = 300.
//     Summing first gives 6012 × 5% = 300.6, which rounds to 301. Anyone who
//     "simplifies" this to one rounding at the end fails here.
{
  const line = { unitPrice: 1002, qty: 2, gstRate: 5 }
  const t = computeOrderTotals([{ ...line }, { ...line }, { ...line }])
  assert.deepEqual(
    t.items.map((i) => i.lineGst),
    [100, 100, 100],
  )
  assert.equal(t.subtotal, 6012)
  assert.equal(t.gstTotal, 300)
  assert.equal(Math.round((t.subtotal * 5) / 100), 301) // the wrong answer, pinned
  assert.equal(t.grandTotal, 6312)
}

// 3b. rounding up from .85 on a multi-qty line
{
  const t = computeOrderTotals([{ unitPrice: 4999, qty: 3, gstRate: 5 }])
  assert.equal(t.items[0].lineSubtotal, 14997) // 749.85 paise of GST
  assert.equal(t.items[0].lineGst, 750)
  assert.equal(t.grandTotal, 15747)
}

// 4. zero-GST line contributes subtotal but no GST
{
  const t = computeOrderTotals(
    [
      { unitPrice: 4000, qty: 2, gstRate: 0 },
      { unitPrice: 9500, qty: 25, gstRate: 18 },
    ],
    4000,
  )
  assert.equal(t.items[0].lineGst, 0)
  assert.equal(t.items[1].lineSubtotal, 237500)
  assert.equal(t.items[1].lineGst, 42750)
  assert.equal(t.subtotal, 245500)
  assert.equal(t.gstTotal, 42750)
  assert.equal(t.grandTotal, 292250)
}

// 5. empty order still returns a usable shape
{
  const t = computeOrderTotals([], 4000)
  assert.deepEqual(t, { items: [], subtotal: 0, gstTotal: 0, deliveryFee: 4000, grandTotal: 4000 })
}

// 6. line fields passed in are preserved (the order snapshot rides along)
{
  const t = computeOrderTotals([{ unitPrice: 4000, qty: 1, gstRate: 5, name: 'Three-Way Stopcock', hsnCode: '9018' }])
  assert.equal(t.items[0].name, 'Three-Way Stopcock')
  assert.equal(t.items[0].hsnCode, '9018')
}

console.log('pricing: all assertions passed')

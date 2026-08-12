// Reconciling a stored cart against the live catalogue.
//
// WHY THIS EXISTS. The cart lives in localStorage (lib/cart.jsx) and every line
// in it is a *photograph* of a product taken at the moment it was added — name,
// price, MOQ and stock, frozen. A B2B cart is not a five-minute session: a
// procurement officer builds one on Tuesday, gets it approved on Thursday and
// checks out on Friday. By then the price can have moved, the MOQ can have been
// raised by an admin, the stock can have gone, and the product can have been
// discontinued altogether.
//
// If none of that is checked, the first the buyer hears of it is a 400 from
// POST /orders naming a productId. That is the backstop, not the experience.
// This module is the experience: it compares what was stored against what is
// true now, and returns a per-line list of problems with an offered correction
// for each one that has one.
//
// It is pure. No React, no storage, no clock — the whole point is that every
// branch below can be exercised by handing it two arrays.

/* -------------------------------------------------------------------------- */
/* Issues                                                                     */
/* -------------------------------------------------------------------------- */

// `blocking` decides whether checkout is allowed. The rule: anything the server
// would reject is blocking, and anything that is merely news is not.
//
// A price change is not blocking. It is not an error — the catalogue is simply
// the current price, and the totals below already use it. Blocking checkout on
// it would mean a buyer cannot proceed until they acknowledge a discount.
export const ISSUES = {
  gone: {
    blocking: true,
    label: 'No longer available',
    tone: 'error',
    message: 'This product is not in the catalogue any more and cannot be ordered.',
  },
  outOfStock: {
    blocking: true,
    label: 'Out of stock',
    tone: 'error',
    message: 'Out of stock. Remove it, or request a quote and an agent will confirm a lead time.',
  },
  overStock: {
    blocking: true,
    label: 'More than we hold',
    tone: 'warning',
    message: 'The quantity is above what is in the warehouse.',
  },
  belowMoq: {
    blocking: true,
    label: 'Below minimum',
    tone: 'warning',
    message: 'The minimum order quantity for this product has changed.',
  },
  notMultiple: {
    blocking: true,
    label: 'Not a pack multiple',
    tone: 'warning',
    message: 'This product is picked in whole packs.',
  },
  priceChanged: {
    blocking: false,
    label: 'Price changed',
    tone: 'info',
    message: 'The price has changed since this was added. The total below uses the current price.',
  },
};

/* -------------------------------------------------------------------------- */
/* Matching a stored line to a live product                                   */
/* -------------------------------------------------------------------------- */

const slugOf = (product) => product.id.replace(/^p-/, '');

/**
 * Find the catalogue entry a stored line refers to.
 *
 * Three keys, in descending order of confidence. `productId` is what the cart
 * writes today; `slug` and `code` are there because a line may have been added
 * by an older build (or by the legacy product page, which uses the API's `_id`)
 * and matching on a second key is the difference between reconciling that line
 * and telling the buyer their product was discontinued.
 */
export function findProduct(line, catalogue) {
  if (!line) return undefined;
  return (
    catalogue.find((p) => p.id === line.productId) ??
    (line.slug ? catalogue.find((p) => slugOf(p) === line.slug) : undefined) ??
    (line.code ? catalogue.find((p) => p.code === line.code) : undefined)
  );
}

/* -------------------------------------------------------------------------- */
/* One line                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Compare one stored line with the catalogue.
 *
 * Returns everything the row needs to render itself: the live product when there
 * is one, the numbers to price with, the list of issue keys, and `fix` — the
 * quantity that would resolve the quantity problems, or null when there is
 * nothing a quantity change can do about it.
 */
export function reconcileLine(line, catalogue) {
  const product = findProduct(line, catalogue);
  const issues = [];

  // Discontinued counts as gone. A product an admin has taken off the catalogue
  // is not orderable, and deriveCatalogue() already refuses to list it.
  if (!product || product.status !== 'active') {
    return {
      line,
      product: product ?? null,
      // Fall back to the stored photograph so the row can still name what it is.
      // A cart row reading "Unavailable" with no product name is unremovable in
      // any meaningful sense — the buyer cannot tell which line to act on.
      name: line.name ?? 'Unknown product',
      unitPrice: line.price ?? 0,
      gst: line.gstRate ?? 0,
      qty: line.qty ?? 0,
      moq: line.minOrderQty ?? 1,
      stock: 0,
      lineTotal: 0, // Nothing unavailable contributes to a total.
      issues: ['gone'],
      fix: null,
      blocking: true,
    };
  }

  const qty = Number(line.qty) || 0;
  const moq = product.moq || 1;
  const stock = product.stock ?? 0;

  if (stock <= 0) issues.push('outOfStock');
  else if (qty > stock) issues.push('overStock');

  if (qty < moq) issues.push('belowMoq');
  else if (qty % moq !== 0) issues.push('notMultiple');

  if (line.price != null && line.price !== product.price) issues.push('priceChanged');

  return {
    line,
    product,
    name: product.name,
    // ALWAYS THE LIVE PRICE. The stored one is a display cache and checkout
    // reprices server-side anyway, so showing the stale figure would put a total
    // on screen that the order confirmation then contradicts.
    unitPrice: product.price,
    previousPrice: line.price != null && line.price !== product.price ? line.price : null,
    gst: product.gst ?? 0,
    qty,
    moq,
    stock,
    lineTotal: product.price * qty,
    issues,
    fix: suggestQty(qty, moq, stock),
    blocking: issues.some((key) => ISSUES[key].blocking),
  };
}

/**
 * The quantity that would make this line orderable, or null if it already is —
 * or if no quantity can be (nothing in stock).
 *
 * Rounds DOWN to a pack multiple when capping to stock, because rounding up
 * would land back above the stock it was capping to. Then floors at the MOQ, and
 * gives up if even one MOQ does not fit in the warehouse: offering "reduce to
 * 100" when 40 exist is a button that fails.
 */
export function suggestQty(qty, moq, stock) {
  if (stock <= 0) return null;
  if (moq > stock) return null;

  let next = qty;
  if (next > stock) next = Math.floor(stock / moq) * moq;
  if (next < moq) next = moq;
  else if (next % moq !== 0) next = Math.round(next / moq) * moq;

  // The rounding above can push back over stock — 250 with moq 100 and stock 260
  // rounds to 300. One step down is always valid because moq <= stock here.
  if (next > stock) next = Math.floor(stock / moq) * moq;

  return next === qty ? null : next;
}

/* -------------------------------------------------------------------------- */
/* The whole cart                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reconcile every line and total the result.
 *
 * GST IS GROUPED BY SLAB, not summed into one figure. This catalogue spans 5%,
 * 12% and 18%, and an Indian tax invoice shows them separately — a single "GST
 * ₹4,820" line is not something a finance team can check against anything.
 */
export function reconcileCart(lines = [], catalogue = []) {
  const rows = lines.map((line) => reconcileLine(line, catalogue));
  const orderable = rows.filter((r) => !r.issues.includes('gone') && !r.issues.includes('outOfStock'));

  const subtotal = orderable.reduce((sum, r) => sum + r.lineTotal, 0);

  const gstBySlab = new Map();
  for (const row of orderable) {
    if (!row.gst) continue;
    // Rounded per slab rather than per line, which is how the tax actually
    // aggregates on an invoice; rounding each line first drifts by a paisa a row.
    gstBySlab.set(row.gst, (gstBySlab.get(row.gst) ?? 0) + row.lineTotal);
  }
  const gstRows = [...gstBySlab.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({ rate, base, amount: Math.round((base * rate) / 100) }));

  const gstTotal = gstRows.reduce((sum, g) => sum + g.amount, 0);

  const issueCounts = {};
  for (const row of rows) for (const key of row.issues) issueCounts[key] = (issueCounts[key] ?? 0) + 1;

  return {
    rows,
    subtotal,
    gstRows,
    gstTotal,
    total: subtotal + gstTotal,
    // Distinct products, matching the header pill. A count of pieces would read
    // "12,400" for one line of infusion sets.
    count: rows.length,
    pieces: orderable.reduce((sum, r) => sum + r.qty, 0),
    issueCounts,
    blockingRows: rows.filter((r) => r.blocking),
    // Rows a single click can put right, versus rows that can only be removed.
    fixableRows: rows.filter((r) => r.fix != null),
    removableRows: rows.filter((r) => r.blocking && r.fix == null),
    canCheckout: rows.length > 0 && rows.every((r) => !r.blocking),
  };
}

// Formatting, centralised.
//
// A design system that stops at colour and spacing still lets two screens print
// the same amount two different ways. These four functions are part of the
// visual contract.
//
// MONEY IS INTEGER PAISE. Not rupees, not floats. It is what the existing
// backend stores (backend/lib/pricing.js) and it is the only representation that
// survives a GST calculation without drifting a paisa. Every amount in this
// system's dummy data is paise, and every amount rendered goes through formatINR.

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Paise → ₹. en-IN grouping, so 12,48,500 and not 1,248,500 — an Indian B2B
 * invoice grouped the western way looks like a bug to the person approving it.
 *
 * `whole` drops the decimals. Use it for dashboard metrics and chart axes, where
 * two decimal places are noise; never for a line item, a tax figure or a total,
 * where the paisa is the thing being agreed on.
 */
export const formatINR = (paise, { whole = false } = {}) =>
  (whole ? inrWhole : inr).format((paise ?? 0) / 100);

/**
 * Compact rupees for tight metric cards: ₹12.5L, ₹1.2Cr. Lakh and crore, not
 * K/M — the audience reads Indian units. Returns the full format under ₹1L,
 * because "₹0.4L" is worse than "₹40,000".
 */
export const formatINRCompact = (paise) => {
  const rupees = (paise ?? 0) / 100;
  if (Math.abs(rupees) >= 1e7) return `₹${(rupees / 1e7).toFixed(2)}Cr`;
  if (Math.abs(rupees) >= 1e5) return `₹${(rupees / 1e5).toFixed(1)}L`;
  return inrWhole.format(rupees);
};

/** 1,240 — grouped, so a stock column is scannable. Pair with .tabular. */
export const formatQty = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0);

/** "12 Aug 2026". Never numeric-only: 08/12 is two different dates in two markets. */
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** "12 Aug 2026, 4:35 pm" — for audit trails and status history, where time matters. */
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Signed percentage for a metric delta: +12.4%, −3.1%. A true minus sign, not a hyphen. */
export const formatDelta = (pct) => `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct).toFixed(1)}%`;

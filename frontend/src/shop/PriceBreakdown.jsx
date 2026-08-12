// The full price breakdown, on Design System v1.0 — the v1.0 replacement for
// components/Breakdown.jsx, which pages/OrderDetail.jsx still renders and which is
// deleted when that page migrates.
//
// Every figure comes from the server: POST /quote before the order exists, the
// order document afterwards. The only computation here is grouping the server's
// per-line `lineGst` by its per-line `gstRate`, which SPEC section 2 calls for —
// one row per distinct rate. Nothing on this screen multiplies, adds a tax, or
// derives a total.

import { AmountList, formatINR } from '../components/DesignSystem';

export default function PriceBreakdown({
  items = [],
  subtotal,
  gstTotal,
  deliveryFee,
  grandTotal,
  className,
}) {
  const byRate = new Map();
  for (const i of items) byRate.set(i.gstRate, (byRate.get(i.gstRate) || 0) + i.lineGst);
  const gstRows = [...byRate.entries()].sort((a, b) => a[0] - b[0]);

  // The one check on the one computation here: the rows must add back up to the
  // server's own gstTotal. If they ever don't, this grouping is wrong — never the
  // server.
  if (import.meta.env.DEV) {
    const summed = gstRows.reduce((sum, [, paise]) => sum + paise, 0);
    if (summed !== gstTotal)
      console.error(`PriceBreakdown: GST rows sum to ${summed} paise, server said ${gstTotal}`);
  }

  return (
    <AmountList
      className={className}
      rows={[
        { label: 'Subtotal', hint: 'excl. GST', value: formatINR(subtotal) },
        ...gstRows.map(([rate, paise]) => ({ label: `GST ${rate}%`, value: formatINR(paise) })),
        { label: 'Delivery', hint: 'per order', value: formatINR(deliveryFee) },
        { label: 'Total', value: formatINR(grandTotal), emphasis: true },
      ]}
    />
  );
}

import { formatINR } from '../lib/money';

/**
 * The full price breakdown. Checkout and OrderDetail both render this one component, so the
 * summary and the confirmation cannot present different totals.
 *
 * Every figure comes from the server: POST /quote before the order exists, the order
 * document afterwards. The only computation here is grouping the server's per-line `lineGst`
 * by its per-line `gstRate`, which SPEC section 2 calls for — one row per distinct rate.
 * Nothing on this screen multiplies, adds a tax, or derives a total.
 */
export default function Breakdown({ items = [], subtotal, gstTotal, deliveryFee, grandTotal }) {
  const byRate = new Map();
  for (const i of items) byRate.set(i.gstRate, (byRate.get(i.gstRate) || 0) + i.lineGst);
  const gstRows = [...byRate.entries()].sort((a, b) => a[0] - b[0]);

  // The one check on the one computation here: the rows must add back up to the server's
  // own gstTotal. If they ever don't, this grouping is wrong — never the server.
  if (import.meta.env.DEV) {
    const summed = gstRows.reduce((sum, [, paise]) => sum + paise, 0);
    if (summed !== gstTotal)
      console.error(`Breakdown: GST rows sum to ${summed} paise, server said ${gstTotal}`);
  }

  return (
    <dl className="text-sm">
      <Row label="Subtotal" paise={subtotal} />
      {gstRows.map(([rate, paise]) => (
        <Row key={rate} label={`GST (${rate}%)`} paise={paise} />
      ))}
      <Row label="Delivery" paise={deliveryFee} />
      <div className="mt-3 border-t border-line pt-3">
        <Row label="Total" paise={grandTotal} strong />
      </div>
    </dl>
  );
}

function Row({ label, paise, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className={strong ? 'text-base font-semibold text-ink' : 'text-ink-muted'}>{label}</dt>
      <dd
        className={`tabular-nums ${strong ? 'text-lg font-semibold text-copper-700' : 'text-ink'}`}
      >
        {formatINR(paise)}
      </dd>
    </div>
  );
}

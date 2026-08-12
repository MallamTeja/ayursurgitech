import { formatINR } from '../lib/money';

/**
 * The struck list price and the saving, or nothing at all. `mrp` is optional and only means
 * something when it is above `price`. The two halves wrap as one unit — a "% off" that has
 * broken onto its own line has lost the number it is a discount from.
 */
export default function Mrp({ price, mrp }) {
  if (!(mrp > price)) return null;
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-sm tabular-nums text-ink-muted line-through">{formatINR(mrp)}</span>
      <span className="text-xs font-medium text-blue-700">
        {Math.round((1 - price / mrp) * 100)}% off
      </span>
    </span>
  );
}

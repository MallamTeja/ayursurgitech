import { formatINR } from '../lib/money';

// Pass paise. Size comes from the caller's className (text-lg in cards, text-2xl on detail).
export default function Price({ paise, gst = false, className = '' }) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="font-semibold tabular-nums text-copper-700">{formatINR(paise)}</span>
      {gst && <span className="text-xs font-normal text-ink-muted">+ GST</span>}
    </span>
  );
}

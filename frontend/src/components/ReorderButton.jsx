import { Link } from 'react-router-dom';
import Button from './Button';
import { RepeatIcon } from './icons';
import useReorder from '../lib/useReorder';

/**
 * "Order again" plus the report of what could not come with it. Each instance owns its own
 * hook, so one row reporting a skipped line never blanks the row above it.
 *
 * The report is rendered here rather than as a toast: a buyer needs to be able to read "gauze
 * is out of stock" for as long as it takes to decide what to do about it.
 */
export default function ReorderButton({ order, variant = 'secondary', className = '' }) {
  const { reorder, busy, report, dismiss } = useReorder();

  return (
    <div className={className}>
      <Button variant={variant} loading={busy} onClick={() => reorder(order)}>
        {!busy && <RepeatIcon className="size-4" />}
        Order again
      </Button>

      {report?.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {report.error}
        </p>
      )}

      {report && !report.error && (
        <div role="status" className="mt-3 rounded-control border border-line bg-card p-3">
          <p className="text-sm text-ink">
            {report.added > 0 ? (
              <>
                {report.added} {report.added === 1 ? 'product' : 'products'} added to your cart.{' '}
                <Link to="/cart" className="text-blue-500 underline">
                  View cart
                </Link>
              </>
            ) : (
              'Nothing from this order can be reordered right now.'
            )}
          </p>

          {report.adjusted.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {report.adjusted.map((a) => (
                <li key={a.name} className="text-xs text-ink-muted">
                  <span className="text-ink">{a.name}</span>: quantity changed from{' '}
                  <span className="tabular-nums">{a.from}</span> to{' '}
                  <span className="tabular-nums">{a.to}</span> — {a.reason}
                </li>
              ))}
            </ul>
          )}

          {report.skipped.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {report.skipped.map((s) => (
                <li key={s.name} className="text-xs text-ink-muted">
                  <span className="text-ink">{s.name}</span> was not added — {s.reason}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="mt-3 rounded-control text-xs text-blue-500 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

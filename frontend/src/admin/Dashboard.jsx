import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch';
import { adminUrl } from './helpers';
import {
  PageHeader,
  SectionHeading,
  Card,
  MetricRow,
  MetricCard,
  ErrorState,
  Skeleton,
  Icon,
  cx,
} from '../components/DesignSystem';

// One request for the whole screen — GET /admin/stats exists so this page never fans out.
//
// Six identical tiles weighted three queues an admin has to clear the same as three figures
// nobody acts on, so the screen had no answer to "what do I do now". The queues come first and
// carry the emphasis; the totals sit underneath in a quieter strip.

/**
 * A queue. Filled while there is work in it, quiet once it is clear.
 *
 * NOT a <Card>. Card hardcodes `bg-surface border-edge`, and cx() is a plain join with no
 * tailwind-merge behind it — appending `bg-brand-50 border-brand-500` leaves two utilities of
 * equal specificity in the class list and the stylesheet's own order picks the winner, not
 * the call site's. The filled state silently never rendered. A component with two surfaces
 * has to own both of them.
 */
function Queue({ label, value, to, action }) {
  const clear = !value;
  return (
    <Link
      to={to}
      className={cx(
        'flex flex-col rounded-xl border p-5 transition-[box-shadow,border-color] duration-150 hover:shadow-e1',
        clear ? 'border-edge bg-surface hover:border-edge-strong' : 'border-brand-500 bg-brand-50 hover:border-brand-600',
      )}
    >
      {/* Full contrast text in both states: a muted tone on the brand-50 fill risks
          failing AA, the same reasoning DESIGN-SYSTEM's contrast check enforces elsewhere. */}
      <p className="type-label text-fg">{label}</p>
      <p className="type-metric tabular mt-2 text-fg">{value}</p>
      <p className={cx('type-body-sm mt-2', clear ? 'text-fg-secondary' : 'font-semibold text-brand-700')}>
        {clear ? 'Nothing waiting' : action}
      </p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch('/admin/stats');

  const queues = data && [
    {
      label: 'Pending orders',
      value: data.pendingOrders,
      to: adminUrl('/orders?status=pending'),
      action: 'Process them',
    },
    {
      label: 'Out of stock',
      value: data.outOfStockCount,
      to: adminUrl('/products?stock=out'),
      action: 'Restock them',
    },
    {
      label: 'Pending reviews',
      value: data.pendingReviews,
      to: adminUrl('/reviews?status=pending'),
      action: 'Moderate them',
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Everything waiting on you, in one place." />

      {loading && (
        <div className="mt-8 flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} w="w-full" h="h-32" rounded="rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} w="w-full" h="h-20" rounded="rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <Card className="mt-8">
          <ErrorState thing="the dashboard" detail={error} onRetry={reload} />
        </Card>
      )}

      {data && (
        <div className="mt-8 flex flex-col gap-8">
          <section>
            <SectionHeading title="Needs attention" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {queues.map((q) => (
                <Queue key={q.label} {...q} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Totals" />
            <div className="mt-4">
              <MetricRow>
                <MetricCard label="Orders" value={data.orderCount} kind="count" icon={Icon.orders} />
                <MetricCard label="Products" value={data.productCount} kind="count" icon={Icon.products} />
                <MetricCard label="Revenue" value={data.revenuePaise} kind="money" icon={Icon.revenue} />
              </MetricRow>
            </div>
            <p className="type-caption mt-4 max-w-prose text-fg-secondary">
              Revenue is the sum of every order except cancelled ones — payment-pending orders
              count, because payment is stubbed in this build.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

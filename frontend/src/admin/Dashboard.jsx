import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Icon,
  MetricCard,
  MetricRow,
  PageHeader,
  Panel,
  SectionHeading,
  ShareBar,
  Skeleton,
  StatusBadge,
  cx,
  formatDate,
  formatINR,
  formatINRCompact,
  formatQty,
} from '../components/DesignSystem';
import { adminUrl } from './helpers';
import { useAdminData, useAdminQueues } from './data';

// §19 and §20 made literal, on the fixture the shop reads.
//
// THE ORDER OF THIS SCREEN IS THE ARGUMENT. Four metric tiles at the top of an
// operations dashboard answer "how are we doing", which nobody opens this panel to
// ask at 9am. The queues come first because they answer "what do I do now", and
// they are the only blocks on the page that change colour when they are not empty.
// The figures follow, then the trend, then the mix — decreasing urgency, top to
// bottom.

/**
 * A queue. Filled while there is work in it, quiet once it is clear.
 *
 * NOT a <Card>. Card hardcodes `bg-surface border-edge`, and cx() is a plain join
 * with no tailwind-merge behind it — appending `bg-brand-50 border-brand-500`
 * leaves two utilities of equal specificity in the class list and the stylesheet's
 * own order picks the winner, not the call site's. A component with two surfaces
 * has to own both of them.
 */
function Queue({ label, value, to, action, tone = 'brand' }) {
  const clear = !value;
  const FILLED = {
    brand: 'border-brand-500 bg-brand-50 hover:border-brand-600',
    warning: 'border-warning/40 bg-warning-bg hover:border-warning',
  };
  const ACTION = { brand: 'text-brand-700', warning: 'text-warning-700' };

  return (
    <Link
      to={to}
      className={cx(
        'flex flex-col rounded-xl border p-5 transition-[box-shadow,border-color] duration-150 hover:shadow-e1',
        clear ? 'border-edge bg-surface hover:border-edge-strong' : FILLED[tone],
      )}
    >
      {/* Full-contrast text in both states: a muted tone on a tinted fill risks
          failing AA, which is the check the token notes in theme.css enforce. */}
      <p className="type-label text-fg">{label}</p>
      <p className="type-metric tabular mt-2 text-fg">{formatQty(value)}</p>
      <p className={cx('type-body-sm mt-2 flex items-center gap-1', clear ? 'text-fg-secondary' : cx('font-semibold', ACTION[tone]))}>
        {clear ? (
          <>
            <Icon.success size={14} className="shrink-0 text-success" />
            Nothing waiting
          </>
        ) : (
          <>
            {action}
            <Icon.arrowRight size={14} className="shrink-0" />
          </>
        )}
      </p>
    </Link>
  );
}

export default function AdminDashboard() {
  const [params, setParams] = useSearchParams();
  const { data, loading, error } = useAdminData(
    (s) => ({
      metrics: s.metrics,
      revenueSeries: s.revenueSeries,
      topProducts: s.topProducts,
      orders: s.orders,
      products: s.products,
    }),
    { forced: params.get('state') },
  );
  const queues = useAdminQueues();

  // Cancelled and returned orders are not revenue, and they are not part of the
  // category mix either.
  const live = data.orders.filter((o) => o.status !== 'cancelled' && o.status !== 'returned');

  const recent = [...data.orders]
    .sort((a, b) => new Date(b.placed) - new Date(a.placed))
    .slice(0, 5);

  // Revenue by category, from the order lines. Everything below the top four is
  // one "Other" segment — §20 allows four series, and a five-colour chart is the
  // rainbow it rules out.
  const byCategory = () => {
    const bucket = new Map();
    for (const order of live) {
      for (const line of order.items ?? []) {
        const product = data.products.find((p) => p.id === line.productId);
        const key = product?.category ?? 'Other';
        bucket.set(key, (bucket.get(key) ?? 0) + line.qty * line.rate);
      }
    }
    const sorted = [...bucket.entries()].sort((a, b) => b[1] - a[1]);
    const head = sorted.slice(0, 4).map(([label, value]) => ({ label, value }));
    const tail = sorted.slice(4).reduce((sum, [, value]) => sum + value, 0);
    return tail > 0 ? [...head, { label: 'Other categories', value: tail }] : head;
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Everything waiting on you, in one place." />
        <div className="mt-8 flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} w="w-full" h="h-32" rounded="rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} w="w-full" h="h-28" rounded="rounded-xl" />
            ))}
          </div>
          <Skeleton w="w-full" h="h-80" rounded="rounded-2xl" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Everything waiting on you, in one place." />
        <Panel className="mt-8">
          {/* Retry has to actually do something or the button is a lie. Dropping
              the parameter that forced the failure is exactly what recovery means
              here, and it is the same shape of call a real retry will be. */}
          <ErrorState thing="the dashboard" detail={error} onRetry={() => setParams({})} />
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Everything waiting on you, in one place."
        actions={
          <Button as={Link} to={adminUrl('/orders')} variant="secondary" iconLeft={Icon.orders}>
            All orders
          </Button>
        }
      />

      <div className="mt-8 flex flex-col gap-10">
        <section>
          <SectionHeading title="Needs attention" subtitle="Each of these is a queue you can clear." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Queue
              label="Orders to dispatch"
              value={queues.pendingOrders}
              to={adminUrl('/orders?status=open')}
              action="Process them"
            />
            <Queue
              label="Out of stock"
              value={queues.outOfStock}
              to={adminUrl('/products?stock=out')}
              action="Restock them"
            />
            <Queue
              label="Low stock"
              value={queues.lowStock}
              to={adminUrl('/products?stock=low')}
              action="Reorder them"
              tone="warning"
            />
            <Queue
              label="Reviews to moderate"
              value={queues.pendingReviews}
              to={adminUrl('/reviews?status=pending')}
              action="Moderate them"
            />
          </div>
        </section>

        {/* THE FIGURES AND THE QUEUES ARE DIFFERENT SCOPES, AND THAT IS WHY THEY
            ARE LABELLED DIFFERENTLY.

            These four cards are the month's trading figures, and they are the same
            numbers the chart below plots — metrics.Revenue is Aug's bar to the
            rupee, metrics.Orders is Aug's order count. Computing them from the ten
            orders loaded on this desk instead made the headline read ₹14.4L above a
            chart whose last bar said ₹12.5L: two numbers, one label, no way for a
            reader to know which one to believe.

            Everything above and below is live over what is on the desk, and says
            so. Nothing on this screen is labelled the same as something else. */}
        <section>
          <SectionHeading title="August 2026" subtitle="Trading figures for the month, against the one before it." />
          <MetricRow className="mt-4">
            {data.metrics.map((m) => (
              <MetricCard
                key={m.label}
                label={m.label}
                value={m.value}
                kind={m.kind}
                delta={m.delta}
                context={m.context}
                // Down is good for receivables. Without this, the best news on the
                // screen renders red and reads as an alarm.
                invertDelta={m.label === 'Outstanding'}
                icon={
                  m.label === 'Revenue'
                    ? Icon.revenue
                    : m.label === 'Orders'
                      ? Icon.orders
                      : m.label === 'Customers'
                        ? Icon.customers
                        : Icon.payments
                }
              />
            ))}
          </MetricRow>
        </section>

        {/* min-w-0 on both columns: a grid item defaults to min-width:auto, so
            without it the chart's own width floors the column and the page scrolls
            sideways instead of the chart shrinking. */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card padding="none" className="min-w-0 lg:col-span-2">
            <CardHeader
              title="Revenue"
              subtitle="Twelve months to August 2026"
              icon={Icon.revenue}
            />
            <CardBody>
              <BarChart
                data={data.revenueSeries}
                xKey="month"
                yKey="revenue"
                series="revenue"
                format={formatINRCompact}
                height={220}
                caption="Revenue by month"
              />
            </CardBody>
          </Card>

          <Card padding="none" className="min-w-0">
            <CardHeader
              title="Category mix"
              subtitle="Across the orders on this desk"
              icon={Icon.categories}
            />
            <CardBody>
              <ShareBar items={byCategory()} format={formatINRCompact} caption="Revenue by category" />
            </CardBody>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <SectionHeading
              title="On this desk"
              subtitle={`${formatQty(data.orders.length)} orders and ${formatQty(data.products.length)} products are loaded. Everything below is live over them.`}
            />
          </div>

          <Card padding="none" className="min-w-0">
            <CardHeader
              title="Latest orders"
              icon={Icon.orders}
              action={
                <Button as={Link} to={adminUrl('/orders')} variant="tertiary" size="sm" iconRight={Icon.arrowRight}>
                  View all
                </Button>
              }
            />
            <CardBody padding="none">
              <ul className="divide-y divide-edge">
                {recent.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={adminUrl(`/orders/${order.id}`)}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="type-body-sm truncate font-medium text-fg">{order.org}</p>
                        <p className="type-caption tabular mt-0.5 text-fg-secondary">
                          {order.id} · {formatDate(order.placed)}
                        </p>
                      </div>
                      <StatusBadge kind="order" value={order.status} size="sm" />
                      <span className="type-body-sm tabular w-24 shrink-0 text-right font-medium text-fg">
                        {formatINR(order.total, { whole: true })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card padding="none" className="min-w-0">
            <CardHeader title="Top products" subtitle="By revenue, this month" icon={Icon.products} />
            <CardBody padding="none">
              <ol className="divide-y divide-edge">
                {data.topProducts.map((product, i) => (
                  <li key={product.name} className="flex items-center gap-3 px-5 py-3">
                    <span className="type-caption tabular grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 font-semibold text-fg-secondary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="type-body-sm truncate font-medium text-fg">{product.name}</p>
                      <p className="type-caption tabular mt-0.5 text-fg-secondary">
                        {formatQty(product.units)} units
                      </p>
                    </div>
                    <span className="type-body-sm tabular shrink-0 font-medium text-fg">
                      {formatINRCompact(product.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}

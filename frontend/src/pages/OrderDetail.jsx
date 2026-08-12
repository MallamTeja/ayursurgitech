import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
// Same renderer the checkout summary uses, so the two totals cannot present differently.
import Breakdown from '../components/Breakdown';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import ErrorState from '../components/ErrorState';
import ReorderButton from '../components/ReorderButton';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import usePageTitle from '../components/usePageTitle';
import { get } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatINR } from '../lib/money';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { pathname } = useLocation();
  usePageTitle(`Order ${id}`);

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrder(await get(`/orders/${id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />;

  if (loading) {
    return (
      <Container className="py-8 md:py-12">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-12">
        <Card>
          <ErrorState message={error || 'Order not found'} onRetry={load} />
        </Card>
      </Container>
    );
  }

  const { address } = order;

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">Order confirmed</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="break-all font-mono text-sm text-ink">{order._id}</span>
        <StatusBadge status={order.status} />
        <span className="text-sm text-ink-muted">
          {new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Payment is stubbed. Nothing here may imply money changed hands. */}
      <Card className="mt-6 p-4">
        <p className="text-sm font-medium text-ink">Payment pending</p>
        <p className="mt-1 text-sm text-ink-muted">
          This order is recorded and reserved. No payment has been taken — our team will contact you
          on {order.userPhone} to settle it. GST invoice with HSN codes issued for every order.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <Card className="p-4 md:p-6">
          <h2 className="text-lg">Items</h2>
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className="h-fit shrink-0 self-start rounded-control border border-line bg-card p-2">
                  <img src={item.image} alt="" className="size-16 object-contain" loading="lazy" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="mt-1 text-xs text-ink-muted tabular-nums">
                    {item.qty} × {formatINR(item.unitPrice)}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    HSN <span className="font-mono text-ink">{item.hsnCode}</span> · GST{' '}
                    {item.gstRate}%
                  </p>
                </div>
                <span className="shrink-0 self-start text-sm font-semibold tabular-nums text-copper-700">
                  {formatINR(item.lineSubtotal)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-4 md:p-6">
            <h2 className="text-lg">Price breakdown</h2>
            <div className="mt-4">
              <Breakdown {...order} />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <h2 className="text-lg">Delivery address</h2>
            <address className="mt-3 text-sm not-italic">
              {address?.label && <span className="block font-semibold text-ink">{address.label}</span>}
              <span className="block text-ink">{address?.line1}</span>
              {address?.line2 && <span className="block text-ink-muted">{address.line2}</span>}
              <span className="block text-ink-muted">
                {address?.city}, {address?.state} {address?.pincode}
              </span>
              <span className="block text-ink-muted">{address?.phone}</span>
            </address>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {/* The one action on this page that starts something rather than navigating away, so
            it takes the accent and sits above the other two. */}
        <ReorderButton order={order} variant="accent" className="self-start" />

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" to="/orders">
            All orders
          </Button>
          <Button variant="secondary" to="/products">
            Continue shopping
          </Button>
        </div>
      </div>
    </Container>
  );
}

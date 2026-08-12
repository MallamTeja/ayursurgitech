import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ReorderButton from '../components/ReorderButton';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import usePageTitle from '../components/usePageTitle';
import { ChevronRightIcon, PackageIcon } from '../components/icons';
import { get } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatINR } from '../lib/money';

export default function Orders() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  usePageTitle('My orders');

  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await get('/orders'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />;

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">My orders</h1>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <Card>
            <ErrorState message={error} onRetry={load} />
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <EmptyState
              icon={<PackageIcon className="size-8" />}
              message="No orders yet. Everything you order will be listed here with its status and GST breakdown."
              actionLabel="Browse the catalogue"
              actionTo="/products"
            />
          </Card>
        ) : (
          // The server already returns these newest first.
          // The card is no longer one big <Link>: "Order again" is a button, and a button
          // inside an anchor is invalid markup that swallows its own clicks. The link now
          // covers the order's details and the button is its sibling.
          <ul className="flex flex-col gap-4">
            {orders.map((order) => (
              <li key={order._id}>
                <Card className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 transition-colors duration-150 hover:border-blue-500 md:p-6">
                  <Link
                    to={`/order/${order._id}`}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-control"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="break-all font-mono text-xs text-ink md:text-sm">
                          {order._id}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <span className="shrink-0 text-lg font-semibold tabular-nums text-copper-700">
                      {formatINR(order.grandTotal)}
                    </span>
                    <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
                  </Link>

                  {/* w-full so a report wraps onto its own line instead of crushing the row. */}
                  <ReorderButton order={order} className="w-full md:w-auto" />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

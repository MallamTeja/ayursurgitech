import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { STATUSES, STATUS_LABELS } from '../components/StatusBadge';
import { put } from '../lib/api';
import { formatDate } from '../lib/date';
import { formatINR } from '../lib/money';
import useFetch from '../lib/useFetch';
import { adminUrl } from './helpers';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  Select,
  TableToolbar,
  useToast,
} from '../components/DesignSystem';

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  // ponytail: the whole list, filtered in the browser. Nothing is paginated, and it lets the
  // "not dispatched" bucket match the dashboard tile exactly — the API filters one status only.
  const list = useFetch('/admin/orders');
  const filter = params.get('status') || 'all';

  const rows = (list.data || []).filter((o) =>
    filter === 'all'
      ? true
      : filter === 'pending'
        ? o.status === 'paymentPending' || o.status === 'placed'
        : o.status === filter,
  );

  async function onStatus(order, status) {
    setBusyId(order._id);
    try {
      const saved = await put(`/admin/orders/${order._id}`, { status });
      list.set(list.data.map((o) => (o._id === order._id ? { ...o, status: saved.status } : o)));
      toast.success(`Order ${order._id.slice(-8)} is now ${STATUS_LABELS[saved.status]}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'Order',
      primary: true,
      render: (o) => (
        <Link
          to={adminUrl(`/orders/${o._id}`)}
          title={o._id}
          aria-label={`Order ${o._id.slice(-8)}`}
          className="font-mono text-xs text-brand-700 hover:underline"
        >
          {o._id.slice(-8)}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (o) => formatDate(o.createdAt),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <>
          {o.userName}
          <span className="ml-2 font-mono text-fg-muted">{o.userPhone}</span>
        </>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      render: (o) => o.items?.length ?? 0,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (o) => formatINR(o.grandTotal),
    },
    {
      key: 'status',
      header: 'Status',
      // The select IS the status: it shows the current one and changes it. A badge above
      // it would print the same word twice and make every row two controls tall, which on
      // a compact table costs more than the colour is worth. The coloured badge lives on
      // the order's own page, where there is one status rather than a column of them.
      render: (o) => (
        <Select
          aria-label={`Status for order ${o._id.slice(-8)}`}
          size="sm"
          value={o.status}
          disabled={busyId === o._id}
          onChange={(e) => onStatus(o, e.target.value)}
        >
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {STATUS_LABELS[st]}
            </option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Orders" subtitle="Newest first. Status changes save the moment you pick one." />

      <div className="mt-6">
        <TableToolbar
          filters={
            <Field label="Filter by status" className="w-full sm:w-64">
              <Select
                value={filter}
                onChange={(e) => setParams(e.target.value === 'all' ? {} : { status: e.target.value })}
              >
                <option value="all">All orders</option>
                <option value="pending">Not dispatched (payment pending + placed)</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
          }
        />
      </div>

      <div className="mt-4">
        {list.error ? (
          <ErrorState thing="the orders" detail={list.error} onRetry={list.reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(o) => o._id}
            caption="Orders"
            loading={list.loading}
            empty={
              <EmptyState
                variant={filter === 'all' ? 'nothing-yet' : 'no-results'}
                title={filter === 'all' ? 'No orders yet.' : 'No orders with that status.'}
                action={
                  filter === 'all' ? undefined : (
                    <Button variant="secondary" onClick={() => setParams({})}>
                      Show all orders
                    </Button>
                  )
                }
              />
            }
          />
        )}
      </div>
    </>
  );
}

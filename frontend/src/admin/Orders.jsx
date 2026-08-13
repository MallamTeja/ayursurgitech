import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Chip,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Icon,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  Select,
  StatusDot,
  TableToolbar,
  formatDate,
  formatINR,
  formatQty,
  useToast,
} from '../components/DesignSystem';
import { adminUrl } from './helpers';
import { ordersApi, useAdminData, useDebounced, useTableView } from './data';

// The order book.
//
// STATUS COMES FROM THE DESIGN SYSTEM, not from a local map. ORDER_STATUS is §28's
// twelve-state lifecycle, and it is the same registry the Stepper, the Timeline and
// the customer's own order page read — so "Out for Delivery" is spelled and coloured
// identically in four places, and adding a state is one line in one file. The local
// ORDER_TONE table this screen used to carry was a second, drifting copy of it.
//
// The dashboard links here with ?status=open, which is the bucket "not dispatched
// yet" — a filter the status list itself cannot express, and the thing an ops user
// actually opens this screen for.

const OPEN_STATES = ['placed', 'confirmed', 'processing', 'packed'];

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounced(search.trim().toLowerCase(), 200);
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error } = useAdminData((s) => s.orders, { forced: params.get('state') });

  // Both filters are closed sets, so an unrecognised value in the URL falls back to
  // "all" rather than filtering everything out. A truncated link should show the
  // order book, not an empty table with a chip reading "banana".
  const statusParam = params.get('status');
  const status = statusParam === 'open' || ORDER_STATUS[statusParam] ? statusParam : 'all';
  const payment = PAYMENT_STATUS[params.get('payment')] ? params.get('payment') : 'all';

  const patchParams = (patch, options) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === 'all') next.delete(key);
        else next.set(key, value);
      }
      return next;
    }, options);

  useEffect(() => {
    if ((params.get('q') ?? '') === search.trim()) return;
    patchParams({ q: search.trim() || null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const rows = useMemo(
    () =>
      data.filter((o) => {
        if (status === 'open' ? !OPEN_STATES.includes(o.status) : status !== 'all' && o.status !== status) return false;
        if (payment !== 'all' && o.payment !== payment) return false;
        if (!q) return true;
        // Order number, buyer, and the buyer's own PO — a purchasing officer
        // chasing an order quotes their PO, not our reference.
        return `${o.id} ${o.org} ${o.po ?? ''}`.toLowerCase().includes(q);
      }),
    [data, status, payment, q],
  );

  const view = useTableView(rows, {
    pageSize: 12,
    initialSort: { key: 'placed', direction: 'desc' },
    sortKey: {
      id: (o) => o.id,
      placed: (o) => new Date(o.placed).getTime(),
      org: (o) => o.org,
      lines: (o) => o.lines,
      total: (o) => o.total,
      // By lifecycle position, not alphabetically: sorting a status column A–Z
      // puts Cancelled above Placed and tells you nothing about progress.
      status: (o) => ORDER_STATUS[o.status]?.step ?? 99,
      payment: (o) => o.payment,
    },
  });

  async function onStatus(order, next) {
    setBusyId(order.id);
    try {
      await ordersApi.setStatus(order.id, next);
      toast.success(`Order ${order.id} is now ${ORDER_STATUS[next]?.label ?? next}.`, {
        title: 'Status updated',
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const filtered = Boolean(q) || status !== 'all' || payment !== 'all';

  const columns = [
    {
      key: 'id',
      header: 'Order',
      primary: true,
      sortable: true,
      render: (o) => (
        <span className="block min-w-0">
          <Link
            to={adminUrl(`/orders/${o.id}`)}
            className="tabular font-medium text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline"
          >
            {o.id}
          </Link>
          {/* The buyer's PO, not ours. It is how they refer to this order on the
              phone, and it is the field an accounts department matches against. */}
          {o.po && o.po !== '—' && (
            <span className="type-caption mt-0.5 block truncate font-mono text-fg-muted">{o.po}</span>
          )}
        </span>
      ),
    },
    { key: 'placed', header: 'Placed', sortable: true, className: 'whitespace-nowrap', render: (o) => formatDate(o.placed) },
    {
      key: 'org',
      header: 'Customer',
      sortable: true,
      render: (o) => <span className="block max-w-56 truncate text-fg">{o.org}</span>,
    },
    { key: 'lines', header: 'Lines', align: 'right', sortable: true, render: (o) => formatQty(o.lines) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortable: true,
      render: (o) => formatINR(o.total),
    },
    {
      key: 'payment',
      header: 'Payment',
      sortable: true,
      // A dot plus the plain word. A full badge in both this column and the next
      // gives every row two coloured chips, and the pair stops being scannable.
      render: (o) => <StatusDot kind="payment" value={o.payment} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      // The select IS the status: it shows the current one and changes it. A badge
      // beside it would print the same word twice and make every row two controls
      // tall. The coloured badge lives on the order's own page, where there is one
      // status rather than a column of them.
      render: (o) => (
        <Select
          aria-label={`Status for order ${o.id}`}
          size="sm"
          value={o.status}
          disabled={busyId === o.id}
          onChange={(e) => onStatus(o, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="min-w-40"
        >
          {Object.entries(ORDER_STATUS).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <Button
          as={Link}
          to={adminUrl(`/orders/${o.id}`)}
          variant="tertiary"
          size="sm"
          iconRight={Icon.arrowRight}
          aria-label={`Open order ${o.id}`}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Newest first. A status change saves the moment you pick one, and is written to the order's history."
      />

      <div className="mt-6 flex flex-col gap-3">
        <TableToolbar
          search={
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Order number, customer or PO"
              aria-label="Search orders by number, customer or PO"
            />
          }
          filters={
            <>
              <Select
                aria-label="Filter by order status"
                size="sm"
                value={status}
                onChange={(e) => patchParams({ status: e.target.value })}
                className="w-full sm:w-52"
              >
                <option value="all">All statuses</option>
                <option value="open">Open — not yet dispatched</option>
                {Object.entries(ORDER_STATUS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filter by payment status"
                size="sm"
                value={payment}
                onChange={(e) => patchParams({ payment: e.target.value })}
                className="w-full sm:w-44"
              >
                <option value="all">Any payment</option>
                {Object.entries(PAYMENT_STATUS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </>
          }
        />

        <FilterBar
          onClearAll={
            filtered
              ? () => {
                  setSearch('');
                  patchParams({ q: null, status: null, payment: null });
                }
              : undefined
          }
          chips={[
            q && (
              <Chip key="q" icon={Icon.search} onRemove={() => setSearch('')} removeLabel="Clear the search">
                {`"${search.trim()}"`}
              </Chip>
            ),
            status !== 'all' && (
              <Chip
                key="status"
                icon={Icon.orders}
                onRemove={() => patchParams({ status: null })}
                removeLabel="Clear the status filter"
              >
                {status === 'open' ? 'Open orders' : (ORDER_STATUS[status]?.label ?? status)}
              </Chip>
            ),
            payment !== 'all' && (
              <Chip
                key="payment"
                icon={Icon.payments}
                onRemove={() => patchParams({ payment: null })}
                removeLabel="Clear the payment filter"
              >
                {PAYMENT_STATUS[payment].label}
              </Chip>
            ),
          ].filter(Boolean)}
        />
      </div>

      <div className="mt-4">
        {error ? (
          <Panel>
            <ErrorState thing="the orders" detail={error} onRetry={() => patchParams({ state: null })} />
          </Panel>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={view.rows}
              rowKey={(o) => o.id}
              caption="Orders"
              loading={loading}
              sort={view.sort}
              onSortChange={view.onSortChange}
              empty={
                <EmptyState
                  variant={filtered ? 'no-results' : 'nothing-yet'}
                  icon={filtered ? Icon.search : Icon.orders}
                  title={filtered ? 'No order matches these filters.' : 'No orders yet.'}
                  body={
                    filtered
                      ? 'Clear the filters to see the whole order book.'
                      : 'Orders placed in the shop arrive here.'
                  }
                  action={
                    filtered ? (
                      <Button
                        variant="secondary"
                        iconLeft={Icon.retry}
                        onClick={() => {
                          setSearch('');
                          patchParams({ q: null, status: null, payment: null });
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              }
            />

            {!loading && view.pages > 1 && (
              <Pagination
                className="mt-4"
                page={view.page}
                pageSize={view.pageSize}
                total={view.total}
                onPageChange={view.setPage}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

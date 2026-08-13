import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AmountList,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  DescriptionList,
  Divider,
  ErrorState,
  Field,
  Icon,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PageHeader,
  Panel,
  Select,
  Skeleton,
  StatusBadge,
  Stepper,
  Timeline,
  Well,
  formatDate,
  formatDateTime,
  formatINR,
  formatQty,
  useToast,
} from '../components/DesignSystem';
import { adminUrl } from './helpers';
import { lineTotalsOf, orderHistoryOf, ordersApi, useAdminData } from './data';

// One order. This is the screen someone packs and dispatches from, so it prints
// legibly: plain rows, no information carried by colour alone, every figure spelled
// out, and the arithmetic reconciles against the Orders table it was opened from
// because both read the same derived lines.

/** GST split into halves. An intra-state invoice is CGST + SGST, never one "GST" line. */
function gstSplit(lines) {
  const byRate = new Map();
  for (const line of lines) {
    const { gst } = lineTotalsOf(line);
    byRate.set(line.gst, (byRate.get(line.gst) ?? 0) + gst);
  }
  return [...byRate.entries()].sort((a, b) => a[0] - b[0]);
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const { data, loading, error } = useAdminData(
    (s) => ({ orders: s.orders, history: s.orderHistory, organizations: s.organizations, settings: s.settings }),
    { forced: params.get('state') },
  );

  const order = data.orders.find((o) => o.id === id);
  // The pending selection, or the saved status when nothing is pending. Keyed off
  // the order so navigating from one order to another does not carry a half-made
  // choice across — the bug where you set AST-26-0412 to Packed and the next order
  // opens already showing Packed in its dropdown.
  const [draft, setDraft] = useState({ id, status: null });
  const pending = draft.id === id ? draft.status : null;
  const selected = pending ?? order?.status;
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton w="w-72" h="h-9" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton h="h-96" rounded="rounded-2xl" className="lg:col-span-2" />
          <Skeleton h="h-96" rounded="rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Panel>
        <ErrorState thing="this order" detail={error} onRetry={() => setParams({})} />
      </Panel>
    );
  }

  // A bad id in the URL is a normal thing to arrive with — a stale bookmark, a
  // deleted order — so it gets a way out rather than a dead end.
  if (!order) {
    return (
      <>
        <PageHeader
          title="Order not found"
          actions={
            <Button as={Link} to={adminUrl('/orders')} variant="secondary" iconLeft={Icon.arrowLeft}>
              Back to orders
            </Button>
          }
        />
        <Panel className="mt-6">
          <ErrorState
            title={`No order numbered ${id}.`}
            body="It may have been removed, or the link may be out of date. The order book has every order on this desk."
            onRetry={undefined}
          />
        </Panel>
      </>
    );
  }

  const lines = order.items ?? [];
  const org = data.organizations.find((o) => o.id === order.orgId);
  const history = orderHistoryOf(order, data.history);
  const statusMeta = ORDER_STATUS[order.status];
  const paymentMeta = PAYMENT_STATUS[order.payment];

  async function onSave() {
    setBusy(true);
    try {
      await ordersApi.setStatus(order.id, selected);
      setDraft({ id, status: null });
      toast.success(`Order ${order.id} is now ${ORDER_STATUS[selected]?.label ?? selected}.`, {
        title: 'Status updated',
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const itemColumns = [
    {
      key: 'name',
      header: 'Product',
      primary: true,
      render: (l) => (
        <span className="block min-w-0">
          <span className="font-medium text-fg">{l.name}</span>
          <span className="type-caption mt-0.5 block font-mono text-fg-muted">
            {l.code} · HSN {l.hsn}
          </span>
        </span>
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      render: (l) => (
        <span>
          {formatQty(l.qty)}
          <span className="type-caption block text-fg-muted">{l.uom}</span>
        </span>
      ),
    },
    { key: 'rate', header: 'Rate', align: 'right', render: (l) => formatINR(l.rate) },
    { key: 'amount', header: 'Amount', align: 'right', render: (l) => formatINR(lineTotalsOf(l).amount) },
    {
      key: 'gst',
      header: 'GST',
      align: 'right',
      render: (l) => (
        <span>
          {formatINR(lineTotalsOf(l).gst)}
          <span className="type-caption block text-fg-muted">@ {l.gst}%</span>
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Line total',
      align: 'right',
      render: (l) => <span className="font-medium">{formatINR(lineTotalsOf(l).total)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Orders', href: adminUrl('/orders') },
              { label: order.id },
            ]}
          />
        }
        title={`Order ${order.id}`}
        subtitle={`${order.org} · placed ${formatDateTime(order.placed)}`}
        meta={
          <>
            <StatusBadge kind="order" value={order.status} />
            <StatusBadge kind="payment" value={order.payment} />
            {order.po && order.po !== '—' && (
              <span className="type-body-sm text-fg-secondary">
                Their PO <span className="font-mono text-fg">{order.po}</span>
              </span>
            )}
          </>
        }
        actions={
          // print-hide: these are the two controls on the page that cannot be used
          // on paper, so they are the two that do not go on it. theme.css has the
          // rest of the print rules.
          <div className="print-hide flex flex-wrap items-center gap-3">
            <Button variant="secondary" iconLeft={Icon.print} onClick={() => window.print()}>
              Print
            </Button>
            <Button as={Link} to={adminUrl('/orders')} variant="tertiary" iconLeft={Icon.arrowLeft}>
              Back to orders
            </Button>
          </div>
        }
      />

      {/* Progress first, because it is the answer to "where is this order" — the
          question the phone call that opened this screen was about. */}
      <Card className="mt-6">
        <Stepper status={order.status} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* min-w-0: a grid item defaults to min-width:auto, so without it the wide
            items table stretches this column and the whole page scrolls sideways
            at 390px instead of the table's own container doing it. */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card padding="none">
            <CardHeader
              title="Items"
              subtitle={`${formatQty(lines.length)} line${lines.length === 1 ? '' : 's'}`}
              icon={Icon.products}
            />
            <CardBody>
              <DataTable
                density="compact"
                columns={itemColumns}
                rows={lines}
                rowKey={(l, i) => `${l.productId}-${i}`}
                caption="Order items"
                stickyHeader={false}
                empty={
                  <div className="type-body-sm px-4 py-8 text-center text-fg-secondary">
                    This order has no lines on it.
                  </div>
                }
              />

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-end">
                <div className="w-full sm:max-w-sm">
                  <AmountList
                    rows={[
                      { label: 'Subtotal', hint: 'excl. GST', value: formatINR(order.subtotal) },
                      ...gstSplit(lines).map(([rate, amount]) => ({
                        label: `GST @ ${rate}%`,
                        value: formatINR(amount),
                      })),
                      {
                        label: 'Delivery',
                        value: order.delivery ? formatINR(order.delivery) : 'Free',
                        hint: order.delivery ? undefined : `over ${formatINR(data.settings.freeDeliveryAbove, { whole: true })}`,
                      },
                      { label: 'Total', value: formatINR(order.total), emphasis: true },
                    ]}
                  />
                </div>
              </div>

              <p className="type-caption mt-4 text-fg-secondary">
                A price breakdown, not a tax invoice — GST is shown by rate, without the CGST/SGST
                split or the HSN-wise summary a filed invoice needs.
              </p>
            </CardBody>
          </Card>

          <Card padding="none">
            <CardHeader title="History" subtitle="Every transition, who made it, when" icon={Icon.audit} />
            <CardBody>
              <Timeline
                entries={history.map((h) => ({ ...h, at: formatDateTime(h.at) }))}
              />
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {/* The status editor is a control, so it does not print. The status
              itself is already in the header badge and in the stepper above, both
              of which do. */}
          <Card padding="none" className="print-hide">
            <CardHeader title="Status" icon={statusMeta?.icon ?? Icon.help} />
            <CardBody className="flex flex-col gap-4">
              <p className="type-body-sm text-fg">
                Currently{' '}
                <strong className="font-semibold">{statusMeta?.label ?? order.status}</strong>. Payment
                is <strong className="font-semibold">{paymentMeta?.label ?? order.payment}</strong>.
              </p>

              <Field
                label="Change status"
                htmlFor="order-status"
                helper="Saved to the order and written to its history below."
              >
                <Select
                  id="order-status"
                  value={selected}
                  onChange={(e) => setDraft({ id, status: e.target.value })}
                >
                  {Object.entries(ORDER_STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* An order cannot un-happen. Moving it backwards is legitimate — a
                  mis-click at the packing bench — but it should be a decision, not
                  a side effect of scrolling a dropdown. §4: words, not colour. */}
              {pending && ORDER_STATUS[pending]?.step && statusMeta?.step && ORDER_STATUS[pending].step < statusMeta.step && (
                <Alert tone="warning" title="This moves the order backwards">
                  {statusMeta.label} has already been recorded against this order. The history keeps
                  both entries.
                </Alert>
              )}

              {pending && !ORDER_STATUS[pending]?.step && (
                <Alert tone="warning" title={`${ORDER_STATUS[pending].label} takes it out of the delivery flow`}>
                  The progress track stops and the order stops counting towards revenue.
                </Alert>
              )}

              <Button fullWidth onClick={onSave} loading={busy} loadingLabel="Saving…" disabled={!pending}>
                {pending ? 'Save status' : 'Saved'}
              </Button>
            </CardBody>
          </Card>

          <Card padding="none">
            <CardHeader title="Customer" icon={Icon.organizations} />
            <CardBody className="flex flex-col gap-4">
              <div>
                <p className="type-body-sm font-semibold text-fg">{org?.tradeName ?? order.org}</p>
                {org?.legalName && org.legalName !== org.tradeName && (
                  <p className="type-caption mt-0.5 text-fg-secondary">{org.legalName}</p>
                )}
              </div>

              {org ? (
                <>
                  <DescriptionList
                    items={[
                      { label: 'GSTIN', value: <span className="font-mono">{org.gstin}</span> },
                      { label: 'Type', value: org.type },
                      { label: 'Location', value: `${org.city}, ${org.state}` },
                      { label: 'Credit terms', value: org.creditTerms },
                      { label: 'Customer since', value: formatDate(org.since) },
                      { label: 'Orders to date', value: formatQty(org.orders) },
                    ]}
                    columns={2}
                  />

                  <Divider />

                  {/* Credit headroom is why an ops user looks at the customer panel
                      on an unpaid order at all, so it is stated as a figure rather
                      than left to be worked out from two others. */}
                  <Well>
                    <p className="type-caption text-fg-secondary">Outstanding against limit</p>
                    <p className="type-body-sm tabular mt-1 font-semibold text-fg">
                      {formatINR(org.outstanding, { whole: true })} of{' '}
                      {formatINR(org.creditLimit, { whole: true })}
                    </p>
                    <p
                      className={
                        org.creditLimit > 0 && org.outstanding >= org.creditLimit * 0.9
                          ? 'type-caption mt-1 font-medium text-error-700'
                          : 'type-caption mt-1 text-fg-secondary'
                      }
                    >
                      {org.creditLimit > 0
                        ? `${formatINR(Math.max(0, org.creditLimit - org.outstanding), { whole: true })} headroom`
                        : 'Advance payment only — no credit line.'}
                    </p>
                  </Well>
                </>
              ) : (
                <p className="type-body-sm text-fg-secondary">
                  This order is not linked to an organisation record.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { STATUSES, STATUS_LABELS } from '../components/StatusBadge';
import { put } from '../lib/api';
import { formatDate } from '../lib/date';
import { formatINR } from '../lib/money';
import useFetch from '../lib/useFetch';
import { adminUrl, ORDER_TONE } from './helpers';
import {
  AmountList,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  ErrorState,
  Field,
  Icon,
  PageHeader,
  Select,
  Skeleton,
  useToast,
} from '../components/DesignSystem';

// This is the screen someone packs and dispatches from, so it prints legibly: plain rows, no
// information carried by colour alone, every figure spelled out.
export default function AdminOrderDetail() {
  const { id } = useParams();
  // ponytail: no GET /admin/orders/:id route exists. The list is unpaginated, so the detail
  // screen reads its order out of it.
  const list = useFetch('/admin/orders');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const order = list.data?.find((o) => String(o._id) === id);
  const current = status ?? order?.status;

  if (list.loading) return <Skeleton h="h-96" rounded="rounded-2xl" />;
  if (list.error) return <ErrorState thing="this order" detail={list.error} onRetry={list.reload} />;
  if (!order) return <ErrorState title="No order with that id." body="It may have been deleted." />;

  async function onSave() {
    setBusy(true);
    try {
      const saved = await put(`/admin/orders/${order._id}`, { status: current });
      list.set(list.data.map((o) => (o._id === order._id ? { ...o, status: saved.status } : o)));
      toast.success(`Status saved: ${STATUS_LABELS[saved.status]}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const { address } = order;
  const orderTone = ORDER_TONE[order.status] ?? { tone: 'neutral', icon: 'help' };

  const itemColumns = [
    { key: 'name', header: 'Product', primary: true, render: (i) => i.name },
    { key: 'hsn', header: 'HSN', className: 'font-mono', render: (i) => i.hsnCode },
    { key: 'unitPrice', header: 'Unit price', align: 'right', render: (i) => formatINR(i.unitPrice) },
    { key: 'qty', header: 'Qty', align: 'right', render: (i) => i.qty },
    { key: 'lineSubtotal', header: 'Line total', align: 'right', render: (i) => formatINR(i.lineSubtotal) },
    {
      key: 'lineGst',
      header: 'GST',
      align: 'right',
      render: (i) => (
        <>
          {formatINR(i.lineGst)} <span className="type-caption text-fg-secondary">@ {i.gstRate}%</span>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Order ${order._id.slice(-8)}`}
        subtitle={`Placed ${formatDate(order.createdAt)}`}
        meta={
          <Badge tone={orderTone.tone} icon={Icon[orderTone.icon]} size="sm">
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        }
        actions={
          <Button as={Link} to={adminUrl('/orders')} variant="secondary" iconLeft={Icon.arrowLeft}>
            Back to orders
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* min-w-0: a grid item defaults to min-width:auto, so without this the wide items
            table stretches the column and the whole page scrolls sideways at 390px. */}
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader title="Items" />
            <CardBody>
              <DataTable
                density="compact"
                columns={itemColumns}
                rows={order.items}
                rowKey={(i, idx) => `${i.productId}-${idx}`}
                caption="Order items"
              />

              <div className="mt-6 ml-auto max-w-sm">
                <AmountList
                  rows={[
                    { label: 'Subtotal', value: formatINR(order.subtotal) },
                    { label: 'GST', value: formatINR(order.gstTotal) },
                    { label: 'Delivery', value: formatINR(order.deliveryFee) },
                    { label: 'Total', value: formatINR(order.grandTotal), emphasis: true },
                  ]}
                />
              </div>
              <p className="type-caption mt-3 text-fg-secondary">
                A price breakdown, not a tax invoice — no CGST/SGST split and no HSN-wise summary.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Customer" />
            <CardBody>
              <p className="type-body-sm font-medium text-fg">{order.userName}</p>
              <p className="type-body-sm font-mono text-fg-secondary">{order.userPhone}</p>

              <h3 className="type-label mt-4 text-fg-secondary">Deliver to</h3>
              <address className="type-body-sm mt-1 not-italic leading-relaxed text-fg">
                {address?.label && <span className="block text-fg-muted">{address.label}</span>}
                {address?.line1}
                {address?.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address?.city}, {address?.state}
                <br />
                <span className="font-mono">{address?.pincode}</span>
                <br />
                <span className="font-mono">{address?.phone}</span>
              </address>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status" />
            <CardBody className="space-y-4">
              <p className="type-body-sm text-fg">
                Currently: <strong className="font-semibold">{STATUS_LABELS[order.status] || order.status}</strong>
              </p>
              <Field label="Change status" htmlFor="order-status">
                <Select id="order-status" value={current} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button fullWidth onClick={onSave} loading={busy} disabled={current === order.status}>
                Save status
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

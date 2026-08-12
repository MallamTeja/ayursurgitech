import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Chip,
  ConfirmModal,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  SearchInput,
  StatusBadge,
  TableToolbar,
  stockStatusOf,
  useToast,
} from '../components/DesignSystem';
import { del } from '../lib/api';
import { formatINR } from '../lib/money';
import useFetch from '../lib/useFetch';
import { adminUrl } from './helpers';

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [confirming, setConfirming] = useState(null); // the product a delete is pending confirmation for
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const list = useFetch(`/admin/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);

  // The dashboard's out-of-stock tile links here with ?stock=out. Filtered in the browser —
  // the list is unpaginated and already in hand.
  const outOnly = params.get('stock') === 'out';
  const rows = (list.data || []).filter((p) => !outOnly || Number(p.stockQty) <= 0);

  async function onDelete() {
    const product = confirming;
    setDeleting(true);
    try {
      await del(`/admin/products/${product._id}`);
      list.reload();
      setConfirming(null);
      toast.success(`Deleted "${product.name}".`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'image',
      header: '',
      width: 56,
      hideOnMobile: true,
      render: (p) =>
        p.images?.[0] ? (
          <img
            src={p.images[0]}
            alt=""
            className="size-8 rounded-lg border border-edge bg-surface object-contain p-1"
          />
        ) : (
          <Icon.noImage size={20} className="text-fg-muted" />
        ),
    },
    {
      key: 'name',
      header: 'Name',
      primary: true,
      render: (p) => (
        <Link to={adminUrl(`/products/${p._id}`)} className="font-medium text-brand-700 hover:text-brand-900">
          {p.name}
        </Link>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <span className="text-fg-secondary">
          {p.categoryName || '—'}
          {p.subcategoryName ? ` › ${p.subcategoryName}` : ''}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p) => formatINR(p.price),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      // Only badged when out, same as before — a Low Stock badge here would need a
      // real lowStockAt threshold this list does not carry.
      render: (p) => {
        const out = Number(p.stockQty) <= 0;
        return (
          <span className="inline-flex items-center justify-end gap-2">
            <span>{p.stockQty}</span>
            {out && <StatusBadge kind="stock" value={stockStatusOf(Number(p.stockQty), 0)} size="sm" />}
          </span>
        );
      },
    },
    {
      key: 'gst',
      header: 'GST',
      align: 'right',
      render: (p) => `${p.gstRate}%`,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // 27 rows of "Edit" all read as the same link to a screen reader, so each one
      // names its product. Delete is coloured as an error, not the brand accent —
      // the one most important action — so it never reads as the default choice.
      render: (p) => (
        <span className="inline-flex items-center justify-end gap-1">
          <Button
            as={Link}
            to={adminUrl(`/products/${p._id}`)}
            variant="tertiary"
            size="sm"
            aria-label={`Edit ${p.name}`}
          >
            Edit
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setConfirming(p)}
            aria-label={`Delete ${p.name}`}
            className="text-error-700 hover:bg-error-bg"
          >
            Delete
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Prices are GST-exclusive, as stored."
        actions={
          <Button as={Link} to={adminUrl('/products/new')} iconLeft={Icon.add}>
            New product
          </Button>
        }
      />

      <div className="mt-6 mb-4">
        <TableToolbar
          search={
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ('')}
              placeholder="Product name"
            />
          }
          filters={
            outOnly && (
              <Chip onRemove={() => setParams({})} removeLabel="Clear out-of-stock filter">
                Out of stock only
              </Chip>
            )
          }
        />
      </div>

      {list.error ? (
        <ErrorState thing="the products" detail={list.error} onRetry={list.reload} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p._id}
          caption="Products"
          loading={list.loading}
          empty={
            <EmptyState
              variant={q.trim() || outOnly ? 'no-results' : 'nothing-yet'}
              title={
                q.trim()
                  ? `No product matches "${q.trim()}".`
                  : outOnly
                    ? 'Nothing is out of stock. Good.'
                    : 'No products yet.'
              }
              body={!q.trim() && !outOnly ? 'The shop has nothing to sell until one exists.' : undefined}
              action={
                !q.trim() && !outOnly ? (
                  <Button as={Link} to={adminUrl('/products/new')} iconLeft={Icon.add}>
                    New product
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={onDelete}
        title="Delete product"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      >
        Delete &quot;{confirming?.name}&quot;? Its reviews go with it. This cannot be undone.
      </ConfirmModal>
    </>
  );
}

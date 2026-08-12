import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { del, put } from '../lib/api';
import { formatDate } from '../lib/date';
import useFetch from '../lib/useFetch';
import {
  Badge,
  Button,
  ConfirmModal,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  PageHeader,
  Select,
  TableToolbar,
  useToast,
} from '../components/DesignSystem';

// `Rating` is a legacy component being deleted with the old Tailwind palette. This is
// used nowhere else, so it stays local rather than becoming a Design System export.
function Stars({ value }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon.star
          key={i}
          size={14}
          aria-hidden="true"
          className={i <= filled ? 'fill-warning text-warning' : 'text-edge-strong'}
        />
      ))}
      <span className="sr-only-ds">{Number(value) || 0} out of 5</span>
    </span>
  );
}

// Nothing a shopper wrote is public until it is approved here, so this defaults to the queue.
export default function AdminReviews() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'pending';
  const list = useFetch(`/admin/reviews?status=${status}`);
  const [busyId, setBusyId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // review awaiting delete confirmation
  const toast = useToast();

  const rows = list.data || [];

  const drop = (id) => list.set(rows.filter((r) => r._id !== id));

  async function onApprove(review) {
    setBusyId(review._id);
    try {
      await put(`/admin/reviews/${review._id}`, { status: 'approved' });
      // Off the pending queue immediately, so the count on screen is the count outstanding.
      if (status === 'pending') drop(review._id);
      else list.set(rows.map((r) => (r._id === review._id ? { ...r, status: 'approved' } : r)));
      toast.success(`Approved ${review.userName}'s review. It is live on the product page.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onConfirmDelete() {
    const review = confirmTarget;
    setBusyId(review._id);
    try {
      await del(`/admin/reviews/${review._id}`);
      drop(review._id);
      setConfirmTarget(null);
      toast.success('Review deleted. The product rating has been recomputed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    {
      key: 'product',
      header: 'Product',
      primary: true,
      render: (r) =>
        r.productSlug ? (
          <a
            href={`/p/${r.productSlug}`}
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
          >
            {r.productName}
          </a>
        ) : (
          <span className="text-fg-muted">{r.productName || 'Deleted product'}</span>
        ),
    },
    { key: 'reviewer', header: 'Reviewer', className: 'whitespace-nowrap', render: (r) => r.userName },
    { key: 'rating', header: 'Rating', render: (r) => <Stars value={r.rating} /> },
    { key: 'text', header: 'Review', className: 'max-w-md text-fg-secondary', render: (r) => r.text },
    {
      key: 'date',
      header: 'Date',
      className: 'whitespace-nowrap',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        // Every row's buttons read as bare "Approve" / "Delete" in a screen reader's control
        // list. One reviewer can review several products and two reviewers can share a name,
        // so the accessible name needs both to identify a row.
        const subject = `${r.userName}'s review of ${r.productName || 'Deleted product'}`;
        return (
          <div className="inline-flex items-center gap-2">
            {r.status === 'pending' ? (
              <Button
                variant="tertiary"
                size="sm"
                iconLeft={Icon.check}
                disabled={busyId === r._id}
                onClick={() => onApprove(r)}
                aria-label={`Approve ${subject}`}
              >
                Approve
              </Button>
            ) : (
              <Badge tone="success" size="sm" icon={Icon.success}>
                Approved
              </Badge>
            )}
            <Button
              variant="tertiary"
              size="sm"
              iconLeft={Icon.delete}
              className="text-error-700"
              disabled={busyId === r._id}
              onClick={() => setConfirmTarget(r)}
              aria-label={`Delete ${subject}`}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle={
          status === 'pending'
            ? `${rows.length} waiting for you.`
            : 'Approving a review recomputes the product rating.'
        }
      />

      <div className="mt-6 mb-4">
        <TableToolbar
          filters={
            <Field label="Show" className="w-40">
              <Select value={status} onChange={(e) => setParams({ status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="all">All</option>
              </Select>
            </Field>
          }
        />
      </div>

      {list.error ? (
        <ErrorState thing="the reviews" detail={list.error} onRetry={list.reload} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r._id}
          caption="Reviews"
          loading={list.loading}
          empty={
            <EmptyState
              variant={status === 'pending' ? 'nothing-yet' : 'no-results'}
              title={status === 'pending' ? 'No reviews waiting' : 'No reviews to show.'}
              action={
                status === 'all' ? undefined : (
                  <Button variant="secondary" onClick={() => setParams({ status: 'all' })}>
                    Show all reviews
                  </Button>
                )
              }
            />
          }
        />
      )}

      <ConfirmModal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={onConfirmDelete}
        title="Delete review"
        confirmLabel="Delete"
        destructive
        loading={busyId === confirmTarget?._id}
      >
        Delete {confirmTarget?.userName}&rsquo;s review? This cannot be undone.
      </ConfirmModal>
    </>
  );
}

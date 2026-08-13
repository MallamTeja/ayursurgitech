import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  ConfirmModal,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Panel,
  Tabs,
  formatDateTime,
  useToast,
} from '../components/DesignSystem';
import { reviewsApi, useAdminData } from './data';

// Nothing a buyer writes is public until it is approved here, so this screen
// defaults to the queue rather than to everything.
//
// THE FILTER IS TABS, not a dropdown. There are exactly three states and the counts
// matter — "Pending 3" is the number this screen exists for, and a <select> hides it
// behind a click. Tabs put both the choice and the workload in view.

/** Stars. Local, because nothing else in the system renders a rating yet. */
function Stars({ value }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon.star
          key={i}
          size={14}
          aria-hidden="true"
          // §4: the count is spoken by the label below, so the colour is never
          // carrying the rating on its own.
          className={i <= filled ? 'fill-warning text-warning' : 'text-edge-strong'}
        />
      ))}
      <span className="sr-only-ds">{filled} out of 5</span>
    </span>
  );
}

export default function AdminReviews() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const { data, loading, error } = useAdminData((s) => s.reviews, { forced: params.get('state') });

  const status = ['pending', 'approved', 'all'].includes(params.get('status'))
    ? params.get('status')
    : 'pending';

  const counts = useMemo(
    () => ({
      pending: data.filter((r) => r.status === 'pending').length,
      approved: data.filter((r) => r.status === 'approved').length,
      all: data.length,
    }),
    [data],
  );

  const rows = useMemo(
    () => (status === 'all' ? data : data.filter((r) => r.status === status)),
    [data, status],
  );

  async function onApprove(review) {
    setBusyId(review.id);
    try {
      await reviewsApi.setStatus(review.id, 'approved');
      toast.success(`Approved ${review.author}'s review. It is live on the product page.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onUnapprove(review) {
    setBusyId(review.id);
    try {
      await reviewsApi.setStatus(review.id, 'pending');
      toast.success(`${review.author}'s review is back in the queue and off the product page.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete() {
    const review = confirming;
    setBusyId(review.id);
    try {
      await reviewsApi.remove(review.id);
      setConfirming(null);
      toast.success('Review deleted. The product rating has been recomputed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    {
      key: 'author',
      header: 'Reviewer',
      primary: true,
      className: 'align-top',
      render: (r) => (
        <span className="flex min-w-0 items-start gap-2.5">
          <Avatar name={r.author} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-fg">{r.author}</span>
            <span className="type-caption block truncate text-fg-secondary">{r.org}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      className: 'align-top',
      render: (r) => <span className="block max-w-56 text-fg-secondary">{r.productName}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      className: 'align-top whitespace-nowrap',
      render: (r) => <Stars value={r.rating} />,
    },
    {
      key: 'body',
      header: 'Review',
      // max-w on the cell rather than truncation: moderating a review means reading
      // it, and a one-line clamp with an ellipsis hides the sentence the decision
      // turns on.
      className: 'align-top max-w-md text-fg-secondary',
      render: (r) => r.body,
    },
    {
      key: 'at',
      header: 'Submitted',
      className: 'align-top whitespace-nowrap',
      render: (r) => formatDateTime(r.at),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      className: 'align-top',
      render: (r) => {
        // Both buttons read as bare "Approve" / "Delete" in a screen reader's
        // control list. One reviewer can review several products and two reviewers
        // can share a name, so the accessible name needs both to identify a row.
        const subject = `${r.author}'s review of ${r.productName}`;
        const busy = busyId === r.id;
        return (
          <span className="inline-flex flex-wrap items-center justify-end gap-1">
            {r.status === 'pending' ? (
              <Button
                variant="tertiary"
                size="sm"
                iconLeft={Icon.check}
                disabled={busy}
                onClick={() => onApprove(r)}
                aria-label={`Approve ${subject}`}
              >
                Approve
              </Button>
            ) : (
              <>
                <Badge tone="success" size="sm" icon={Icon.success}>
                  Approved
                </Badge>
                {/* Approval is reversible. Without this, a review approved by
                    mistake can only be dealt with by deleting it. */}
                <Button
                  variant="tertiary"
                  size="sm"
                  disabled={busy}
                  onClick={() => onUnapprove(r)}
                  aria-label={`Return ${subject} to the queue`}
                >
                  Unapprove
                </Button>
              </>
            )}
            <Button
              variant="tertiary"
              size="sm"
              iconLeft={Icon.delete}
              className="text-error-700 hover:bg-error-bg"
              disabled={busy}
              onClick={() => setConfirming(r)}
              aria-label={`Delete ${subject}`}
            >
              Delete
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle={
          counts.pending > 0
            ? `${counts.pending} waiting for you. Nothing is visible on a product page until it is approved.`
            : 'Nothing waiting. A review is invisible on the product page until it is approved here.'
        }
      />

      <Tabs
        className="mt-6"
        value={status}
        onChange={(next) => setParams(next === 'pending' ? {} : { status: next })}
        tabs={[
          { value: 'pending', label: 'Pending', icon: Icon.pending, count: counts.pending },
          { value: 'approved', label: 'Approved', icon: Icon.success, count: counts.approved },
          { value: 'all', label: 'All', icon: Icon.reports, count: counts.all },
        ]}
      />

      <div className="mt-6">
        {error ? (
          <Panel>
            <ErrorState thing="the reviews" detail={error} onRetry={() => setParams({})} />
          </Panel>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            caption="Reviews"
            // `default`, not the admin `compact`: a review is a paragraph, and
            // 40px rows put five lines of prose in a 40px box. The density classes
            // are relaxed / default / compact — there is no fourth.
            density="default"
            loading={loading}
            empty={
              <EmptyState
                variant={status === 'pending' ? 'nothing-yet' : 'no-results'}
                icon={status === 'pending' ? Icon.success : Icon.star}
                title={
                  status === 'pending'
                    ? 'Nothing waiting to be moderated.'
                    : status === 'approved'
                      ? 'No approved reviews yet.'
                      : 'No reviews at all yet.'
                }
                body={
                  status === 'pending'
                    ? 'The queue is clear. New reviews land here as buyers write them.'
                    : 'Approved reviews appear on their product page in the shop.'
                }
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
      </div>

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={onDelete}
        title="Delete review"
        confirmLabel="Delete"
        destructive
        loading={Boolean(confirming) && busyId === confirming.id}
      >
        Delete {confirming?.author}&rsquo;s review of {confirming?.productName}? The product rating is
        recomputed without it. This cannot be undone.
      </ConfirmModal>
    </>
  );
}

// /cart — the order being built, on Design System v1.0.
//
// A B2B CART IS NOT A SHOPPING BASKET. It is a draft purchase order that may sit
// for days between being built and being approved, so this page's first job is
// not to look tidy — it is to tell the buyer the truth about what is in it right
// now. Prices move, MOQs get raised, stock runs out, products get discontinued.
// All of that is checked on every render against the live catalogue by
// cart-reconcile.js, and every problem it finds is shown with the correction
// that fixes it.
//
// THE ALTERNATIVE IS WHAT WAS HERE BEFORE: a stored snapshot rendered verbatim,
// one "minimum order is 500 pieces" warning, and a 400 from POST /orders as the
// place everything else surfaces. A 400 naming a productId is a backstop. It is
// not an experience.
//
// NOTHING IS CHANGED WITHOUT BEING ASKED. Quantities are never silently
// corrected — every fix is a button. The single exception is the price, which is
// always the live one, because a total on screen that the order confirmation
// then contradicts is worse than a total that moved while you were away.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  AmountList,
  Badge,
  Button,
  Card,
  ConfirmModal,
  Container,
  Divider,
  EmptyState,
  Icon,
  ProductImage,
  QuantityStepper,
  StatusBadge,
  Well,
  cx,
  formatINR,
  formatQty,
  stockStatusOf,
  useToast,
} from '../components/DesignSystem';
import { products as catalogue } from '../components/DesignSystem/dummy.js';
import usePageTitle from '../components/usePageTitle';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { ISSUES, reconcileCart } from './cart-reconcile.js';

/* -------------------------------------------------------------------------- */
/* One line                                                                   */
/* -------------------------------------------------------------------------- */

// The tint lives on the notice strip, never on the Card's own border.
//
// `border-edge` (from Card) and `border-error` both set border-color, and which
// one wins is decided by their order in the generated stylesheet, not by the
// order they appear in the class attribute. That is a coin toss, and a coin toss
// is not a way to indicate that a line cannot be ordered. Tinting the strip is
// unambiguous and puts the colour next to the sentence explaining it — §4 asks
// for the state to be legible without colour, and here colour is the third
// signal after the badge and the message.
const STRIP = {
  error: 'border-t border-error/30 bg-error-bg',
  warning: 'border-t border-warning/30 bg-warning-bg',
  info: 'border-t border-edge bg-surface-2',
};

function CartRow({ row, index, onQty, onRemove, onFix }) {
  const { line, product, name, unitPrice, previousPrice, qty, moq, stock, lineTotal, issues, fix } = row;
  const gone = issues.includes('gone');
  // The worst tone present decides the strip: one blocking error outranks three
  // informational notices.
  const stripTone = issues.some((k) => ISSUES[k].tone === 'error')
    ? 'error'
    : issues.some((k) => ISSUES[k].tone === 'warning')
      ? 'warning'
      : 'info';

  return (
    <li>
      <Card padding="none" className="overflow-hidden">
        <div className="flex gap-4 p-4">
          {/* The thumbnail links to the product except when there is no product
              left to link to — a dead link on an unavailable row is a second
              small failure on top of the first. */}
          {gone ? (
            <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-edge opacity-60 sm:size-24">
              <ProductImage alt={name} code={line.code} ratio="square" />
            </div>
          ) : (
            <Link
              to={`/p/${line.slug ?? product.id.replace(/^p-/, '')}`}
              className="size-20 shrink-0 overflow-hidden rounded-lg border border-edge transition-colors hover:border-brand-500 sm:size-24"
            >
              <ProductImage
                src={product.image}
                alt={name}
                code={product.code}
                icon={Icon[product.icon] ?? Icon.products}
                ratio="square"
              />
            </Link>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {product && (
                  <p className="type-label truncate text-fg-muted">
                    {product.category} · <span className="tabular">{product.code}</span>
                  </p>
                )}
                {gone ? (
                  <p className="type-body mt-0.5 font-medium text-fg">{name}</p>
                ) : (
                  <Link
                    to={`/p/${line.slug ?? product.id.replace(/^p-/, '')}`}
                    className="type-body mt-0.5 block font-medium text-fg underline-offset-2 hover:text-brand-700 hover:underline"
                  >
                    {name}
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemove(row, index)}
                aria-label={`Remove ${name} from your order`}
                // -m-2.5 keeps the 44px hit area from pushing the layout around.
                className="-m-2.5 shrink-0 rounded-lg p-2.5 text-fg-muted transition-colors hover:bg-surface-2 hover:text-error"
              >
                <Icon.delete size={18} />
              </button>
            </div>

            {product && (
              <p className="type-caption mt-1 text-fg-secondary">
                <span className="tabular">{formatINR(unitPrice)}</span> per {product.uom.toLowerCase()} ·{' '}
                {product.packSize} · {formatQty(moq)} minimum
                {previousPrice != null && (
                  <>
                    {' · '}
                    <span className="tabular text-fg-muted line-through">{formatINR(previousPrice)}</span>{' '}
                    <span className={cx('font-medium', unitPrice > previousPrice ? 'text-warning-700' : 'text-success-700')}>
                      {unitPrice > previousPrice ? 'up' : 'down'}
                    </span>
                  </>
                )}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              {gone ? (
                <Button size="sm" variant="secondary" onClick={() => onRemove(row, index)} iconLeft={Icon.delete}>
                  Remove from order
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <QuantityStepper
                    value={qty}
                    onChange={(next) => onQty(row, next)}
                    moq={moq}
                    max={stock > 0 ? stock : moq}
                    uom={product.uom}
                    disabled={stock <= 0}
                    size="sm"
                  />
                  <StatusBadge kind="stock" value={stockStatusOf(stock, product.lowStockAt)} />
                </div>
              )}

              <div className="text-right">
                <p className={cx('type-h4 tabular', gone ? 'text-fg-disabled line-through' : 'text-fg')}>
                  {formatINR(lineTotal)}
                </p>
                {!gone && <p className="type-caption text-fg-secondary">+ {row.gst}% GST</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Every problem with this line, each with the button that resolves it. */}
        {issues.length > 0 && (
          <div className={cx('px-4 py-3', STRIP[stripTone])}>
            <ul className="space-y-2">
              {issues.map((key) => {
                const issue = ISSUES[key];
                return (
                  <li key={key} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge
                      size="sm"
                      tone={issue.tone === 'error' ? 'error' : issue.tone === 'warning' ? 'warning' : 'info'}
                      icon={issue.tone === 'info' ? Icon.info : Icon.warning}
                    >
                      {issue.label}
                    </Badge>
                    <span className="type-caption text-fg-secondary">
                      {issue.message}
                      {key === 'overStock' && ` Only ${formatQty(stock)} in the warehouse.`}
                      {key === 'belowMoq' && ` It is now ${formatQty(moq)}.`}
                      {key === 'notMultiple' && ` The pack is ${formatQty(moq)}.`}
                    </span>
                    {fix != null && issue.blocking && key !== 'gone' && key !== 'outOfStock' && (
                      <button
                        type="button"
                        onClick={() => onFix(row)}
                        className="type-caption font-semibold text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
                      >
                        Set to {formatQty(fix)}
                      </button>
                    )}
                    {key === 'outOfStock' && (
                      <Link
                        to={`/support?product=${encodeURIComponent(product?.code ?? '')}&topic=quote`}
                        className="type-caption font-semibold text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
                      >
                        Request a quote
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

export default function CartPage() {
  const { lines, patch, remove, removeMany, restore, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle('Your order');

  const [confirmClear, setConfirmClear] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const cart = useMemo(() => reconcileCart(lines, catalogue), [lines]);

  // Announce structural changes once, not on every keystroke of the stepper.
  const previousCount = useRef(cart.count);
  useEffect(() => {
    if (previousCount.current !== cart.count) {
      setAnnouncement(
        cart.count === 0
          ? 'Your order is now empty.'
          : `${formatQty(cart.count)} ${cart.count === 1 ? 'product' : 'products'} in your order.`,
      );
      previousCount.current = cart.count;
    }
  }, [cart.count]);

  /**
   * Remove, with an undo.
   *
   * A cart line is real work — someone chose it, checked the specification and
   * set a quantity — and the delete control sits next to the product name where
   * a mis-tap is easy. A toast with Undo costs nothing and is the difference
   * between an annoyance and rebuilding a 14-line order.
   */
  const removeWithUndo = (row, index) => {
    remove(row.line.productId);
    toast.info(`${row.name} removed`, {
      title: 'Removed from your order',
      action: { label: 'Undo', onClick: () => restore(row.line, index) },
    });
  };

  /**
   * Set a line's quantity, syncing the stale stock and MOQ figures with it.
   *
   * NOT setQty. That helper caps against the *stored* stockQty, which is the
   * right rule while shopping and wrong here: if the warehouse has been
   * restocked since the line was added, the stale cap makes the now-valid
   * quantity unreachable — the stepper offers 5,000 and the cart silently
   * refuses above 800. QuantityStepper already clamps to [moq, stock] on blur,
   * so what arrives here is bounded by the live figures rather than the old ones.
   *
   * THE PRICE IS DELIBERATELY NOT WRITTEN BACK. Totals always use the live price
   * anyway (see cart-reconcile.js), so the stored one is only still there to
   * answer "what has changed since I added this" — and overwriting it on a
   * quantity nudge would quietly delete that answer.
   */
  const setLineQty = (row, qty) =>
    patch(row.line.productId, { qty, stockQty: row.stock, minOrderQty: row.moq });

  const applyFix = (row) => setLineQty(row, row.fix);

  const fixAll = () => {
    for (const row of cart.fixableRows) applyFix(row);
    toast.success(
      `${formatQty(cart.fixableRows.length)} ${cart.fixableRows.length === 1 ? 'quantity' : 'quantities'} updated`,
      { title: 'Order updated' },
    );
  };

  const removeUnavailable = () => {
    const ids = cart.removableRows.map((r) => r.line.productId);
    const removed = cart.removableRows.map((r) => r.line);
    removeMany(ids);
    toast.info(`${formatQty(ids.length)} ${ids.length === 1 ? 'line' : 'lines'} removed`, {
      title: 'Unavailable products removed',
      // Restoring at the end rather than at the original index: after a bulk
      // removal the original positions no longer describe the same list.
      action: { label: 'Undo', onClick: () => removed.forEach((line) => restore(line, lines.length)) },
    });
  };

  const proceed = () => {
    if (!cart.canCheckout) return;
    // Not logged in? Checkout is where they were going, so that is where login
    // sends them back to — not to the home page, and not back to this cart.
    navigate(user ? '/checkout' : '/login', user ? undefined : { state: { from: '/checkout' } });
  };

  /* ---- Empty ------------------------------------------------------------- */
  if (cart.count === 0) {
    return (
      <Container width="app" className="py-10 lg:py-16">
        <h1 className="type-h2 text-fg">Your order</h1>
        <div className="mx-auto mt-8 max-w-xl rounded-xl border border-edge bg-surface">
          <EmptyState
            icon={Icon.cart}
            title="Nothing in your order yet"
            body="Add products from the catalogue and they will collect here. Your order is saved on this device, so you can come back to it."
            action={
              <Button as={Link} to="/products" iconRight={Icon.arrowRight}>
                Browse the catalogue
              </Button>
            }
            secondaryAction={
              <Button as={Link} to="/support" variant="tertiary">
                Request a quote instead
              </Button>
            }
          />
        </div>
      </Container>
    );
  }

  const problemCount = cart.blockingRows.length;

  /* ---- Order ------------------------------------------------------------- */
  return (
    <Container width="app" className="py-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-edge pb-5">
        <div>
          <h1 className="type-h2 text-fg">Your order</h1>
          <p className="type-body-sm mt-1 text-fg-secondary">
            <span className="tabular">{formatQty(cart.count)}</span> {cart.count === 1 ? 'product' : 'products'} ·{' '}
            <span className="tabular">{formatQty(cart.pieces)}</span> pieces · prices exclusive of GST
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button as={Link} to="/products" variant="tertiary" size="sm" iconLeft={Icon.arrowLeft}>
            Continue shopping
          </Button>
          <Button variant="tertiary" size="sm" iconLeft={Icon.delete} onClick={() => setConfirmClear(true)}>
            Clear order
          </Button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only-ds">
        {announcement}
      </p>

      {/* One summary of everything wrong, above the lines, with the bulk actions.
          The per-line notices below still exist — this is how you find out there
          are three problems without scrolling a 20-line order to count them. */}
      {problemCount > 0 && (
        <Alert
          tone={cart.removableRows.length > 0 ? 'error' : 'warning'}
          className="mt-6"
          title={
            problemCount === 1
              ? 'One product needs attention before you can check out'
              : `${formatQty(problemCount)} products need attention before you can check out`
          }
          action={
            <>
              {cart.fixableRows.length > 0 && (
                <Button size="sm" variant="secondary" onClick={fixAll} iconLeft={Icon.check}>
                  Fix {formatQty(cart.fixableRows.length)}{' '}
                  {cart.fixableRows.length === 1 ? 'quantity' : 'quantities'}
                </Button>
              )}
              {cart.removableRows.length > 0 && (
                <Button size="sm" variant="secondary" onClick={removeUnavailable} iconLeft={Icon.delete}>
                  Remove {formatQty(cart.removableRows.length)} unavailable
                </Button>
              )}
            </>
          }
        >
          The catalogue has changed since these were added. Each line below says what changed.
        </Alert>
      )}

      {cart.issueCounts.priceChanged > 0 && (
        <Alert tone="info" className="mt-4" title="Some prices have changed">
          <span className="tabular">{formatQty(cart.issueCounts.priceChanged)}</span>{' '}
          {cart.issueCounts.priceChanged === 1 ? 'product is' : 'products are'} priced differently from when they were
          added. The totals below use the current price.
        </Alert>
      )}

      {/* pb-40 keeps the last line clear of the sticky mobile bar. */}
      <div className="mt-6 grid gap-6 pb-40 lg:grid-cols-[1fr_22rem] lg:items-start lg:pb-0">
        <ul className="space-y-3">
          {cart.rows.map((row, index) => (
            <CartRow
              key={row.line.productId}
              row={row}
              index={index}
              onQty={setLineQty}
              onRemove={removeWithUndo}
              onFix={applyFix}
            />
          ))}
        </ul>

        {/* ---- Summary ---------------------------------------------------- */}
        <Card className="lg:sticky lg:top-20">
          <h2 className="type-h4 text-fg">Order summary</h2>

          <AmountList
            className="mt-4"
            rows={[
              { label: 'Subtotal', hint: 'excl. GST', value: formatINR(cart.subtotal) },
              // One row per slab. A single merged "GST" figure is not something a
              // finance team can reconcile against anything.
              ...cart.gstRows.map((g) => ({
                label: `GST ${g.rate}%`,
                hint: `on ${formatINR(g.base)}`,
                value: formatINR(g.amount),
              })),
              { label: 'Estimated total', value: formatINR(cart.total), emphasis: true },
            ]}
          />

          <p className="type-caption mt-3 text-fg-secondary">
            Delivery is quoted at checkout. Final pricing is confirmed against your account's rate contract when the
            order is placed.
          </p>

          {cart.issueCounts.gone > 0 || cart.issueCounts.outOfStock > 0 ? (
            <Well className="mt-4">
              <p className="type-caption text-fg-secondary">
                Unavailable products are excluded from these totals.
              </p>
            </Well>
          ) : null}

          <Divider className="my-5" />

          <div className="hidden lg:block">
            <Button fullWidth onClick={proceed} disabled={!cart.canCheckout} iconRight={Icon.arrowRight}>
              {user ? 'Proceed to checkout' : 'Log in to check out'}
            </Button>
            {!cart.canCheckout && (
              // §4 again: the button being grey is not the message. This is.
              <p className="type-caption mt-2 flex items-start gap-1.5 text-fg-secondary">
                <Icon.info size={14} className="mt-px shrink-0" />
                Resolve the {problemCount === 1 ? 'product' : `${formatQty(problemCount)} products`} flagged above
                first.
              </p>
            )}
            {cart.canCheckout && !user && (
              <p className="type-caption mt-2 text-fg-secondary">
                Your order is saved — logging in will not lose it.
              </p>
            )}
          </div>

          <ul className="mt-5 space-y-2 lg:mt-6">
            {[
              [Icon.shipments, 'Dispatch in 24–48 hours'],
              [Icon.certified, 'CE marked, ISO 13485'],
              [Icon.quotes, 'Need a rate contract? Request a quote'],
            ].map(([Glyph, label]) => (
              <li key={label} className="type-caption flex items-center gap-2 text-fg-secondary">
                <Glyph size={15} className="shrink-0 text-brand-600" />
                {label}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---- Mobile bar ----------------------------------------------------- */}
      {/* Fixed, because on a phone the summary card is below a list that can be
          twenty items long, and a checkout button nobody scrolls to is a checkout
          button nobody presses. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-surface/95 px-4 py-3 shadow-e2 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="type-body-sm text-fg-secondary">
            Estimated total <span className="type-caption text-fg-muted">incl. GST</span>
          </span>
          <span className="type-h4 tabular text-fg">{formatINR(cart.total)}</span>
        </div>
        <Button fullWidth onClick={proceed} disabled={!cart.canCheckout} iconRight={Icon.arrowRight}>
          {user ? 'Proceed to checkout' : 'Log in to check out'}
        </Button>
        {!cart.canCheckout && (
          <p className="type-caption mt-2 text-center text-fg-secondary">
            Resolve the {problemCount === 1 ? 'flagged product' : `${formatQty(problemCount)} flagged products`} first.
          </p>
        )}
      </div>

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          const removed = lines;
          clear();
          setConfirmClear(false);
          toast.info(`${formatQty(removed.length)} ${removed.length === 1 ? 'product' : 'products'} removed`, {
            title: 'Order cleared',
            action: { label: 'Undo', onClick: () => removed.forEach((line, i) => restore(line, i)) },
          });
        }}
        title="Clear your whole order?"
        confirmLabel="Clear order"
        destructive
      >
        This removes all {formatQty(cart.count)} products. You can undo it straight afterwards, but not once you leave
        the page.
      </ConfirmModal>
    </Container>
  );
}

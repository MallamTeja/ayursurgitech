// /checkout — placing the order, on Design System v1.0.
//
// EVERY FIGURE ON THIS SCREEN COMES FROM THE SERVER. The cart carries cached
// prices for display, and they go stale the moment an admin edits a product, so
// POST /quote reprices the whole basket from the database and this page renders
// exactly what comes back. Ids and quantities are the only things sent. Nothing
// here multiplies, adds a tax, or derives a total.
//
// Unlike /cart, this page does NOT reconcile against the dummy catalogue — the
// server's quote is the authority, and its `problems` array is what flags a line.

import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Container,
  Divider,
  ErrorState,
  Icon,
  ProductImage,
  Skeleton,
  cx,
  formatINR,
  formatQty,
} from '../components/DesignSystem';
import usePageTitle from '../components/usePageTitle';
import { post } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { AddressForm, AddressLines } from './AddressFields.jsx';
import PriceBreakdown from './PriceBreakdown.jsx';

export default function CheckoutPage() {
  const { user, refreshUser } = useAuth();
  const { lines, clear } = useCart();
  const navigate = useNavigate();
  usePageTitle('Checkout');

  const addresses = user?.addresses ?? [];
  const [addressId, setAddressId] = useState(() => user?.addresses?.[0]?._id ?? '');
  const [adding, setAdding] = useState(() => !user?.addresses?.length);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(true);

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [placeProblems, setPlaceProblems] = useState(null);

  // Ids and quantities only. A price is never sent — the server reprices from the database
  // because these cached values go stale the moment an admin edits a product.
  const itemsKey = JSON.stringify(lines.map((l) => ({ productId: l.productId, qty: l.qty })));

  const loadQuote = useCallback(async () => {
    const items = JSON.parse(itemsKey);
    if (items.length === 0) return;
    setLoadingQuote(true);
    setQuoteError('');
    setPlaceProblems(null); // a fresh quote carries its own problems; the old 400's are stale
    try {
      setQuote(await post('/quote', { items }));
    } catch (err) {
      setQuoteError(err.message);
    } finally {
      setLoadingQuote(false);
    }
  }, [itemsKey]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  // `placing` stays true through the redirect, so clearing the cart on success does not
  // bounce the user to /cart before the order page loads.
  if (lines.length === 0 && !placing) return <Navigate to="/cart" replace />;

  async function saveAddress(form) {
    setSavingAddress(true);
    setAddressError('');
    try {
      const { addresses: saved } = await post('/users/me/addresses', form);
      await refreshUser();
      // Select the address that was just typed — it is the reason they opened the form.
      setAddressId(saved[saved.length - 1]._id);
      setAdding(false);
    } catch (err) {
      setAddressError(err.message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function placeOrder() {
    setPlacing(true);
    setPlaceError('');
    setPlaceProblems(null);
    try {
      const order = await post('/orders', {
        addressId,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      });
      clear();
      navigate(`/order/${order._id}`, { replace: true });
    } catch (err) {
      setPlaceError(err.message);
      setPlaceProblems(err.problems);
      setPlacing(false);
    }
  }

  // The 400 already names every offending line, so it wins over the older quote's list.
  const problems = new Map(
    (placeProblems ?? quote?.problems ?? []).map((p) => [String(p.productId), p.message]),
  );
  const canPlace =
    Boolean(addressId) && Boolean(quote) && problems.size === 0 && !loadingQuote && !placing;

  // Why the button is off, in words. §4: the button being grey is not the message,
  // and "Place order" that does nothing with no explanation is the worst version of
  // this screen. Order matters — the first unmet condition is the one to fix next.
  const blocker = placeError
    ? null
    : problems.size > 0
      ? `Fix the ${problems.size === 1 ? 'flagged product' : `${formatQty(problems.size)} flagged products`} before placing this order.`
      : !addressId
        ? 'Choose a delivery address to continue.'
        : quoteError
          ? 'The order total could not be loaded. Try again above.'
          : null;

  const placeButton = (
    <Button fullWidth onClick={placeOrder} loading={placing} loadingLabel="Placing…" disabled={!canPlace}>
      Place order
    </Button>
  );

  return (
    <Container width="app" className="py-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-edge pb-5">
        <div>
          <h1 className="type-h2 text-fg">Checkout</h1>
          <p className="type-body-sm mt-1 text-fg-secondary">
            <span className="tabular">{formatQty(lines.length)}</span>{' '}
            {lines.length === 1 ? 'product' : 'products'} · repriced from the catalogue just now
          </p>
        </div>
        <Button as={Link} to="/cart" variant="tertiary" size="sm" iconLeft={Icon.arrowLeft}>
          Back to your order
        </Button>
      </div>

      {/* pb-44 keeps the last card clear of the fixed mobile bar. */}
      <div className="mt-6 grid gap-6 pb-44 lg:grid-cols-[1fr_22rem] lg:items-start lg:pb-0">
        <div className="flex flex-col gap-6">
          {/* ---------------------------------------------------------------- address */}
          <Card>
            <h2 className="type-h4 text-fg">Delivery address</h2>

            {addresses.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3">
                {addresses.map((a) => {
                  const selected = addressId === a._id;
                  return (
                    <li key={a._id}>
                      {/* The tint is on the label, which owns its own border and fill —
                          not a className passed into Card. Card hardcodes
                          `border-edge bg-surface`, and cx() is a plain join, so an
                          appended `border-brand-500` is a second same-specificity
                          utility whose winner the stylesheet order decides. Which
                          address is selected is not something to leave to a coin toss. */}
                      <label
                        className={cx(
                          'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors duration-150',
                          selected
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-edge bg-surface hover:border-edge-strong hover:bg-surface-2',
                        )}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={a._id}
                          checked={selected}
                          onChange={() => setAddressId(a._id)}
                          className="mt-1 size-4 shrink-0 accent-brand-600"
                        />
                        {/* Never muted. The selected card sits on brand-50, where
                            fg-secondary drops below the AA body floor — and `muted` is
                            opt-in precisely so this caller can decline it on every row. */}
                        <AddressLines address={a} />
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {adding ? (
              <AddressForm
                className="mt-5 border-t border-edge pt-5"
                onSave={saveAddress}
                // No cancel on a first address: there is nothing to go back to, and a Cancel
                // that leaves the order unplaceable is a dead end.
                onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
                busy={savingAddress}
                error={addressError}
              />
            ) : (
              <Button variant="secondary" className="mt-4" iconLeft={Icon.add} onClick={() => setAdding(true)}>
                Add new address
              </Button>
            )}
          </Card>

          {/* ------------------------------------------------------------------ items */}
          <Card>
            <h2 className="type-h4 text-fg">Items</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {lines.map((line) => {
                const problem = problems.get(String(line.productId));
                return (
                  <li key={line.productId} className="flex gap-4">
                    <span className="size-16 shrink-0 overflow-hidden rounded-lg border border-edge">
                      <ProductImage src={line.image} alt={line.name} icon={Icon.products} ratio="square" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="type-body-sm font-medium text-fg">{line.name}</p>
                      <p className="type-caption mt-1 text-fg-secondary">
                        Quantity <span className="tabular">{formatQty(line.qty)}</span>
                      </p>
                      {problem && (
                        <p role="alert" className="type-caption mt-1.5 flex items-start gap-1.5 font-medium text-error-700">
                          <Icon.danger size={14} className="mt-px shrink-0" />
                          <span>{problem}</span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="type-caption mt-4 border-t border-edge pt-4 text-fg-secondary">
              Dispatched in 24–48 hours. For professional and institutional use.
            </p>
          </Card>
        </div>

        {/* -------------------------------------------------------------- summary */}
        <Card className="lg:sticky lg:top-20">
          <h2 className="type-h4 text-fg">Order summary</h2>
          <p className="type-caption mt-1 text-fg-secondary">
            All prices are trade prices, exclusive of GST. GST is added below.
          </p>

          <div className="mt-4">
            {loadingQuote && !quote ? (
              <div className="flex flex-col gap-3">
                <Skeleton h="h-4" />
                <Skeleton h="h-4" />
                <Skeleton h="h-4" w="w-2/3" />
                <Skeleton h="h-6" w="w-1/2" />
              </div>
            ) : quoteError ? (
              <ErrorState thing="the order total" detail={quoteError} onRetry={loadQuote} />
            ) : (
              quote && <PriceBreakdown {...quote} />
            )}
          </div>

          {placeError && (
            <Alert tone="error" className="mt-4" title="The order was not placed">
              {placeError}
            </Alert>
          )}

          <Divider className="my-5" />

          <div className="hidden lg:block">
            {placeButton}
            {blocker && (
              <p className="type-caption mt-2 flex items-start gap-1.5 text-fg-secondary">
                <Icon.info size={14} className="mt-px shrink-0" />
                {blocker}
              </p>
            )}
          </div>

          <p className="type-caption mt-4 text-fg-secondary lg:mt-3">
            Payment is collected separately — nothing is charged now.
          </p>
        </Card>
      </div>

      {/* ---- Mobile bar ------------------------------------------------------ */}
      {/* Fixed, for the same reason /cart has one: on a phone the summary sits below
          an address picker and the whole item list, and a Place order button nobody
          scrolls to is a Place order button nobody presses. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-surface/95 px-4 py-3 shadow-e2 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="type-body-sm text-fg-secondary">
            Total <span className="type-caption text-fg-muted">incl. GST</span>
          </span>
          <span className="type-h4 tabular text-fg">
            {quote ? formatINR(quote.grandTotal) : '—'}
          </span>
        </div>
        {placeButton}
        {blocker && <p className="type-caption mt-2 text-center text-fg-secondary">{blocker}</p>}
      </div>
    </Container>
  );
}

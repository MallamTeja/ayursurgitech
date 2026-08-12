import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AddressForm, { AddressLines } from '../components/AddressForm';
import Breakdown from '../components/Breakdown';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import usePageTitle from '../components/usePageTitle';
import { post } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export default function Checkout() {
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

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* ---------------------------------------------------------------- address */}
          <Card className="p-4 md:p-6">
            <h2 className="text-lg">Delivery address</h2>

            {addresses.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3">
                {addresses.map((a) => (
                  <li key={a._id}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-card border p-4 transition-colors duration-150 ${
                        addressId === a._id ? 'border-blue-500 bg-blue-100' : 'border-line'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={a._id}
                        checked={addressId === a._id}
                        onChange={() => setAddressId(a._id)}
                        className="mt-1 size-4 shrink-0 accent-blue-700"
                      />
                      {/* Full ink, never muted: the selected card's fill is blue-100, where
                          ink-muted is 4.26:1 and fails AA. Same failure DESIGN-SYSTEM records
                          as #3, on a different fill. Unselected cards sit on white and pass,
                          so this only ever showed on the checked address — which is why the
                          shared component takes `muted` as an opt-in and this caller declines
                          it on every row. */}
                      <AddressLines address={a} />
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {adding ? (
              <AddressForm
                className="mt-4 border-t border-line pt-4"
                onSave={saveAddress}
                // No cancel on a first address: there is nothing to go back to, and a Cancel
                // that leaves the order unplaceable is a dead end.
                onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
                busy={savingAddress}
                error={addressError}
              />
            ) : (
              <Button variant="secondary" className="mt-4" onClick={() => setAdding(true)}>
                Add new address
              </Button>
            )}
          </Card>

          {/* ------------------------------------------------------------------ items */}
          <Card className="p-4 md:p-6">
            <h2 className="text-lg">Items</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {lines.map((line) => {
                const problem = problems.get(String(line.productId));
                return (
                  <li key={line.productId} className="flex gap-4">
                    <span className="h-fit shrink-0 self-start rounded-control border border-line bg-card p-2">
                      <img src={line.image} alt="" className="size-12 object-contain" loading="lazy" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{line.name}</p>
                      <p className="mt-1 text-xs text-ink-muted">Quantity {line.qty}</p>
                      {problem && (
                        <p role="alert" className="mt-1 text-xs font-medium text-danger">
                          {problem}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 border-t border-line pt-4 text-xs text-ink-muted">
              Dispatched in 24–48 hours. For professional and institutional use.
            </p>
          </Card>
        </div>

        {/* -------------------------------------------------------------- summary */}
        <Card className="p-4 md:p-6 lg:sticky lg:top-20">
          <h2 className="text-lg">Order summary</h2>
          <p className="mt-1 text-xs text-ink-muted">
            All prices are trade prices, exclusive of GST. GST is added at checkout.
          </p>

          <div className="mt-4">
            {loadingQuote && !quote ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : quoteError ? (
              <ErrorState message={quoteError} onRetry={loadQuote} />
            ) : (
              quote && <Breakdown {...quote} />
            )}
          </div>

          {placeError && (
            <p
              role="alert"
              className="mt-4 rounded-control border border-danger px-3 py-2 text-sm text-danger"
            >
              {placeError}
            </p>
          )}

          {problems.size > 0 && !placeError && (
            <p className="mt-4 text-xs text-ink-muted">
              Fix the flagged items before placing this order.
            </p>
          )}

          {!addressId && !placeError && (
            <p className="mt-4 text-xs text-ink-muted">Choose a delivery address to continue.</p>
          )}

          <Button
            variant="accent"
            className="mt-4 w-full"
            onClick={placeOrder}
            loading={placing}
            disabled={!canPlace}
          >
            Place order
          </Button>

          <p className="mt-3 text-xs text-ink-muted">
            Payment is collected separately — nothing is charged now.
          </p>
        </Card>
      </div>
    </Container>
  );
}

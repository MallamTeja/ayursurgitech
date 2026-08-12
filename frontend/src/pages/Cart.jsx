import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import Price from '../components/Price';
import QtyStepper from '../components/QtyStepper';
import usePageTitle from '../components/usePageTitle';
import { CartIcon, TrashIcon } from '../components/icons';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { formatINR } from '../lib/money';

export default function Cart() {
  const { lines, setQty, remove, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle('Your cart');

  // The cart is localStorage and an admin can raise a minimum after the item was added,
  // so it is re-checked here. POST /orders' 400 is the backstop, not the UX.
  const belowMin = lines.filter((l) => l.qty < (l.minOrderQty || 1));

  const proceed = () =>
    user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } });

  if (lines.length === 0) {
    return (
      <Container className="py-12">
        <h1 className="text-3xl">Your cart</h1>
        <Card className="mt-6">
          <EmptyState
            icon={<CartIcon className="size-8" />}
            message="Nothing in the cart yet."
            actionLabel="Browse the catalogue"
            actionTo="/products"
          />
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">Your cart</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {lines.length} {lines.length === 1 ? 'product' : 'products'}
      </p>

      {/* pb-28 keeps the last line clear of the sticky mobile bar */}
      <div className="mt-6 grid gap-6 pb-32 lg:grid-cols-[1fr_20rem] lg:items-start lg:pb-0">
        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li key={line.productId}>
              <Card className="flex gap-4 p-4">
                <Link
                  to={`/p/${line.slug}`}
                  className="h-fit shrink-0 self-start rounded-control border border-line bg-card p-2"
                >
                  <img
                    src={line.image}
                    alt=""
                    className="size-16 object-contain md:size-20"
                    loading="lazy"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/p/${line.slug}`}
                      className="text-base font-medium text-ink hover:text-blue-500"
                    >
                      {line.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      aria-label={`Remove ${line.name}`}
                      // p-3 round a 20px icon is 44px; the matching -m-3 keeps the layout put.
                      className="-m-3 shrink-0 p-3 text-ink-muted transition-colors duration-150 hover:text-danger"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-ink-muted">{formatINR(line.price)} each</p>

                  <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                    <QtyStepper
                      value={line.qty}
                      onChange={(qty) => setQty(line.productId, qty)}
                      minOrderQty={line.minOrderQty}
                      stockQty={line.stockQty}
                    />
                    {/* Line subtotal. No GST here — the breakdown appears first at checkout. */}
                    <Price paise={line.price * line.qty} className="text-lg" />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <Card className="p-4 md:p-6 lg:sticky lg:top-20">
          <h2 className="text-lg">Summary</h2>

          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="text-base text-ink">Subtotal</span>
            <span className="text-lg font-semibold tabular-nums text-copper-700">
              {formatINR(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">GST and delivery calculated at checkout.</p>

          {belowMin.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1" role="alert">
              {belowMin.map((l) => (
                <li key={l.productId} className="text-xs text-copper-700">
                  {l.name}: minimum order is {l.minOrderQty} pieces
                </li>
              ))}
            </ul>
          )}

          {/* The wrapper does the hiding: Button sets its own `inline-flex`, so a `hidden`
              in its className is a coin toss between two display utilities. */}
          <div className="mt-4 hidden md:block">
            <Button onClick={proceed} disabled={belowMin.length > 0} className="w-full">
              Proceed to checkout
            </Button>
          </div>
        </Card>
      </div>

      {/* Mobile: the checkout button is always reachable. The one shadow the design system
          allows on a sticky bar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card px-4 py-3 shadow-lift md:hidden">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="text-sm text-ink-muted">Subtotal</span>
          <span className="text-lg font-semibold tabular-nums text-copper-700">
            {formatINR(subtotal)}
          </span>
        </div>
        <Button onClick={proceed} disabled={belowMin.length > 0} className="w-full">
          Proceed to checkout
        </Button>
      </div>
    </Container>
  );
}

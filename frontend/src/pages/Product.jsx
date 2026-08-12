import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { post } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import useFetch from '../lib/useFetch';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Mrp from '../components/Mrp';
import Price from '../components/Price';
import QtyStepper from '../components/QtyStepper';
import Rating from '../components/Rating';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import StockBadge from '../components/StockBadge';
import Textarea from '../components/Textarea';
import usePageTitle from '../components/usePageTitle';

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Gallery({ name, images }) {
  const [active, setActive] = useState(0);
  const list = images?.length ? images : [null];
  const src = list[Math.min(active, list.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      {/* Contain on white with padding, never cover. */}
      <div className="flex aspect-square items-center justify-center rounded-card border border-line bg-white p-6">
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm text-ink-muted">No image</span>
        )}
      </div>

      {/* Thumbnails only when there is more than one image. */}
      {list.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {list.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${list.length}`}
              aria-current={i === active}
              className={`size-20 rounded-control border bg-white p-1 transition-colors duration-150 ${
                i === active ? 'border-blue-700' : 'border-line hover:border-blue-500'
              }`}
            >
              <img src={image} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ productId }) {
  const [rating, setRating] = useState('5');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Nothing appears publicly until an admin approves it. A user who is not told that
  // assumes the submission failed and sends it again.
  if (done) {
    return (
      <p className="rounded-card border border-line bg-card p-4 text-sm text-ink">
        Thanks — your review is awaiting approval
      </p>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await post(`/products/${productId}/reviews`, { rating: Number(rating), text });
      setDone(true);
    } catch (err) {
      // 409 ("already reviewed") arrives as the server's own message. Show it verbatim.
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <Select label="Your rating" value={rating} onChange={(e) => setRating(e.target.value)}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? 'star' : 'stars'}
          </option>
        ))}
      </Select>
      <Textarea
        label="Your review"
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="How did this perform in practice?"
        error={error}
      />
      <Button type="submit" loading={sending} className="self-start">
        Submit review
      </Button>
    </form>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { data, loading, error, retry } = useFetch(`/products/${slug}`);
  const { user } = useAuth();
  const { add } = useCart();

  // `product` is the canonical key SPEC pins. The same fields used to arrive flat alongside it
  // too; that duplicate copy is gone, so this is now the only shape the endpoint serves.
  const product = data?.product;
  const { reviews, category, subcategory } = data || {};

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Before the early returns below, so the hook order stays stable.
  usePageTitle(product?.name);

  // Seeded at minOrderQty, never at 1 — a stepper showing 1 against a minimum of 10 is a trap.
  useEffect(() => {
    if (!product) return;
    const min = product.minOrderQty || 1;
    setQty(product.stockQty > 0 ? Math.min(min, product.stockQty) : min);
    setAdded(false);
  }, [product?._id]);

  if (loading) {
    return (
      <Container className="py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-8 md:py-12">
        <ErrorState message={error || 'This product could not be loaded.'} onRetry={retry} />
      </Container>
    );
  }

  const inStock = product.stockQty > 0;
  const minOrderQty = product.minOrderQty || 1;
  const belowMin = qty < minOrderQty;

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb
        trail={[
          { label: 'Home', to: '/' },
          ...(category ? [{ label: category.name, to: `/c/${category.slug}` }] : []),
          ...(category && subcategory
            ? [{ label: subcategory.name, to: `/c/${category.slug}/${subcategory.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery name={product.name} images={product.images} />

        <div className="flex flex-col gap-5">
          <div>
            {product.brand && (
              <p className="text-xs uppercase tracking-label text-ink-muted">{product.brand}</p>
            )}
            <h1 className="mt-1 text-3xl">{product.name}</h1>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Price paise={product.price} gst={product.gstRate !== 0} className="text-2xl" />
            <Mrp price={product.price} mrp={product.mrp} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StockBadge stockQty={product.stockQty} />
            {/* The exact count, always. A buyer sizing a 200-unit order needs the number. */}
            {inStock && (
              <span className="text-sm tabular-nums text-ink-muted">
                {product.stockQty} in stock
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-4 text-sm">
            <div>
              <dt className="text-ink-muted">HSN code</dt>
              <dd className="font-mono text-ink">{product.hsnCode}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">GST rate</dt>
              <dd className="tabular-nums text-ink">{product.gstRate}%</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Minimum order</dt>
              <dd className="tabular-nums text-ink">
                {minOrderQty} {minOrderQty === 1 ? 'piece' : 'pieces'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Pieces available</dt>
              <dd className="tabular-nums text-ink">{product.stockQty}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3">
            <QtyStepper
              value={qty}
              onChange={setQty}
              minOrderQty={minOrderQty}
              stockQty={product.stockQty}
              disabled={!inStock}
            />
            {/* The resting state, not only after a violation. Stated as a sale unit. */}
            {minOrderQty > 1 && (
              <p className="text-sm text-ink-muted">Minimum order: {minOrderQty}</p>
            )}

            {/* The one accent button on the screen. */}
            <Button
              variant="accent"
              className="self-start"
              disabled={!inStock || belowMin}
              onClick={() => {
                add(product, qty);
                setAdded(true);
              }}
            >
              {inStock ? 'Add to cart' : 'Out of stock'}
            </Button>

            {/* role=status: this confirmation was rendered silently, so a screen-reader user
                pressed Add to cart and got nothing back. */}
            {added && (
              <p role="status" className="text-sm text-ink-muted">
                Added to cart.{' '}
                <Link to="/cart" className="text-blue-500 underline">
                  View cart
                </Link>
              </p>
            )}
          </div>

          <p className="text-sm text-ink-muted">Dispatched in 24–48 hours.</p>
        </div>
      </div>

      <section className="pt-12">
        <h2 className="text-2xl">Description</h2>
        {/* Plain text with newlines preserved — it is a spec sheet, not sales copy. */}
        <p className="mt-4 max-w-prose whitespace-pre-line text-base text-ink">
          {product.description}
        </p>
      </section>

      <section className="pt-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">Reviews</h2>
          {product.ratingCount > 0 && (
            <Rating value={product.ratingAvg} count={product.ratingCount} />
          )}
        </div>

        {reviews?.length > 0 ? (
          <ul className="mt-6 flex max-w-prose flex-col gap-6">
            {reviews.map((r) => (
              <li key={r._id} className="border-b border-line pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-ink">{r.userName}</span>
                  <Rating value={r.rating} />
                  <span className="text-sm text-ink-muted">{formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-base text-ink">{r.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          // Centred in a panel. Loose on the page it reads as a rendering gap at 1440.
          <Card className="mt-6 max-w-prose">
            <EmptyState message="No reviews yet" />
          </Card>
        )}

        <div className="mt-8">
          <h3 className="text-lg">Write a review</h3>
          <div className="mt-4">
            {user ? (
              <ReviewForm productId={product._id} />
            ) : (
              <p className="text-sm text-ink-muted">
                <Link to="/login" className="text-blue-500 underline">
                  Sign in
                </Link>{' '}
                to write a review.
              </p>
            )}
          </div>
        </div>
      </section>
    </Container>
  );
}

import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import usePageTitle from '../components/usePageTitle';
import { PackageIcon } from '../components/icons';
import useFetch from '../lib/useFetch';

/**
 * The landing page — about the company and what it supplies. No products on it.
 *
 * It used to be a hero above a category grid above "new arrivals", which made it a catalogue
 * index with a headline on top: it never said who we are, who we sell to, or on what terms,
 * and it duplicated the job /products now does. Products live on /products. This page answers
 * the questions a procurement officer has BEFORE they open a catalogue.
 *
 * Every claim here is one the codebase can back — trade pricing, GST invoicing with HSN codes,
 * 24–48h dispatch, per-product minimum order quantities, and a live stock count. No
 * certifications, no client counts, no testimonials: those would be invented.
 */

// ponytail: no search field in the hero. The header search is now permanent at every
// breakpoint, and two search inputs 80px apart is worse than one that is always there.

function Term({ label, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="text-xs uppercase tracking-label text-blue-100">{label}</dt>
      <dd className="text-sm text-white">{children}</dd>
    </div>
  );
}

function CategoryTile({ category }) {
  // The first few subcategory names, not a count: "4 subcategories" tells a buyer nothing,
  // "Gauze & Swabs · Bandages · Cotton" tells them whether to click.
  const inside = (category.subcategories ?? []).slice(0, 3).map((s) => s.name);
  const more = (category.subcategories?.length ?? 0) - inside.length;

  return (
    <Link
      to={`/c/${category.slug}`}
      className="group flex flex-col rounded-card border border-line bg-card transition-shadow duration-150 hover:shadow-lift"
    >
      <div className="flex aspect-[4/3] items-center justify-center border-b border-line bg-white p-3">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <PackageIcon className="size-10 text-line" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg group-hover:text-blue-500">{category.name}</h3>
        {inside.length > 0 && (
          <p className="mt-1 text-sm text-ink-muted">
            {inside.join(' · ')}
            {more > 0 && ` + ${more} more`}
          </p>
        )}
      </div>
    </Link>
  );
}

// A real sequence, so it is numbered. Nothing else on the page is.
const STEPS = [
  [
    'Find the line',
    'Search by name or brand, or browse the range. Every product lists its HSN code, GST rate, minimum order quantity and the stock on hand.',
  ],
  [
    'Place the order',
    'Prices are trade prices, exclusive of GST. GST and delivery are added at checkout, and nothing is charged before we confirm it with you.',
  ],
  [
    'Invoice and dispatch',
    'A GST invoice with HSN codes is issued for every order, and orders are dispatched in 24–48 hours.',
  ],
];

export default function Home() {
  const cats = useFetch('/categories');
  const products = useFetch('/products');
  usePageTitle('Surgical and pharma supplies');

  const categories = cats.data;
  const items = products.data?.items;
  const inStock = items?.filter((p) => Number(p.stockQty) > 0).length;

  return (
    <>
      {/* ------------------------------------------------------------------------- hero */}
      <section className="border-b border-line">
        <Container className="grid gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12 md:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-label text-copper-700">
              Surgical · Wound care · Pharma
            </p>
            <h1 className="mt-4 text-3xl md:text-5xl">Surgical supplies, at trade prices.</h1>
            <p className="mt-6 max-w-prose text-base text-ink-muted">
              Consumables, instruments and diagnostics for hospitals, clinics and distributors.
              One supplier for the whole consumables list, invoiced with GST and dispatched in
              24–48 hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/products">Browse the catalogue</Button>
              <Button variant="secondary" to="/register">
                Create an account
              </Button>
            </div>
          </div>

          {/* The one dark element on the page, and the terms a procurement officer checks
              first. A supply desk's honest hero is its terms of trade, not a stock photo. */}
          <dl className="rounded-card bg-blue-900 p-6 md:p-8">
            <p className="text-xs font-medium uppercase tracking-label text-blue-100">
              How we sell
            </p>
            <div className="mt-4 divide-y divide-blue-700 border-t border-blue-700">
              <Term label="Prices">Trade, exclusive of GST</Term>
              <Term label="Invoice">GST invoice, HSN coded</Term>
              <Term label="Dispatch">24–48 hours</Term>
              <Term label="Minimum order">Stated on every product</Term>
              <Term label="In stock now">
                {products.loading ? (
                  <span className="text-blue-100">Checking…</span>
                ) : items ? (
                  <span className="tabular-nums">
                    {inStock} of {items.length} lines
                  </span>
                ) : (
                  // A failed fetch means the figure is unknown, not zero.
                  <Link to="/products" className="text-blue-100 underline">
                    See the catalogue
                  </Link>
                )}
              </Term>
            </div>
          </dl>
        </Container>
      </section>

      {/* --------------------------------------------------------------------- the range */}
      <section>
        <Container className="py-12 md:py-16">
          <h2 className="text-2xl">What we supply</h2>
          <p className="mt-2 max-w-prose text-base text-ink-muted">
            The range, by department. Prices and stock are on the products themselves.
          </p>

          <div className="mt-8">
            {cats.loading && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="rounded-card border border-line bg-card">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="flex flex-col gap-2 p-4">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cats.error && <ErrorState message={cats.error} onRetry={cats.retry} />}
            {categories?.length === 0 && <EmptyState message="No categories are listed yet." />}
            {categories?.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {categories.map((c) => (
                  <CategoryTile key={c._id || c.slug} category={c} />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ how it works */}
      <section className="border-y border-line bg-shade">
        <Container className="py-12 md:py-16">
          <h2 className="text-2xl">How ordering works</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="border-t border-line pt-4">
                <span className="font-display text-sm tabular-nums text-copper-700">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* -------------------------------------------------------------------- who we sell to */}
      <section>
        <Container className="py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl">Who we supply</h2>
              <p className="mt-2 max-w-prose text-base text-ink-muted">
                Hospitals, nursing homes, clinics and distributors buying for professional and
                institutional use. If a line you need is not listed, ask — most of the range is
                wider than the catalogue.
              </p>
            </div>
            <Button to="/products" className="shrink-0">
              Browse the catalogue
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

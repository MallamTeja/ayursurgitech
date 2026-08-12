// /products — the catalogue.
//
// The listing page is where a B2B buyer spends most of their time, so it is built
// around narrowing rather than browsing: faceted filters with honest counts, a
// shareable URL, and two view modes that map to two different intents.
//
// GRID IS FOR DISCOVERY, LIST IS FOR PROCUREMENT. That distinction drives the one
// real departure from §15 on this page. The grid card keeps §15's single action —
// buying a medical device off a thumbnail without reading its specification is a
// clinical risk, not a conversion win. The list row adds a quantity stepper and Add
// to Order, because someone reordering 500 sets they have bought monthly for two
// years is not discovering anything and should not be sent through a detail page.
//
// EVERY FILTER STATE IS IN THE URL. See useProductQuery.js for why that is not
// optional on an enterprise catalogue.

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  Container,
  DescriptionList,
  Divider,
  Drawer,
  EmptyState,
  ErrorState,
  FeatureList,
  Icon,
  Pagination,
  PriceBlock,
  ProductCard,
  ProductCardSkeleton,
  ProductGrid,
  ProductImage,
  QuantityStepper,
  Select,
  SpecTable,
  StatusBadge,
  StockMeter,
  Tooltip,
  cx,
  formatINR,
  formatQty,
  stockStatusOf,
  useToast,
} from '../components/DesignSystem';
import { categories, products as allProducts } from '../components/DesignSystem/dummy.js';
import usePageTitle from '../components/usePageTitle';
import { useCart } from '../lib/cart';
import { PER_PAGE, SORTS, slugOf } from './catalogue.js';
import Facets from './Facets.jsx';
import useProductQuery from './useProductQuery.js';

/* -------------------------------------------------------------------------- */
/* The data seam                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where the API goes.
 *
 * Today this returns the fixture synchronously. Swapping it for
 * `useFetch('/products')` is the entire change — nothing below knows or cares where
 * the list came from, because it only ever sees { data, loading, error, retry }.
 *
 * No artificial delay. A fake 400ms spinner makes the page feel slower than it is
 * and teaches everyone to distrust the measurement. The loading and error paths are
 * still real code and still reachable: `?state=loading` and `?state=error` force
 * them, which is how they get looked at without waiting for the API to break.
 */
function useCatalogueData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const forced = searchParams.get('state');
  const failed = forced === 'error';
  const isLoading = forced === 'loading';

  return {
    // Empty rather than null while loading or failed: every consumer downstream
    // treats the catalogue as a list, and handing it null would push a `?? []` into
    // each of them.
    data: isLoading || failed ? [] : allProducts,
    loading: isLoading,
    error: failed ? 'Forced by ?state=error in the URL.' : null,
    // Retry has to actually do something or the button is a lie. Dropping the
    // parameter is exactly what recovery means for this stub, and it is the same
    // shape of call — re-run the request — that useFetch's retry will be.
    retry: () =>
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('state');
        return next;
      }),
  };
}

/** dummy.js speaks the design system's shape; the cart speaks the API's. */
const toCartLine = (product) => ({
  productId: product.id,
  slug: slugOf(product),
  name: product.name,
  image: product.image ?? '',
  price: product.price,
  gstRate: product.gst,
  minOrderQty: product.moq,
  stockQty: product.stock,
});

/* -------------------------------------------------------------------------- */
/* Add to Order                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The procurement control: a stepper stepping in MOQ multiples, and the button.
 *
 * Out of stock disables the button rather than hiding it. Hiding leaves a gap where
 * an action was and makes the row look broken; a disabled button with the reason
 * beside it answers the question the buyer is about to ask. §4 — the reason is
 * words, not a colour.
 */
function AddToOrder({ product, compact = false }) {
  const { add } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(product.moq);
  const outOfStock = product.stock <= 0;

  const submit = () => {
    add(toCartLine(product), qty);
    toast.success(`${formatQty(qty)} × ${product.name} added`, { title: 'Added to your order' });
    // Reset to the MOQ so the row does not sit there implying the next add is also
    // 500 pieces.
    setQty(product.moq);
  };

  if (outOfStock) {
    return (
      <div className={cx('flex flex-col items-end gap-1.5', compact && 'items-stretch')}>
        <Tooltip label="Not in stock. Request a quote and an agent will confirm lead time.">
          <Button size="sm" variant="secondary" disabled fullWidth={compact}>
            Out of stock
          </Button>
        </Tooltip>
        {/* Carry the product across. Landing on a blank contact form after
            clicking Request quote on a specific out-of-stock item makes the
            buyer retype what they just clicked; /support reads `product` and
            `topic` and pre-fills both. */}
        <Button
          as={Link}
          to={`/support?product=${encodeURIComponent(product.code)}&topic=quote`}
          size="sm"
          variant="tertiary"
        >
          Request quote
        </Button>
      </div>
    );
  }

  return (
    <div className={cx('flex flex-col gap-2', compact ? 'items-stretch' : 'items-end')}>
      <QuantityStepper
        value={qty}
        onChange={setQty}
        moq={product.moq}
        max={product.stock}
        uom={product.uom}
        size="sm"
      />
      <Button size="sm" iconLeft={Icon.cart} onClick={submit} fullWidth={compact}>
        Add to Order
      </Button>
      <p className="type-caption text-fg-muted">
        {formatQty(product.moq)} minimum · {product.packSize}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick view                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * §16's detail hierarchy, in a drawer.
 *
 * A drawer rather than a navigation for a specific reason: comparing three filtered
 * infusion sets means opening and closing them in turn, and a full page navigation
 * costs the filter state, the scroll position and two clicks each time. The buyer
 * stays in their result set.
 *
 * This is a complement to the product detail page, not a substitute — related
 * products, full documentation and the quote flow belong on a page. When /p/:slug is
 * migrated, the footer link here goes to it.
 */
function QuickView({ product, onClose }) {
  if (!product) return null;
  const stockKey = stockStatusOf(product.stock, product.lowStockAt);

  return (
    <Drawer
      open={Boolean(product)}
      onClose={onClose}
      title={product.name}
      description={`${product.category} · ${product.code}`}
      size="lg"
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Close
          </Button>
          <Button as={Link} to={`/p/${slugOf(product)}`} variant="secondary" iconRight={Icon.arrowRight}>
            Full product page
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <ProductImage
          src={product.image}
          alt={product.name}
          code={product.code}
          icon={Icon[product.icon] ?? Icon.products}
          className="rounded-xl border border-edge"
        />

        <p className="type-body text-fg-secondary">{product.summary}</p>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="stock" value={stockKey} />
          {product.sterile && (
            <Badge tone="brand" icon={Icon.verified}>
              Sterile
            </Badge>
          )}
          {product.latexFree && <Badge>Latex-free</Badge>}
          <Badge>GST {product.gst}%</Badge>
        </div>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <PriceBlock product={product} />
            <AddToOrder product={product} />
          </div>
          <Divider className="my-4" />
          <StockMeter stock={product.stock} lowStockAt={product.lowStockAt} />
        </Card>

        <div>
          <h3 className="type-h4 mb-3 text-fg">Key specifications</h3>
          <SpecTable specs={product.specs} />
        </div>

        <div>
          <h3 className="type-h4 mb-3 text-fg">Applications</h3>
          <FeatureList items={product.applications} />
        </div>

        <div>
          <h3 className="type-h4 mb-3 text-fg">Ordering</h3>
          <DescriptionList
            columns={2}
            items={[
              { label: 'Product code', value: product.code },
              { label: 'HSN code', value: product.hsn },
              { label: 'Unit of measure', value: product.uom },
              { label: 'Pack size', value: product.packSize },
              { label: 'Minimum order', value: `${formatQty(product.moq)} ${product.uom.toLowerCase()}` },
              { label: 'Unit price', value: `${formatINR(product.price)} excl. GST` },
            ]}
          />
        </div>

        <div>
          <h3 className="type-h4 mb-3 text-fg">Documents</h3>
          <ul className="space-y-2">
            {product.documents.map((d) => (
              <li key={d}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-4 py-3 transition-colors hover:border-brand-500"
                >
                  <Icon.documents size={18} className="shrink-0 text-brand-700" />
                  <span className="type-body-sm min-w-0 flex-1 truncate font-medium text-fg">{d}</span>
                  <Icon.download size={16} className="shrink-0 text-fg-muted" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Drawer>
  );
}

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The sidebar while the catalogue is in flight.
 *
 * Not the live Facets with zeroes in it. Every count would read 0, every unselected
 * option would disable itself on that zero, and the panel would grey out entirely —
 * a filter UI that looks permanently broken for as long as the request takes. A
 * skeleton says "not yet" instead of saying "nothing".
 */
function FacetsSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0">
      <span className="ds-pulse mb-4 block h-6 w-20 rounded bg-surface-2" />
      {[4, 3, 2, 3, 2].map((rows, group) => (
        <div key={group} className="border-t border-edge py-5">
          <span className="ds-pulse mb-3 block h-3.5 w-28 rounded bg-surface-2" />
          <div className="space-y-2.5">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="ds-pulse size-[18px] shrink-0 rounded-[4px] bg-surface-2" />
                <span className="ds-pulse h-3 flex-1 rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CHIP_LABEL = {
  cat: (v) => categories.find((c) => c.slug === v)?.name ?? v,
  avail: (v) => ({ inStock: 'In stock', lowStock: 'Low stock', outOfStock: 'Out of stock' })[v] ?? v,
  props: (v) => ({ sterile: 'Sterile', latexFree: 'Latex-free' })[v] ?? v,
  moq: (v) => `MOQ up to ${v}`,
};

export default function ProductsPage() {
  const { data, loading, error, retry } = useCatalogueData();
  const cat = useProductQuery(data);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const resultsTop = useRef(null);

  usePageTitle('All products');

  const { query, items, total, catalogueTotal, facets, page, pageCount, chips, isFiltered } = cat;

  /**
   * Announce the result count, debounced.
   *
   * A polite live region that updates on every keystroke of a search box talks over
   * itself and gets muted by the user. Waiting for the count to settle means it is
   * announced once, when it is worth announcing.
   */
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    // Nothing to announce until there is a real count. Announcing "0 products"
    // while the request is still out is the spoken version of the same
    // contradiction the visible copy avoids.
    if (loading) {
      setAnnounced('');
      return undefined;
    }
    const timer = setTimeout(
      () => setAnnounced(total === 1 ? '1 product' : `${formatQty(total)} products`),
      500,
    );
    return () => clearTimeout(timer);
  }, [total, loading]);

  /**
   * Bring the top of the results into view when the page changes.
   *
   * Only on a page change. Doing it on every filter change fights someone who is
   * halfway down the sidebar ticking boxes, yanking the viewport upward each time.
   * `block: 'start'` on the results heading rather than window.scrollTo(0) keeps the
   * sticky toolbar visible instead of scrolling past it.
   */
  const prevPage = useRef(page);
  useEffect(() => {
    if (prevPage.current !== page) {
      resultsTop.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      prevPage.current = page;
    }
  }, [page]);

  const showingFrom = total === 0 ? 0 : (page - 1) * query.per + 1;
  const showingTo = Math.min(total, page * query.per);

  const facetProps = { query, facets, total, chips, ...cat };

  /* ---- Error ------------------------------------------------------------- */
  if (error) {
    return (
      <Container width="app" className="py-8">
        {/* The heading stays even when the fetch failed. Without it the screen is a
            single error card floating on an unidentified page, and someone who
            arrived from a shared link cannot tell what failed to load. */}
        <h1 className="type-h2 text-fg">All products</h1>
        <div className="mt-6 rounded-xl border border-edge bg-surface">
          <ErrorState thing="the catalogue" detail={error} onRetry={retry} />
        </div>
      </Container>
    );
  }

  return (
    <Container width="app" className="py-6 lg:py-8">
      {/* No visible page header, and no breadcrumb.
          The heading and its blurb were removed by request: this is the landing
          page, the catalogue is the first thing on screen, and a title reading
          "All products" above a grid of all the products was restating what the
          grid already said. The breadcrumb went for the same reason — it read
          "Home → All products" with both entries pointing at this URL.

          THE <h1> STAYS, VISUALLY HIDDEN. Removing it outright would leave the
          document with no top-level heading, so a screen reader's heading list —
          the primary way non-visual users skim a page — would open on this page
          empty. sr-only-ds keeps the structure and costs nothing on screen.
          usePageTitle('All products') writes the same string to <title> and to the
          route announcer, so the three agree. */}
      <h1 className="sr-only-ds">All products</h1>

      {/* One live region for the whole page. */}
      <p role="status" aria-live="polite" className="sr-only-ds">
        {announced}
      </p>

      <div className="flex gap-8">
        {/* ---- Desktop facets ---------------------------------------------- */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Product filters">
          {/* top-24 clears the 64px header plus the §8 gap. Its own scroll so a long
              facet list cannot outgrow the viewport and trap the Clear all button. */}
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
            {loading ? <FacetsSkeleton /> : <Facets {...facetProps} idPrefix="d" />}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* ---- Toolbar --------------------------------------------------- */}
          {/* Sticky from lg only. Below lg the header is two rows and its height
              varies, so a sticky toolbar under it either overlaps or floats. A wrong
              sticky offset is worse than none. */}
          <div className="lg:sticky lg:top-16 lg:z-20 lg:-mx-2 lg:bg-canvas/95 lg:px-2 lg:py-3 lg:backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={Icon.filter}
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden"
              >
                Filters
                {chips.length > 0 && (
                  <span className="tabular ml-1.5 rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-semibold text-white">
                    {chips.length}
                  </span>
                )}
              </Button>

              <p className="type-body-sm hidden text-fg-secondary sm:block">
                {loading ? (
                  <span className="ds-pulse inline-block h-3 w-40 rounded bg-surface-2 align-middle" />
                ) : total === 0 ? (
                  'No products'
                ) : (
                  <>
                    Showing <span className="tabular font-semibold text-fg">{showingFrom}</span>–
                    <span className="tabular font-semibold text-fg">{showingTo}</span> of{' '}
                    <span className="tabular font-semibold text-fg">{formatQty(total)}</span>
                    {total !== catalogueTotal && <span className="text-fg-muted"> ({formatQty(catalogueTotal)} in catalogue)</span>}
                  </>
                )}
              </p>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <label className="type-caption hidden text-fg-secondary sm:block" htmlFor="sort">
                  Sort
                </label>
                <Select
                  id="sort"
                  size="sm"
                  value={query.sort}
                  onChange={(e) => cat.setSort(e.target.value)}
                  options={SORTS}
                  className="w-44"
                />

                <Select
                  size="sm"
                  aria-label="Products per page"
                  value={String(query.per)}
                  onChange={(e) => cat.setPer(e.target.value)}
                  options={PER_PAGE.map((n) => ({ value: String(n), label: `${n} per page` }))}
                  className="hidden w-32 sm:block"
                />

                {/* A two-state segmented control, as radios. Two buttons with
                    aria-pressed would work; a radiogroup announces "grid, 1 of 2",
                    which is the information a screen reader user needs. */}
                <div
                  role="radiogroup"
                  aria-label="Layout"
                  className="flex shrink-0 rounded-lg border border-edge-strong bg-surface p-0.5"
                >
                  {[
                    ['grid', Icon.categories, 'Grid — browse'],
                    ['list', Icon.reports, 'List — order'],
                  ].map(([value, Glyph, label]) => (
                    <Tooltip key={value} label={label}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={query.view === value}
                        aria-label={label}
                        onClick={() => cat.setView(value)}
                        className={cx(
                          'grid size-8 place-items-center rounded-md transition-colors',
                          query.view === value
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                        )}
                      >
                        <Glyph size={16} />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>

            {/* ---- Active filters ------------------------------------------ */}
            {(chips.length > 0 || query.q) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="type-caption text-fg-secondary">Filtered by</span>
                {query.q && (
                  <Chip onRemove={() => cat.setSearch('')} icon={Icon.search}>
                    “{query.q}”
                  </Chip>
                )}
                {chips.map((chip) => (
                  <Chip
                    key={`${chip.facet}-${chip.value}`}
                    onRemove={() => cat.removeFilter(chip.facet, chip.value)}
                    removeLabel={`Remove filter ${CHIP_LABEL[chip.facet]?.(chip.value) ?? chip.value}`}
                  >
                    {chip.facet === 'price'
                      ? `₹${query.min ?? 0} – ${query.max != null ? `₹${query.max}` : 'any'}`
                      : (CHIP_LABEL[chip.facet]?.(chip.value) ?? chip.value)}
                  </Chip>
                ))}
                <button
                  type="button"
                  onClick={cat.clearFilters}
                  className="type-caption font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 transition-colors hover:text-brand-900"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <span ref={resultsTop} aria-hidden="true" className="block scroll-mt-32" />

          {/* ---- Results --------------------------------------------------- */}
          <div className="mt-4">
            {loading ? (
              query.view === 'grid' ? (
                <ProductGrid>
                  {Array.from({ length: query.per > 12 ? 12 : query.per }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </ProductGrid>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 rounded-xl border border-edge bg-surface p-4">
                      <span className="ds-pulse size-24 shrink-0 rounded-lg bg-surface-2" />
                      <div className="flex-1 space-y-2 py-1">
                        <span className="ds-pulse block h-2.5 w-20 rounded bg-surface-2" />
                        <span className="ds-pulse block h-4 w-3/4 rounded bg-surface-2" />
                        <span className="ds-pulse block h-3 w-1/2 rounded bg-surface-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : total === 0 ? (
              // §26: the action depends on the cause. A filtered empty offers a way
              // back; a genuinely empty catalogue must not offer "Clear filters",
              // because there is nothing to clear and nothing would change.
              <div className="rounded-xl border border-edge bg-surface">
                {isFiltered ? (
                  <EmptyState
                    variant="no-results"
                    icon={Icon.search}
                    title="No products match these filters"
                    body={
                      query.q
                        ? `Nothing matches “${query.q}” with the filters you have applied. Try a shorter search, or widen the filters.`
                        : 'No products match every filter you have applied. Removing one usually helps — the counts beside each filter show what is available.'
                    }
                    action={
                      <Button variant="secondary" iconLeft={Icon.close} onClick={cat.clearFilters}>
                        Clear all filters
                      </Button>
                    }
                    secondaryAction={
                      query.q ? (
                        <Button variant="tertiary" onClick={() => cat.setSearch('')}>
                          Keep filters, clear search
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <EmptyState
                    icon={Icon.products}
                    title="No products listed yet"
                    body="Products added to the catalogue will appear here."
                  />
                )}
              </div>
            ) : query.view === 'grid' ? (
              <ProductGrid>
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    price
                    stock
                    onView={() => setQuickView(p)}
                  />
                ))}
              </ProductGrid>
            ) : (
              <div className="space-y-3">
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    variant="row"
                    price
                    stock
                    onView={() => setQuickView(p)}
                    action={<AddToOrder product={p} />}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---- Pagination ------------------------------------------------- */}
          {!loading && total > 0 && pageCount > 1 && (
            <div className="mt-8 border-t border-edge pt-6">
              <Pagination page={page} pageSize={query.per} total={total} onPageChange={cat.setPage} />
            </div>
          )}

          {/* A quiet nudge only when a filter is doing the narrowing, so someone who
              filtered to two results knows the other 32 are one click away. */}
          {!loading && total > 0 && total < catalogueTotal && (
            <Alert tone="info" className="mt-6" title={`${formatQty(catalogueTotal - total)} more products are hidden by your filters`}>
              <button
                type="button"
                onClick={cat.clearFilters}
                className="font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
              >
                Clear all filters
              </button>{' '}
              to see the full catalogue.
            </Alert>
          )}
        </div>
      </div>

      {/* ---- Mobile facets ------------------------------------------------- */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description={loading ? 'Loading the catalogue…' : `${formatQty(total)} of ${formatQty(catalogueTotal)} products`}
        side="left"
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={cat.clearFilters} disabled={loading || chips.length === 0}>
              Clear all
            </Button>
            {/* The drawer covers the results, so it needs an explicit dismissal that
                doubles as the confirmation. The filters have already applied — this
                button says what they applied to. */}
            <Button onClick={() => setFiltersOpen(false)} loading={loading} loadingLabel="Loading…">
              Show {formatQty(total)} {total === 1 ? 'product' : 'products'}
            </Button>
          </>
        }
      >
        {loading ? <FacetsSkeleton /> : <Facets {...facetProps} idPrefix="m" />}
      </Drawer>

      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </Container>
  );
}

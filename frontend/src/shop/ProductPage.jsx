// /p/:slug — the product detail page, Design System v1.0.
//
// WHY THIS FILE EXISTS. /p/:slug used to render pages/Product.jsx inside the old
// navy/copper <Layout>, and it was reached from the catalogue's Quick View footer
// ("Full product page"). That was broken twice over:
//
//   1. Styling. Clicking through from the teal catalogue landed on the old shop's
//      palette and chrome — the migration split App.jsx documents, crossed by a
//      link that sits *inside* a v1.0 drawer.
//   2. Reachability. pages/Product.jsx fetches `/products/:slug` from the API,
//      but the v1.0 catalogue is the dummy.js fixture and the backend seed holds a
//      different product set entirely. Every slug the catalogue could produce —
//      `polyfusion-airvent`, `needlefree` — 404s against the API, so the button
//      rendered an error state 100% of the time. The page was not merely
//      mis-styled; it was unreachable.
//
// So this is the migration App.jsx prescribes: same data source as the catalogue
// (dummy.js, through slugOf), same component library, and its <Route> moved into
// the ShopShell group. pages/Product.jsx is left in place unrouted, the way
// pages/Home.jsx is — it is the only reference for the API-backed version of this
// page for whenever the fixture is swapped for useFetch.
//
// THE DATA SEAM is deliberately the same one ProductsPage uses: look the product up
// in the fixture synchronously. When the catalogue moves to `useFetch('/products')`,
// this becomes `useFetch(`/products/${slug}`)` and everything below is unchanged,
// because nothing below touches the fixture directly.

import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Container,
  DescriptionList,
  Divider,
  EmptyState,
  FeatureList,
  Icon,
  PriceBlock,
  ProductCard,
  ProductGrid,
  ProductImage,
  SpecTable,
  StatusBadge,
  StockMeter,
  formatINR,
  formatQty,
  stockStatusOf,
} from '../components/DesignSystem';
import { categories, products as allProducts } from '../components/DesignSystem/dummy.js';
import usePageTitle from '../components/usePageTitle';
import AddToOrder from './AddToOrder.jsx';
import { slugOf } from './catalogue.js';

/** A titled band inside the page. Not shop/Section.jsx — that one owns the full-bleed
 *  vertical rhythm of /about and /support, which is far too airy for a spec sheet. */
function Block({ title, children, className }) {
  return (
    <section className={className}>
      <h2 className="type-h4 text-fg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const product = allProducts.find((p) => slugOf(p) === slug);

  // Before the early return, so the hook order stays stable across a slug change
  // that goes from found to not-found.
  usePageTitle(product?.name ?? 'Product not found');

  /* ---- Unknown slug ------------------------------------------------------- */
  // A mistyped or stale URL is a 404, not a failure — there is nothing to retry,
  // so this is an EmptyState with a way out rather than an ErrorState.
  if (!product) {
    return (
      <Container width="app" className="py-8 lg:py-12">
        <h1 className="sr-only-ds">Product not found</h1>
        <div className="rounded-xl border border-edge bg-surface">
          <EmptyState
            icon={Icon.empty}
            title="We could not find that product"
            body="The link may be out of date, or the product may have been withdrawn from the catalogue."
            action={
              <Button as={Link} to="/products" iconLeft={Icon.arrowLeft}>
                Back to all products
              </Button>
            }
          />
        </div>
      </Container>
    );
  }

  const category = categories.find((c) => c.slug === product.categorySlug);
  const stockKey = stockStatusOf(product.stock, product.lowStockAt);

  // deriveCatalogue drops non-active products before anything else, so the only way
  // to reach one is by typing the URL. Render it — a withdrawn product's
  // specification is still the honest answer to "what was this?" — but say so at the
  // top and take the buy control away, rather than 404ing a URL that did work.
  const discontinued = product.status !== 'active';

  // Same category, still sellable, not this one. Capped at four so the row is one
  // grid line at xl and does not turn the page into a second catalogue.
  const related = allProducts
    .filter((p) => p.status === 'active' && p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return (
    <Container width="app" className="py-6 lg:py-8">
      {/* The category crumb goes to the filtered catalogue rather than to a /c/:slug
          route: /products?cat= is the URL the v1.0 shop actually serves, and the
          facet state it lands on is the one the header and footer link to. */}
      <Breadcrumb
        as={Link}
        items={[
          { label: 'All products', href: '/products' },
          ...(category ? [{ label: category.name, href: `/products?cat=${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      {discontinued && (
        <Alert tone="warning" title="This product is no longer available" className="mt-6">
          It has been withdrawn from the catalogue and cannot be ordered. The specification below is
          kept for reference.
        </Alert>
      )}

      {/* ---- Hero ---------------------------------------------------------- */}
      {/* Equal columns and the catalogue's own 4/3 ratio. A square image in a wider
          column renders ~640px tall on a laptop, which pushes the price and the
          stepper — the two things a buyer came for — under the fold, and leaves the
          buy box floating against 300px of dead space. */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0">
          <ProductImage
            src={product.image}
            alt={product.name}
            code={product.code}
            icon={Icon[product.icon] ?? Icon.products}
            className="rounded-xl border border-edge"
          />
        </div>

        <div className="min-w-0">
          {/* Sticky only from lg. Below it the buy box is simply the next thing in the
              scroll, and a sticky element in a single column fights the page. */}
          <div className="lg:sticky lg:top-24">
            <p className="type-caption tabular text-fg-muted">{product.code}</p>
            <h1 className="type-h2 mt-1 text-fg">{product.name}</h1>
            <p className="type-body mt-3 text-fg-secondary">{product.summary}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge kind="stock" value={stockKey} />
              {product.sterile && (
                <Badge tone="brand" icon={Icon.verified}>
                  Sterile
                </Badge>
              )}
              {product.latexFree && <Badge>Latex-free</Badge>}
              <Badge>GST {product.gst}%</Badge>
            </div>

            <Card className="mt-6">
              <PriceBlock product={product} />
              <Divider className="my-4" />
              <StockMeter stock={product.stock} lowStockAt={product.lowStockAt} />
              <div className="mt-5">
                {discontinued ? (
                  <Button as={Link} to="/products" variant="secondary" fullWidth iconLeft={Icon.arrowLeft}>
                    Browse the catalogue
                  </Button>
                ) : (
                  // compact: the buy box is a narrow column, so the stepper and button
                  // go full-width instead of right-aligning against nothing.
                  <AddToOrder product={product} compact />
                )}
              </div>
            </Card>

            <p className="type-caption mt-4 text-fg-muted">
              Need a different pack size or a bulk price?{' '}
              <Link
                to={`/support?product=${encodeURIComponent(product.code)}&topic=quote`}
                className="font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                Request a quote
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* ---- Detail -------------------------------------------------------- */}
      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-10 lg:col-span-2">
          <Block title="Key specifications">
            <SpecTable specs={product.specs} />
          </Block>

          <Block title="Applications">
            <FeatureList items={product.applications} />
          </Block>
        </div>

        <div className="min-w-0 space-y-10">
          <Block title="Ordering">
            <DescriptionList
              items={[
                { label: 'Product code', value: product.code },
                { label: 'HSN code', value: product.hsn },
                { label: 'Category', value: category?.name ?? product.category },
                { label: 'Sub-category', value: product.subCategory },
                { label: 'Unit of measure', value: product.uom },
                { label: 'Pack size', value: product.packSize },
                {
                  label: 'Minimum order',
                  value: `${formatQty(product.moq)} ${product.uom.toLowerCase()}`,
                },
                { label: 'Unit price', value: `${formatINR(product.price)} excl. GST` },
              ]}
            />
          </Block>

          <Block title="Documents">
            {/* ponytail: the fixture lists document names, not URLs, so these are
                inert by design — same as the catalogue's Quick View. Give them real
                hrefs the moment the API serves them. */}
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
          </Block>
        </div>
      </div>

      {/* ---- Related ------------------------------------------------------- */}
      {related.length > 0 && (
        <>
          <Divider className="mt-12 lg:mt-16" />
          <Block title={`More in ${category?.name ?? product.category}`} className="mt-10">
            <ProductGrid>
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  price
                  // A navigation, not a drawer: this page IS the detail view, and
                  // opening a Quick View on top of it would show the same
                  // information in a smaller box.
                  onView={() => navigate(`/p/${slugOf(p)}`)}
                />
              ))}
            </ProductGrid>
          </Block>
        </>
      )}
    </Container>
  );
}

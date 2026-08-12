import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import CatalogueControls from '../components/CatalogueControls';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ProductResults, { ResultsSkeleton } from '../components/ProductResults';
import usePageTitle from '../components/usePageTitle';
import useCatalogue from '../lib/useCatalogue';
import useFetch from '../lib/useFetch';

const chipClass = (active) =>
  `inline-flex min-h-11 items-center rounded-pill border px-4 text-sm font-medium transition-colors duration-150 ${
    active
      ? 'border-blue-700 bg-blue-700 text-white'
      : 'border-line bg-card text-ink hover:bg-blue-100'
  }`;

export default function Category() {
  const { categorySlug, subSlug } = useParams();
  const cat = useCatalogue();

  const cats = useFetch('/categories');
  const category = cats.data?.find((c) => c.slug === categorySlug);
  const sub = subSlug && category?.subcategories?.find((s) => s.slug === subSlug);

  // Wait for the tree before asking for products, so an unknown slug never fires a query.
  const known = category && (!subSlug || sub);
  const query = subSlug
    ? `category=${categorySlug}&subcategory=${subSlug}`
    : `category=${categorySlug}`;
  const products = useFetch(known ? `/products?${query}&sort=${cat.sort}` : null);
  const results = cat.results(products.data?.items);

  usePageTitle(sub?.name || category?.name);

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb
        trail={[
          { label: 'Home', to: '/' },
          { label: 'All products', to: '/products' },
          { label: category?.name || categorySlug, to: `/c/${categorySlug}` },
          ...(sub ? [{ label: sub.name }] : []),
        ]}
      />

      {/* An unknown slug gets a sentence, not the raw slug echoed back as a page title. */}
      <h1 className="mt-3 text-3xl">
        {cats.loading || known ? sub?.name || category?.name || ' ' : 'Category not found'}
      </h1>

      {cats.error && <ErrorState message={cats.error} onRetry={cats.retry} />}

      {!cats.loading && !cats.error && !known && (
        <EmptyState
          message={`We could not find the category "${subSlug || categorySlug}". It may have been renamed or removed.`}
          actionLabel="Browse the full catalogue"
          actionTo="/products"
        />
      )}

      {known && (
        <>
          {category.subcategories?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {category.subcategories.map((s) => (
                <Link
                  key={s._id || s.slug}
                  to={`/c/${categorySlug}/${s.slug}`}
                  aria-current={s.slug === subSlug ? 'page' : undefined}
                  className={chipClass(s.slug === subSlug)}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <CatalogueControls
              {...cat}
              {...results}
              loading={products.loading}
              error={Boolean(products.error)}
            />
          </div>

          <div className="mt-6">
            {products.loading && <ResultsSkeleton view={cat.view} />}
            {products.error && <ErrorState message={products.error} onRetry={products.retry} />}
            {!products.loading && !products.error && results.items.length === 0 && (
              <EmptyState
                message={
                  results.filtered
                    ? 'Nothing here matches those filters.'
                    : 'Nothing is listed here yet. Try another subcategory.'
                }
                actionLabel={results.filtered ? 'Clear filters' : 'Browse the full catalogue'}
                actionTo={results.filtered ? undefined : '/products'}
                onAction={cat.clear}
              />
            )}
            {!products.loading && !products.error && results.items.length > 0 && (
              <ProductResults items={results.items} view={cat.view} />
            )}
          </div>
        </>
      )}
    </Container>
  );
}

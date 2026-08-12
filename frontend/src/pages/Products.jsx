import CatalogueControls from '../components/CatalogueControls';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ProductResults, { ResultsSkeleton } from '../components/ProductResults';
import usePageTitle from '../components/usePageTitle';
import useCatalogue from '../lib/useCatalogue';
import useFetch from '../lib/useFetch';

/**
 * The whole catalogue, unfiltered by category.
 *
 * The footer said "All products" and pointed at /search, which with no query renders a prompt
 * to use a search field that is not on screen on a phone. The search empty state offered
 * "Browse the full catalogue" and went to the home page. The home CTA carried a comment
 * admitting there was no all-products route to send anyone to. This is that route.
 */
export default function Products() {
  const cat = useCatalogue();
  const { data, loading, error, retry } = useFetch(`/products?sort=${cat.sort}`);
  const results = cat.results(data?.items);
  usePageTitle('All products');

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">All products</h1>
      <p className="mt-2 max-w-prose text-base text-ink-muted">
        Every line we stock. Trade prices, exclusive of GST, dispatched in 24–48 hours.
      </p>

      <div className="mt-6">
        <CatalogueControls {...cat} {...results} loading={loading} error={Boolean(error)} />
      </div>

      <div className="mt-6">
        {loading && <ResultsSkeleton view={cat.view} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && results.items.length === 0 && (
          <EmptyState
            message={
              results.filtered
                ? 'Nothing matches those filters. Clear them to see the rest of the catalogue.'
                : 'No products are listed yet.'
            }
            actionLabel={results.filtered ? 'Clear filters' : undefined}
            onAction={cat.clear}
          />
        )}
        {!loading && !error && results.items.length > 0 && (
          <ProductResults items={results.items} view={cat.view} />
        )}
      </div>
    </Container>
  );
}

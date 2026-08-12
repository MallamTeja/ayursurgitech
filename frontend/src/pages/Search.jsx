import { useSearchParams } from 'react-router-dom';
import CatalogueControls from '../components/CatalogueControls';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ProductResults, { ResultsSkeleton } from '../components/ProductResults';
import usePageTitle from '../components/usePageTitle';
import { SearchIcon } from '../components/icons';
import useCatalogue from '../lib/useCatalogue';
import useFetch from '../lib/useFetch';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  usePageTitle(q ? `Results for “${q}”` : 'Search');

  const cat = useCatalogue();

  // No term, no request. Passing null keeps the hook order stable without fetching.
  const { data, loading, error, retry } = useFetch(
    q ? `/products?q=${encodeURIComponent(q)}&sort=${cat.sort}` : null,
  );
  const results = cat.results(data?.items);

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">{q ? `Results for “${q}”` : 'Search'}</h1>

      {!q && (
        <EmptyState
          icon={<SearchIcon className="size-8" />}
          message="Type a product name, a brand or a pack size in the search field above."
          actionLabel="Browse the full catalogue"
          actionTo="/products"
        />
      )}

      {q && (
        <>
          {/* The controls carry the count. Rendering "0 products" above a "Nothing matches"
              empty state says it twice, so they are suppressed together. */}
          {!loading && !error && results.items.length === 0 ? null : (
            <div className="mt-6">
              <CatalogueControls {...cat} {...results} loading={loading} error={Boolean(error)} />
            </div>
          )}

          <div className="mt-6">
            {loading && <ResultsSkeleton view={cat.view} />}
            {error && <ErrorState message={error} onRetry={retry} />}
            {!loading && !error && results.items.length === 0 && (
              <EmptyState
                icon={<SearchIcon className="size-8" />}
                message={
                  results.filtered
                    ? `Nothing matching “${q}” is left after those filters.`
                    : `Nothing matches “${q}”. Check the spelling, or try a broader term such as the product type on its own.`
                }
                actionLabel={results.filtered ? 'Clear filters' : 'Browse the full catalogue'}
                actionTo={results.filtered ? undefined : '/products'}
                onAction={cat.clear}
              />
            )}
            {!loading && !error && results.items.length > 0 && (
              <ProductResults items={results.items} view={cat.view} />
            )}
          </div>
        </>
      )}
    </Container>
  );
}

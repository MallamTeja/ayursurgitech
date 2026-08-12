import ProductGrid, { GridSkeleton } from './ProductGrid';
import ProductList from './ProductList';
import Skeleton from './Skeleton';

/** Grid or rows, decided by useCatalogue's `view`. Three pages render products; none of them
 *  should have to know which layouts exist. */
export default function ProductResults({ items, view }) {
  return view === 'list' ? <ProductList items={items} /> : <ProductGrid items={items} />;
}

/** Skeletons in the shape of whichever view is about to arrive. */
export function ResultsSkeleton({ view, count = 8 }) {
  if (view !== 'list') return <GridSkeleton count={count} />;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line p-4 last:border-0">
          <Skeleton className="size-16 shrink-0" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="ml-auto h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

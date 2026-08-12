import ProductCard from './ProductCard';
import Skeleton from './Skeleton';

// 2 columns at 390px, 3 at md, 4 at lg. Surgical buyers scan a catalogue.
const GRID = 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4';

export default function ProductGrid({ items }) {
  return (
    <div className={GRID}>
      {items.map((p) => (
        <ProductCard key={p._id || p.slug} product={p} />
      ))}
    </div>
  );
}

/** Skeletons in the real grid's shape, never a spinner on a blank page. */
export function GridSkeleton({ count = 8 }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card border border-line bg-card">
          <Skeleton className="aspect-square w-full" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2 h-6 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

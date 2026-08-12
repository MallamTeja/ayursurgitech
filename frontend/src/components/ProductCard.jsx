import { Link } from 'react-router-dom';
import Badge from './Badge';
import Mrp from './Mrp';
import Price from './Price';
import Rating from './Rating';
import StockBadge from './StockBadge';
import { PackageIcon } from './icons';

// Out-of-stock products stay visible and browsable. They are not hidden.
export default function ProductCard({ product }) {
  const { slug, name, brand, images, image, price, mrp, gstRate } = product;
  const { ratingAvg, ratingCount, stockQty, minOrderQty } = product;
  const src = image || images?.[0];

  return (
    <Link
      to={`/p/${slug}`}
      className="group flex flex-col rounded-card border border-line bg-card transition-shadow duration-150 hover:shadow-lift"
    >
      {/* Contain, never cover: shot on white, and cropping cuts the instrument in half. */}
      <div className="flex aspect-square items-center justify-center border-b border-line bg-white p-3">
        {src ? (
          <img src={src} alt={name} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <PackageIcon className="size-10 text-line" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {brand && (
          <span className="text-xs uppercase tracking-label text-ink-muted">{brand}</span>
        )}
        {/* ponytail: deliberately NOT line-clamped. At 390px a two-column card runs the name
            to three or four lines, so clamping at two deletes the pack size — the number the
            clamp rule exists to protect. Inter, not Fraunces: the display face is for headings. */}
        <h3 className="font-sans text-lg font-medium text-ink group-hover:text-blue-500">
          {name}
        </h3>

        {ratingCount > 0 && <Rating value={ratingAvg} count={ratingCount} />}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
          <Price paise={price} gst={gstRate !== 0} className="text-lg" />
          <Mrp price={price} mrp={mrp} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StockBadge stockQty={stockQty} />
          {/* A count only when it is nearly gone. Above that the badge says enough. */}
          {stockQty > 0 && stockQty <= 10 && (
            <span className="text-xs text-ink-muted">Only {stockQty} left</span>
          )}
          {/* Suppressed at 1: a "Min 1" badge on every card trains people to ignore badges. */}
          {minOrderQty > 1 && <Badge tone="muted">Min {minOrderQty}</Badge>}
        </div>
      </div>
    </Link>
  );
}

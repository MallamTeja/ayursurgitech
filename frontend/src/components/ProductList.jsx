import { Link } from 'react-router-dom';
import Mrp from './Mrp';
import Price from './Price';
import Rating from './Rating';
import StockBadge from './StockBadge';
import { PackageIcon } from './icons';

/**
 * The catalogue as rows. A buyer comparing thirty SKUs on price, minimum order and stock is
 * reading a column, not browsing cards — this is the view that lets them.
 *
 * No header row on purpose. Fixed-width cells under a header align beautifully at 1440 and
 * fall apart at 390, where the header has scrolled away from the row it labels. Each cell
 * carries its own label instead, which is the same spec-band device the product page uses and
 * survives being wrapped onto two lines.
 */

function Spec({ label, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-label text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm tabular-nums text-ink">{children}</dd>
    </div>
  );
}

function Row({ product }) {
  const { slug, name, brand, images, image, price, mrp, gstRate } = product;
  const { ratingAvg, ratingCount, stockQty, minOrderQty } = product;
  const src = image || images?.[0];
  const inStock = Number(stockQty) > 0;

  return (
    <li className="border-b border-line last:border-0">
      <Link
        to={`/p/${slug}`}
        className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 p-4 transition-colors duration-150 hover:bg-shade md:grid-cols-[4rem_minmax(0,1fr)_auto] md:items-center"
      >
        <span className="flex aspect-square items-center justify-center rounded-control border border-line bg-white p-1">
          {src ? (
            <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
          ) : (
            <PackageIcon className="size-6 text-line" />
          )}
        </span>

        <div className="min-w-0">
          {brand && (
            <span className="text-xs uppercase tracking-label text-ink-muted">{brand}</span>
          )}
          <h3 className="font-sans text-base font-medium text-ink group-hover:text-blue-500">
            {name}
          </h3>
          {ratingCount > 0 && <Rating value={ratingAvg} count={ratingCount} className="mt-1" />}
        </div>

        {/* Spans both columns on a phone and wraps; becomes the third column from md, where
            the fixed widths line the numbers up down the page. */}
        <dl className="col-span-2 flex flex-wrap items-start gap-x-6 gap-y-3 md:col-span-1 md:flex-nowrap md:justify-end">
          <Spec label="Min order" className="w-20">
            {minOrderQty || 1}
          </Spec>
          <Spec label="Stock" className="w-24">
            {inStock ? stockQty : <StockBadge stockQty={0} />}
          </Spec>
          <Spec label="GST" className="w-14">
            {gstRate}%
          </Spec>
          <div className="w-32 text-right">
            <Price paise={price} gst={gstRate !== 0} className="text-lg" />
            <div className="mt-1">
              <Mrp price={price} mrp={mrp} />
            </div>
          </div>
        </dl>
      </Link>
    </li>
  );
}

export default function ProductList({ items }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <ul>
        {items.map((p) => (
          <Row key={p._id || p.slug} product={p} />
        ))}
      </ul>
    </div>
  );
}

// Product presentation — §15, §16, §22, and §32 Rules 8 and 11.
//
// "The product itself is the hero" (§1) and "the actual medical product should
// receive visual priority" (§32 Rule 11) are the two sentences this file answers
// to. The card gives the image 4:3 of the space and everything else the minimum.
//
// §15 fixes the card's contents exactly:
//     image → CATEGORY → name → product code → [ View Details ]
// and §32 Rule 8 forbids adding to it. So specifications, applications, HSN, GST
// slab and stock counts are not here — they are on the detail page, which §16
// lays out. The card's job is to be chosen from, not read.

import { Icon } from '../icons.jsx';
import { formatINR, formatQty } from '../format.js';
import { cx } from '../utils.js';
import { Badge, StatusBadge, stockStatusOf } from './Badge.jsx';
import { Button } from './Button.jsx';

/* -------------------------------------------------------------------------- */
/* ProductImage                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The product image, and — until there is real photography — its placeholder.
 *
 * §22 ranks actual Ayursurgi product photography first and explicitly rejects
 * generic stock imagery, so this system ships no photographs rather than the
 * wrong ones. The placeholder is deliberately a placeholder: it holds the exact
 * aspect ratio and position the real photo will occupy, so dropping photography in
 * later changes no layout, and it shows the category glyph and the product code
 * so the card is still identifiable without it.
 *
 * It doubles as the missing-image state the catalogue needs permanently — a
 * product added by an admin before its photo is ready lands here.
 */
export function ProductImage({ src, alt, code, icon: Glyph = Icon.products, ratio = 'card', className }) {
  const RATIO = { card: 'aspect-[4/3]', square: 'aspect-square', wide: 'aspect-[16/9]' };

  if (src) {
    return (
      <div className={cx('overflow-hidden bg-surface-2', RATIO[ratio], className)}>
        {/* object-contain, not cover: a cropped infusion set is a misleading
            product photo. Letterboxing on surface-2 is the honest option. */}
        <img src={src} alt={alt} loading="lazy" className="size-full object-contain" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt ? `${alt} — photograph pending` : 'Product photograph pending'}
      className={cx(
        'grid place-items-center gap-2 border-b border-edge bg-surface-2 text-center',
        RATIO[ratio],
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1.5">
        <Glyph size={32} className="text-brand-500" aria-hidden="true" />
        {code && <span className="type-caption tabular text-fg-muted">{code}</span>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ProductCard — §15                                                          */
/* -------------------------------------------------------------------------- */

/**
 * `variant="grid"` is §15's card. `variant="row"` is the same information in a
 * horizontal band, for search results and dense catalogue listings where a grid
 * of images wastes the screen.
 *
 * ABOUT `price`. §15's card has no price on it, and Overview §44 question 25 asks
 * the client whether prices are publicly visible at all — an open question with
 * two different answers for a logged-out visitor and a hospital with negotiated
 * rates. So price is optional here and the card is correct with or without it.
 * When the answer arrives, this prop is the only thing that changes.
 *
 * `stock` is likewise optional and off in the public catalogue: §32 Rule 8 says do
 * not overload the card, and a stock figure is an operations concern that only
 * matters once someone is actually ordering.
 */
/**
 * `action` replaces the default View Details button.
 *
 * §15 gives the card one action and §32 Rule 8 forbids piling more on, and that is
 * right for the browsing grid — buying a medical device off a thumbnail without
 * reading the specification is a clinical risk, not a conversion win. But a buyer
 * reordering 500 sets they have bought monthly for two years is not browsing, and
 * making them open a detail page is friction with nothing on the other side of it.
 *
 * So the slot exists and the shop uses it in one place only: the list view, where
 * it supplies a quantity stepper and Add to Order. View mode maps to intent — grid
 * for discovery, list for procurement — and the §15 card stays exactly §15's card.
 */
export function ProductCard({ product, variant = 'grid', price = false, stock = false, onView, action, className }) {
  const { name, code, category, summary, icon, image, moq, uom, packSize } = product;
  const stockKey = stockStatusOf(product.stock, product.lowStockAt);

  if (variant === 'row') {
    return (
      <article
        className={cx(
          'group flex gap-4 rounded-xl border border-edge bg-surface p-4 transition-[box-shadow,border-color] hover:border-edge-strong hover:shadow-e1',
          className,
        )}
      >
        <ProductImage
          src={image}
          alt={name}
          code={code}
          icon={Icon[icon] ?? Icon.products}
          ratio="square"
          className="w-24 shrink-0 rounded-lg border border-edge sm:w-28"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label text-brand-700">{category}</p>
          <h3 className="type-body font-semibold leading-snug text-fg">{name}</h3>
          {summary && <p className="type-body-sm line-clamp-2 text-fg-secondary">{summary}</p>}
          <p className="type-caption tabular mt-auto pt-1 text-fg-secondary">Product Code: {code}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between gap-3">
          {price && <PriceBlock product={product} align="right" compact />}
          {stock && <StatusBadge kind="stock" value={stockKey} size="sm" />}
          {action ?? (
            <Button size="sm" variant="secondary" onClick={onView}>
              View Details
            </Button>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cx(
        'group flex flex-col overflow-hidden rounded-xl border border-edge bg-surface transition-[box-shadow,border-color] duration-150 hover:border-edge-strong hover:shadow-e1',
        className,
      )}
    >
      <ProductImage src={image} alt={name} code={code} icon={Icon[icon] ?? Icon.products} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* §15's uppercase category line. */}
        <p className="type-label text-brand-700">{category}</p>

        {/* The product name is the second-loudest thing after the image, and it
            wraps rather than truncates — a truncated medical device name can name
            a different device. */}
        <h3 className="type-body font-semibold leading-snug text-fg">{name}</h3>

        {price && <PriceBlock product={product} className="mt-1" />}

        <p className="type-caption tabular mt-auto pt-2 text-fg-secondary">Product Code: {code}</p>

        {(moq > 1 || stock) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {moq > 1 && (
              <Badge size="sm" tone="neutral">
                MOQ {formatQty(moq)} {uom?.toLowerCase()}
              </Badge>
            )}
            {packSize && (
              <Badge size="sm" tone="neutral">
                {packSize}
              </Badge>
            )}
            {stock && <StatusBadge kind="stock" value={stockKey} size="sm" />}
          </div>
        )}

        {/* §15 puts a single action on the card. Secondary, not primary: the page
            has one primary action and it is not "look at one of forty products". */}
        <div className="mt-3">
          {action ?? (
            <Button variant="secondary" size="sm" fullWidth onClick={onView}>
              View Details
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Price, with MRP and the GST position stated.
 *
 * The GST line is not decoration. A B2B buyer approving a purchase needs to know
 * whether the figure they are looking at includes tax, and "₹42.50" alone does not
 * say. Exclusive-of-tax is the B2B convention, so the card says so out loud.
 */
export function PriceBlock({ product, align = 'left', compact = false, className }) {
  const { price, mrp, gst, uom } = product;
  const saving = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className={cx('min-w-0', align === 'right' && 'text-right', className)}>
      <div className={cx('flex flex-wrap items-baseline gap-x-2', align === 'right' && 'justify-end')}>
        <span className="type-h4 tabular text-fg">{formatINR(price)}</span>
        {uom && <span className="type-caption text-fg-secondary">/ {uom.toLowerCase()}</span>}
      </div>
      {!compact && (
        <div className={cx('mt-0.5 flex flex-wrap items-baseline gap-x-2', align === 'right' && 'justify-end')}>
          {mrp > price && (
            <>
              <span className="type-caption tabular text-fg-muted line-through">{formatINR(mrp)}</span>
              <span className="type-caption font-semibold text-success-700">{saving}% off</span>
            </>
          )}
        </div>
      )}
      {gst != null && <p className="type-caption mt-0.5 text-fg-secondary">+ {gst}% GST</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CategoryTile — §11.1                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The category row from §11.1's customer-portal sketch. A glyph, a name, a count.
 *
 * The whole tile is one link rather than a card containing a link — a category
 * tile has exactly one destination, so splitting it into a clickable surface and a
 * clickable label would give the same target two tab stops.
 */
export function CategoryTile({ name, count, icon: Glyph = Icon.products, as: As = 'a', className, ...rest }) {
  return (
    <As
      className={cx(
        'group flex items-center gap-3 rounded-xl border border-edge bg-surface p-4 transition-[box-shadow,border-color] duration-150 hover:border-brand-500 hover:shadow-e1',
        className,
      )}
      {...rest}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
        <Glyph size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-body-sm block truncate font-semibold text-fg">{name}</span>
        {count != null && <span className="type-caption tabular text-fg-secondary">{formatQty(count)} products</span>}
      </span>
      <Icon.chevronRight size={16} className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5" />
    </As>
  );
}

/**
 * A grid of product cards with the §8 gutter and the §23 column counts already
 * decided, so two catalogue screens cannot disagree about them.
 */
export function ProductGrid({ className, children }) {
  return (
    <div className={cx('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>{children}</div>
  );
}

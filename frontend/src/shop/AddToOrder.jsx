// The one add-to-cart control for the v1.0 shop.
//
// It was defined inside ProductsPage.jsx while the catalogue was the only page that
// could add to a cart. /p/:slug needs the identical behaviour, and the part that
// must not fork is `toCartLine`: the cart, the checkout and cart-reconcile.js all
// read that shape, so two copies drifting by one field is a silent pricing or
// stock-check bug rather than a visible one. One definition, two callers.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Icon,
  QuantityStepper,
  Tooltip,
  cx,
  formatQty,
  useToast,
} from '../components/DesignSystem';
import { useCart } from '../lib/cart';
import { slugOf } from './catalogue.js';

/** dummy.js speaks the design system's shape; the cart speaks the API's. */
export const toCartLine = (product) => ({
  productId: product.id,
  slug: slugOf(product),
  name: product.name,
  image: product.image ?? '',
  price: product.price,
  gstRate: product.gst,
  minOrderQty: product.moq,
  stockQty: product.stock,
});

/**
 * The procurement control: a stepper stepping in MOQ multiples, and the button.
 *
 * Out of stock disables the button rather than hiding it. Hiding leaves a gap where
 * an action was and makes the row look broken; a disabled button with the reason
 * beside it answers the question the buyer is about to ask. §4 — the reason is
 * words, not a colour.
 */
export default function AddToOrder({ product, compact = false }) {
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

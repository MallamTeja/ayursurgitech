import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from './api';
import { useCart } from './cart';

/**
 * Put a past order back in the cart.
 *
 * An order line is a SNAPSHOT — name, unit price, qty, HSN, taken when the order was placed.
 * It carries no slug, no stock and no minimum, so a cart line cannot be built from it: the
 * link would go nowhere and the quantity would be checked against a stock figure from weeks
 * ago. Every line is therefore matched by productId against the live catalogue, and what goes
 * in the cart is today's price, today's minimum and today's stock.
 *
 * Anything that cannot be re-added is named rather than dropped quietly. A reorder that
 * silently returns four of five lines is how someone under-orders without noticing.
 */
export default function useReorder() {
  const { add } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  const dismiss = () => setReport(null);

  async function reorder(order) {
    setBusy(true);
    setReport(null);
    try {
      const { items } = await get('/products');
      const byId = new Map(items.map((p) => [p._id, p]));

      const skipped = [];
      const adjusted = [];
      const queued = [];

      for (const line of order.items) {
        const product = byId.get(line.productId);
        if (!product) {
          skipped.push({ name: line.name, reason: 'no longer in the catalogue' });
          continue;
        }
        if (Number(product.stockQty) <= 0) {
          skipped.push({ name: product.name, reason: 'out of stock' });
          continue;
        }

        // Both bounds can have moved since the order: an admin can raise a minimum and stock
        // can fall. Clamp between them and say so rather than adding a quantity that checkout
        // would reject.
        const min = product.minOrderQty || 1;
        const qty = Math.min(Math.max(line.qty, min), product.stockQty);
        if (qty !== line.qty) {
          adjusted.push({
            name: product.name,
            from: line.qty,
            to: qty,
            reason: qty > line.qty ? `minimum order is now ${min}` : `only ${product.stockQty} left`,
          });
        }
        queued.push({ product, qty });
      }

      queued.forEach(({ product, qty }) => add(product, qty));

      // Nothing to report means nothing to read: go straight to the cart. The interruption is
      // reserved for the case where a line actually changed.
      if (queued.length > 0 && skipped.length === 0 && adjusted.length === 0) {
        navigate('/cart');
        return;
      }
      setReport({ added: queued.length, skipped, adjusted });
    } catch (err) {
      setReport({ error: err.message });
    } finally {
      setBusy(false);
    }
  }

  return { reorder, busy, report, dismiss };
}

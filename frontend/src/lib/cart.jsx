import { createContext, useContext, useEffect, useState } from 'react';

const CART_KEY = 'ast.cart';
const CartContext = createContext(null);

// Never exceed what is on the shelf. stockQty > 0 is the only stock truth.
const capToStock = (qty, stockQty) => (stockQty > 0 ? Math.min(qty, stockQty) : qty);

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  // Persisted on every change, so the cart survives a refresh.
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines]);

  // ponytail: cart prices are a display cache. Checkout reprices server-side.
  function add(product, qty = product.minOrderQty || 1) {
    const productId = product.productId || product._id;
    setLines((prev) => {
      if (prev.some((l) => l.productId === productId)) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: capToStock(l.qty + qty, l.stockQty) } : l,
        );
      }
      return [
        ...prev,
        {
          productId,
          // The cart links each line to /p/:slug, and there is no lookup by id.
          slug: product.slug,
          name: product.name,
          image: product.image || product.images?.[0] || '',
          price: product.price,
          gstRate: product.gstRate,
          minOrderQty: product.minOrderQty || 1,
          stockQty: product.stockQty ?? 0,
          qty: capToStock(qty, product.stockQty ?? 0),
        },
      ];
    });
  }

  const value = {
    lines,
    add,
    setQty: (productId, qty) =>
      setLines((prev) =>
        prev.map((l) =>
          l.productId === productId ? { ...l, qty: capToStock(Math.max(1, qty), l.stockQty) } : l,
        ),
      ),
    remove: (productId) => setLines((prev) => prev.filter((l) => l.productId !== productId)),

    /**
     * Overwrite fields on one stored line, with no clamping.
     *
     * setQty deliberately caps against the line's *stored* stockQty, which is the
     * right rule while shopping and the wrong one when reconciling: if the
     * warehouse has been restocked since the line was added, the stale cap makes
     * the correct quantity unreachable. The cart page (shop/CartPage.jsx) uses
     * this to write the live catalogue figures back over the photograph taken
     * when the product was added. Nothing else should.
     */
    patch: (productId, changes) =>
      setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...changes } : l))),

    /** Remove several lines in one commit, so a "remove all unavailable" is one undo. */
    removeMany: (productIds) =>
      setLines((prev) => prev.filter((l) => !productIds.includes(l.productId))),

    /** Put a removed line back exactly where it was — the undo behind the toast. */
    restore: (line, index) =>
      setLines((prev) => {
        if (prev.some((l) => l.productId === line.productId)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, line);
        return next;
      }),

    clear: () => setLines([]),
    // ponytail: count is distinct products, not total pieces — minOrderQty of 100 makes a
    // pile of pieces meaningless in a header pill.
    count: lines.length,
    subtotal: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart needs a CartProvider above it.');
  return ctx;
}

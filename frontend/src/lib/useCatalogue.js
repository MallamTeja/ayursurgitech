import { useState } from 'react';

/**
 * The state behind every list of products — /products, a category, a search result.
 * Three screens needed the same sort, the same filters and the same view switch, so it lives
 * here once and each of them spreads the result into <CatalogueControls>.
 *
 * Sort is a SERVER concern: the caller puts `sort` into its own fetch URL, because re-ordering
 * a list the server already ordered is how the two come to disagree. Filters are a CLIENT
 * concern: GET /products is unpaginated and the whole list is already in hand, so filtering it
 * here costs one pass and saves a round trip.
 */

export const SORTS = [
  ['newest', 'Newest'],
  ['priceAsc', 'Price low to high'],
  ['priceDesc', 'Price high to low'],
  ['nameAsc', 'Name A–Z'],
  ['rating', 'Rating'],
];

const VIEW_KEY = 'ast.view';

// Grid or rows is a working preference, not a per-page one: a buyer who switches to rows on
// one category expects rows on the next.
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

export default function useCatalogue() {
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [brand, setBrand] = useState('');
  const [view, setViewState] = useState(readView);

  const setView = (next) => {
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Private mode. The preference just does not survive the tab.
    }
    setViewState(next);
  };

  /**
   * Derive the visible list. A plain function rather than a useMemo, because it has to run
   * AFTER the fetch whose URL carries `sort` — and a hook cannot be called in that position.
   * It is one pass over a list that is already in memory.
   */
  function results(items) {
    const list = items || [];

    // Brands come from the UNFILTERED list, so picking one never empties the brand menu.
    const brands = [...new Set(list.map((p) => p.brand).filter(Boolean))].sort();

    // A brand chosen on one category does not exist on the next, and a filter that matches
    // nothing reads as an empty catalogue rather than a stale control. Ignore it instead.
    const activeBrand = brands.includes(brand) ? brand : '';

    const visible = list.filter(
      (p) => (!inStockOnly || Number(p.stockQty) > 0) && (!activeBrand || p.brand === activeBrand),
    );

    return {
      items: visible,
      /** What arrived before filtering, so the count can say "18 of 44". */
      total: list.length,
      brands,
      brand: activeBrand,
      filtered: inStockOnly || Boolean(activeBrand),
    };
  }

  return {
    sort,
    setSort,
    brand,
    setBrand,
    inStockOnly,
    setInStockOnly,
    view,
    setView,
    clear: () => {
      setInStockOnly(false);
      setBrand('');
    },
    results,
  };
}

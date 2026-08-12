// Catalogue filtering, sorting and facet counting. Pure functions, no React.
//
// Kept separate from the hook and the page so the awkward parts — sanitising a
// hostile URL, counting facets correctly — can be reasoned about (and tested)
// without rendering anything.
//
// THE FACET COUNTING RULE, which is the whole reason this file exists.
// A facet's option counts must be computed against the list filtered by every
// OTHER facet, but not by its own. Get this wrong in either direction and the
// sidebar lies:
//
//   Count against nothing        → "Stop Cocks 11" while a price filter that
//                                  excludes all of them is active. Click it, get
//                                  an empty page.
//   Count against everything     → select "I.V. Infusion" and every other
//                                  category reads 0, so the catalogue looks like
//                                  it has one category and the filter cannot be
//                                  widened.
//
// Counting per-facet with that facet excluded is what makes "Extension Lines 9"
// mean "nine more results if you add this", which is the only useful reading.

import { stockStatusOf } from '../components/DesignSystem';

export const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'nameAsc', label: 'Name A–Z' },
  { value: 'nameDesc', label: 'Name Z–A' },
  { value: 'priceAsc', label: 'Price low to high' },
  { value: 'priceDesc', label: 'Price high to low' },
  { value: 'stockDesc', label: 'Availability' },
];

export const PER_PAGE = [12, 24, 48];

export const AVAILABILITY = [
  { value: 'inStock', label: 'In stock' },
  { value: 'lowStock', label: 'Low stock' },
  { value: 'outOfStock', label: 'Out of stock' },
];

// Only properties that exist on every product in the catalogue. A facet whose
// underlying field is missing from half the data reports "false" for those and
// quietly under-reports — worse than not offering the filter at all.
export const PROPERTIES = [
  { value: 'sterile', label: 'Sterile' },
  { value: 'latexFree', label: 'Latex-free' },
];

// B2B-specific: a clinic that cannot take 200 pieces needs to filter by the
// commitment, not just the price. Overview §44 q23–24 asks the client whether MOQ
// applies at all; these buckets are a guess that costs nothing to change.
export const MOQ_BUCKETS = [
  { value: '25', label: 'Up to 25 pieces' },
  { value: '50', label: 'Up to 50 pieces' },
  { value: '100', label: 'Up to 100 pieces' },
];

/** A URL-safe slug for a product. dummy.js has no slug field; ids are stable. */
export const slugOf = (product) => product.id.replace(/^p-/, '');

/* -------------------------------------------------------------------------- */
/* Sanitising the query                                                       */
/* -------------------------------------------------------------------------- */

const asList = (raw, allowed) =>
  String(raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && allowed.includes(s));

const asInt = (raw, fallback = null) => {
  const n = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * Turn URLSearchParams into a state object that is always internally valid.
 *
 * Every unknown value is dropped rather than honoured. That matters more than it
 * sounds: a bookmarked `?cat=surgical-gloves` from before a taxonomy rename would
 * otherwise filter the catalogue down to nothing, and an empty catalogue reads as
 * "this company sells nothing", not as "your link is stale".
 *
 * The one thing NOT silently dropped is an inverted price range. min above max is
 * a mistake the user just made in front of us, so it is surfaced as an error on
 * the field instead of being quietly ignored — see `priceError`.
 */
export function parseQuery(searchParams, { categorySlugs }) {
  const min = asInt(searchParams.get('min'));
  const max = asInt(searchParams.get('max'));
  const inverted = min != null && max != null && min > max;

  return {
    q: (searchParams.get('q') ?? '').trim(),
    categories: asList(searchParams.get('cat'), categorySlugs),
    availability: asList(searchParams.get('avail'), AVAILABILITY.map((a) => a.value)),
    properties: asList(searchParams.get('props'), PROPERTIES.map((p) => p.value)),
    moq: MOQ_BUCKETS.some((b) => b.value === searchParams.get('moq')) ? searchParams.get('moq') : '',
    // Rupees in the URL because that is what a person types and shares; paise
    // internally because that is what the money is.
    min,
    max,
    priceError: inverted ? 'The lowest price is above the highest.' : null,
    sort: SORTS.some((s) => s.value === searchParams.get('sort')) ? searchParams.get('sort') : 'relevance',
    page: Math.max(1, asInt(searchParams.get('page'), 1) || 1),
    per: PER_PAGE.includes(asInt(searchParams.get('per'))) ? asInt(searchParams.get('per')) : 12,
    view: searchParams.get('view') === 'list' ? 'list' : 'grid',
  };
}

/** Which facets are actually narrowing the list — drives the chip row and Clear all. */
export function activeFilters(query) {
  const chips = [];
  for (const slug of query.categories) chips.push({ facet: 'cat', value: slug });
  for (const v of query.availability) chips.push({ facet: 'avail', value: v });
  for (const v of query.properties) chips.push({ facet: 'props', value: v });
  if (query.moq) chips.push({ facet: 'moq', value: query.moq });
  if (!query.priceError && (query.min != null || query.max != null)) chips.push({ facet: 'price', value: 'range' });
  return chips;
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Search across the fields a buyer actually types: the product name, the code
 * they read off a carton, and the category. Every term must match somewhere —
 * "infusion vented" should not return every infusion set.
 */
const matchesQuery = (product, q) => {
  if (!q) return true;
  const haystack = `${product.name} ${product.code} ${product.category} ${product.subCategory ?? ''}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
};

/**
 * One predicate per facet, keyed so the counting pass below can leave one out.
 * An empty facet selection means "no constraint", never "match nothing" — the
 * difference between a sidebar you can use and one that empties the page the
 * moment you touch it.
 */
const predicates = (query) => ({
  q: (p) => matchesQuery(p, query.q),
  cat: (p) => query.categories.length === 0 || query.categories.includes(p.categorySlug),
  avail: (p) =>
    query.availability.length === 0 || query.availability.includes(stockStatusOf(p.stock, p.lowStockAt)),
  props: (p) => query.properties.every((prop) => p[prop] === true),
  moq: (p) => !query.moq || p.moq <= Number(query.moq),
  price: (p) => {
    // An inverted range is a typo in progress, not a filter. Applying it would
    // return nothing and make the user think the catalogue is empty.
    if (query.priceError) return true;
    if (query.min != null && p.price < query.min * 100) return false;
    if (query.max != null && p.price > query.max * 100) return false;
    return true;
  },
});

const compare = {
  relevance: () => 0, // keep the source order — curated, not arbitrary
  nameAsc: (a, b) => a.name.localeCompare(b.name),
  nameDesc: (a, b) => b.name.localeCompare(a.name),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  stockDesc: (a, b) => b.stock - a.stock,
};

/**
 * The whole derivation, in one place: what is visible, what the facet counts are,
 * and how many pages there turn out to be.
 *
 * `catalogue` is the customer-visible list — discontinued products are removed
 * before anything else happens, so they cannot appear in a count, a facet or a
 * result. A discontinued line showing "Out of stock" invites someone to ask when
 * it is coming back; it is not coming back.
 */
export function deriveCatalogue(allProducts, query, categories) {
  const catalogue = allProducts.filter((p) => p.status === 'active');
  const tests = predicates(query);

  // Filtered by every facet except `exclude`.
  const except = (exclude) =>
    catalogue.filter((p) => Object.entries(tests).every(([key, test]) => key === exclude || test(p)));

  const visible = except(null);

  const countIn = (list, test) => list.reduce((n, p) => n + (test(p) ? 1 : 0), 0);

  const forCat = except('cat');
  const forAvail = except('avail');
  const forProps = except('props');
  const forMoq = except('moq');

  const facets = {
    categories: categories.map((c) => ({
      ...c,
      count: countIn(forCat, (p) => p.categorySlug === c.slug),
    })),
    availability: AVAILABILITY.map((a) => ({
      ...a,
      count: countIn(forAvail, (p) => stockStatusOf(p.stock, p.lowStockAt) === a.value),
    })),
    properties: PROPERTIES.map((prop) => ({
      ...prop,
      // Each property counts independently of the others in its own group, which
      // is why this counts against forProps rather than against `visible`.
      count: countIn(forProps, (p) => p[prop.value] === true),
    })),
    moq: MOQ_BUCKETS.map((b) => ({
      ...b,
      count: countIn(forMoq, (p) => p.moq <= Number(b.value)),
    })),
  };

  const sorted = [...visible].sort(compare[query.sort] ?? compare.relevance);

  const pageCount = Math.max(1, Math.ceil(sorted.length / query.per));
  // Clamped rather than trusted. ?page=9 on a two-page result set must not render
  // a blank grid — the user did nothing wrong, the filter simply narrowed under a
  // page number that was valid a moment ago.
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.per;

  return {
    items: sorted.slice(start, start + query.per),
    total: sorted.length,
    catalogueTotal: catalogue.length,
    facets,
    page,
    pageCount,
    // True when a filter is responsible for the result set being smaller than the
    // catalogue — decides whether an empty page offers "Clear filters" or
    // "nothing here yet", which §26 is explicit about.
    isFiltered: activeFilters(query).length > 0 || Boolean(query.q),
  };
}

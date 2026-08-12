// The catalogue's state, held in the URL.
//
// WHY THE URL AND NOT useState. On an enterprise catalogue the query string is
// part of the product:
//
//   · A buyer sends "the four filtered sets we discussed" to a colleague as a link.
//   · An agent bookmarks the low-stock view they check every morning.
//   · The back button steps back through filters instead of leaving the page — the
//     single most common complaint about filter UIs that keep state in memory.
//   · A refresh does not silently reset the work.
//
// None of that is achievable with component state, and retrofitting it later means
// rewriting every handler. So the URL is the only source of truth here and there is
// no shadow copy of it in React state to fall out of sync.
//
// One exception, deliberately: `view` also persists to localStorage. Grid-versus-
// list is a working preference rather than a description of the result set — a
// buyer who switches to list on one category expects list on the next, and a
// shared link should not impose the sender's layout on the recipient.

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categories } from '../components/DesignSystem/dummy.js';
import { activeFilters, deriveCatalogue, parseQuery } from './catalogue.js';

const VIEW_KEY = 'ast.view';

const readStoredView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    // Private browsing, or storage disabled by policy. Not worth an error path.
    return 'grid';
  }
};

const categorySlugs = categories.map((c) => c.slug);

/**
 * @param products The catalogue, from whatever supplied it. Passed in rather than
 *   imported so this hook does not know or care whether the list came from a fixture
 *   or from the API — which is the whole point of the seam in ProductsPage.
 */
export default function useProductQuery(products = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => {
    const parsed = parseQuery(searchParams, { categorySlugs });
    // The URL wins when it says something; storage fills the silence.
    return { ...parsed, view: searchParams.get('view') ? parsed.view : readStoredView() };
  }, [searchParams]);

  const derived = useMemo(() => deriveCatalogue(products, query, categories), [products, query]);

  /**
   * Write a patch into the query string.
   *
   * ANY FACET CHANGE RESETS THE PAGE. Without this, narrowing a filter while on
   * page 3 of 4 lands on page 3 of 1 — a blank grid that looks like a broken
   * catalogue. It is the most common bug in this whole component and it is fixed
   * here once rather than remembered at eleven call sites.
   *
   * `replace` is used for the things that are not navigation steps in their own
   * right — typing in the search box, switching layout — so the back button steps
   * through decisions rather than through keystrokes.
   */
  const update = useCallback(
    (patch, { keepPage = false, replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            // Empty means absent. A URL carrying `?cat=&avail=` is noise, and
            // parseQuery would have to strip it anyway.
            if (value === '' || value == null || (Array.isArray(value) && value.length === 0)) {
              next.delete(key);
            } else {
              next.set(key, Array.isArray(value) ? value.join(',') : String(value));
            }
          }
          if (!keepPage) next.delete('page');
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  /** Add or remove one value from a comma-separated facet. */
  const toggleIn = useCallback(
    (key, currentList, value) => {
      const next = currentList.includes(value)
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];
      update({ [key]: next });
    },
    [update],
  );

  const setView = useCallback(
    (view) => {
      try {
        localStorage.setItem(VIEW_KEY, view);
      } catch {
        // The preference just does not survive the tab.
      }
      update({ view }, { keepPage: true, replace: true });
    },
    [update],
  );

  /**
   * Clear the filters and keep everything else.
   *
   * Sort, per-page and view survive on purpose. They are not filters — they are how
   * this person reads a list, and resetting them alongside the filters is the
   * behaviour that makes people stop using a Clear button.
   */
  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      for (const key of ['sort', 'per', 'view']) {
        if (prev.get(key)) next.set(key, prev.get(key));
      }
      return next;
    });
  }, [setSearchParams]);

  const removeFilter = useCallback(
    (facet, value) => {
      if (facet === 'price') return update({ min: '', max: '' });
      if (facet === 'moq') return update({ moq: '' });
      const map = { cat: query.categories, avail: query.availability, props: query.properties };
      return update({ [facet]: map[facet].filter((v) => v !== value) });
    },
    [query, update],
  );

  return {
    query,
    ...derived,
    chips: activeFilters(query),
    update,
    toggleIn,
    setView,
    clearFilters,
    removeFilter,
    setSearch: (q) => update({ q }, { replace: true }),
    setSort: (sort) => update({ sort }),
    setPer: (per) => update({ per }),
    setPage: (page) => update({ page }, { keepPage: true }),
  };
}

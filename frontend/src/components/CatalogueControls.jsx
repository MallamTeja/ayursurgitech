import Select from './Select';
import { GridIcon, ListIcon } from './icons';
import { SORTS } from '../lib/useCatalogue';

/**
 * The strip above every product list: what you are looking at on the left, how to narrow it
 * on the right. Spread a useCatalogue() result straight into it.
 *
 * "In stock only" is the one filter a buyer who needs stock this week actually reaches for,
 * so it is a checkbox in the open rather than a row inside a collapsed filter panel.
 */

function ViewToggle({ view, setView }) {
  const btn = (active) =>
    `flex size-11 items-center justify-center transition-colors duration-150 ${
      active ? 'bg-blue-700 text-white' : 'bg-card text-ink hover:bg-blue-100'
    }`;

  return (
    // role=group, not radiogroup: these are two buttons that act immediately, and a radio
    // group would promise a selection that needs confirming.
    <div
      role="group"
      aria-label="Result layout"
      className="flex shrink-0 overflow-hidden rounded-control border border-line"
    >
      <button
        type="button"
        onClick={() => setView('grid')}
        aria-pressed={view === 'grid'}
        aria-label="Show results as a grid"
        className={btn(view === 'grid')}
      >
        <GridIcon className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => setView('list')}
        aria-pressed={view === 'list'}
        aria-label="Show results as a list"
        className={`border-l border-line ${btn(view === 'list')}`}
      >
        <ListIcon className="size-5" />
      </button>
    </div>
  );
}

export default function CatalogueControls({
  items,
  total,
  brands,
  brand,
  setBrand,
  inStockOnly,
  setInStockOnly,
  sort,
  setSort,
  view,
  setView,
  filtered,
  clear,
  /** Suppresses the count while the fetch is in flight, and after one fails. */
  loading = false,
  error = false,
  /** Search has no sort in its URL until the caller asks for one. */
  showSort = true,
}) {
  const count = items.length;

  // Nothing on error: zero is a claim, and a failed fetch means the count is unknown, not
  // none. The <p> stays so the controls keep their side of the row.
  const summary = error
    ? ''
    : loading
      ? 'Loading…'
      : filtered
        ? `${count} of ${total} products`
        : `${count} ${count === 1 ? 'product' : 'products'}`;

  return (
    <div className="flex flex-col gap-4 border-y border-line py-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <p className="text-sm tabular-nums text-ink-muted">{summary}</p>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="size-4 accent-blue-700"
            />
            In stock only
          </label>

          {brands.length > 1 && (
            <div className="w-40">
              <Select label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {showSort && (
            <div className="w-48">
              <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <ViewToggle view={view} setView={setView} />
        </div>
      </div>

      {/* Only once something is actually filtered — a permanent "Clear" reads as a filter
          that is always on. */}
      {filtered && (
        <button
          type="button"
          onClick={clear}
          className="self-start rounded-control text-sm text-blue-500 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

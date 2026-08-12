// Tables — §17, §29, §25, §26.
//
// §17 calls tables critical for the admin portal and then gives eight rules. Each
// one is implemented rather than aspired to:
//
//   avoid excessive grid lines  → horizontal rules only. No vertical borders at
//                                 all; column separation is done with alignment
//                                 and space, which is what makes a dense table
//                                 readable instead of graph paper.
//   subtle borders              → edge, 1px, and the header carries surface-2
//                                 instead of a heavy rule.
//   generous row height         → from the §29 density class, not hardcoded.
//   hover states                → surface-2, and a selected row gets brand-50 so
//                                 hover and selected are never confusable.
//   consistent alignment        → declared per column, and numeric columns get
//                                 tabular figures automatically. This is the rule
//                                 most often broken, and it is the one that
//                                 decides whether a column of money can be read.
//   semantic status badges      → StatusBadge, from the registry.
//   sorting/filtering/pagination→ here, and TableToolbar / Pagination below.
//   predictable actions         → one actions column, always last, always right.
//
// RESPONSIVE (§23). A twelve-column admin table cannot shrink to 360px, and
// horizontal scroll on a phone hides the columns that matter. Below `sm` each row
// becomes a card of label/value pairs instead — same data, same order, no
// side-scrolling. `primary: true` on a column marks the card's heading.

import { Icon } from '../icons.jsx';
import { cx } from '../utils.js';
import { Button } from './Button.jsx';
import { Checkbox } from './Form.jsx';

/* -------------------------------------------------------------------------- */
/* Sort header                                                                */
/* -------------------------------------------------------------------------- */

/**
 * aria-sort is what makes a sortable column announce its state; the arrow is for
 * everyone else. The neutral glyph stays visible at low contrast on unsorted
 * columns so it is discoverable that they *can* be sorted — a sort affordance that
 * only appears on hover is invisible to a touch user.
 */
function SortButton({ label, active, direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/sort inline-flex items-center gap-1 rounded transition-colors hover:text-brand-700"
    >
      <span>{label}</span>
      {active ? (
        direction === 'asc' ? (
          <Icon.chevronUp size={14} className="text-brand-700" />
        ) : (
          <Icon.chevronDown size={14} className="text-brand-700" />
        )
      ) : (
        <Icon.sort size={14} className="text-fg-muted opacity-60 group-hover/sort:opacity-100" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* DataTable                                                                  */
/* -------------------------------------------------------------------------- */

export function DataTable({
  columns = [],
  rows = [],
  rowKey = (r, i) => r.id ?? i,
  density = 'compact',
  selectable = false,
  selected = [],
  onSelectedChange,
  sort,
  onSortChange,
  loading = false,
  skeletonRows = 6,
  empty,
  caption,
  onRowClick,
  stickyHeader = true,
  className,
}) {
  const allSelected = rows.length > 0 && selected.length === rows.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => onSelectedChange?.(allSelected ? [] : rows.map(rowKey));
  const toggleRow = (key) =>
    onSelectedChange?.(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  const align = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  // A number that is not tabular in a column is a number you cannot compare.
  const numeric = (col) => col.align === 'right' && col.tabular !== false;

  const handleSort = (col) => {
    if (!col.sortable) return;
    const dir = sort?.key === col.key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange?.({ key: col.key, direction: dir });
  };

  /* ---- Empty (§26) --------------------------------------------------------- */
  if (!loading && rows.length === 0 && empty) {
    return <div className={cx('rounded-xl border border-edge bg-surface', className)}>{empty}</div>;
  }

  return (
    <div className={cx('min-w-0', `density-${density}`, className)}>
      {/* ---- Desktop: the real table ----------------------------------------- */}
      <div className={cx('hidden overflow-x-auto rounded-xl border border-edge bg-surface sm:block')}>
        <table className="w-full border-collapse text-left">
          {/* A caption is the table's accessible name. sr-only because the screen
              already has a heading above it — but a table with neither is a table a
              screen reader user meets with no idea what it lists. */}
          <caption className="sr-only-ds">{caption ?? 'Data table'}</caption>

          <thead className={cx('bg-surface-2', stickyHeader && 'sticky top-0 z-10')}>
            <tr className="border-b border-edge">
              {selectable && (
                <th scope="col" className="w-10 px-[var(--row-px)]">
                  <Checkbox
                    aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable
                      ? sort?.key === col.key
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  style={col.width ? { width: col.width } : undefined}
                  className={cx(
                    'type-th whitespace-nowrap px-[var(--row-px)] py-2.5 text-fg-secondary',
                    align(col.align),
                    col.headerClassName,
                  )}
                >
                  {col.sortable ? (
                    <SortButton
                      label={col.header}
                      active={sort?.key === col.key}
                      direction={sort?.direction}
                      onClick={() => handleSort(col)}
                    />
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? // §25: skeleton rows, not a blank panel. Same row height as real
                // rows so the table does not jump when the data lands.
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`sk-${i}`} className="h-[var(--row-h)] border-b border-edge last:border-0">
                    {selectable && <td className="px-[var(--row-px)]" />}
                    {columns.map((col) => (
                      <td key={col.key} className="px-[var(--row-px)]">
                        <span
                          className="ds-pulse block h-3 rounded bg-surface-2"
                          style={{ width: `${45 + ((i * 13 + col.key.length * 7) % 45)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => {
                  const key = rowKey(row, i);
                  const isSelected = selected.includes(key);
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cx(
                        'h-[var(--row-h)] border-b border-edge transition-colors last:border-0',
                        isSelected ? 'bg-brand-50' : 'hover:bg-surface-2',
                        onRowClick && 'cursor-pointer',
                      )}
                    >
                      {selectable && (
                        <td className="px-[var(--row-px)]" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={`Select row ${key}`}
                            checked={isSelected}
                            onChange={() => toggleRow(key)}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cx(
                            'type-body-sm px-[var(--row-px)] py-2 text-fg',
                            align(col.align),
                            numeric(col) && 'tabular',
                            col.className,
                          )}
                        >
                          {col.render ? col.render(row, i) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* ---- Mobile: the same rows as cards ---------------------------------- */}
      <ul className="space-y-3 sm:hidden">
        {(loading ? Array.from({ length: 3 }) : rows).map((row, i) => {
          if (loading) {
            return (
              <li key={`msk-${i}`} className="space-y-2 rounded-xl border border-edge bg-surface p-4">
                <span className="ds-pulse block h-4 w-2/3 rounded bg-surface-2" />
                <span className="ds-pulse block h-3 w-1/2 rounded bg-surface-2" />
                <span className="ds-pulse block h-3 w-1/3 rounded bg-surface-2" />
              </li>
            );
          }
          const key = rowKey(row, i);
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);
          return (
            <li key={key}>
              <div
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(
                  'rounded-xl border border-edge bg-surface p-4',
                  selected.includes(key) && 'border-brand-500 bg-brand-50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="type-body-sm min-w-0 font-semibold text-fg">
                    {primary.render ? primary.render(row, i) : row[primary.key]}
                  </div>
                  {selectable && (
                    <Checkbox
                      aria-label={`Select ${key}`}
                      checked={selected.includes(key)}
                      onChange={() => toggleRow(key)}
                    />
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {rest.map((col) => (
                    <div key={col.key} className="min-w-0">
                      <dt className="type-caption text-fg-secondary">{col.header}</dt>
                      <dd className={cx('type-body-sm mt-0.5 text-fg', numeric(col) && 'tabular')}>
                        {col.render ? col.render(row, i) : (row[col.key] ?? '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toolbar                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The band above a table: search on the left, filters and actions on the right.
 *
 * When rows are selected it becomes a bulk-action bar instead, and says how many.
 * Swapping the whole bar rather than adding a second one keeps the vertical
 * position of the table stable — a table that jumps down 56px the moment you tick a
 * checkbox loses you the row you were aiming at.
 */
export function TableToolbar({ search, filters, actions, selectedCount = 0, bulkActions, onClearSelection, className }) {
  if (selectedCount > 0) {
    return (
      <div
        className={cx(
          'flex flex-wrap items-center gap-3 rounded-xl border border-brand-500 bg-brand-50 px-4 py-3',
          className,
        )}
      >
        <p className="type-body-sm font-medium text-brand-900">
          <span className="tabular">{selectedCount}</span> selected
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {bulkActions}
          <Button variant="tertiary" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      {search && <div className="w-full sm:max-w-xs">{search}</div>}
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {filters}
        {actions}
      </div>
    </div>
  );
}

/** The active-filter row, so it is obvious why a table is showing 4 of 348 rows. */
export function FilterBar({ chips, onClearAll, className }) {
  if (!chips?.length) return null;
  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      <span className="type-caption text-fg-secondary">Filtered by</span>
      {chips}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="type-caption font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * §17 asks for pagination and nothing about its shape, so: a count on the left
 * and controls on the right.
 *
 * The count is not decoration — "1–20 of 348" is how someone knows a filter did
 * something. Page numbers are windowed to five with ellipses; a 348-row table at 20
 * per page is 18 buttons, which is a worse control than a first/last pair.
 */
export function Pagination({ page = 1, pageSize = 20, total = 0, onPageChange, onPageSizeChange, className }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const window = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
    if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, '…', page - 1, page, page + 1, '…', pages];
  };

  return (
    <nav
      aria-label="Pagination"
      className={cx('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <p className="type-body-sm text-fg-secondary">
        Showing <span className="tabular font-medium text-fg">{from}</span>–
        <span className="tabular font-medium text-fg">{to}</span> of{' '}
        <span className="tabular font-medium text-fg">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          iconLeft={Icon.first}
          aria-label="First page"
          disabled={page === 1}
          onClick={() => onPageChange?.(1)}
        />
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          iconLeft={Icon.chevronLeft}
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange?.(page - 1)}
        />
        {window().map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="type-body-sm px-1.5 text-fg-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cx(
                'tabular h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'text-fg-secondary hover:bg-surface-2 hover:text-fg',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          iconLeft={Icon.chevronRight}
          aria-label="Next page"
          disabled={page === pages}
          onClick={() => onPageChange?.(page + 1)}
        />
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          iconLeft={Icon.last}
          aria-label="Last page"
          disabled={page === pages}
          onClick={() => onPageChange?.(pages)}
        />
      </div>
    </nav>
  );
}

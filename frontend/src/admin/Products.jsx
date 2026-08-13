import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Chip,
  ConfirmModal,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Icon,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  Select,
  StatusBadge,
  TableToolbar,
  formatINR,
  formatQty,
  stockStatusOf,
  useToast,
} from '../components/DesignSystem';
import { adminUrl } from './helpers';
import { productsApi, useAdminData, useDebounced, useTableView } from './data';

// The catalogue, from the ops-desk side. Same products, same codes and same money
// format as /products — one fixture, so the two lists cannot disagree.
//
// EVERY FILTER IS IN THE URL. `?q=`, `?cat=`, `?stock=` — which is what makes
// "the out-of-stock ones" a link the dashboard can point at and a state someone can
// send to a colleague. Local state for the search box only, because a URL that
// rewrites itself on every keystroke fills the history stack.

const STOCK_FILTERS = {
  all: { label: 'Any stock level', match: () => true },
  out: { label: 'Out of stock', match: (p) => p.stock <= 0 },
  low: { label: 'Low stock', match: (p) => p.stock > 0 && p.stock <= p.lowStockAt },
  in: { label: 'In stock', match: (p) => p.stock > p.lowStockAt },
};

/**
 * The 36px row thumbnail.
 *
 * NOT ProductImage. That component's placeholder carries `border-b border-edge` for
 * the card it was built for, and at 36px in a table cell that border renders as a
 * stray rule under the glyph. cx() is a plain join with no tailwind-merge, so
 * passing `border-b-0` would leave two utilities of equal specificity and let the
 * stylesheet order decide. The catalogue card keeps ProductImage; a table cell gets
 * the same glyph in the shape a table cell needs.
 */
function Thumb({ product }) {
  const Glyph = Icon[product.icon] ?? Icon.products;
  if (product.image) {
    return (
      <img
        src={product.image}
        alt=""
        className="size-9 rounded-lg border border-edge bg-surface object-contain p-1"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-9 place-items-center rounded-lg border border-edge bg-surface-2 text-brand-500"
    >
      <Glyph size={18} />
    </span>
  );
}

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounced(search.trim().toLowerCase(), 200);

  const [confirming, setConfirming] = useState(null); // the product a delete is pending confirmation for
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error } = useAdminData(
    (s) => ({ products: s.products, categories: s.categories }),
    { forced: params.get('state') },
  );

  const cat = params.get('cat') ?? 'all';
  const stock = STOCK_FILTERS[params.get('stock')] ? params.get('stock') : 'all';

  // One patch function for all three filters, so setting one never drops the
  // others — the bug behind "I filtered by category and lost my search".
  const patchParams = (patch, options) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === 'all') next.delete(key);
        else next.set(key, value);
      }
      return next;
    }, options);

  // The search box mirrors itself into the URL once it settles, so a filtered
  // view is a link you can send. `replace` is what keeps it out of the history
  // stack — writing on every keystroke would put nine entries behind "infusion"
  // and make Back useless.
  useEffect(() => {
    if ((params.get('q') ?? '') === search.trim()) return;
    patchParams({ q: search.trim() || null }, { replace: true });
    // patchParams closes over setParams only, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const rows = useMemo(
    () =>
      data.products.filter((p) => {
        if (cat !== 'all' && p.categorySlug !== cat) return false;
        if (!STOCK_FILTERS[stock].match(p)) return false;
        if (!q) return true;
        // Code as well as name: an ops user who has the box in their hand types
        // AST-IV-1001, and a name-only search finds nothing for them.
        return `${p.name} ${p.code} ${p.category} ${p.subCategory ?? ''}`.toLowerCase().includes(q);
      }),
    [data.products, cat, stock, q],
  );

  const view = useTableView(rows, {
    pageSize: 12,
    initialSort: { key: 'name', direction: 'asc' },
    sortKey: {
      name: (p) => p.name,
      code: (p) => p.code,
      category: (p) => `${p.category} ${p.subCategory ?? ''}`,
      price: (p) => p.price,
      stock: (p) => p.stock,
      gst: (p) => p.gst,
    },
  });

  async function onDelete() {
    const product = confirming;
    setDeleting(true);
    try {
      await productsApi.remove(product.id);
      setConfirming(null);
      toast.success(`Deleted "${product.name}".`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = Boolean(q) || cat !== 'all' || stock !== 'all';
  // Only active products reach the shop, which is the rule dummy.js uses to derive
  // the category counts the shop prints. Saying it here means the difference between
  // 34 rows and 33 listed products never has to be discovered.
  const listed = data.products.filter((p) => p.status === 'active').length;

  const columns = [
    {
      key: 'image',
      header: '',
      width: 56,
      hideOnMobile: true,
      render: (p) => <Thumb product={p} />,
    },
    {
      key: 'name',
      header: 'Product',
      primary: true,
      sortable: true,
      render: (p) => (
        <span className="block min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <Link
              to={adminUrl(`/products/${p.id}`)}
              className="font-medium text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline"
            >
              {p.name}
            </Link>
            {/* Badged only when it is NOT active. Without this a discontinued
                product is indistinguishable from a live one in this table while
                being invisible in the shop — which is the state someone spends an
                afternoon on before finding the reason. */}
            {p.status !== 'active' && <StatusBadge kind="entity" value={p.status} size="sm" />}
          </span>
          <span className="type-caption mt-0.5 block font-mono text-fg-muted">{p.code}</span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => (
        <span className="text-fg-secondary">
          {p.category || '—'}
          {p.subCategory ? <span className="text-fg-muted"> › {p.subCategory}</span> : ''}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      sortable: true,
      // GST-exclusive, as stored — said once in the subtitle rather than in 27 rows.
      render: (p) => formatINR(p.price),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      sortable: true,
      render: (p) => {
        const key = stockStatusOf(p.stock, p.lowStockAt);
        return (
          <span className="inline-flex flex-col items-end gap-1">
            <span className="tabular">{formatQty(p.stock)}</span>
            {/* Badged only when it needs an action. A green "In Stock" chip on
                every healthy row turns the column into wallpaper and hides the two
                rows that matter. */}
            {key !== 'inStock' && <StatusBadge kind="stock" value={key} size="sm" />}
          </span>
        );
      },
    },
    { key: 'gst', header: 'GST', align: 'right', sortable: true, render: (p) => `${p.gst}%` },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // A column of "Edit" links all read as the same control to a screen reader,
      // so each one names its product. Delete is coloured as an error, not with the
      // brand accent, so it never reads as the default choice.
      render: (p) => (
        <span className="inline-flex items-center justify-end gap-1">
          <Button as={Link} to={adminUrl(`/products/${p.id}`)} variant="tertiary" size="sm" aria-label={`Edit ${p.name}`}>
            Edit
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setConfirming(p)}
            aria-label={`Delete ${p.name}`}
            className="text-error-700 hover:bg-error-bg"
          >
            Delete
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${formatQty(listed)} of ${formatQty(data.products.length)} are listed in the shop. Prices are GST-exclusive, as stored, and stock badges follow each product's own reorder threshold.`}
        actions={
          <Button as={Link} to={adminUrl('/products/new')} iconLeft={Icon.add}>
            New product
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3">
        <TableToolbar
          search={
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Name or product code"
              aria-label="Search products by name or code"
            />
          }
          filters={
            <>
              <Select
                aria-label="Filter by category"
                size="sm"
                value={cat}
                onChange={(e) => patchParams({ cat: e.target.value })}
                className="w-full sm:w-52"
              >
                <option value="all">All categories</option>
                {data.categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filter by stock level"
                size="sm"
                value={stock}
                onChange={(e) => patchParams({ stock: e.target.value })}
                className="w-full sm:w-44"
              >
                {Object.entries(STOCK_FILTERS).map(([key, f]) => (
                  <option key={key} value={key}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </>
          }
        />

        {/* Why the table is showing 4 of 27 rows, spelled out and removable. */}
        <FilterBar
          onClearAll={
            filtered
              ? () => {
                  setSearch('');
                  patchParams({ q: null, cat: null, stock: null });
                }
              : undefined
          }
          chips={[
            q && (
              <Chip key="q" icon={Icon.search} onRemove={() => setSearch('')} removeLabel="Clear the search">
                {`"${search.trim()}"`}
              </Chip>
            ),
            cat !== 'all' && (
              <Chip
                key="cat"
                icon={Icon.categories}
                onRemove={() => patchParams({ cat: null })}
                removeLabel="Clear the category filter"
              >
                {data.categories.find((c) => c.slug === cat)?.name ?? cat}
              </Chip>
            ),
            stock !== 'all' && (
              <Chip
                key="stock"
                icon={Icon.inventory}
                onRemove={() => patchParams({ stock: null })}
                removeLabel="Clear the stock filter"
              >
                {STOCK_FILTERS[stock].label}
              </Chip>
            ),
          ].filter(Boolean)}
        />
      </div>

      <div className="mt-4">
        {error ? (
          <Panel>
            <ErrorState thing="the products" detail={error} onRetry={() => patchParams({ state: null })} />
          </Panel>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={view.rows}
              rowKey={(p) => p.id}
              caption="Products"
              loading={loading}
              sort={view.sort}
              onSortChange={view.onSortChange}
              empty={
                <EmptyState
                  variant={filtered ? 'no-results' : 'nothing-yet'}
                  icon={filtered ? Icon.search : Icon.products}
                  title={
                    q
                      ? `No product matches "${search.trim()}".`
                      : filtered
                        ? 'No product matches these filters.'
                        : 'No products yet.'
                  }
                  body={
                    filtered
                      ? 'Try a product code, or clear the filters to see the whole catalogue.'
                      : 'The shop has nothing to sell until one exists.'
                  }
                  action={
                    filtered ? (
                      <Button
                        variant="secondary"
                        iconLeft={Icon.retry}
                        onClick={() => {
                          setSearch('');
                          patchParams({ q: null, cat: null, stock: null });
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button as={Link} to={adminUrl('/products/new')} iconLeft={Icon.add}>
                        New product
                      </Button>
                    )
                  }
                />
              }
            />

            {/* Hidden on a single page: "Showing 1–7 of 7" beside no usable
                controls is furniture. */}
            {!loading && view.pages > 1 && (
              <Pagination
                className="mt-4"
                page={view.page}
                pageSize={view.pageSize}
                total={view.total}
                onPageChange={view.setPage}
              />
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={onDelete}
        title="Delete product"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      >
        Delete &quot;{confirming?.name}&quot;? It leaves the catalogue and its reviews go with it. This
        cannot be undone.
      </ConfirmModal>
    </>
  );
}

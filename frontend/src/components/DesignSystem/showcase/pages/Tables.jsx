import { useMemo, useState } from 'react';
import { Icon } from '../../icons.jsx';
import {
  Badge,
  Button,
  Chip,
  DataTable,
  Dropdown,
  EmptyState,
  FilterBar,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  StatusDot,
  TableToolbar,
  formatDate,
  formatINR,
  formatQty,
  stockStatusOf,
} from '../../index.js';
import { orders, products } from '../../dummy.js';
import { Code, Decision, DoDont, Example, Page, PropsTable, Row, Section } from '../kit.jsx';

/* The columns an orders table actually needs, with §17's alignment rules applied:
   text left, numbers right, status in a fixed-width column, actions last. */
const orderColumns = [
  {
    key: 'id',
    header: 'Order',
    primary: true,
    sortable: true,
    render: (o) => (
      <span className="tabular font-medium text-brand-700">{o.id}</span>
    ),
  },
  { key: 'org', header: 'Organisation', sortable: true },
  { key: 'placed', header: 'Placed', sortable: true, render: (o) => formatDate(o.placed) },
  { key: 'lines', header: 'Lines', align: 'right', sortable: true },
  { key: 'total', header: 'Total', align: 'right', sortable: true, render: (o) => formatINR(o.total) },
  { key: 'status', header: 'Status', render: (o) => <StatusBadge kind="order" value={o.status} size="sm" /> },
  { key: 'payment', header: 'Payment', render: (o) => <StatusDot kind="payment" value={o.payment} /> },
  {
    key: 'actions',
    header: '',
    align: 'right',
    hideOnMobile: true,
    render: () => (
      <Dropdown
        label="Order actions"
        items={[
          { label: 'View order', icon: Icon.show },
          { label: 'Print invoice', icon: Icon.print },
          { label: 'Mark dispatched', icon: Icon.shipments },
          { separator: true },
          { label: 'Cancel order', icon: Icon.error, destructive: true },
        ]}
      />
    ),
  },
];

const productColumns = [
  { key: 'name', header: 'Product', primary: true, sortable: true },
  { key: 'code', header: 'Code', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'stock', header: 'Stock', align: 'right', sortable: true, render: (p) => formatQty(p.stock) },
  {
    key: 'stockStatus',
    header: 'Availability',
    render: (p) => <StatusBadge kind="stock" value={stockStatusOf(p.stock, p.lowStockAt)} size="sm" />,
  },
  { key: 'price', header: 'Unit price', align: 'right', sortable: true, render: (p) => formatINR(p.price) },
];

export default function Tables() {
  const [sort, setSort] = useState({ key: 'placed', direction: 'desc' });
  const [selected, setSelected] = useState([]);
  const [density, setDensity] = useState('compact');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('data');

  const sorted = useMemo(() => {
    const rows = [...orders];
    rows.sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const cmp = typeof x === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [sort]);

  const filtered = useMemo(
    () => sorted.filter((o) => !search || `${o.id} ${o.org}`.toLowerCase().includes(search.toLowerCase())),
    [sorted, search],
  );

  return (
    <Page
      eyebrow="Components"
      title="Tables"
      intro="§17 calls tables critical for the admin portal and then gives eight rules. Each one is implemented rather than aspired to — most visibly the first, “avoid excessive grid lines”, which is why there are no vertical borders anywhere in this table at all."
      spec="§17, §29, §23, §26"
    >
      <Section
        title="The eight rules, applied"
        spec="§17"
        intro="Column separation is done with alignment and space rather than lines. Numbers are right-aligned and tabular, so a column of totals can be compared in one pass — the rule most often broken, and the one that decides whether a money column is readable at all."
      >
        <Example title="Orders — sortable, selectable, with row actions" surface="canvas" padded={false}>
          <div className="space-y-4 p-4">
            <TableToolbar
              selectedCount={selected.length}
              onClearSelection={() => setSelected([])}
              search={
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Order or organisation…"
                  size="sm"
                />
              }
              filters={
                <Select
                  size="sm"
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  options={[
                    { value: 'compact', label: 'Compact — admin' },
                    { value: 'default', label: 'Default — agent' },
                    { value: 'relaxed', label: 'Relaxed — customer' },
                  ]}
                />
              }
              actions={
                <>
                  <Button size="sm" variant="secondary" iconLeft={Icon.export}>
                    Export
                  </Button>
                  <Button size="sm" iconLeft={Icon.add}>
                    New Order
                  </Button>
                </>
              }
              bulkActions={
                <>
                  <Button size="sm" variant="secondary" iconLeft={Icon.print}>
                    Print invoices
                  </Button>
                  <Button size="sm" variant="secondary" iconLeft={Icon.shipments}>
                    Mark dispatched
                  </Button>
                  <Button size="sm" variant="danger" iconLeft={Icon.error}>
                    Cancel
                  </Button>
                </>
              }
            />

            <FilterBar
              chips={
                search
                  ? [
                      <Chip key="s" onRemove={() => setSearch('')}>
                        “{search}”
                      </Chip>,
                    ]
                  : []
              }
              onClearAll={() => setSearch('')}
            />

            <DataTable
              caption="Orders"
              columns={orderColumns}
              rows={filtered}
              rowKey={(o) => o.id}
              density={density}
              selectable
              selected={selected}
              onSelectedChange={setSelected}
              sort={sort}
              onSortChange={setSort}
              empty={
                <EmptyState
                  variant="no-results"
                  icon={Icon.search}
                  title="No orders found"
                  body={`Nothing matches “${search}”. Try a different order number or organisation name.`}
                  action={
                    <Button variant="secondary" onClick={() => setSearch('')}>
                      Clear Filters
                    </Button>
                  }
                />
              }
            />

            <Pagination page={page} pageSize={10} total={348} onPageChange={setPage} />
          </div>
        </Example>

        <Decision kind="addition" title="Density is a prop, and only the row height moves">
          <p>
            Change the selector above. Type size, colour and border weight are identical across all three — a denser table
            is the same table with less air, which is what keeps the customer catalogue and the admin stock list
            recognisable as one product. §29 gives the three portals different densities and no numbers; these are 56, 48
            and 40px.
          </p>
        </Decision>
      </Section>

      <Section
        title="Selection"
        spec="§17"
        intro="Select rows above and the toolbar becomes a bulk-action bar. Swapping the whole bar rather than adding a second one keeps the table's vertical position stable — a table that jumps down 56px the moment you tick a checkbox loses you the row you were aiming at."
      >
        <Example title="Selected rows read brand-50, hover reads surface-2" surface="surface">
          <p className="type-body-sm text-fg-secondary">
            Two different states need two different colours, or you cannot tell a hovered row from a selected one. The
            select-all checkbox goes indeterminate when only some rows are picked — <Code>indeterminate</Code> is a DOM
            property with no HTML attribute, so it is a prop on <Code>Checkbox</Code> rather than something every call
            site reaches for a ref to set.
          </p>
        </Example>
      </Section>

      <Section
        title="Loading, empty and error"
        spec="§25, §26, §27"
        intro="A table has three states besides having data, and §25 through §27 are specific about all of them."
      >
        <Row className="mb-4">
          {['data', 'loading', 'empty'].map((s) => (
            <Button key={s} size="sm" variant={state === s ? 'primary' : 'secondary'} onClick={() => setState(s)}>
              {s}
            </Button>
          ))}
        </Row>

        <Example title={`state: ${state}`} surface="canvas" padded={false}>
          <div className="p-4">
            <DataTable
              caption="Products"
              columns={productColumns}
              rows={state === 'data' ? products.slice(0, 6) : []}
              rowKey={(p) => p.id}
              density="compact"
              loading={state === 'loading'}
              empty={
                <EmptyState
                  title="No products yet"
                  body="Products you add to the catalogue will appear here. Start with a category, then add products to it."
                  action={<Button iconLeft={Icon.add}>Add Product</Button>}
                  secondaryAction={<Button variant="secondary">Import CSV</Button>}
                />
              }
            />
          </div>
        </Example>

        <p className="type-body-sm text-fg-secondary">
          Skeleton rows are the same height as real rows, so the table does not jump when data lands. The empty state is
          §26's shape — a heading, a sentence explaining what happened, and an action — and the action differs by cause: a
          first-run empty offers “Add Product”, a filtered empty offers “Clear Filters”. Offering “Add Product” to someone
          whose search matched nothing is the wrong answer to the question they asked.
        </p>
      </Section>

      <Section
        title="Mobile"
        spec="§23"
        intro="A twelve-column admin table cannot shrink to 360px, and horizontal scroll on a phone hides the columns that matter most."
      >
        <Decision kind="addition" title="Below sm, each row becomes a card">
          <p>
            Same data, same order, no side-scrolling. The column marked <Code>primary</Code> becomes the card heading and
            the rest render as label/value pairs. Columns marked <Code>hideOnMobile</Code> — usually the actions column —
            drop out. Narrow this browser window to see it.
          </p>
        </Decision>

        <DoDont
          doLabel="Stacked cards"
          dontLabel="Horizontal scroll"
          doNote="Every field visible, one row per card, labels included. Reading is vertical, which is the direction a phone is."
          dontNote="The Total and Status columns are off-screen to the right, which is where the information the user came for usually sits."
          doNode={
            <div className="space-y-2">
              {orders.slice(0, 2).map((o) => (
                <div key={o.id} className="rounded-xl border border-edge bg-surface p-3">
                  <p className="type-body-sm font-semibold text-brand-700">{o.id}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <dt className="type-caption text-fg-secondary">Total</dt>
                      <dd className="type-body-sm tabular text-fg">{formatINR(o.total)}</dd>
                    </div>
                    <div>
                      <dt className="type-caption text-fg-secondary">Status</dt>
                      <dd className="mt-0.5">
                        <StatusBadge kind="order" value={o.status} size="sm" />
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          }
          dontNode={
            <div className="overflow-hidden rounded-lg border border-edge">
              <div className="flex">
                <div className="min-w-0 shrink-0" style={{ width: '190%' }}>
                  <table className="w-full">
                    <thead className="bg-surface-2">
                      <tr>
                        {['Order', 'Organisation', 'Placed', 'Lines', 'Total', 'Status'].map((h) => (
                          <th key={h} className="type-th whitespace-nowrap px-3 py-2 text-left text-fg-secondary">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 2).map((o) => (
                        <tr key={o.id} className="border-t border-edge">
                          <td className="type-body-sm whitespace-nowrap px-3 py-2">{o.id}</td>
                          <td className="type-body-sm whitespace-nowrap px-3 py-2">{o.org}</td>
                          <td className="type-body-sm whitespace-nowrap px-3 py-2">{formatDate(o.placed)}</td>
                          <td className="type-body-sm px-3 py-2">{o.lines}</td>
                          <td className="type-body-sm whitespace-nowrap px-3 py-2">{formatINR(o.total)}</td>
                          <td className="px-3 py-2">
                            <Badge size="sm">{o.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
        />
      </Section>

      <Section title="Props — DataTable" spec="§17">
        <PropsTable
          rows={[
            ['columns', 'Column[]', '[]', 'See the column shape below.'],
            ['rows', 'object[]', '[]', 'Already sorted and paginated — this component renders, it does not fetch.'],
            ['rowKey', '(row, i) => string', 'row.id ?? i', 'Used for selection and React keys.'],
            ['density', "'relaxed' | 'default' | 'compact'", "'compact'", '§29 — 56 / 48 / 40px rows.'],
            ['selectable', 'boolean', 'false', 'Adds the checkbox column and the select-all header.'],
            ['selected / onSelectedChange', 'string[] / fn', '[]', 'Controlled. Keys come from rowKey.'],
            ['sort / onSortChange', '{key, direction} / fn', '—', 'Controlled. Sets aria-sort on the header.'],
            ['loading', 'boolean', 'false', 'Renders skeleton rows at the real row height (§25).'],
            ['empty', 'ReactNode', '—', 'Rendered instead of the table when there are no rows (§26).'],
            ['caption', 'string', "'Data table'", 'The table’s accessible name. Visually hidden, always present.'],
            ['onRowClick', '(row) => void', '—', 'Makes rows clickable. The checkbox cell stops propagation.'],
          ]}
        />

        <PropsTable
          rows={[
            ['key', 'string', '—', 'Also the property read from the row when there is no render function.'],
            ['header', 'string', '—', 'Column heading. Doubles as the label in the mobile card.'],
            ['align', "'left' | 'right' | 'center'", "'left'", "Right-aligned columns get tabular figures automatically."],
            ['sortable', 'boolean', 'false', 'Renders the sort button and wires aria-sort.'],
            ['render', '(row, i) => ReactNode', '—', 'For badges, links, formatted money.'],
            ['primary', 'boolean', 'false', 'This column becomes the heading of the mobile card.'],
            ['hideOnMobile', 'boolean', 'false', 'Drops the column from the mobile card — usually actions.'],
            ['width', 'string', '—', 'A CSS width for columns that must not collapse.'],
          ]}
        />
      </Section>
    </Page>
  );
}

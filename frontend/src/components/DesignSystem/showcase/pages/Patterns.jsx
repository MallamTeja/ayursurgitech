import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import {
  ADMIN_NAV,
  Alert,
  AmountList,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  DataTable,
  DescriptionList,
  Divider,
  FeatureList,
  MetricCard,
  MetricRow,
  PageHeader,
  Panel,
  PriceBlock,
  ProductCard,
  ProductGrid,
  ProductImage,
  ProgressBar,
  QuantityStepper,
  SectionHeading,
  SidebarNav,
  SpecTable,
  StatusBadge,
  StatusDot,
  Stepper,
  StockMeter,
  Timeline,
  formatDate,
  formatDateTime,
  formatINR,
  formatINRCompact,
  formatQty,
  stockStatusOf,
} from '../../index.js';
import { BarChart, ShareBar } from '../../ui/Chart.jsx';
import { agents, metrics, orderHistory, orderLines, orders, products, quotes, revenueSeries, topProducts } from '../../dummy.js';
import { Decision, Page, Section } from '../kit.jsx';

const product = products[0];

/* -------------------------------------------------------------------------- */

function CustomerPattern() {
  const [qty, setQty] = useState(100);

  return (
    <div className="bg-canvas">
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '#' },
            { label: 'I.V. Infusion', href: '#' },
            { label: 'Standard Infusion Sets', href: '#' },
            { label: product.name },
          ]}
        />

        {/* §16's hierarchy: breadcrumb → category → name → summary → imagery →
            specifications → applications → documents → action → related. */}
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <ProductImage
              code={product.code}
              alt={product.name}
              icon={Icon.infusion}
              className="rounded-xl border border-edge"
            />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <ProductImage
                  key={i}
                  ratio="square"
                  code=""
                  icon={Icon.infusion}
                  className="rounded-lg border border-edge"
                />
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="type-label text-brand-700">{product.category}</p>
            <h1 className="type-h2 mt-2 text-fg">{product.name}</h1>
            <p className="type-body-lg mt-3 text-fg-secondary">{product.summary}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="brand" icon={Icon.verified}>
                Sterile
              </Badge>
              <Badge tone="brand" icon={Icon.certified}>
                CE marked
              </Badge>
              <Badge>Latex-free</Badge>
              <StatusBadge kind="stock" value={stockStatusOf(product.stock, product.lowStockAt)} />
            </div>

            <div className="mt-6 rounded-xl border border-edge bg-surface p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <PriceBlock product={product} />
                <div className="type-caption text-right text-fg-secondary">
                  <p>Product Code: {product.code}</p>
                  <p>HSN {product.hsn}</p>
                </div>
              </div>

              <Divider className="my-4" />

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="type-body-sm mb-1.5 font-medium text-fg">Quantity</p>
                  <QuantityStepper value={qty} onChange={setQty} moq={product.moq} uom={product.uom} />
                  <p className="type-caption mt-1.5 text-fg-secondary">
                    MOQ {formatQty(product.moq)} · {product.packSize}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="type-caption text-fg-secondary">Line total, excl. GST</p>
                  <p className="type-h4 tabular text-fg">{formatINR(product.price * qty)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button fullWidth iconLeft={Icon.cart}>
                  Add to Order
                </Button>
                <Button variant="secondary" fullWidth iconLeft={Icon.quotes}>
                  Request Quote
                </Button>
              </div>
            </div>

            <Alert tone="info" className="mt-4" title="Bulk pricing available above 5,000 pieces">
              Request a quote and an agent will respond within one working day.
            </Alert>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeading title="Key specifications" />
            <div className="mt-4 rounded-xl border border-edge bg-surface p-5">
              <SpecTable specs={product.specs} />
            </div>

            <SectionHeading title="Applications" className="mt-8" />
            <div className="mt-4">
              <FeatureList items={product.applications} />
            </div>
          </div>

          <div>
            <SectionHeading title="Documents" />
            <ul className="mt-4 space-y-2">
              {product.documents.map((d) => (
                <li key={d}>
                  <a
                    href="#"
                    className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-4 py-3 transition-colors hover:border-brand-500"
                  >
                    <Icon.documents size={18} className="shrink-0 text-brand-700" />
                    <span className="type-body-sm min-w-0 flex-1 truncate font-medium text-fg">{d}</span>
                    <Icon.download size={16} className="shrink-0 text-fg-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <SectionHeading
          title="Related products"
          className="mt-12"
          action={
            <Button variant="tertiary" size="sm" iconRight={Icon.arrowRight}>
              All I.V. Infusion
            </Button>
          }
        />
        <ProductGrid className="mt-4">
          {products.slice(1, 5).map((p) => (
            <ProductCard key={p.id} product={p} price />
          ))}
        </ProductGrid>
      </Container>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const adminOrderColumns = [
  { key: 'id', header: 'Order', primary: true, sortable: true, render: (o) => <span className="tabular font-medium text-brand-700">{o.id}</span> },
  { key: 'org', header: 'Organisation', sortable: true },
  { key: 'placed', header: 'Placed', sortable: true, render: (o) => formatDate(o.placed) },
  { key: 'total', header: 'Total', align: 'right', sortable: true, render: (o) => formatINR(o.total) },
  { key: 'status', header: 'Status', render: (o) => <StatusBadge kind="order" value={o.status} size="sm" /> },
  { key: 'payment', header: 'Payment', render: (o) => <StatusDot kind="payment" value={o.payment} /> },
];

function AdminPattern() {
  const [section, setSection] = useState('dashboard');

  return (
    <div className="flex min-h-[46rem]">
      <div className="hidden w-60 shrink-0 lg:block">
        <SidebarNav
          groups={ADMIN_NAV}
          activeKey={section}
          onNavigate={setSection}
          footer={
            <button className="type-nav flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-white/70 transition-colors hover:bg-white/8 hover:text-white">
              <Avatar name="Priya Sharma" size="sm" />
              <span className="min-w-0 flex-1 truncate">Priya Sharma</span>
              <Icon.logout size={16} />
            </button>
          }
        />
      </div>

      <div className="min-w-0 flex-1 bg-canvas">
        <div className="px-6 py-6">
          <PageHeader
            title="Dashboard"
            subtitle="August 2026 · all territories"
            actions={
              <>
                <Button variant="secondary" size="sm" iconLeft={Icon.export}>
                  Export
                </Button>
                <Button size="sm" iconLeft={Icon.add}>
                  New Order
                </Button>
              </>
            }
          />

          <div className="mt-6 space-y-6">
            <MetricRow>
              <MetricCard label="Revenue" value={metrics[0].value} kind="money" delta={12.4} context="vs previous month" icon={Icon.revenue} />
              <MetricCard label="Orders" value={metrics[1].value} delta={6.1} context="vs previous month" icon={Icon.orders} />
              <MetricCard label="Customers" value={metrics[2].value} delta={2.4} context="4 new this month" icon={Icon.customers} />
              <MetricCard label="Outstanding" value={metrics[3].value} kind="money" delta={-8.2} invertDelta context="across 23 invoices" icon={Icon.invoices} />
            </MetricRow>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card padding="none" className="xl:col-span-2">
                <CardHeader title="Revenue" subtitle="Last twelve months" />
                <CardBody padding="lg">
                  <BarChart data={revenueSeries} yKey="revenue" format={formatINRCompact} caption="Revenue by month" height={220} />
                </CardBody>
              </Card>

              <Card padding="none">
                <CardHeader title="Revenue by product" />
                <CardBody padding="lg">
                  <ShareBar items={topProducts.map((p) => ({ label: p.name, value: p.revenue }))} format={formatINRCompact} />
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <SectionHeading
                  title="Recent orders"
                  action={
                    <Button variant="tertiary" size="sm" iconRight={Icon.arrowRight}>
                      All orders
                    </Button>
                  }
                />
                <DataTable
                  caption="Recent orders"
                  className="mt-4"
                  columns={adminOrderColumns}
                  rows={orders.slice(0, 7)}
                  rowKey={(o) => o.id}
                  density="compact"
                />
              </div>

              <div className="space-y-6">
                <Card padding="none">
                  <CardHeader icon={Icon.inventory} title="Stock alerts" subtitle="3 products need attention" />
                  <CardBody>
                    <div className="space-y-4">
                      {[products[1], products[4], products[9]].map((p) => (
                        <div key={p.id}>
                          <p className="type-body-sm mb-1.5 truncate font-medium text-fg">{p.name}</p>
                          <StockMeter stock={p.stock} lowStockAt={p.lowStockAt} />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card padding="none">
                  <CardHeader icon={Icon.performance} title="Agent targets" subtitle="August" />
                  <CardBody>
                    <div className="space-y-4">
                      {agents.map((a) => {
                        const pct = Math.round((a.achieved / a.target) * 100);
                        return (
                          <ProgressBar
                            key={a.id}
                            label={`${a.name} — ${formatINRCompact(a.achieved)} of ${formatINRCompact(a.target)}`}
                            value={pct}
                            tone={pct >= 100 ? 'success' : pct >= 80 ? 'warning' : 'error'}
                            showValue
                          />
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AgentPattern() {
  const agent = agents[0];
  const pct = Math.round((agent.achieved / agent.target) * 100);

  return (
    <div className="bg-canvas">
      <Container width="app" className="py-6">
        <PageHeader
          eyebrow="Agent · South — Telangana, Karnataka"
          title="Good morning, Rakesh"
          subtitle="Four orders need action today and two quotes expire this week."
          actions={
            <>
              <Button variant="secondary" size="sm" iconLeft={Icon.quotes}>
                New Quote
              </Button>
              <Button size="sm" iconLeft={Icon.add}>
                Order for Customer
              </Button>
            </>
          }
        />

        <div className="mt-6 space-y-6">
          {/* §11.3: an agent should understand their situation in 5–10 seconds.
              So: today's actionable count first, then the target, then the list. */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="type-label text-fg-secondary">Needs action today</p>
              <p className="type-metric mt-2 text-fg">4</p>
              <p className="type-caption mt-1 text-fg-secondary">2 quotes, 1 payment, 1 dispatch</p>
            </Card>
            <MetricCard label="Revenue this month" value={agent.achieved} kind="money" delta={9.2} context="vs previous month" />
            <MetricCard label="Orders" value={agent.orders} delta={4.1} context="this month" />
            <Card>
              <p className="type-label text-fg-secondary">Target</p>
              <p className="type-metric mt-2 text-fg">{pct}%</p>
              <ProgressBar className="mt-2" value={pct} tone={pct >= 100 ? 'success' : 'warning'} />
              <p className="type-caption mt-1.5 text-fg-secondary">
                {formatINRCompact(agent.achieved)} of {formatINRCompact(agent.target)}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="none">
              <CardHeader icon={Icon.quotes} title="Quotes to chase" subtitle="Two expire within seven days" />
              <CardBody padding="none">
                <ul className="divide-y divide-edge">
                  {quotes.slice(0, 4).map((q) => (
                    <li key={q.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="type-body-sm truncate font-medium text-fg">{q.org}</p>
                        <p className="type-caption tabular text-fg-secondary">
                          {q.id} · {formatINR(q.value)} · valid to {formatDate(q.validTill)}
                        </p>
                      </div>
                      <StatusBadge kind="quote" value={q.status} size="sm" />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card padding="none">
              <CardHeader icon={Icon.customers} title="My customers" subtitle="34 assigned" />
              <CardBody padding="none">
                <ul className="divide-y divide-edge">
                  {[
                    ['Apollo Hospitals, Kondapur', 'Net 45', 842000, 'active'],
                    ['Medipoint', 'Net 60', 3160000, 'active'],
                    ['Sunrise Multi-Speciality Clinic', 'Net 30', 126500, 'active'],
                    ['CityCare Nursing Home', 'Net 30', 719000, 'on-hold'],
                  ].map(([name, terms, outstanding, status]) => (
                    <li key={name} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={name} />
                      <div className="min-w-0 flex-1">
                        <p className="type-body-sm truncate font-medium text-fg">{name}</p>
                        <p className="type-caption tabular text-fg-secondary">
                          {terms} · {formatINR(outstanding)} outstanding
                        </p>
                      </div>
                      <StatusBadge kind="entity" value={status} size="sm" />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function OrderDetailPattern() {
  const order = orders[4];
  const gstPerLine = orderLines.map((l) => Math.round(l.qty * l.rate * (l.gst / 100)));
  const subtotal = orderLines.reduce((s, l) => s + l.qty * l.rate, 0);
  const gstTotal = gstPerLine.reduce((s, g) => s + g, 0);

  return (
    <div className="bg-canvas">
      <Container width="app" className="py-6">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '#' }, { label: 'Orders', href: '#' }, { label: order.id }]} />}
          title={order.id}
          subtitle={`${order.org} · ${order.po}`}
          meta={
            <>
              <StatusBadge kind="order" value={order.status} />
              <StatusBadge kind="payment" value={order.payment} />
              <span className="type-caption text-fg-secondary">Placed {formatDate(order.placed)}</span>
              <span className="type-caption flex items-center gap-1.5 text-fg-secondary">
                <Avatar name="Rakesh Iyer" size="sm" /> Rakesh Iyer
              </span>
            </>
          }
          actions={
            <>
              <Button variant="secondary" size="sm" iconLeft={Icon.print}>
                Print invoice
              </Button>
              <Button size="sm" iconLeft={Icon.shipments}>
                Mark delivered
              </Button>
            </>
          }
        />

        <div className="mt-6">
          <Panel className="p-6">
            <Stepper status={order.status} />
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card padding="none">
              <CardHeader title="Items" subtitle={`${orderLines.length} lines`} />
              <CardBody padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <caption className="sr-only-ds">Order lines</caption>
                    <thead className="bg-surface-2">
                      <tr className="border-b border-edge">
                        {['Product', 'Qty', 'Rate', 'GST', 'Amount'].map((h, i) => (
                          <th
                            key={h}
                            scope="col"
                            className={`type-th px-4 py-2.5 text-fg-secondary ${i > 0 ? 'text-right' : ''}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((l, i) => (
                        <tr key={l.code} className="border-b border-edge last:border-0">
                          <td className="px-4 py-3">
                            <p className="type-body-sm font-medium text-fg">{l.name}</p>
                            <p className="type-caption tabular text-fg-secondary">{l.code}</p>
                          </td>
                          <td className="type-body-sm tabular px-4 py-3 text-right text-fg">
                            {formatQty(l.qty)}
                            <span className="type-caption block text-fg-muted">{l.uom}</span>
                          </td>
                          <td className="type-body-sm tabular px-4 py-3 text-right text-fg">{formatINR(l.rate)}</td>
                          <td className="type-body-sm tabular px-4 py-3 text-right text-fg-secondary">{l.gst}%</td>
                          <td className="type-body-sm tabular px-4 py-3 text-right font-medium text-fg">
                            {formatINR(l.qty * l.rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            <Card padding="none">
              <CardHeader icon={Icon.audit} title="History" subtitle="Every transition, who and when" />
              <CardBody padding="lg">
                <Timeline entries={orderHistory.map((e) => ({ ...e, at: formatDateTime(e.at) }))} />
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <p className="type-h4 mb-4 text-fg">Amount</p>
              <AmountList
                rows={[
                  { label: 'Subtotal', hint: `(${orderLines.length} lines)`, value: formatINR(subtotal) },
                  { label: 'CGST', hint: '6%', value: formatINR(Math.round(gstTotal / 2)) },
                  { label: 'SGST', hint: '6%', value: formatINR(Math.round(gstTotal / 2)) },
                  { label: 'Delivery', value: formatINR(0) },
                  { label: 'Total', value: formatINR(subtotal + gstTotal), emphasis: true },
                ]}
              />
            </Card>

            <Card>
              <p className="type-h4 mb-4 text-fg">Organisation</p>
              <DescriptionList
                items={[
                  { label: 'Legal name', value: 'Apollo Health Services Pvt Ltd' },
                  { label: 'GSTIN', value: '36AABCA1234F1Z5' },
                  { label: 'Credit terms', value: 'Net 45' },
                  { label: 'Assigned agent', value: 'Rakesh Iyer' },
                ]}
              />
            </Card>

            <Card>
              <p className="type-h4 mb-4 text-fg">Shipment</p>
              <DescriptionList
                items={[
                  { label: 'Courier', value: 'Bluedart' },
                  { label: 'AWB', value: '77291184450' },
                  { label: 'Dispatched', value: formatDate('2026-08-09') },
                  { label: 'Weight', value: '42.4 kg · 3 cartons' },
                ]}
              />
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const DENSITY_ROWS = orders.slice(0, 5);
const densityColumns = [
  { key: 'id', header: 'Order', primary: true },
  { key: 'org', header: 'Organisation' },
  { key: 'total', header: 'Total', align: 'right', render: (o) => formatINR(o.total) },
  { key: 'status', header: 'Status', render: (o) => <StatusBadge kind="order" value={o.status} size="sm" /> },
];

export default function Patterns() {
  const [view, setView] = useState('customer');

  return (
    <Page
      eyebrow="Patterns"
      title="Portal patterns"
      intro="§11 gives three portal shapes and §29 gives them three densities. These are those shapes assembled from the components, at full size, with the dummy catalogue behind them — the point being that the pieces compose into real screens rather than only into a component gallery."
      spec="§11, §16, §19, §29"
    >
      <Section
        title="Three portals, one language"
        spec="§11, §29, §32 Rule 9"
        intro="Switch between them. The tokens, type scale and components are identical; the density, chrome and information priority are not. §32 Rule 9 is the test — the admin panel must not look like the marketing site, and it does not."
      >
        <div className="flex flex-wrap gap-2">
          {[
            ['customer', 'Customer — product detail', Icon.products],
            ['admin', 'Admin — dashboard', Icon.dashboard],
            ['agent', 'Agent — daily view', Icon.agents],
            ['order', 'Admin — order detail', Icon.orders],
          ].map(([key, label, glyph]) => (
            <Button
              key={key}
              size="sm"
              variant={view === key ? 'primary' : 'secondary'}
              iconLeft={glyph}
              onClick={() => setView(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-edge">
          {view === 'customer' && <CustomerPattern />}
          {view === 'admin' && <AdminPattern />}
          {view === 'agent' && <AgentPattern />}
          {view === 'order' && <OrderDetailPattern />}
        </div>
      </Section>

      <Section
        title="Density, side by side"
        spec="§29"
        intro="The same four columns and the same five rows at all three densities. Nothing changes but the row height — type size, colour and border weight are identical, which is what keeps the three portals recognisable as one product."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {[
            ['relaxed', 'Customer', '56px'],
            ['default', 'Agent', '48px'],
            ['compact', 'Admin', '40px'],
          ].map(([density, portal, h]) => (
            <div key={density}>
              <p className="type-body-sm mb-2 font-medium text-fg">
                {portal} <span className="type-caption font-normal text-fg-secondary">· {density} · {h}</span>
              </p>
              <DataTable
                caption={`${portal} density`}
                columns={densityColumns}
                rows={DENSITY_ROWS}
                rowKey={(o) => o.id}
                density={density}
                stickyHeader={false}
              />
            </div>
          ))}
        </div>

        <Decision kind="addition" title="§29 gives the densities names but no numbers">
          <p>
            Without numbers, density becomes whatever each developer types. These three — 56, 48 and 40px — are the
            classes <code className="font-mono text-[0.8125rem]">density-relaxed</code>,{' '}
            <code className="font-mono text-[0.8125rem]">density-default</code> and{' '}
            <code className="font-mono text-[0.8125rem]">density-compact</code>, and they set two custom properties that
            any table or list inside them reads.
          </p>
        </Decision>
      </Section>

      <Section
        title="What these screens are not"
        spec="—"
        intro="Worth stating so nobody mistakes the demo for the product."
      >
        <Alert tone="info" title="Static, and running on dummy.js">
          <p>
            Nothing here calls the API. The catalogue, orders, organisations, agents and quotes are the fixtures in{' '}
            <code className="font-mono text-[0.8125rem]">dummy.js</code>, shaped to match what the platform will actually
            store — 42-character product names, five-digit stock figures, an eight-state status column — because lorem ipsum
            hides exactly the layout bugs real data finds.
          </p>
          <p className="mt-2">
            The B2B entities these screens assume — organisations, agents, quotes, shipments, invoices — do not exist in the
            current Express backend yet. These patterns are the target the API can be built towards, and the shapes in
            dummy.js are the contract to match.
          </p>
        </Alert>
      </Section>
    </Page>
  );
}

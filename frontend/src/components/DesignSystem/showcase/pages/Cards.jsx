import { Icon } from '../../icons.jsx';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CategoryTile,
  MetricCard,
  MetricRow,
  Panel,
  PriceBlock,
  ProductCard,
  ProductGrid,
  ProductImage,
  SectionHeading,
  Well,
  formatINRCompact,
} from '../../index.js';
import { categories, metrics, products, topProducts } from '../../dummy.js';
import { BarChart, LineChart, ShareBar, Sparkline } from '../../ui/Chart.jsx';
import { revenueSeries } from '../../dummy.js';
import { Code, Decision, DoDont, Example, Page, PropsTable, Row, Section } from '../kit.jsx';

export default function Cards() {
  return (
    <Page
      eyebrow="Components"
      title="Cards, products & charts"
      intro="§15 fixes the product card's contents exactly and §32 Rule 8 forbids adding to it. §19 is equally specific about metric cards, including one instruction that rules out most dashboard design: no decorative graphics competing with the number."
      spec="§10, §15, §16, §19, §20, §22"
    >
      <Section
        title="Card, Panel, Well"
        spec="§9, §10"
        intro="Three containers at three radii, and the nesting order is the point: a panel (16px) contains cards (12px) which contain wells. If they shared a radius the nesting would read as a mistake. §10's default is background plus border — a shadow appears only when a card is interactive and hovered, because then it means “this responds to you”."
      >
        <Example title="The three, nested" surface="canvas">
          <Panel className="p-6">
            <SectionHeading
              title="Order AST-26-0405"
              subtitle="Apollo Hospitals, Kondapur · PO/APL/26/8802"
              action={
                <Button variant="tertiary" size="sm" iconRight={Icon.arrowRight}>
                  Full order
                </Button>
              }
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="type-label text-fg-secondary">Delivery address</p>
                <p className="type-body-sm mt-2 text-fg">
                  Apollo Hospitals, Kondapur
                  <br />
                  Central Stores, Gate 3
                  <br />
                  Hyderabad 500084, Telangana
                </p>
              </Card>
              <Card>
                <p className="type-label text-fg-secondary">Amount</p>
                <Well className="mt-2">
                  <p className="type-h4 tabular text-fg">₹6,13,760.00</p>
                  <p className="type-caption mt-0.5 text-fg-secondary">Inclusive of 12% GST · Net 45</p>
                </Well>
              </Card>
            </div>
          </Panel>
        </Example>

        <Example title="Card with header and footer" surface="canvas">
          <Card padding="none" className="max-w-md">
            <CardHeader
              icon={Icon.inventory}
              title="Stock alert"
              subtitle="2 products below threshold"
              action={
                <Button variant="tertiary" size="sm">
                  View
                </Button>
              }
            />
            <CardBody>
              <ul className="space-y-2">
                <li className="type-body-sm flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-fg">Polyfusion Micro Drip Set</span>
                  <Badge tone="warning" size="sm" icon={Icon.warning}>
                    1,840
                  </Badge>
                </li>
                <li className="type-body-sm flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-fg">Low Pressure Extension Line</span>
                  <Badge tone="error" size="sm" icon={Icon.error}>
                    0
                  </Badge>
                </li>
              </ul>
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="secondary" fullWidth>
                Create purchase order
              </Button>
            </CardFooter>
          </Card>
        </Example>
      </Section>

      <Section
        title="MetricCard"
        spec="§19"
        intro="§19's structure is label → primary metric → comparison, and its one prohibition is decorative graphics that compete with the number. So these cards have no chart, no ring, no gradient and no oversized background glyph. The number is the largest thing in each one, and nothing else is allowed to be."
      >
        <Example title="The dashboard row" surface="canvas">
          <MetricRow>
            <MetricCard label="Revenue" value={metrics[0].value} kind="money" delta={12.4} context="vs previous month" icon={Icon.revenue} />
            <MetricCard label="Orders" value={metrics[1].value} delta={6.1} context="vs previous month" icon={Icon.orders} />
            <MetricCard label="Customers" value={metrics[2].value} delta={2.4} context="4 new this month" icon={Icon.customers} />
            <MetricCard
              label="Outstanding"
              value={metrics[3].value}
              kind="money"
              delta={-8.2}
              invertDelta
              context="across 23 invoices"
              icon={Icon.invoices}
            />
          </MetricRow>
        </Example>

        <Decision kind="addition" title="invertDelta, for metrics where down is good">
          <p>
            Outstanding receivables fell 8.2%, which is the best news on that dashboard. Without{' '}
            <Code>invertDelta</Code> it renders red with a downward arrow and reads as an alarm. Same for overdue
            invoices, returns and cancellations — any metric you are trying to reduce.
          </p>
        </Decision>

        <DoDont
          doNote="§19's hierarchy. The number is the loudest thing; the delta and its arrow are support. The arrow matters because §4 forbids colour alone — a green figure and a red figure are the same string to anyone who cannot tell them apart."
          dontNote="§19 exactly: a decorative graphic competing with the number. The sparkline is bigger than the figure, the gradient adds nothing, and the actual value is now the third thing you see."
          doNode={
            <MetricCard label="Revenue" value={12485000000} kind="money" delta={12.4} context="vs previous month" />
          }
          dontNode={
            <div className="relative overflow-hidden rounded-xl border border-edge bg-gradient-to-br from-brand-600 to-brand-500 p-5 text-white">
              <Icon.revenue size={72} className="absolute -right-2 -top-2 opacity-25" />
              <p className="text-xs uppercase tracking-wider opacity-80">Revenue</p>
              <p className="mt-1 text-xl font-semibold">₹1.25Cr</p>
              <div className="mt-2 opacity-90">
                <Sparkline values={revenueSeries.map((r) => r.revenue)} width={160} height={40} />
              </div>
            </div>
          }
        />
      </Section>

      <Section
        title="ProductCard"
        spec="§15, §32 Rules 8 and 11"
        intro="§15's card is image → CATEGORY → name → product code → View Details, and §32 Rule 8 forbids adding to it. Specifications, applications, HSN and GST live on the detail page that §16 lays out. The card's job is to be chosen from, not read."
      >
        <Example title="The §15 grid card" surface="canvas">
          <ProductGrid>
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </Example>

        <Example title="With price and stock — the signed-in B2B view" surface="canvas">
          <ProductGrid>
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} price stock />
            ))}
          </ProductGrid>
        </Example>

        <Decision kind="open" title="Whether prices appear at all is question 25 of Overview §44">
          <p>
            It is unanswered, and it has two different answers for a logged-out visitor and a hospital with negotiated
            rates. So price is a prop, the card is correct with and without it, and when the client decides, one flag
            changes rather than a component. <Code>stock</Code> is off by default for the same reason plus §32 Rule 8 — a
            stock figure is an operations concern that only matters once someone is ordering.
          </p>
        </Decision>

        <Example title="Row variant — for search results and dense listings" surface="canvas">
          <div className="space-y-3">
            {products.slice(4, 7).map((p) => (
              <ProductCard key={p.id} product={p} variant="row" price stock />
            ))}
          </div>
        </Example>

        <Decision kind="change" title="No photography, and the placeholder is deliberate">
          <p>
            §22 ranks actual Aayursurgi product photography first and explicitly rejects generic stock imagery, so this
            system ships none rather than the wrong kind. The placeholder holds the exact 4:3 box the real photo will
            occupy — dropping photography in later changes no layout — and shows the category glyph and product code so the
            card stays identifiable. It doubles as the missing-image state the catalogue needs permanently, for a product
            an admin adds before its photo is ready.
          </p>
          <p>
            When real images arrive they render <Code>object-contain</Code>, not <Code>cover</Code>. A cropped infusion set
            is a misleading product photograph; letterboxing on surface-2 is the honest option.
          </p>
        </Decision>

        <Example title="ProductImage — placeholder and ratios" surface="surface">
          <div className="grid gap-4 sm:grid-cols-3">
            {['card', 'square', 'wide'].map((ratio) => (
              <div key={ratio}>
                <ProductImage ratio={ratio} code="AST-IV-1001" alt="Polyfusion" icon={Icon.infusion} className="rounded-lg border border-edge" />
                <p className="type-caption mt-2 text-fg-muted">{ratio}</p>
              </div>
            ))}
          </div>
        </Example>

        <Example title="PriceBlock" surface="surface">
          <Row align="start">
            <PriceBlock product={products[0]} />
            <PriceBlock product={products[2]} />
            <PriceBlock product={products[0]} compact />
          </Row>
          <p className="type-caption mt-4 max-w-2xl text-fg-secondary">
            The “+ 12% GST” line is not decoration. A buyer approving a purchase needs to know whether the figure includes
            tax, and “₹42.50” alone does not say. Exclusive-of-tax is the B2B convention, so the card says so.
          </p>
        </Example>
      </Section>

      <Section
        title="CategoryTile"
        spec="§11.1, §12"
        intro="The category row from §11.1's customer-portal sketch, over §12's taxonomy. The whole tile is one link rather than a card containing a link — a category has exactly one destination, and splitting it would give the same target two tab stops."
      >
        <Example surface="canvas">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <CategoryTile key={c.slug} name={c.name} count={c.count} icon={Icon[c.icon]} href="#" />
            ))}
          </div>
        </Example>
      </Section>

      <Section
        title="Charts"
        spec="§20"
        intro="§20 is three sentences and a colour table, and all three sentences are restrictions: restrained colours, no rainbows, charts communicate information rather than decoration. The series colours are §20's mapping exactly — revenue brand-600, orders brand-500, customers brand-900, profit success. Four is the whole vocabulary."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">Revenue by month</p>
            <BarChart data={revenueSeries} yKey="revenue" series="revenue" format={(v) => formatINRCompact(v)} caption="Revenue by month" />
          </Card>
          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">Revenue trend</p>
            <LineChart
              data={revenueSeries}
              lines={[{ key: 'revenue', series: 'revenue' }]}
              format={(v) => formatINRCompact(v)}
              caption="Revenue trend"
            />
          </Card>
          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">Revenue by product</p>
            <ShareBar items={topProducts.map((p) => ({ label: p.name, value: p.revenue }))} format={formatINRCompact} caption="Revenue by product" />
          </Card>
          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">Sparklines, inline</p>
            <ul className="space-y-3">
              {topProducts.slice(0, 4).map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="type-body-sm min-w-0 flex-1 truncate text-fg">{p.name}</span>
                  <Sparkline values={revenueSeries.slice(i).map((r) => r.revenue)} series={i % 2 ? 'orders' : 'revenue'} />
                  <span className="type-body-sm tabular w-20 shrink-0 text-right font-medium text-fg">
                    {formatINRCompact(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Decision kind="addition" title="Four SVG primitives, no charting library">
          <p>
            Recharts or Chart.js arrives with its own palette, type scale, tooltip and grid lines — four decisions this
            document has already made, differently — and overriding all of them is more work than drawing a bar, with every
            upgrade putting them back. When a real analytics screen needs axes, zoom and brushing, that is the moment to add
            a library and theme it against <Code>tokens.js</Code> on the way in.
          </p>
          <p>
            Every chart here is <Code>aria-hidden</Code> and ships with a visually hidden <Code>&lt;table&gt;</Code> of the
            same numbers. A chart that is only pixels is unreadable to a screen reader and §24 does not exempt data
            visualisation — and it means the figures are selectable, which is what the person doing the monthly report
            wants anyway.
          </p>
        </Decision>

        <Decision kind="change" title="A stacked bar instead of a pie or donut">
          <p>
            Comparing lengths is easier than comparing angles; a donut with a figure in the hole is the decorative graphic
            competing with the number that §19 rules out; and five slices need five colours, one more than §20 permits. A
            stacked share bar needs no additional colour and stays readable at any width.
          </p>
        </Decision>
      </Section>

      <Section title="Props — MetricCard & ProductCard" spec="§15, §19">
        <PropsTable
          rows={[
            ['label', 'string', '—', 'The §19 label. Rendered as type-label.'],
            ['value', 'number', '—', 'Paise when kind is money.'],
            ['kind', "'count' | 'money' | 'percent'", "'count'", 'Chooses the formatter. Money uses lakh/crore compaction.'],
            ['delta', 'number', '—', 'Signed percentage. Renders with an arrow, never colour alone.'],
            ['invertDelta', 'boolean', 'false', 'For metrics where a fall is good — outstanding, overdue, returns.'],
            ['context', 'string', '—', 'The §19 comparison line — “vs previous month”.'],
          ]}
        />
        <PropsTable
          rows={[
            ['product', 'Product', '—', 'The shape in dummy.js.'],
            ['variant', "'grid' | 'row'", "'grid'", 'Grid is §15’s card. Row is for search results.'],
            ['price', 'boolean', 'false', 'Open question — Overview §44 q25.'],
            ['stock', 'boolean', 'false', 'Off in the public catalogue per §32 Rule 8.'],
            ['onView', '() => void', '—', 'The single §15 action.'],
          ]}
        />
      </Section>
    </Page>
  );
}

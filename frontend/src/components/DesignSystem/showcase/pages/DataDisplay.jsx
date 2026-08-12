import { Icon } from '../../icons.jsx';
import {
  AmountList,
  Avatar,
  Badge,
  Card,
  Chip,
  CountBadge,
  DescriptionList,
  Divider,
  FeatureList,
  ProgressBar,
  STATUS_SETS,
  SpecTable,
  Stat,
  StatusBadge,
  StatusDot,
  StockMeter,
  formatINR,
} from '../../index.js';
import { products } from '../../dummy.js';
import { Code, Decision, DoDont, Example, Page, PropsTable, Row, Section, SubSection } from '../kit.jsx';

const product = products[0];

const KINDS = [
  { kind: 'order', label: 'Order', spec: '§28 — eight forward states, four exceptions' },
  { kind: 'payment', label: 'Payment', spec: 'Overview §19 — separate from the order' },
  { kind: 'quote', label: 'Quote', spec: '§15 — the only entity that expires' },
  { kind: 'stock', label: 'Stock', spec: '§18 names “Low Stock” as a badge' },
  { kind: 'entity', label: 'Entity', spec: 'Products, organisations, agents, users' },
];

export default function DataDisplay() {
  return (
    <Page
      eyebrow="Components"
      title="Status & data display"
      intro="§18 asks for compact semantic badges and gives six examples, every one of which is a glyph plus a word. That is not a stylistic preference — it is §4 and §32 Rule 5 made concrete, and it is why status in this system is a registry rather than a colour prop."
      spec="§4, §18, §28, §32 Rule 5"
    >
      <Section
        title="Status is a registry"
        spec="§28"
        intro="One map per lifecycle, each entry naming its label, tone and glyph together. A status column, a filter dropdown, a stepper and an audit trail all read the same map — so “Out for Delivery” is spelled and coloured identically in four places, and adding a state is one line."
      >
        {KINDS.map(({ kind, label, spec }) => (
          <SubSection key={kind} title={label} intro={spec}>
            <Example surface="surface">
              <Row>
                {Object.keys(STATUS_SETS[kind]).map((value) => (
                  <StatusBadge key={value} kind={kind} value={value} />
                ))}
              </Row>
            </Example>
          </SubSection>
        ))}

        <Decision kind="addition" title="Nothing in flight is green">
          <p>
            The order progression runs neutral → info while work is happening, brand at dispatch when it leaves the
            building, and success <em>only</em> at Delivered. An operations screen where six of eight states are green
            cannot be scanned — the colour has stopped carrying information. Exceptions are the only other places colour
            appears: error for cancelled and rejected, warning for the two return states.
          </p>
        </Decision>

        <Decision kind="change" title="Badges are 8px, not pills">
          <p>
            §9 lists a pill radius but also says “avoid making every component a pill”, and §2 asks for precision. So
            state — something the system asserts — is squared at 8px, and the pill is reserved for <Code>Chip</Code>,
            which is a token the user put there and can remove. The shape carries the difference between “the system says
            this” and “you chose this”.
          </p>
        </Decision>
      </Section>

      <Section
        title="Variants and sizes"
        spec="§18"
        intro="Soft is the default and covers almost everything. Solid is for high emphasis on a dark surface or a count. Outline is for a badge that must not compete with a filled control beside it."
      >
        <Example title="soft · solid · outline" surface="surface">
          <div className="space-y-4">
            {['soft', 'solid', 'outline'].map((variant) => (
              <div key={variant}>
                <p className="type-caption mb-2 font-mono text-fg-muted">{variant}</p>
                <Row>
                  {['neutral', 'brand', 'success', 'warning', 'error', 'info'].map((tone) => (
                    <Badge key={tone} tone={tone} variant={variant}>
                      {tone}
                    </Badge>
                  ))}
                </Row>
              </div>
            ))}
          </div>
        </Example>

        <Example title="Sizes, and the compact dot form" surface="surface">
          <div className="space-y-4">
            <Row>
              <StatusBadge kind="order" value="dispatched" size="sm" />
              <StatusBadge kind="order" value="dispatched" size="md" />
            </Row>
            <Divider />
            <div>
              <p className="type-caption mb-2 text-fg-secondary">
                StatusDot — for a dense table where a full badge in every row turns the column into wallpaper. The dot is
                decoration; the label carries the meaning.
              </p>
              <div className="space-y-1.5">
                {['placed', 'processing', 'dispatched', 'delivered', 'cancelled'].map((v) => (
                  <StatusDot key={v} kind="order" value={v} />
                ))}
              </div>
            </div>
          </div>
        </Example>

        <DoDont
          doNote="Glyph plus word. Legible in greyscale, at 12px, and to anyone who cannot distinguish the two tints."
          dontNote="§4 and §32 Rule 5. Two dots, no labels — the entire meaning is in a hue, and roughly one in twelve men cannot read it."
          doNode={
            <Row>
              <StatusBadge kind="order" value="delivered" />
              <StatusBadge kind="order" value="cancelled" />
            </Row>
          }
          dontNode={
            <Row>
              <span className="size-3 rounded-full bg-success" />
              <span className="size-3 rounded-full bg-error" />
            </Row>
          }
        />
      </Section>

      <Section
        title="Non-status badges"
        spec="§18"
        intro="Badge on its own is for labels that are not lifecycle states — a tax rate, a pack size, a property of the product. §18's “do not use more than necessary” applies most here."
      >
        <Example surface="surface">
          <Row>
            <Badge>GST 12%</Badge>
            <Badge>100 pcs / box</Badge>
            <Badge>MOQ 100 pieces</Badge>
            <Badge tone="brand" icon={Icon.verified}>
              Sterile
            </Badge>
            <Badge tone="brand" icon={Icon.certified}>
              CE marked
            </Badge>
            <Badge tone="neutral" icon={Icon.documents}>
              3 documents
            </Badge>
          </Row>
        </Example>

        <Example title="Chips are removable, and pill-shaped for that reason" surface="surface">
          <Row>
            <Chip icon={Icon.categories} onRemove={() => {}}>
              I.V. Infusion
            </Chip>
            <Chip onRemove={() => {}}>In stock only</Chip>
            <Chip onRemove={() => {}}>₹40 – ₹200</Chip>
            <Chip>Not removable</Chip>
          </Row>
        </Example>

        <Example title="Counts" surface="surface">
          <Row>
            <span className="type-body-sm flex items-center gap-2 text-fg">
              Orders <CountBadge value={12} />
            </span>
            <span className="type-body-sm flex items-center gap-2 text-fg">
              Quotes <CountBadge value={4} tone="brand" />
            </span>
            <span className="type-body-sm flex items-center gap-2 text-fg">
              Unread <CountBadge value={128} tone="brand" />
            </span>
          </Row>
        </Example>
      </Section>

      <Section
        title="Key–value display"
        spec="§13, §16, §19"
        intro="A B2B screen is mostly label-and-value pairs: GSTIN, HSN, PO number, credit terms, delivery address. All three components below render real <dl> markup, so a screen reader pairs each term with its definition."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">DescriptionList</p>
            <DescriptionList
              columns={2}
              items={[
                { label: 'Product code', value: 'AST-IV-1001' },
                { label: 'HSN code', value: '90183930' },
                { label: 'Unit of measure', value: 'Piece' },
                { label: 'Pack size', value: '100 pcs / box' },
                { label: 'GST rate', value: '12%' },
                { label: 'Shelf life', value: '36 months' },
              ]}
            />
          </Card>

          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">AmountList</p>
            <AmountList
              rows={[
                { label: 'Subtotal', hint: '(4 lines)', value: formatINR(18420000) },
                { label: 'CGST', hint: '6%', value: formatINR(1105200) },
                { label: 'SGST', hint: '6%', value: formatINR(1105200) },
                { label: 'Delivery', value: formatINR(400000) },
                { label: 'Total', value: formatINR(21030400), emphasis: true },
              ]}
            />
          </Card>
        </div>

        <Example title="SpecTable — the §16 “key specifications” block" surface="surface">
          <div className="max-w-xl">
            <SpecTable specs={product.specs} />
          </div>
        </Example>

        <Example title="FeatureList — trust signals" surface="surface">
          <FeatureList items={['Sterile — ethylene oxide', 'Latex-free', 'CE marked', 'DEHP-free PVC', 'ISO 8536-4 compliant spike']} />
        </Example>
      </Section>

      <Section
        title="Progress, meters and figures"
        spec="§19, §11.3"
        intro="A bar is never the authoritative figure — the number beside it is. Nobody reorders stock from a bar."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">Stock, against its own threshold</p>
            <div className="space-y-5">
              {[products[0], products[1], products[4]].map((p) => (
                <div key={p.id}>
                  <p className="type-body-sm mb-1.5 font-medium text-fg">{p.name}</p>
                  <StockMeter stock={p.stock} lowStockAt={p.lowStockAt} />
                </div>
              ))}
            </div>
            <p className="type-caption mt-4 text-fg-secondary">
              The reorder threshold is drawn as a tick rather than implied by the colour change, so “how close is this to
              reordering” is answerable at a glance and the state is not carried by hue alone.
            </p>
          </Card>

          <Card padding="lg">
            <p className="type-h4 mb-4 text-fg">Targets</p>
            <div className="space-y-5">
              <ProgressBar label="Rakesh Iyer — ₹3.91L of ₹4.5L" value={87} tone="warning" showValue />
              <ProgressBar label="Meera Nair — ₹4.04L of ₹3.8L" value={106} tone="success" showValue />
              <ProgressBar label="Devika Rao — ₹1.86L of ₹3.0L" value={62} tone="error" showValue />
              <ProgressBar label="Upload progress" value={40} tone="brand" size="sm" />
            </div>
            <p className="type-caption mt-4 text-fg-secondary">
              Tone is information here, not decoration: behind is warning, met is success, well behind is error. That is
              what an agent opens the screen to find out (§11.3).
            </p>
          </Card>
        </div>

        <Example title="Stat — a figure inside a card that already has a heading" surface="surface">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Invoices overdue" value="23" tone="error" />
            <Stat label="New customers" value="4" tone="success" />
            <Stat label="Awaiting dispatch" value="12" tone="warning" />
            <Stat label="Average order value" value="₹35,850" />
          </div>
        </Example>
      </Section>

      <Section
        title="Avatars"
        spec="§22"
        intro="Initials on a brand tint, no photographs. §22 spends its length arguing that imagery should be products, and a B2B roster of stock-photo faces is exactly the generic healthcare imagery it rules out. The tint is derived from the name, so the same person is the same colour on every screen."
      >
        <Example surface="surface">
          <Row>
            {['Rakesh Iyer', 'Meera Nair', 'Devika Rao', 'Sanjay Menon', 'Priya Sharma'].map((name) => (
              <span key={name} className="flex items-center gap-2">
                <Avatar name={name} />
                <span className="type-body-sm text-fg">{name}</span>
              </span>
            ))}
          </Row>
          <Row className="mt-4" align="center">
            <Avatar name="Rakesh Iyer" size="sm" />
            <Avatar name="Rakesh Iyer" size="md" />
            <Avatar name="Rakesh Iyer" size="lg" />
          </Row>
        </Example>
      </Section>

      <Section title="Props — StatusBadge" spec="§18">
        <PropsTable
          rows={[
            ['kind', "'order' | 'payment' | 'quote' | 'stock' | 'entity'", "'order'", 'Which registry to read.'],
            ['value', 'string', '—', 'A key in that registry. An unknown key renders neutral with the raw value rather than blank.'],
            ['variant', "'soft' | 'solid' | 'outline'", "'soft'", 'Soft covers almost everything.'],
            ['size', "'sm' | 'md'", "'md'", '20px or 24px tall. sm for table cells.'],
          ]}
        />
      </Section>
    </Page>
  );
}

import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import {
  ADMIN_NAV,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  CustomerHeader,
  Pagination,
  SidebarNav,
  Stepper,
  TabPanel,
  Tabs,
  Timeline,
  formatDateTime,
} from '../../index.js';
import { ORDER_FLOW, ORDER_STATUS } from '../../ui/Badge.jsx';
import { orderHistory } from '../../dummy.js';
import { Code, Decision, DoDont, Example, Page, PropsTable, Row, Section } from '../kit.jsx';

const CUSTOMER_NAV = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'about', label: 'About' },
  { key: 'support', label: 'Support' },
  { key: 'account', label: 'Account' },
];

export default function NavigationPage() {
  const [tab, setTab] = useState('items');
  const [adminSection, setAdminSection] = useState('orders');
  const [status, setStatus] = useState('dispatched');
  const [page, setPage] = useState(3);

  return (
    <Page
      eyebrow="Components"
      title="Navigation"
      intro="§12 gives two navigations and the difference between them is the point: customer navigation is six flat items, admin navigation is twenty-plus grouped under seven business headings. One component cannot be both, so there are two — and §32 Rule 9 is enforced here more than anywhere else in the system."
      spec="§11, §12, §16, §28, §32 Rule 9"
    >
      <Section
        title="Two navigations, deliberately unalike"
        spec="§12, §32 Rule 9"
        intro="Same tokens, same type scale, deliberately different weight. The customer header is white, spacious and horizontal. The admin sidebar is brand-900, dense and vertical."
      >
        <Example title="Customer — §12's six items" surface="canvas" padded={false}>
          <CustomerHeader items={CUSTOMER_NAV} activeKey="products" cartCount={3} />
          <div className="grid place-items-center py-10">
            <p className="type-caption text-fg-muted">page content</p>
          </div>
        </Example>

        <Example title="Admin — §12's groups, in §12's order" surface="canvas" padded={false}>
          <div className="flex h-[32rem]">
            <div className="w-60 shrink-0">
              <SidebarNav
                groups={ADMIN_NAV}
                activeKey={adminSection}
                onNavigate={setAdminSection}
                footer={
                  <button className="type-nav flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-white/70 transition-colors hover:bg-white/8 hover:text-white">
                    <Avatar name="Priya Sharma" size="sm" />
                    <span className="min-w-0 flex-1 truncate">Priya Sharma</span>
                    <Icon.logout size={16} />
                  </button>
                }
              />
            </div>
            <div className="grid flex-1 place-items-center bg-canvas">
              <p className="type-body-sm text-fg-muted">{adminSection}</p>
            </div>
          </div>
        </Example>

        <Decision kind="addition" title="Group headings are labels, not buttons">
          <p>
            Seven collapsible sections is seven decisions before you can navigate. §12's grouping exists to help scanning,
            not to hide things — so the groups are always open and the sidebar scrolls.
          </p>
          <p>
            The active item is marked three ways: a brand-500 left bar, a lighter background, and{' '}
            <Code>aria-current="page"</Code>. §4's rule about not relying on colour applies to navigation state too.
          </p>
        </Decision>
      </Section>

      <Section
        title="Breadcrumb"
        spec="§16"
        intro="§16 puts a breadcrumb at the top of the product detail hierarchy, and §12's four-level taxonomy is unusable without one."
      >
        <Example surface="surface">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Home', href: '#' },
                { label: 'I.V. Infusion', href: '#' },
                { label: 'Standard Infusion Sets', href: '#' },
                { label: 'Polyfusion I.V. Infusion Set with Airvent Spike' },
              ]}
            />
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '#' },
                { label: 'Orders', href: '#' },
                { label: 'AST-26-0405' },
              ]}
            />
          </div>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            The last item is not a link — it is <Code>aria-current="page"</Code> and rendered as text. A breadcrumb whose
            final item navigates to the page you are already on is a control that does nothing. Trails longer than three
            collapse in the middle on mobile rather than wrapping to three lines: the first and last two orient you, the
            middle rarely does.
          </p>
        </Card>
      </Section>

      <Section
        title="Tabs"
        spec="§16"
        intro="For sections of one record — an order's items, shipment, invoice and history. Not for moving between pages; that is the sidebar's job."
      >
        <Example surface="surface">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'items', label: 'Items', count: 11, icon: Icon.products },
              { value: 'shipment', label: 'Shipment', icon: Icon.shipments },
              { value: 'invoice', label: 'Invoice', icon: Icon.invoices },
              { value: 'history', label: 'History', count: 5, icon: Icon.audit },
              { value: 'documents', label: 'Documents', count: 0, disabled: true, icon: Icon.documents },
            ]}
          />
          <TabPanel id="items" value={tab}>
            <p className="type-body-sm text-fg-secondary">Eleven order lines would render here.</p>
          </TabPanel>
          <TabPanel id="shipment" value={tab}>
            <p className="type-body-sm text-fg-secondary">Bluedart · AWB 77291184450 · dispatched 9 Aug 2026.</p>
          </TabPanel>
          <TabPanel id="invoice" value={tab}>
            <p className="type-body-sm text-fg-secondary">Invoice INV-26-0388, ₹6,13,760.00, due 23 Sep 2026.</p>
          </TabPanel>
          <TabPanel id="history" value={tab}>
            <Timeline entries={orderHistory.map((e) => ({ ...e, at: formatDateTime(e.at) }))} />
          </TabPanel>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            Arrow keys move between tabs; Tab itself moves out of the tablist and into the panel, so a five-tab record does
            not cost five tab stops on the way past. The counts matter on an admin screen — “Documents 0” tells you not to
            click before you click.
          </p>
        </Card>
      </Section>

      <Section
        title="Stepper — the §28 lifecycle"
        spec="§28"
        intro="Eight forward states and four exceptions, read from the same registry the badges and the audit trail read. Change the status to see it move."
      >
        <Row className="mb-4">
          {[...ORDER_FLOW, 'cancelled', 'returned'].map((s) => (
            <Button key={s} size="sm" variant={status === s ? 'primary' : 'secondary'} onClick={() => setStatus(s)}>
              {ORDER_STATUS[s].label}
            </Button>
          ))}
        </Row>

        <Example title={`status: ${status}`} surface="surface">
          <Stepper status={status} />
        </Example>

        <Decision kind="addition" title="An exception state halts the track rather than sitting in it">
          <p>
            Cancelled and Returned are not steps. Rendering a cancelled order at 60% progress is a lie the UI is telling —
            so passing an exception state replaces the track with a halted panel that says the order left the normal flow
            and points at the history for why.
          </p>
          <p>
            Below <Code>sm</Code> the track collapses to “Step 5 of 8 — Dispatched” plus a bar. Eight labels squeezed into
            360px produces eight unreadable labels, which is worse than one readable sentence.
          </p>
        </Decision>
      </Section>

      <Section
        title="Timeline"
        spec="§28, Overview §25"
        intro="§28 requires status history to be auditable and Overview §25 wants who-did-what-when on every important transition. That is three facts per entry — status, actor, timestamp — and this component takes all three."
      >
        <Example surface="surface">
          <div className="max-w-xl">
            <Timeline entries={orderHistory.map((e) => ({ ...e, at: formatDateTime(e.at) }))} />
          </div>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            Oldest first. A trail is read as a narrative, and reversing it puts “Confirmed by Priya Sharma” above “Placed by
            Rakesh Iyer”, which describes an order that cannot have happened.
          </p>
        </Card>
      </Section>

      <Section
        title="Pagination"
        spec="§17"
        intro="§17 asks for pagination and says nothing about its shape. The count on the left is not decoration — “1–20 of 348” is how someone knows their filter did something."
      >
        <Example surface="surface">
          <div className="space-y-6">
            <Pagination page={page} pageSize={20} total={348} onPageChange={setPage} />
            <Pagination page={1} pageSize={20} total={12} onPageChange={() => {}} />
            <Pagination page={1} pageSize={20} total={0} onPageChange={() => {}} />
          </div>
        </Example>

        <DoDont
          doLabel="Windowed"
          dontLabel="Every page"
          doNote="Five pages plus first, last and ellipses. Reaching page 14 of 18 takes one click either way."
          dontNote="Eighteen buttons for 348 rows. It is a worse control than a first/last pair, and it wraps to two lines on a tablet."
          doNode={<Pagination page={9} pageSize={20} total={348} onPageChange={() => {}} />}
          dontNode={
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 18 }, (_, i) => (
                <button
                  key={i}
                  className={`tabular h-8 min-w-8 rounded-lg px-2 text-sm font-medium ${
                    i === 8 ? 'bg-brand-600 text-white' : 'text-fg-secondary hover:bg-surface-2'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          }
        />
      </Section>

      <Section title="Props" spec="§12, §28">
        <PropsTable
          rows={[
            ['SidebarNav groups', '{label?, items[]}[]', '[]', 'ADMIN_NAV is §12’s structure as data.'],
            ['SidebarNav activeKey', 'string', '—', 'Sets aria-current and the brand-500 indicator.'],
            ['Breadcrumb items', '{label, href?}[]', '[]', 'The last item is rendered as text, not a link.'],
            ['Tabs tabs', '{value, label, icon?, count?, disabled?}[]', '[]', 'Arrow keys move; Tab exits the list.'],
            ['Stepper status', 'ORDER_STATUS key', '—', 'An exception key halts the track instead of filling it.'],
            ['Timeline entries', '{status, at, by, note?}[]', '[]', 'Oldest first.'],
            ['Pagination total', 'number', '0', 'Row count, not page count. Drives the “1–20 of 348” line.'],
          ]}
        />
      </Section>
    </Page>
  );
}

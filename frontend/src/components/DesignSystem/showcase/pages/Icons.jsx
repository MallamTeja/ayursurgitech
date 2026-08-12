import { Alert, Card, IconButton } from '../../index.js';
import { ICON_NAMES, ICON_SIZE, Icon } from '../../icons.jsx';
import { Code, Decision, Example, Page, Row, Section, Specimen } from '../kit.jsx';

// The registry, grouped for reading. Keys match icons.jsx.
const GROUPS = [
  {
    label: 'Admin navigation',
    note: '§12\'s groups, in §12\'s order. Semantic keys, so swapping a glyph is one edit here rather than a search across every screen.',
    keys: ['dashboard', 'products', 'categories', 'documents', 'orders', 'quotes', 'customers', 'inventory', 'shipments', 'warehouse', 'agents', 'organizations', 'users', 'invoices', 'payments', 'revenue', 'reports', 'performance', 'notifications', 'audit', 'settings'],
  },
  {
    label: 'Actions',
    keys: ['add', 'remove', 'search', 'filter', 'sort', 'edit', 'delete', 'download', 'upload', 'print', 'copy', 'retry', 'externalLink', 'attach', 'show', 'hide', 'logout', 'menu', 'close', 'more', 'moreVertical', 'drag', 'collapse', 'export'],
  },
  {
    label: 'Direction',
    keys: ['chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight', 'first', 'last', 'arrowLeft', 'arrowRight'],
  },
  {
    label: 'Status',
    note: 'The glyph half of “never colour alone” (§4). These are what the status registries reference.',
    keys: ['check', 'success', 'warning', 'error', 'danger', 'info', 'pending', 'active', 'neutral', 'spinner', 'verified', 'certified', 'approved', 'blocked', 'help', 'empty', 'noImage'],
  },
  {
    label: 'Commerce',
    keys: ['rupee', 'tag', 'cash', 'discount', 'trendUp', 'trendDown', 'cart', 'spec'],
  },
  {
    label: 'Domain',
    note: '§22 wants the product to be the hero; these stand in for it in navigation, category tiles and empty states, where a photograph cannot go.',
    keys: ['infusion', 'clinical', 'pharma', 'vitals', 'lab', 'microscope', 'temperature', 'cardiac', 'wound'],
  },
  { label: 'Misc', keys: ['calendar', 'location', 'phone', 'mail', 'star'] },
];

export default function Icons() {
  const grouped = new Set(GROUPS.flatMap((g) => g.keys));
  const ungrouped = ICON_NAMES.filter((n) => !grouped.has(n));

  return (
    <Page
      eyebrow="Foundations"
      title="Iconography"
      intro="Lucide, and only Lucide. §21 mandates it and §32 Rule 6 forbids mixing families, so every icon in the system comes through one module that applies §21's stroke weight and size defaults once."
      spec="§21, §32 Rule 6"
    >
      <Section
        title="The defaults"
        spec="§21"
        intro="§21 asks for a 1.5–2px stroke, simple geometry, consistent size and minimal decorative use. Two of those are enforceable in code, and are."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="type-h4 text-fg">Stroke 1.75px</p>
            <p className="type-body-sm mt-2 text-fg-secondary">
              Lucide ships 2px. 1.75 is the middle of the range §21 permits and sits better beside Inter at 14px, which is
              most of the admin UI.
            </p>
            <Row className="mt-4">
              {[1.5, 1.75, 2].map((w) => (
                <Specimen key={w} label={`${w}px`}>
                  <Icon.products size={28} strokeWidth={w} className="text-brand-700" />
                </Specimen>
              ))}
            </Row>
          </Card>
          <Card>
            <p className="type-h4 text-fg">Four sizes</p>
            <p className="type-body-sm mt-2 text-fg-secondary">§21's ladder. 20px is the default, so the common case needs no prop.</p>
            <Row className="mt-4" align="end">
              {Object.entries(ICON_SIZE).map(([name, size]) => (
                <Specimen key={name} label={`${name} · ${size}`}>
                  <Icon.orders size={size} className="text-brand-700" />
                </Specimen>
              ))}
            </Row>
          </Card>
        </div>

        <Alert tone="info" title="aria-hidden is the default">
          <p>
            An icon beside a text label must not be announced twice, and an icon that is a control's only content takes its
            name from the control's <Code>aria-label</Code> — never from the glyph. <Code>IconButton</Code> makes that
            label a required-looking prop for exactly this reason, and <Code>Button</Code> warns in development if an
            icon-only button has no accessible name.
          </p>
        </Alert>
      </Section>

      <Section
        title="The set"
        spec="§21"
        intro="Curated rather than exhaustive. Lucide has around 1,600 icons; shipping a lookup over all of them would defeat tree-shaking and put the whole library in the bundle, so every icon here is a static named import and only what is used ships."
      >
        {GROUPS.map((group) => (
          <div key={group.label}>
            <h3 className="type-h4 text-fg">{group.label}</h3>
            {group.note && <p className="type-body-sm mt-1.5 max-w-3xl text-fg-secondary">{group.note}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.keys.map((key) => {
                const Glyph = Icon[key];
                if (!Glyph) return null;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 rounded-lg border border-edge bg-surface px-3 py-2.5"
                  >
                    <Glyph size={18} className="shrink-0 text-brand-700" />
                    <code className="type-caption min-w-0 truncate font-mono text-fg-secondary">{key}</code>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <Card>
            <p className="type-body-sm text-fg-secondary">
              Exported but not grouped above: {ungrouped.map((n) => <Code key={n} className="mr-1">{n}</Code>)}
            </p>
          </Card>
        )}
      </Section>

      <Section
        title="Usage"
        spec="§21"
        intro="Semantic keys where the domain has a word for the thing, literal keys where it does not."
      >
        <Example title="In context" surface="surface">
          <Row>
            <IconButton icon={Icon.edit} label="Edit product" variant="secondary" />
            <IconButton icon={Icon.delete} label="Delete product" variant="secondary" />
            <IconButton icon={Icon.more} label="More actions" />
            <span className="type-body-sm flex items-center gap-1.5 text-fg">
              <Icon.warning size={16} className="text-warning" />
              1,840 units — below threshold
            </span>
          </Row>
        </Example>

        <Decision kind="addition" title="The existing shop has its own hand-rolled icons">
          <p>
            <Code>src/components/icons.jsx</Code> holds a bespoke set drawn for the navy/copper shop. §32 Rule 6 forbids
            mixing families, so a screen built on this design system should not import from it — treat that file as the
            legacy system's, and this one as the v1.0 system's.
          </p>
        </Decision>
      </Section>
    </Page>
  );
}

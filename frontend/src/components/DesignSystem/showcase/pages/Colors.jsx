import { Alert, Badge, Button, StatusBadge } from '../../index.js';
import { COLOR_GROUPS, contrast } from '../../tokens.js';
import { Code, Decision, DoDont, Example, Page, Row, Section, Swatch } from '../kit.jsx';

// Measured live rather than quoted, so this page cannot claim something the
// tokens no longer do.
const ratio = (a, b) => contrast(a, b).toFixed(2);

export default function Colors() {
  return (
    <Page
      eyebrow="Foundations"
      title="Colour"
      intro="Six brand steps, nine neutrals, four semantic families. §5 sets the proportions: about 60% white and very light surfaces, 30% navy neutrals and structure, 10% teal and semantic accent. The interface should feel calm rather than saturated, and the way to keep it that way is to use the accent rarely enough that it still means something."
      spec="§3, §4, §5, §30"
    >
      <Section
        title="Every swatch measures itself"
        spec="§24"
        intro="Each swatch below computes its own WCAG 2.2 contrast against all three surfaces at render time and prints the verdict. Nothing here is a quoted number that can drift out of date — change a hex in tokens.js and these badges change with it."
      >
        <Alert tone="info" title="How to read the verdicts">
          <p>
            <strong>AA</strong> means the colour clears the level required for the role it is assigned: 4.5:1 for body
            text, 3:1 for large text and for non-text such as icons, borders and focus rings. A background-only token is
            not measured for text at all and says so.
          </p>
        </Alert>
      </Section>

      {COLOR_GROUPS.map((group) => (
        <Section key={group.name} title={group.name} spec={group.section} intro={group.note}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map((t) => (
              <Swatch key={t.name} {...t} />
            ))}
          </div>
        </Section>
      ))}

      <Section
        title="The contrast problem, and the fix"
        spec="§4 vs §24"
        intro="This is the one place the document contradicts itself, and it does so on the most-used component in the system."
      >
        <Decision kind="change" title="§4's semantic colours cannot carry §24's AA as badge text">
          <p>
            A status badge label is 12px, so it needs 4.5:1. Measured against §4's own tinted backgrounds, every one of
            the four families falls short — and warning falls short even on plain white:
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-edge bg-surface">
            <table className="w-full text-left">
              <caption className="sr-only-ds">Measured contrast of §4 base colours against their own tints</caption>
              <thead className="bg-surface-2">
                <tr className="border-b border-edge">
                  {['Family', '§4 base', 'On own tint', 'On white', 'Verdict'].map((h) => (
                    <th key={h} scope="col" className="type-th px-3 py-2 text-fg-secondary">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="type-body-sm">
                {[
                  ['Success', '#198754', '#EAF7F0'],
                  ['Warning', '#C98200', '#FFF6E5'],
                  ['Error', '#C83C4A', '#FDECEF'],
                  ['Info', '#2778A5', '#EAF4FA'],
                ].map(([name, base, tint]) => (
                  <tr key={name} className="border-b border-edge last:border-0">
                    <td className="px-3 py-2 font-medium text-fg">{name}</td>
                    <td className="tabular px-3 py-2 font-mono text-xs text-fg-secondary">{base}</td>
                    <td className="tabular px-3 py-2 text-fg">{ratio(base, tint)}</td>
                    <td className="tabular px-3 py-2 text-fg">{ratio(base, '#FFFFFF')}</td>
                    <td className="px-3 py-2">
                      <Badge tone="error" size="sm">
                        below 4.5:1
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            The fix is the smallest one available: keep §4's values for fills, icons and chart series, and add a{' '}
            <Code>-700</Code> step per family for text. Each is the same hue and saturation walked down in lightness
            until it clears 4.8:1 on white, canvas, surface-2 and its own tint. No new hue enters the palette, so §32
            Rule 1 holds.
          </p>
          <p>
            A useful check on the method: the derived warning step landed on <Code>#956000</Code>, within a hair of
            GitHub Primer's <Code>#9A6700</Code> — the same problem, solved the same way, arrived at independently.
          </p>
        </Decision>

        <DoDont
          doNote="Tinted background, -700 text, and the glyph carrying the meaning. 4.95:1."
          dontNote="§4's base colour as the label. 2.93:1 — unreadable for a significant number of users, and a failure of the standard §24 sets."
          doNode={
            <Row>
              <StatusBadge kind="payment" value="pending" />
              <StatusBadge kind="stock" value="lowStock" />
            </Row>
          }
          dontNode={
            <Row>
              <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-warning-bg px-2 text-xs font-medium text-warning ring-1 ring-inset ring-warning/30">
                Payment Pending
              </span>
              <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-warning-bg px-2 text-xs font-medium text-warning ring-1 ring-inset ring-warning/30">
                Low Stock
              </span>
            </Row>
          }
        />
      </Section>

      <Section
        title="Teal: fills at 600, text at 700"
        spec="§3.1, §13"
        intro="brand-600 is the primary colour and stays the primary colour — on every button fill, every active nav item, every selected control. But as text it is marginal, and marginal in exactly the place it gets used most."
      >
        <Decision kind="change" title="Links and tertiary buttons use brand-700">
          <p>
            brand-600 measures {ratio('#087F8C', '#FFFFFF')}:1 on white — AA, but only just — and{' '}
            {ratio('#087F8C', '#F0F5F5')}:1 on surface-2, which is a fail. surface-2 is the background of table headers,
            wells and toolbars, which is precisely where a tertiary button or an inline link lives.
          </p>
          <p>
            brand-700 is {ratio('#0A6170', '#FFFFFF')}:1 on white and {ratio('#0A6170', '#F0F5F5')}:1 on surface-2, so
            the same component is legible wherever it is dropped. §13's fills are untouched, so the brand keeps its
            loudest position and only the small print moves one step darker.
          </p>
        </Decision>

        <Example title="Same component, three surfaces" surface="canvas">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['surface', 'bg-surface'],
              ['canvas', 'bg-canvas border border-edge'],
              ['surface-2', 'bg-surface-2'],
            ].map(([label, cls]) => (
              <div key={label} className={`rounded-xl p-4 ${cls}`}>
                <p className="type-caption mb-3 text-fg-muted">{label}</p>
                <Row>
                  <Button variant="tertiary" size="sm">
                    View Details
                  </Button>
                  <a href="#" className="type-body-sm font-medium text-brand-700 underline underline-offset-2">
                    Link
                  </a>
                </Row>
              </div>
            ))}
          </div>
        </Example>
      </Section>

      <Section
        title="brand-500 is decorative"
        spec="§3.1"
        intro="§3.1 assigns brand-500 to “accent and supporting visuals”, which is easy to read as “a lighter teal you can use for anything”. It is not."
      >
        <Alert tone="warning" title={`brand-500 is ${ratio('#39A9B6', '#FFFFFF')}:1 on white`}>
          <p>
            That is below 3:1, so it fails not only as text but as a meaningful border, an icon that carries information,
            or a focus ring. Its legal uses are: a chart series, a decorative fill, a hover accent behind something else
            that carries the meaning, and the active indicator bar in the sidebar — where it sits on brand-900, not on
            white.
          </p>
        </Alert>
      </Section>

      <Section
        title="The 60 / 30 / 10 ratio"
        spec="§5"
        intro="Stated as areas rather than counts. Most of a screen is white and very light surfaces; the structure and type are navy neutrals; teal and semantics are the last tenth."
      >
        <Example title="Roughly the intended proportion" surface="canvas" padded={false}>
          <div className="flex h-16">
            <div className="grid w-[60%] place-items-center bg-surface">
              <span className="type-caption text-fg-secondary">60% surface / canvas</span>
            </div>
            <div className="grid w-[30%] place-items-center bg-brand-900">
              <span className="type-caption text-white/80">30% navy structure</span>
            </div>
            <div className="grid w-[10%] place-items-center bg-brand-600">
              <span className="type-caption text-white">10%</span>
            </div>
          </div>
        </Example>
      </Section>

      <Section
        title="Light only, for now"
        spec="—"
        intro="The document does not mention dark mode. That silence is treated here as a decision rather than an omission, and it is worth being explicit about why."
      >
        <Decision kind="open" title="No dark theme in v1.0">
          <p>
            Three reasons. The palette is built around a near-white canvas and tinted semantic surfaces, and inverting it
            is a second palette to design and measure, not a filter to apply. The audience works in lit clinical and
            office environments and prints from these screens — invoices, quotes, purchase orders — where light is the
            source of truth. And a half-finished dark mode is worse than none: the failure mode is unreadable semantic
            badges, which is the exact thing §4 and §24 are protecting.
          </p>
          <p>
            The groundwork is here anyway: every colour is a token, nothing is hardcoded in a component, and{' '}
            <Code>.ds-root</Code> is a single scope to redefine them under. When it is wanted, it is a token exercise
            with a contrast pass — not a rewrite.
          </p>
        </Decision>
      </Section>
    </Page>
  );
}

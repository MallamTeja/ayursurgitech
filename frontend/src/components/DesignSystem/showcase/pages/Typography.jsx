import { Alert, Card } from '../../index.js';
import { TYPE_ADDITIONS, TYPE_SCALE, contrast } from '../../tokens.js';
import { Code, Decision, DoDont, Example, Page, Section } from '../kit.jsx';

export default function Typography() {
  return (
    <Page
      eyebrow="Foundations"
      title="Typography"
      intro="Inter throughout, at 400, 500 and 600. §7 says prefer those three weights and avoid excessive bold, so 700 is available in the family but unused in this system — hierarchy comes from size and colour, which is what keeps a dense admin screen calm."
      spec="§6, §7"
    >
      <Section
        title="The scale"
        spec="§6.1"
        intro="Nine styles, one per row of §6.1's table. They are classes rather than tokens for a specific reason — see the note below the ramp."
      >
        <Example title="Named text styles" surface="surface">
          <div className="space-y-6">
            {TYPE_SCALE.map((t) => (
              <div key={t.cls} className="border-b border-edge pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="type-caption font-mono text-fg-muted">.{t.cls}</p>
                  <p className="type-caption tabular text-fg-muted">
                    {t.px}px · {t.weight} · {t.lh}
                    {t.fluid && ` · fluid ${t.fluid}`}
                  </p>
                </div>
                <p className={`${t.cls} mt-2 text-fg`}>Polyfusion I.V. Infusion Set</p>
                <p className="type-caption mt-1.5 text-fg-secondary">{t.use}</p>
              </div>
            ))}
          </div>
        </Example>

        <Decision kind="change" title="Classes, not --text-* tokens">
          <p>
            §6.1 asks for 48 / 40 / 32 / 28 / 20 / 18 / 16 / 14 / 12. Tailwind's default scale has no 40 and no 28, and
            the shop's stylesheet has already overridden <Code>--text-3xl</Code> to 32px and <Code>--text-5xl</Code> to
            44px for the other brand. Redefining those would restyle the running shop; adding parallel size tokens would
            leave two ways to say the same thing.
          </p>
          <p>
            Named styles avoid both, and they are how the scale exists in a design tool anyway — one class per row of the
            table, so a heading that does not match the spec is greppable rather than arithmetic.
          </p>
        </Decision>

        <Decision kind="change" title="Display through H3 are fluid">
          <p>
            §6.1 gives one fixed size per style; §23 asks for responsive layout. 48px of display type does not fit a
            360px viewport. Display, H1, H2 and H3 use <Code>clamp()</Code> with the §6.1 value as the maximum, so
            desktop is exactly the spec and small screens degrade instead of overflowing. H4 and below are already small
            enough to stay fixed.
          </p>
        </Decision>
      </Section>

      <Section
        title="Four styles the scale was missing"
        spec="§6.1 dashboard row"
        intro="§6.1 has a second, smaller table for dashboard elements — metric value, table heading, navigation — with sizes but no names. These give them names, plus the uppercase label that §15 and §19 both use and neither table defines."
      >
        <Example title="Additions" surface="surface">
          <div className="space-y-6">
            <div className="border-b border-edge pb-6">
              <p className="type-caption font-mono text-fg-muted">.type-label</p>
              <p className="type-label mt-2 text-brand-700">I.V. INFUSION</p>
            </div>
            <div className="border-b border-edge pb-6">
              <p className="type-caption font-mono text-fg-muted">.type-metric</p>
              <p className="type-metric mt-2 text-fg">₹12,48,500</p>
            </div>
            <div className="border-b border-edge pb-6">
              <p className="type-caption font-mono text-fg-muted">.type-th</p>
              <p className="type-th mt-2 text-fg-secondary">Product · Category · Stock · Status</p>
            </div>
            <div>
              <p className="type-caption font-mono text-fg-muted">.type-nav</p>
              <p className="type-nav mt-2 text-fg">Orders</p>
            </div>
          </div>
        </Example>

        <div className="grid gap-3 sm:grid-cols-2">
          {TYPE_ADDITIONS.map((t) => (
            <Card key={t.cls} padding="sm">
              <p className="type-body-sm font-semibold text-fg">
                {t.name} <span className="font-mono text-xs font-normal text-fg-muted">.{t.cls}</span>
              </p>
              <p className="type-caption mt-1 font-mono text-fg-secondary">{t.spec}</p>
              <p className="type-body-sm mt-2 text-fg-secondary">{t.why}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Tabular numerals are not optional"
        spec="§6"
        intro="§6 chose Inter partly for its numerals and its dashboard readability. Proportional digits throw that away the moment numbers sit in a column."
      >
        <DoDont
          doLabel="Tabular"
          dontLabel="Proportional"
          doNote="Digits share one width, so the decimal points line up and the column can be scanned in one pass. .tabular, .type-metric and every right-aligned table cell apply it automatically."
          dontNote="The same figures with default numerals. Nothing is misaligned by much, and that is the problem — it is just wrong enough to slow down every comparison."
          doNode={
            <table className="w-full text-right">
              <tbody className="type-body-sm tabular">
                {['₹1,11,100.00', '₹9,63,000.00', '₹1,24,850.00', '₹88,900.00'].map((v) => (
                  <tr key={v} className="border-b border-edge last:border-0">
                    <td className="py-1.5 text-fg">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
          dontNode={
            <table className="w-full text-right">
              <tbody className="type-body-sm">
                {['₹1,11,100.00', '₹9,63,000.00', '₹1,24,850.00', '₹88,900.00'].map((v) => (
                  <tr key={v} className="border-b border-edge last:border-0">
                    <td className="py-1.5 text-fg">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
      </Section>

      <Section
        title="Captions use fg-secondary, not fg-muted"
        spec="§3.2 vs §24"
        intro="A second small contradiction between the palette and the accessibility target, and it lands on the smallest text in the system."
      >
        <Alert tone="warning" title={`fg-muted is ${contrast('#82949A', '#F7FAFA').toFixed(2)}:1 on canvas`}>
          <p>
            §3.2 assigns fg-muted to “muted/caption text”, and caption is 12px — the size that most needs 4.5:1. It does
            not reach it. So in this system captions use{' '}
            <Code>fg-secondary</Code> ({contrast('#536B73', '#F7FAFA').toFixed(2)}:1), and fg-muted is reserved for
            genuinely non-essential text at 20px or larger: a watermark, a placeholder, an inline hint that repeats
            something already stated.
          </p>
        </Alert>

        <Example title="The same caption in both" surface="canvas">
          <div className="space-y-3">
            <p className="type-caption text-fg-secondary">
              Product Code: AST-IV-1001 — fg-secondary, {contrast('#536B73', '#F7FAFA').toFixed(2)}:1, readable
            </p>
            <p className="type-caption text-fg-muted">
              Product Code: AST-IV-1001 — fg-muted, {contrast('#82949A', '#F7FAFA').toFixed(2)}:1, below AA
            </p>
          </div>
        </Example>
      </Section>

      <Section
        title="Headings inside .ds-root"
        spec="§6"
        intro="One collision worth knowing about, because it is invisible until it is not."
      >
        <Alert tone="info" title="The shop's stylesheet puts a serif on h1–h3">
          <p>
            <Code>index.css</Code> sets <Code>h1, h2, h3</Code> to the legacy brand's display face — Fraunces, with
            optical-size and SOFT/WONK variation axes on h1. §6 says Inter throughout. So{' '}
            <Code>theme.css</Code> resets heading elements back to Inter at 600 <em>within .ds-root</em>, at zero
            specificity so the <Code>.type-*</Code> classes and any utility still win. Render a component outside{' '}
            <Code>.ds-root</Code> and its headings will silently turn serif.
          </p>
        </Alert>
      </Section>
    </Page>
  );
}

import { Card } from '../../index.js';
import { BREAKPOINTS, DENSITY, ELEVATION, RADIUS, SPACING } from '../../tokens.js';
import { Code, Decision, DoDont, Example, Page, Section, TokenRow, TokenTable } from '../kit.jsx';

export default function Foundations() {
  return (
    <Page
      eyebrow="Foundations"
      title="Space, radius, elevation"
      intro="The three systems that decide whether an interface feels precise or approximate. All three are deliberately small — §8 asks for one ladder with no arbitrary values, §9 for four radii, §10 for almost no shadow at all."
      spec="§8, §9, §10, §23, §29"
    >
      <Section
        title="Spacing"
        spec="§8"
        intro="An 8px system with 4px for micro spacing. §8 also names the values to avoid — 13, 19, 27, 37 — which is really a rule about not eyeballing gaps."
      >
        <TokenTable head={['Tailwind', 'Value', 'Scale', 'Use']}>
          {SPACING.map((s) => (
            <TokenRow key={s.px} token={`p-${s.tw} / gap-${s.tw}`} value={`${s.px}px`} use={`${s.name} — ${s.use}`}>
              <span className="block h-3 rounded-sm bg-brand-500" style={{ width: s.px }} />
            </TokenRow>
          ))}
        </TokenTable>

        <Decision kind="addition" title="Not tokenised, on purpose">
          <p>
            §8's ladder is already Tailwind's default 4px scale, value for value. Declaring <Code>--space-*</Code> tokens
            on top of it would create a second source of truth for numbers that agree, and the second one always drifts.
            Use <Code>p-4</Code>, <Code>gap-6</Code>, <Code>mt-8</Code>. Same reasoning applies to radius below.
          </p>
        </Decision>
      </Section>

      <Section
        title="Radius"
        spec="§9"
        intro="Four values, and §9 is explicit that not everything is a pill: AyursurgiTech should feel precise rather than overly rounded. The nesting order matters — a panel is rounder than the cards inside it, which is what makes the nesting read as intentional."
      >
        <TokenTable head={['Tailwind', 'Value', 'Shape', 'Use']}>
          {RADIUS.map((r) => (
            <TokenRow key={r.px} token={r.tw} value={r.px === 999 ? '999px' : `${r.px}px`} use={r.use}>
              <span
                className="block size-10 border border-edge-strong bg-surface-2"
                style={{ borderRadius: r.px === 999 ? '999px' : `${r.px}px` }}
              />
            </TokenRow>
          ))}
        </TokenTable>

        <DoDont
          doLabel="Precise"
          dontLabel="Over-rounded"
          doNote="8px on the control, 12px on the card, pill only on the removable filter chip. The shape carries a distinction: squared is a state the system asserts, a pill is a token you put there."
          dontNote="Everything at 999px. §9 Rule 3 — it reads as consumer retail and loses the clinical register the brand is built on."
          doNode={
            <div className="space-y-3">
              <div className="rounded-xl border border-edge bg-surface p-3">
                <span className="inline-flex h-6 items-center rounded-lg bg-success-bg px-2 text-xs font-medium text-success-700 ring-1 ring-inset ring-success/30">
                  Delivered
                </span>
                <button className="ml-2 h-8 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white">Confirm</button>
              </div>
            </div>
          }
          dontNode={
            <div className="space-y-3">
              <div className="rounded-full border border-edge bg-surface p-3 px-5">
                <span className="inline-flex h-6 items-center rounded-full bg-success-bg px-2.5 text-xs font-medium text-success-700 ring-1 ring-inset ring-success/30">
                  Delivered
                </span>
                <button className="ml-2 h-8 rounded-full bg-brand-600 px-4 text-sm font-medium text-white">Confirm</button>
              </div>
            </div>
          }
        />
      </Section>

      <Section
        title="Elevation"
        spec="§10"
        intro="§10's instruction is that most cards should use background plus border rather than a shadow, and §32 Rule 4 forbids excessive shadows outright. So the default elevation in this system is none, and a shadow is information: it means the thing either responds to you or floats above the page."
      >
        <Example title="Three levels" surface="canvas">
          <div className="grid gap-4 sm:grid-cols-3">
            {ELEVATION.map((e) => (
              <div key={e.name} className={`rounded-xl bg-surface p-5 ${e.cls}`}>
                <p className="type-body-sm font-semibold text-fg">{e.name}</p>
                {e.spec && <p className="type-caption mt-1 font-mono text-fg-muted">{e.spec}</p>}
                <p className="type-caption mt-2 text-fg-secondary">{e.use}</p>
              </div>
            ))}
          </div>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            Both shadows are tinted with brand-900 rather than black, so they read as part of the palette instead of as
            grey haze over it. In practice: <Code>e1</Code> on a hovered card or a sticky bar, <Code>e2</Code> on the four
            things that genuinely float — dialog, drawer, dropdown, toast. Everything else is flat.
          </p>
        </Card>
      </Section>

      <Section
        title="Breakpoints"
        spec="§23"
        intro="§23 gives four bands and adds the more important instruction: design for layout needs, not for devices. The notes below are what actually changes at each step in this system."
      >
        <TokenTable head={['Band', 'Range', 'Prefix', 'What changes']}>
          {BREAKPOINTS.map((b) => (
            <TokenRow key={b.name} token={b.tw} value={b.range} use={b.note}>
              <span className="type-body-sm font-medium text-fg">{b.name}</span>
            </TokenRow>
          ))}
        </TokenTable>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            Two container widths carry the §11 distinction: <Code>max-w-content</Code> at 1200px for the customer portal,
            which is a reading column, and <Code>max-w-app</Code> at 1536px for admin and agent screens, where more
            columns on screen is the entire point.
          </p>
        </Card>
      </Section>

      <Section
        title="Density"
        spec="§29"
        intro="§29 says the three portals share the design language but not the density, and then gives no numbers. Without numbers, density becomes whatever each developer types, so here are three."
      >
        <TokenTable head={['Class', 'Row height', 'Portal', 'Why']}>
          {DENSITY.map((d) => (
            <TokenRow key={d.cls} token={d.cls} value={d.rows} use={d.why}>
              <span className="type-body-sm font-medium text-fg">{d.portal}</span>
            </TokenRow>
          ))}
        </TokenTable>

        <Decision kind="addition" title="Only the row height changes">
          <p>
            Type size, colour and border weight stay identical across all three. A denser table is not a differently
            styled table — it is the same table with less air. That is what keeps the customer catalogue and the admin
            stock list recognisable as one product, which is the thing §29 is protecting when it says they share the
            language.
          </p>
          <p>
            The classes set <Code>--row-h</Code> and <Code>--row-px</Code> on a container; the table reads them. Applying
            one to a wrapper changes every row inside it.
          </p>
        </Decision>
      </Section>
    </Page>
  );
}

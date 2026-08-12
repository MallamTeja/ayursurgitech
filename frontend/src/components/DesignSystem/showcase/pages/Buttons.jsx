import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { Button, ButtonGroup, IconButton } from '../../index.js';
import { contrast } from '../../tokens.js';
import { Decision, DoDont, Example, Page, PropsTable, Row, Section } from '../kit.jsx';

export default function Buttons() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
  };

  return (
    <Page
      eyebrow="Components"
      title="Buttons"
      intro="§13 defines three variants and stops. That restraint is the design: a page with one primary button has one obvious next step, and a page with four has none."
      spec="§13, §24, §25"
    >
      <Section
        title="Variants"
        spec="§13"
        intro="Primary for the one action a page exists for. Secondary for everything alongside it. Tertiary for the lowest tier — table row actions, “View all”, dismissals. Danger is an addition, argued below."
      >
        <Example title="The four variants" surface="canvas">
          <Row>
            <Button>Place Order</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="tertiary">View Details</Button>
            <Button variant="danger">Cancel Order</Button>
          </Row>
        </Example>

        <Example title="On every surface" surface="surface" note="Each variant has to survive all three backgrounds">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['surface', 'bg-surface border border-edge'],
              ['canvas', 'bg-canvas'],
              ['surface-2', 'bg-surface-2'],
            ].map(([label, cls]) => (
              <div key={label} className={`rounded-xl p-4 ${cls}`}>
                <p className="type-caption mb-3 text-fg-muted">{label}</p>
                <div className="flex flex-col items-start gap-2">
                  <Button size="sm">Primary</Button>
                  <Button size="sm" variant="secondary">
                    Secondary
                  </Button>
                  <Button size="sm" variant="tertiary">
                    Tertiary
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Example>

        <Decision kind="addition" title="danger — because §13 has no destructive variant">
          <p>
            The admin panel deletes products, cancels orders and rejects organisations. Without a variant for it, every
            destructive action becomes a one-off style, which is what §31 says to avoid. The error token carries white
            text at {contrast('#C83C4A', '#FFFFFF').toFixed(2)}:1, so it is AA as a fill and introduces no new colour
            (§32 Rule 1).
          </p>
        </Decision>

        <Decision kind="change" title="Tertiary text is brand-700, not §13's brand-600">
          <p>
            brand-600 measures {contrast('#087F8C', '#F0F5F5').toFixed(2)}:1 on surface-2 — a fail — and surface-2 is
            where toolbars are. brand-700 is {contrast('#0A6170', '#F0F5F5').toFixed(2)}:1 there. The primary button's
            fill is still exactly §13's brand-600, so the brand keeps its loudest position.
          </p>
        </Decision>
      </Section>

      <Section
        title="Sizes"
        spec="§8, §24"
        intro="Three heights on the §8 ladder: 32, 40 and 48px. WCAG 2.2 2.5.8 sets a 24×24 minimum for targets, which all three clear — but use md as the default for anything a customer taps on a phone."
      >
        <Example title="sm · md · lg" surface="canvas">
          <Row align="center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
        </Example>
      </Section>

      <Section
        title="With icons"
        spec="§21"
        intro="An icon supports a label; it does not replace one, except in a toolbar where space is the constraint and a tooltip carries the name."
      >
        <Example title="Leading, trailing, icon-only" surface="canvas">
          <Row>
            <Button iconLeft={Icon.add}>New Product</Button>
            <Button variant="secondary" iconLeft={Icon.download}>
              Export CSV
            </Button>
            <Button variant="tertiary" iconRight={Icon.arrowRight}>
              All orders
            </Button>
            <IconButton icon={Icon.edit} label="Edit" variant="secondary" />
            <IconButton icon={Icon.delete} label="Delete" variant="secondary" />
            <IconButton icon={Icon.more} label="More actions" />
          </Row>
        </Example>
      </Section>

      <Section
        title="Loading and disabled"
        spec="§25"
        intro="§25's example is “[ Saving Product… ]” rather than a button that can be clicked five times. A loading button is disabled, carries aria-busy, and keeps its label so it does not change width and shove the layout sideways mid-save."
      >
        <Example title="Press Save" surface="canvas">
          <Row>
            <Button loading={saving} loadingLabel="Saving Product…" onClick={save}>
              Save Product
            </Button>
            <Button variant="secondary" loading>
              Loading
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
            <Button variant="tertiary" disabled>
              Disabled
            </Button>
          </Row>
        </Example>
      </Section>

      <Section
        title="Groups and hierarchy"
        spec="§13, §32 Rule 10"
        intro="One primary per view. ButtonGroup reverses order on mobile so the primary action sits at the bottom of a stacked form, where the thumb reaches it first and it reads last."
      >
        <Example title="Form actions" surface="surface">
          <ButtonGroup>
            <Button variant="secondary">Cancel</Button>
            <Button>Save Changes</Button>
          </ButtonGroup>
        </Example>

        <DoDont
          doNote="One primary. The eye lands on the action the screen exists for, and the alternatives are still perfectly reachable."
          dontNote="Three primaries. Now nothing is primary, and the user has to read all three labels to find out what the page wants — §32 Rule 10."
          doNode={
            <Row>
              <Button>Confirm Order</Button>
              <Button variant="secondary">Save Draft</Button>
              <Button variant="tertiary">Cancel</Button>
            </Row>
          }
          dontNode={
            <Row>
              <Button>Confirm Order</Button>
              <Button>Save Draft</Button>
              <Button>Cancel</Button>
            </Row>
          }
        />
      </Section>

      <Section title="Props" spec="§31">
        <PropsTable
          rows={[
            ['variant', "'primary' | 'secondary' | 'tertiary' | 'danger'", "'primary'", 'One primary per view.'],
            ['size', "'sm' | 'md' | 'lg'", "'md'", '32 / 40 / 48px. md for touch.'],
            ['iconLeft', 'Icon', '—', 'From the Icon registry, not lucide-react directly.'],
            ['iconRight', 'Icon', '—', 'For direction only — “All orders →”. Never a second meaning.'],
            ['iconOnly', 'boolean', 'false', 'Requires aria-label; warns in dev without one. Prefer IconButton.'],
            ['loading', 'boolean', 'false', 'Disables and sets aria-busy (§25).'],
            ['loadingLabel', 'string', '—', 'Replaces the label while loading — “Saving Product…”.'],
            ['fullWidth', 'boolean', 'false', 'For stacked mobile forms and card footers.'],
            ['as', 'ElementType', "'button'", 'Render as a link or router Link. Keeps the styling, changes the semantics.'],
          ]}
        />
      </Section>
    </Page>
  );
}

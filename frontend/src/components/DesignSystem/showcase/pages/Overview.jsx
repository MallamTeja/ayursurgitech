import { Icon } from '../../icons.jsx';
import { Badge, Card, StatusBadge } from '../../index.js';
import { Code, Decision, Page, Rule, Section } from '../kit.jsx';

const KEYWORDS = ['Clinical', 'Precise', 'Clean', 'Trustworthy', 'Professional', 'Calm', 'Modern', 'Reliable', 'Structured', 'Accessible'];

const NOT = ['Generic hospital-blue', 'Overly colourful', 'Childish', 'Dark/futuristic SaaS', 'Luxury/corporate', 'Lifelessly sterile'];

export default function Overview() {
  return (
    <Page
      eyebrow="Design System v1.0"
      title="Clinical Precision"
      intro="The visual contract for AayursurgiTech — a B2B medical-device commerce and distribution platform. This site is the implementation of docs/AayursurgiTech-Design-System-v1.0.md: every token, component and rule below traces to a section of that document, and every place this implementation departs from it is labelled."
      spec="§1, §2, §33, §34"
    >
      <Section
        title="What it should feel like"
        spec="§1, §33"
        intro="§1 lists what the interface should communicate and — more usefully — what it must not. The second list is the one that does the work: it rules out the four directions a medical B2B product usually drifts in."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="type-label text-success-700">Should feel</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {KEYWORDS.map((k) => (
                <Badge key={k} tone="brand">
                  {k}
                </Badge>
              ))}
            </div>
          </Card>
          <Card>
            <p className="type-label text-error-700">Should not feel</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {NOT.map((k) => (
                <Badge key={k} tone="neutral">
                  {k}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        <Card className="bg-brand-50">
          <p className="type-body-lg text-brand-900">
            “The product itself is the hero.”
          </p>
          <p className="type-body-sm mt-2 text-fg-secondary">
            §1, restated as §32 Rule 11. It is the reason the product card gives four-fifths of itself to an image, the
            reason there are no decorative graphics on a metric card, and the reason this system ships no photography
            rather than the wrong photography.
          </p>
        </Card>
      </Section>

      <Section
        title="How to use this system"
        spec="§31, §34"
        intro="§34 asks one question before anything new is introduced: does this strengthen the Clinical Precision design language? These are the practical forms of that question."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card padding="md">
            <p className="type-h4 text-fg">Import from one place</p>
            <p className="type-body-sm mt-2 text-fg-secondary">
              Everything is exported from the package root. Deep imports work but are not the contract.
            </p>
            <div className="mt-3">
              <Code>{"import { Button, DataTable } from '@/components/DesignSystem'"}</Code>
            </div>
          </Card>
          <Card padding="md">
            <p className="type-h4 text-fg">Render inside <Code>.ds-root</Code></p>
            <p className="type-body-sm mt-2 text-fg-secondary">
              The tokens and the heading, focus and dialog resets are all scoped to that class. Outside it, headings
              fall back to the shop's display serif.
            </p>
          </Card>
          <Card padding="md">
            <p className="type-h4 text-fg">Never colour alone</p>
            <p className="type-body-sm mt-2 text-fg-secondary">
              §4 and §32 Rule 5. Every state carries a glyph and a word — which is why status is a registry, not a
              colour prop.
            </p>
            <div className="mt-3 flex gap-2">
              <StatusBadge kind="order" value="delivered" />
              <StatusBadge kind="payment" value="pending" />
            </div>
          </Card>
          <Card padding="md">
            <p className="type-h4 text-fg">Density is a choice, once</p>
            <p className="type-body-sm mt-2 text-fg-secondary">
              §29 gives the three portals different densities. Pick <Code>relaxed</Code>, <Code>default</Code> or{' '}
              <Code>compact</Code> per screen and nothing else changes.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Where this departs from the document"
        spec="§4, §6.1, §13, §24"
        intro="Four changes and one addition, each because the document contradicts itself somewhere. All are hue-preserving, none introduces a colour (§32 Rule 1), and each is argued in full on the page it belongs to."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Decision kind="change" title="Semantic text needs a darker step">
            <p>
              §24 targets WCAG 2.2 AA. Measured, §4's own colours fail it as badge text — warning is 2.93:1 on its own
              tint. Four <Code>-700</Code> steps were derived to fix it. See Colour.
            </p>
          </Decision>
          <Decision kind="change" title="Teal text is brand-700, teal fills are brand-600">
            <p>
              §13's tertiary teal is 4.31:1 on surface-2, which is where toolbars live. Fills keep §13's exact brand-600.
              See Buttons.
            </p>
          </Decision>
          <Decision kind="addition" title="A danger button, and four text styles">
            <p>
              §13 has no destructive variant and the admin panel deletes things. §6.1 has no label, metric, table-heading
              or nav style, and all four are on almost every screen.
            </p>
          </Decision>
          <Decision kind="open" title="Prices on product cards">
            <p>
              Overview §44 question 25 has not been answered, so <Code>ProductCard</Code> is correct with and without a
              price. One prop flips it when the client decides.
            </p>
          </Decision>
        </div>
      </Section>

      <Section
        title="The non-negotiable rules"
        spec="§32"
        intro="Quoted in full, because a rule paraphrased is a rule already being negotiated. Each is enforced somewhere concrete in this system, and where that enforcement is structural rather than advisory it is noted on the component's page."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Rule n={1}>Do not randomly introduce colours.</Rule>
          <Rule n={2}>Do not use pure black as normal text.</Rule>
          <Rule n={3}>Do not make every component rounded.</Rule>
          <Rule n={4}>Do not use excessive shadows.</Rule>
          <Rule n={5}>Do not use colour as the only status indicator.</Rule>
          <Rule n={6}>Do not mix icon families.</Rule>
          <Rule n={7}>Do not use placeholder text as a replacement for labels.</Rule>
          <Rule n={8}>Do not overload product cards.</Rule>
          <Rule n={9}>Do not make the admin panel look like the marketing website.</Rule>
          <Rule n={10}>Do not sacrifice usability for visual decoration.</Rule>
          <Rule n={11}>The actual medical product should receive visual priority.</Rule>
          <Rule n={12}>Evaluate every new visual pattern against the existing system first.</Rule>
        </div>
      </Section>

      <Section title="What is not built yet" spec="—" intro="Stated plainly, so nobody assumes coverage that is not there.">
        <Card>
          <ul className="space-y-2.5">
            {[
              'Photography. §22 wants real Aayursurgi product images; placeholders hold the exact aspect ratio until they exist.',
              'Dark mode. The document is silent on it and this system is light-only by decision, not by omission — see Colour.',
              'A charting library. Four SVG primitives cover §20; axes, zoom and brushing are the point to reconsider.',
              'Data. Every screen here runs on dummy.js. Nothing in this folder calls the API.',
            ].map((t) => (
              <li key={t} className="type-body-sm flex gap-2.5 text-fg-secondary">
                <Icon.neutral size={16} className="mt-0.5 shrink-0 text-fg-muted" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </Page>
  );
}

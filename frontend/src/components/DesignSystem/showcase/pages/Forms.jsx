import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import {
  Button,
  Checkbox,
  Field,
  FileDrop,
  FormActions,
  FormRow,
  FormSection,
  Input,
  Panel,
  QuantityStepper,
  RadioGroup,
  SearchInput,
  Select,
  Switch,
  Textarea,
} from '../../index.js';
import { Code, Decision, DoDont, Example, Page, PropsTable, Section } from '../kit.jsx';

export default function Forms() {
  const [qty, setQty] = useState(100);
  const [search, setSearch] = useState('');
  const [terms, setTerms] = useState('net30');
  const [files, setFiles] = useState([{ name: 'AST-IV-1001-technical-spec.pdf', size: 284160 }]);
  const [showOos, setShowOos] = useState(true);
  const [gstin, setGstin] = useState('36AABCA1234F');

  const gstinError = gstin.length > 0 && gstin.length !== 15 ? 'A GSTIN is exactly 15 characters.' : null;

  return (
    <Page
      eyebrow="Components"
      title="Forms"
      intro="§14 is short and absolute: labels above inputs, never a placeholder standing in for a label, and support for helper text, inline validation, error messages, required indicators and keyboard navigation. §32 Rule 7 repeats the placeholder ban, which is usually a sign it gets broken often."
      spec="§14, §24, §31"
    >
      <Section
        title="Field owns the wiring"
        spec="§14, §24"
        intro="Field generates the id, points aria-describedby at whichever of helper or error exists, sets aria-invalid and marks required — and passes all of it down through context. A control inside a Field is correctly labelled without the call site repeating any of it, and more importantly without being able to forget."
      >
        <Example title="Label, helper, error, required" surface="surface">
          <div className="grid max-w-2xl gap-5">
            <Field label="Product name" required helper="Shown on the catalogue card and the invoice line.">
              <Input placeholder="Polyfusion I.V. Infusion Set" />
            </Field>

            <Field
              label="GSTIN"
              required
              helper="15 characters. Used on every invoice raised to this organisation."
              error={gstinError}
            >
              <Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="36AABCA1234F1Z5" />
            </Field>

            <Field label="Internal notes" optional helper="Not visible to the customer.">
              <Textarea placeholder="Anything the warehouse should know about this line." />
            </Field>
          </div>
        </Example>

        <DoDont
          doNote="Label above, helper below, error replacing the helper when it fires. The label stays visible while the field is being filled in — which is when it is needed."
          dontNote="§14 and §32 Rule 7. The moment someone types, the only description of the field disappears; and a screen reader may never announce it at all."
          doNode={
            <Field label="Purchase order number" helper="As printed on the customer's PO.">
              <Input placeholder="PO/APL/26/8871" />
            </Field>
          }
          dontNode={
            <input
              placeholder="Purchase order number"
              className="h-10 w-full rounded-lg border border-edge-strong bg-surface px-3 text-[0.9375rem] placeholder:text-fg-muted"
            />
          }
        />

        <Decision kind="change" title="Placeholders are formatting examples, never instructions">
          <p>
            fg-muted is 3.16:1, below the AA body floor. That is acceptable for a placeholder <em>and only</em> for a
            placeholder, because §14 has already ruled that it may not carry information — the label above and the helper
            below both do, and both are AA. A placeholder in this system shows the shape of a value
            (<Code>36ABCDE1234F1Z5</Code>). If it needs to be read, it belongs in the helper text.
          </p>
        </Decision>
      </Section>

      <Section
        title="Text inputs"
        spec="§14, §9"
        intro="40px tall to match a medium button, 8px radius per §9, edge-strong border — a 1.26:1 border on a white field is a field you cannot see. Prefixes and suffixes are for units, not decoration."
      >
        <Example title="Sizes, units, states" surface="surface">
          <div className="grid max-w-2xl gap-5">
            <FormRow>
              <Field label="Unit price" required hint="exclusive of GST">
                <Input prefix="₹" placeholder="42.50" inputMode="decimal" />
              </Field>
              <Field label="GST rate" required>
                <Input suffix="%" defaultValue="12" inputMode="numeric" />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Tube length">
                <Input suffix="cm" defaultValue="150" inputMode="numeric" />
              </Field>
              <Field label="HSN code" helper="Eight digits.">
                <Input defaultValue="90183930" inputMode="numeric" />
              </Field>
            </FormRow>

            <Field label="Search with a leading glyph">
              <Input icon={Icon.search} placeholder="Product name or code" />
            </Field>

            <Field label="Disabled" helper="Set automatically from the pack size.">
              <Input disabled defaultValue="100 pcs / box" />
            </Field>
          </div>
        </Example>
      </Section>

      <Section
        title="Select"
        spec="§14, §24"
        intro="A native select, deliberately. A custom listbox is a great deal of ARIA to get wrong; the native control brings keyboard behaviour, type-ahead and the platform picker on mobile for free, which is most of §24. The only styling is the chevron."
      >
        <Example title="Native, styled" surface="surface">
          <div className="grid max-w-2xl gap-5">
            <FormRow>
              <Field label="Category" required>
                <Select
                  placeholder="Select a category"
                  options={['I.V. Infusion', 'Extension Lines', 'Connectors', 'Stop Cocks', 'Vial Access', 'Other Products']}
                />
              </Field>
              <Field label="Unit of measure" required>
                <Select options={['Piece', 'Box', 'Carton', 'Pack']} />
              </Field>
            </FormRow>
            <Field label="Assigned agent" helper="Determines commission and territory reporting.">
              <Select
                options={[
                  { value: 'a-rakesh', label: 'Rakesh Iyer — South' },
                  { value: 'a-meera', label: 'Meera Nair — West' },
                  { value: 'a-devika', label: 'Devika Rao — North' },
                  { value: 'a-sanjay', label: 'Sanjay Menon — East' },
                ]}
              />
            </Field>
          </div>
        </Example>
      </Section>

      <Section
        title="Selection controls"
        spec="§14, §24"
        intro="The box is 18px but the whole label row is the target, because the input sits inside the label — WCAG 2.2 2.5.8 measures the target, not the graphic. A RadioGroup is a real fieldset with a legend: without one, a screen reader reads four options and never says what they are options for."
      >
        <Example title="Checkbox, radio, switch" surface="surface">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="type-th text-fg-secondary">Checkbox</p>
              <Checkbox label="Sterile" defaultChecked />
              <Checkbox label="Latex-free" defaultChecked />
              <Checkbox label="Requires cold chain" description="Adds a handling surcharge at dispatch." />
              <Checkbox label="Indeterminate" indeterminate />
              <Checkbox label="Disabled" disabled />
            </div>

            <div>
              <RadioGroup
                legend="Credit terms"
                name="terms"
                value={terms}
                onChange={setTerms}
                helper="Applies to every order this organisation places."
                options={[
                  { value: 'advance', label: 'Advance', description: 'Payment before dispatch.' },
                  { value: 'net30', label: 'Net 30' },
                  { value: 'net45', label: 'Net 45' },
                  { value: 'net60', label: 'Net 60', description: 'Requires director approval.' },
                ]}
              />
            </div>

            <div className="space-y-4">
              <p className="type-th text-fg-secondary">Switch</p>
              <Switch
                label="Show out-of-stock products"
                description="Takes effect immediately."
                checked={showOos}
                onChange={setShowOos}
              />
              <Switch label="Email order confirmations" checked onChange={() => {}} />
              <Switch label="Disabled" checked={false} disabled onChange={() => {}} />
            </div>
          </div>
        </Example>

        <Decision kind="addition" title="Switch versus Checkbox is a promise, not a style">
          <p>
            A switch takes effect immediately. A checkbox is part of a form and waits for Save. Choosing between them on
            appearance is how a settings screen ends up with a switch that silently does nothing until you scroll to a
            button.
          </p>
        </Decision>
      </Section>

      <Section
        title="Domain controls"
        spec="Overview §44"
        intro="Two controls that exist because this is B2B medical distribution and not a generic shop."
      >
        <Example title="Quantity that knows about MOQ" surface="surface">
          <div className="max-w-md space-y-4">
            <Field
              label="Quantity"
              helper="Minimum order 100 pieces, in multiples of 100 — one box."
            >
              <QuantityStepper value={qty} onChange={setQty} moq={100} uom="Piece" />
            </Field>
            <p className="type-caption text-fg-secondary">
              The minus button stops at the MOQ rather than at zero, and a typed value is snapped to the nearest multiple
              on blur rather than blocked on keypress — fighting someone mid-keystroke is how a field becomes impossible
              to edit.
            </p>
          </div>
        </Example>

        <Example title="Document upload" surface="surface" note="§24 documents — brochures, specs, certificates, POs">
          <div className="max-w-xl">
            <Field label="Product documents" optional helper="Technical specification, CE certificate, brochure.">
              <FileDrop
                files={files}
                onAdd={(added) => setFiles((f) => [...f, ...added])}
                onRemove={(i) => setFiles((f) => f.filter((_, idx) => idx !== i))}
              />
            </Field>
          </div>
        </Example>

        <Example title="Search" surface="surface">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search products or codes…"
            />
          </div>
        </Example>
      </Section>

      <Section
        title="Structure"
        spec="§31"
        intro="A 27-field product form is unusable as one list. FormSection puts a title and description beside the fields it explains, so someone can find the section they need without reading every label."
      >
        <Panel className="p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            <FormSection title="Identity" description="How this product is named and found in the catalogue.">
              <Field label="Product name" required>
                <Input defaultValue="Polyfusion I.V. Infusion Set with Airvent Spike" />
              </Field>
              <FormRow>
                <Field label="Product code" required helper="Printed on the carton.">
                  <Input defaultValue="AST-IV-1001" />
                </Field>
                <Field label="Category" required>
                  <Select options={['I.V. Infusion', 'Extension Lines', 'Connectors']} />
                </Field>
              </FormRow>
            </FormSection>

            <FormSection title="Pricing and tax" description="Figures the invoice is built from. All amounts exclusive of GST.">
              <FormRow columns={3}>
                <Field label="Unit price" required>
                  <Input prefix="₹" defaultValue="42.50" />
                </Field>
                <Field label="MRP">
                  <Input prefix="₹" defaultValue="55.00" />
                </Field>
                <Field label="GST rate" required>
                  <Input suffix="%" defaultValue="12" />
                </Field>
              </FormRow>
              <FormRow>
                <Field label="HSN code" required>
                  <Input defaultValue="90183930" />
                </Field>
                <Field label="Minimum order quantity" required helper="Usually one full box.">
                  <Input suffix="pcs" defaultValue="100" />
                </Field>
              </FormRow>
            </FormSection>

            <FormActions note="Last saved 11 Aug 2026, 4:35 pm by Priya Sharma">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
              <Button type="submit">Save Product</Button>
            </FormActions>
          </form>
        </Panel>
      </Section>

      <Section title="Props — Field" spec="§14">
        <PropsTable
          rows={[
            ['label', 'string', '—', 'Rendered above the control. §14 — always.'],
            ['required', 'boolean', 'false', 'Adds the asterisk and sets required on the control.'],
            ['optional', 'boolean', 'false', 'Prints “Optional” instead. Use in forms that are mostly required.'],
            ['helper', 'ReactNode', '—', 'Below the control. Where anything the user must know goes.'],
            ['error', 'string', '—', 'Replaces the helper, wires aria-invalid, renders with a glyph (§4).'],
            ['hint', 'ReactNode', '—', 'Right-aligned on the label row — “exclusive of GST”.'],
            ['htmlFor', 'string', 'auto', 'Override the generated id. Rarely needed.'],
          ]}
        />
      </Section>
    </Page>
  );
}

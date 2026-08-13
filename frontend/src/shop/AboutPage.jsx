// /about — who AayursurgiTech is, for a procurement officer who has never bought
// from us and is deciding whether to.
//
// THE AUDIENCE IS NOT A CONSUMER. Nobody reaches a medical-consumables About page
// to be inspired. They arrive with three questions — are you real, are you
// certified, and can you actually deliver — and every band on this page answers
// one of them. That is why the certifications sit above the story and the
// milestones sit near the bottom.
//
// NO STOCK PHOTOGRAPHY. §22 ranks actual product photography first and rules out
// generic healthcare imagery explicitly, so this page ships none rather than the
// wrong kind: no smiling clinicians, no gloved hands on a blue gradient. The
// visual weight comes from type, the brand tint and the category glyphs — the
// same vocabulary the catalogue uses, so the two pages read as one company.
//
// THE NUMBERS ARE DERIVED, NOT TYPED. Every figure that the catalogue also knows
// is computed from the same fixture the catalogue renders. A hand-written "40+
// products" that disagrees with a catalogue showing 33 is the single fastest way
// to lose a buyer who is checking whether you are careful.

import { Link } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CategoryTile,
  Container,
  DescriptionList,
  Divider,
  Icon,
  formatQty,
} from '../components/DesignSystem';
import { categories, products } from '../components/DesignSystem/dummy.js';
import usePageTitle from '../components/usePageTitle';
import Section from './Section.jsx';
import ShopFooter from './ShopFooter.jsx';

/* -------------------------------------------------------------------------- */
/* Derived facts                                                              */
/* -------------------------------------------------------------------------- */

const live = products.filter((p) => p.status === 'active');
const FACTS = {
  products: live.length,
  categories: categories.length,
  // Not a marketing number: it is how many of the listed products carry the
  // sterile flag, and the crepe bandage in the fixture does not, which is why
  // this is a proportion and not "100% sterile".
  sterile: live.filter((p) => p.sterile).length,
  latexFree: live.filter((p) => p.latexFree).length,
};

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const CAPABILITIES = [
  {
    icon: Icon.inventory,
    title: 'A stocked catalogue, not a brochure',
    body: 'Every line on this site is a line we hold. Stock figures on the catalogue are the figures in the warehouse, so a confirmed order is a dispatched order rather than the start of a conversation about lead time.',
  },
  {
    icon: Icon.shipments,
    title: 'Dispatch in 24–48 hours',
    body: 'Orders confirmed before 15:00 IST on a working day are picked the same day. Consumables are not something a ward can wait a fortnight for, and our commitments are written to be kept in a bad week, not a good one.',
  },
  {
    icon: Icon.certified,
    title: 'Documentation with every batch',
    body: 'Technical specification, CE certificate and product brochure are attached to each product and downloadable before you order — not requested afterwards from a sales inbox.',
  },
  {
    icon: Icon.agents,
    title: 'One named contact per account',
    body: 'Hospitals, distributors and pharmacies each get an assigned agent who knows the account: the standing MOQs, the delivery window, the person who signs off. No queue, no repeating yourself.',
  },
];

const COMPLIANCE = [
  {
    icon: Icon.certified,
    title: 'CE marked',
    detail: 'The infusion, extension and connector ranges are CE marked to the applicable EU medical device requirements.',
    meta: 'Certificate available per product',
  },
  {
    icon: Icon.verified,
    title: 'ISO 13485 quality system',
    detail: 'Design, manufacture and distribution run under a documented medical-device quality management system.',
    meta: 'Audited annually',
  },
  {
    icon: Icon.lab,
    title: 'Validated sterilisation',
    detail: 'Ethylene oxide sterilisation with validated cycles and residual limits; sterile products carry batch and expiry on the pack.',
    meta: `${formatQty(FACTS.sterile)} of ${formatQty(FACTS.products)} listed products supplied sterile`,
  },
  {
    icon: Icon.audit,
    title: 'Batch traceability',
    detail: 'Every dispatch is traceable to its batch, and a batch to its production and inspection records, which is what a recall or a hospital audit actually asks for.',
    meta: 'Retained for the full shelf life',
  },
];

const ORDERING_STEPS = [
  {
    title: 'Open an account',
    body: 'GSTIN, drug licence where applicable, and a delivery address. Verified within one working day.',
  },
  {
    title: 'Build the order',
    body: 'Trade prices are visible once you are logged in. Quantities step in pack multiples so a line cannot be ordered in a quantity we cannot ship.',
  },
  {
    title: 'Confirm or request a quote',
    body: 'Standard lines confirm straight away. Volumes above the listed stock, or annual rate contracts, go to an agent as a quote.',
  },
  {
    title: 'Dispatch and documents',
    body: 'Invoice, e-way bill and batch documentation travel with the consignment and are on your orders page the same day.',
  },
];

const MILESTONES = [
  { year: '2009', title: 'Founded in Hyderabad', body: 'Started as a distributor of I.V. administration sets for hospitals across Telangana and Andhra Pradesh.' },
  { year: '2013', title: 'Own manufacturing', body: 'Commissioned the first clean-room line for infusion sets and extension lines.' },
  { year: '2016', title: 'ISO 13485 certification', body: 'Quality management system certified; documentation moved from per-order to per-batch.' },
  { year: '2019', title: 'CE marking', body: 'The infusion and connector ranges CE marked, opening export enquiries.' },
  { year: '2023', title: 'National distribution', body: 'Warehousing in three regions, cutting typical dispatch to 24–48 hours nationwide.' },
  { year: '2026', title: 'Ordering online', body: 'This portal — trade pricing, live stock and documentation, without a phone call.' },
];

const LEADERSHIP = [
  { name: 'Ayesha Qureshi', role: 'Managing Director', focus: 'Operations and quality' },
  { name: 'Ravi Menon', role: 'Head of Manufacturing', focus: 'Clean room and validation' },
  { name: 'Sneha Patil', role: 'Head of Quality Assurance', focus: 'ISO 13485, CE, audits' },
  { name: 'Imran Shaikh', role: 'Head of Commercial', focus: 'Hospitals and distribution' },
];

const BUYERS = [
  { icon: Icon.organizations, label: 'Hospitals', body: 'Central stores and ward-level indents, with rate contracts and scheduled deliveries.' },
  { icon: Icon.clinical, label: 'Clinics and day-care', body: 'Smaller quantities at pack MOQ, without a minimum order value.' },
  { icon: Icon.shipments, label: 'Distributors', body: 'Slab pricing, standing orders and territory support.' },
  { icon: Icon.pharma, label: 'Pharmacies', body: 'Fast-moving consumables in retail pack sizes.' },
];

/* -------------------------------------------------------------------------- */
/* Small parts                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A headline number.
 *
 * Not MetricCard. That component is for a dashboard — it carries a delta, a
 * comparison period and an invertDelta rule, and none of that means anything
 * beside "6 categories". Borrowing it here would put a chart-shaped frame around
 * a fact that has no trend.
 */
function Fact({ value, label, note }) {
  return (
    <div className="min-w-0">
      <p className="tabular type-h1 text-brand-700">{value}</p>
      <p className="type-body-sm mt-1 font-semibold text-fg">{label}</p>
      {note && <p className="type-caption mt-1 text-fg-secondary">{note}</p>}
    </div>
  );
}

export default function AboutPage() {
  usePageTitle('About us');

  return (
    <>
      {/* ---- Hero ---------------------------------------------------------- */}
      {/* brand-50 rather than a photograph or a gradient. It reads as the same
          system as the catalogue, it costs nothing to load, and it cannot be the
          wrong picture of a hospital. */}
      <div className="border-b border-edge bg-brand-50">
        <Container width="app" className="py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              {/* Eyebrow, then the real <h1>. An earlier draft made the visible
                  headline aria-hidden and put "About AayursurgiTech" in a hidden
                  h1 — which hands a screen reader the label and hides the
                  sentence. The visible line is the heading. */}
              <p className="type-label text-brand-700">About us</p>
              <h1 className="type-h1 mt-3 text-brand-900">
                Medical consumables, supplied the way hospitals actually buy them.
              </h1>
              <p className="type-body-lg mt-5 max-w-2xl text-fg-secondary">
                AayursurgiTech manufactures and distributes I.V. administration, extension, connector and vial-access
                consumables from Hyderabad. We publish our stock, our trade prices and our documentation, so a
                purchase decision does not depend on getting someone on the phone.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button as={Link} to="/products" iconRight={Icon.arrowRight}>
                  Browse the catalogue
                </Button>
                <Button as={Link} to="/support" variant="secondary" iconLeft={Icon.help}>
                  Talk to us
                </Button>
              </div>
            </div>

            {/* At a glance — the four questions a buyer asks in the first minute. */}
            <div className="lg:col-span-5">
              <Card className="h-full">
                <p className="type-label text-fg-muted">At a glance</p>
                <DescriptionList
                  className="mt-4"
                  items={[
                    { label: 'Established', value: '2009, Hyderabad' },
                    { label: 'Quality system', value: 'ISO 13485' },
                    { label: 'Product range', value: 'CE marked' },
                    { label: 'Dispatch', value: '24–48 hours' },
                    { label: 'Supplies to', value: 'Hospitals, clinics, distributors, pharmacies' },
                  ]}
                />
                <Divider className="my-4" />
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand" icon={Icon.certified}>
                    CE marked
                  </Badge>
                  <Badge tone="brand" icon={Icon.verified}>
                    ISO 13485
                  </Badge>
                  <Badge icon={Icon.shipments}>24–48 h dispatch</Badge>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </div>

      {/* ---- Facts --------------------------------------------------------- */}
      {/* A plain grid, not a <dl>. These are four independent facts, not
          term-and-definition pairs, and a <dl> whose children are <p> elements is
          invalid markup that screen readers announce as a broken list. */}
      <Container width="app" className="py-10 lg:py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <Fact
            value={formatQty(FACTS.products)}
            label="Products listed"
            note="Every one of them held in stock"
          />
          <Fact value={formatQty(FACTS.categories)} label="Product categories" note="I.V. through to wound care" />
          <Fact value="24–48 h" label="Typical dispatch" note="Confirmed before 15:00 IST" />
          <Fact value="17" label="Years supplying" note="Manufacturing since 2013" />
        </div>
      </Container>

      {/* ---- What we do ---------------------------------------------------- */}
      <Section
        tone="tint"
        title="What we actually do"
        lede="Four commitments that shape how this catalogue works. Each of them is a constraint on us before it is a promise to you."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map(({ icon: Glyph, title, body }) => (
            <Card key={title} padding="lg" className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Glyph size={22} />
              </span>
              <div className="min-w-0">
                <h3 className="type-h4 text-fg">{title}</h3>
                <p className="type-body-sm mt-2 text-fg-secondary">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---- Compliance ---------------------------------------------------- */}
      <Section
        id="compliance"
        title="Quality and compliance"
        lede="The part of an About page a procurement officer reads first, so it is not at the bottom."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMPLIANCE.map(({ icon: Glyph, title, detail, meta }) => (
            <Card key={title} padding="lg" className="flex flex-col">
              <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Glyph size={22} />
              </span>
              <h3 className="type-h4 mt-4 text-fg">{title}</h3>
              <p className="type-body-sm mt-2 flex-1 text-fg-secondary">{detail}</p>
              <p className="type-caption mt-4 border-t border-edge pt-3 text-fg-muted">{meta}</p>
            </Card>
          ))}
        </div>
        <p className="type-body-sm mt-6 text-fg-secondary">
          Certificates and technical specifications are attached to each product and downloadable from its page.{' '}
          <Link
            to="/support"
            className="font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
          >
            Ask for a document we have not published
          </Link>
          .
        </p>
      </Section>

      {/* ---- Range --------------------------------------------------------- */}
      <Section
        tone="tint"
        title="What we supply"
        lede={`${formatQty(FACTS.products)} products across ${formatQty(FACTS.categories)} categories, ${formatQty(FACTS.latexFree)} of them latex-free. Counts come from the live catalogue, so this list cannot drift out of date.`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <CategoryTile
              key={c.slug}
              as={Link}
              to={`/products?cat=${c.slug}`}
              name={c.name}
              count={c.count}
              icon={Icon[c.icon] ?? Icon.products}
            />
          ))}
        </div>
      </Section>

      {/* ---- Ordering ------------------------------------------------------ */}
      <Section
        title="How ordering works"
        lede="Four steps, and the only one that involves waiting for us is the first."
      >
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ORDERING_STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              {/* The connector is decoration and is hidden from the accessibility
                  tree; the ordered list already carries the sequence. */}
              {i < ORDERING_STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute left-11 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-edge lg:block" />
              )}
              <span className="tabular relative grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="type-h4 mt-4 text-fg">{step.title}</h3>
              <p className="type-body-sm mt-2 text-fg-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---- Who we supply -------------------------------------------------- */}
      <Section tone="tint" title="Who we supply" lede="Four kinds of buyer, with genuinely different needs.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUYERS.map(({ icon: Glyph, label, body }) => (
            <Card key={label} padding="lg">
              <Glyph size={24} className="text-brand-700" />
              <h3 className="type-h4 mt-3 text-fg">{label}</h3>
              <p className="type-body-sm mt-2 text-fg-secondary">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---- Milestones ----------------------------------------------------- */}
      <Section title="How we got here" lede="Seventeen years, condensed.">
        {/* A real <ol> with the year as the first line of each entry. The DS
            Timeline component is bound to ORDER_STATUS — it renders order
            lifecycle icons and labels — so it is the wrong tool for company
            history, and forcing it would put a "Dispatched" glyph next to 2016. */}
        <ol className="relative border-l border-edge pl-6 sm:pl-8">
          {MILESTONES.map((m) => (
            <li key={m.year} className="relative pb-8 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -left-[calc(1.5rem+5px)] top-1.5 size-2.5 rounded-full bg-brand-600 ring-4 ring-canvas sm:-left-[calc(2rem+5px)]"
              />
              <p className="tabular type-label text-brand-700">{m.year}</p>
              <h3 className="type-h4 mt-1 text-fg">{m.title}</h3>
              <p className="type-body-sm mt-1.5 max-w-2xl text-fg-secondary">{m.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---- People --------------------------------------------------------- */}
      <Section
        tone="tint"
        title="Who you will be dealing with"
        lede="Initials, not stock portraits — §22 rules out generic imagery, and a placeholder face is worse than none."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERSHIP.map((person) => (
            <Card key={person.name} padding="lg" className="flex items-start gap-3">
              <Avatar name={person.name} size="lg" />
              <div className="min-w-0">
                <p className="type-body-sm font-semibold text-fg">{person.name}</p>
                <p className="type-body-sm text-fg-secondary">{person.role}</p>
                <p className="type-caption mt-1 text-fg-muted">{person.focus}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---- CTA ------------------------------------------------------------ */}
      <Container width="app" className="py-14 lg:py-20">
        {/* brand-900 with white type is §3.1's dark navigation surface, ~12:1.
            Only ONE button, and it is the white `secondary` — on a navy band a
            white button already reads as the primary action, and putting a second
            one beside it makes two equal-weight whites with no hierarchy. The
            secondary action is a link, which is what it is. */}
        <div className="rounded-2xl border border-edge bg-brand-900 px-6 py-12 text-center sm:px-12">
          <h2 className="type-h3 text-white">Ready to order, or still comparing?</h2>
          <p className="type-body mx-auto mt-3 max-w-xl text-brand-100">
            The full catalogue is open without an account. Trade prices and stock appear once you log in, and an agent
            can quote anything above the listed quantity.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Button as={Link} to="/products" variant="secondary" iconRight={Icon.arrowRight}>
              Browse {formatQty(FACTS.products)} products
            </Button>
            <Link
              to="/support"
              className="type-body-sm font-medium text-brand-100 underline decoration-brand-500 underline-offset-4 transition-colors hover:text-white"
            >
              Or request a quote from an agent
            </Link>
          </div>
        </div>
      </Container>

      <ShopFooter />
    </>
  );
}

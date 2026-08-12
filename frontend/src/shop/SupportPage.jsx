// /support — the page every other page sends people to.
//
// The footer's "Request a quote", "Minimum order quantities" and "Delivery and
// dispatch" all point here, and so does the Request quote button on every
// out-of-stock product. So this is not a contact page with an email address on
// it: it has to answer those questions on the page, and take an enquiry when it
// cannot.
//
// THE ORDER OF THE PAGE IS THE ORDER OF LIKELIHOOD. Self-service first — the
// channels with their real hours, then the enquiry form for the thing you came to
// ask, then the FAQs that make the form unnecessary. Burying the form under
// twenty FAQs is the pattern that makes people hunt for a phone number, and
// putting the FAQs above it pretends we know their question better than they do.
//
// EVERY EDGE CASE THE FORM CAN REACH IS HANDLED HERE, NOT LEFT TO THE BACKEND:
// empty required fields, a malformed email, a phone number that is not ten
// digits, a quantity that is not a positive whole number, a message under 20 or
// over 1,000 characters, unticked consent, a repeated submit, and an unknown
// product code arriving in the URL. See validateEnquiry() in support.js.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  EmptyState,
  Field,
  Input,
  Panel,
  RadioGroup,
  SearchInput,
  Select,
  Textarea,
  cx,
  formatQty,
  useToast,
  Icon,
} from '../components/DesignSystem';
import { products } from '../components/DesignSystem/dummy.js';
import usePageTitle from '../components/usePageTitle';
import Section from './Section.jsx';
import ShopFooter from './ShopFooter.jsx';
import {
  EMPTY_ENQUIRY,
  FIELD_LABEL,
  FIELD_ORDER,
  MESSAGE_MAX,
  MESSAGE_MIN,
  TOPICS,
  TOPIC_VALUES,
  enquiryReference,
  filterFaqs,
  officeStatus,
  validateEnquiry,
} from './support.js';

/** The live badge, mounted only after hydration — see the note inside. */
function OfficeStatus() {
  // Deliberately null on the first render. The status depends on the clock, so
  // computing it during render makes the markup a function of *when* it rendered;
  // the moment this app is server-rendered or pre-rendered that becomes a
  // hydration mismatch. The hours below it are static and always correct, so the
  // badge is additive.
  const [status, setStatus] = useState(null);
  useEffect(() => {
    const tick = () => setStatus(officeStatus());
    tick();
    // A minute is the resolution of the claim being made, so it is also the
    // refresh rate. Cleared on unmount — an interval left running after a route
    // change calls setState on a dead component.
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;
  return (
    <Badge tone={status.open ? 'success' : 'neutral'} icon={status.open ? Icon.success : Icon.pending} size="sm">
      {status.open ? 'Open now' : 'Closed'} · {status.detail}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const CHANNELS = [
  {
    icon: Icon.phone,
    title: 'Call the order desk',
    value: '+91 40 3500 0000',
    href: 'tel:+914035000000',
    hours: 'Mon–Fri 09:30–18:30 · Sat 09:30–14:30 IST',
    note: 'Fastest for a dispatch or delivery question on an order already placed.',
    live: true,
  },
  {
    icon: Icon.mail,
    title: 'Email orders and quotes',
    value: 'orders@ayursurgitech.com',
    href: 'mailto:orders@ayursurgitech.com',
    hours: 'Replies within one working day',
    note: 'Send a purchase order, a rate-contract request or a bulk requirement list.',
  },
  {
    icon: Icon.location,
    title: 'Registered office',
    value: 'Hyderabad, Telangana',
    hours: 'Visits by appointment',
    note: 'Plot 14, Phase II, IDA Cherlapally, Hyderabad 500051, Telangana, India.',
  },
];

const RESPONSE_TIMES = [
  ['Order or delivery question', 'Same working day'],
  ['Quote request', '1 working day'],
  ['New account verification', '1 working day'],
  ['Returns or complaint', '2 working days'],
];

const DOCUMENTS = [
  ['Full product catalogue', 'PDF · 4.2 MB'],
  ['ISO 13485 certificate', 'PDF · 310 KB'],
  ['CE declaration of conformity', 'PDF · 265 KB'],
  ['GST registration certificate', 'PDF · 180 KB'],
  ['Rate contract template', 'DOCX · 96 KB'],
];

const FAQS = [
  {
    group: 'Ordering',
    q: 'Is there a minimum order quantity?',
    a: 'Yes, per product rather than per order. Each product lists its MOQ on the catalogue and the quantity stepper only steps in that multiple, so a line cannot be ordered in a quantity we cannot pick. There is no minimum order value on top of it.',
  },
  {
    group: 'Ordering',
    q: 'Can I order more than the stock shown?',
    a: 'Not directly — the stepper caps at the figure in the warehouse so a confirmed order is always a shippable one. For anything above it, send a quote request with the quantity and required date and an agent will confirm a production or procurement lead time.',
  },
  {
    group: 'Ordering',
    q: 'Do I need an account to see prices?',
    a: 'The catalogue, specifications and documentation are open to everyone. Trade prices and live stock appear once you are logged in, because they are account-specific — slab pricing and rate contracts differ between a hospital and a distributor.',
  },
  {
    group: 'Delivery',
    q: 'How quickly do you dispatch?',
    a: 'Orders confirmed before 15:00 IST on a working day are picked the same day and dispatched within 24–48 hours. Transit time on top of that depends on the destination; metro addresses are typically 1–3 days, the rest of India 3–6.',
  },
  {
    group: 'Delivery',
    q: 'Can I schedule deliveries against a rate contract?',
    a: 'Yes. Standing orders with scheduled call-offs are set up by your assigned agent. Send the annual requirement and the delivery calendar through the form below and we will draft the contract.',
  },
  {
    group: 'Delivery',
    q: 'What paperwork travels with the consignment?',
    a: 'Tax invoice, e-way bill where applicable, packing list, and batch documentation for sterile products. The same documents appear on your orders page on the day of dispatch.',
  },
  {
    group: 'Pricing and GST',
    q: 'Are the listed prices inclusive of GST?',
    a: 'No. Every price on the catalogue is exclusive of GST. Each product shows its GST slab and HSN code, and the tax is calculated on the order summary before you confirm.',
  },
  {
    group: 'Pricing and GST',
    q: 'Do you offer credit terms?',
    a: 'Credit is available to verified hospitals and distributors after the first three settled orders. Terms are set per account — send your GSTIN and requirement through the form and we will come back with what we can offer.',
  },
  {
    group: 'Quality',
    q: 'Which products are supplied sterile?',
    a: 'Sterile products carry a Sterile badge on the catalogue and on their product page, with batch number and expiry printed on the pack. Sterilisation is ethylene oxide on validated cycles. Products without the badge — dressings and consumables where sterility is not applicable — say so rather than leaving it blank.',
  },
  {
    group: 'Quality',
    q: 'Can I get certificates before ordering?',
    a: 'Yes, and you should not have to ask. Technical specification, CE certificate and brochure are attached to each product and downloadable without an account. Anything not published — a specific batch certificate, a validation summary — comes through the form.',
  },
  {
    group: 'Returns',
    q: 'What is the returns policy?',
    a: 'Short supply, damage in transit or a wrong item: report within 48 hours of delivery with photographs and we replace or credit it. Sterile products cannot be returned once the pack is opened, for the reason you would expect.',
  },
  {
    group: 'Account',
    q: 'What do you need to open an account?',
    a: 'GSTIN, a drug licence where the product range requires one, and a delivery address. Verification is normally within one working day, and you can browse the catalogue while it is in progress.',
  },
];

/* -------------------------------------------------------------------------- */
/* The enquiry form                                                           */
/* -------------------------------------------------------------------------- */

function EnquiryForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const summaryRef = useRef(null);

  // Arriving from a product: /support?product=AST-IV-1001&topic=quote.
  // An unrecognised code is not an error — it is still pre-filled into the field
  // so nothing the visitor arrived with is silently thrown away — but the
  // confirmation card that names the product only appears when we found it.
  const requestedCode = (searchParams.get('product') ?? '').trim();
  const requestedProduct = useMemo(
    () => (requestedCode ? products.find((p) => p.code.toLowerCase() === requestedCode.toLowerCase()) : undefined),
    [requestedCode],
  );
  const requestedTopic = searchParams.get('topic');

  const [values, setValues] = useState(() => ({
    ...EMPTY_ENQUIRY,
    productCode: requestedProduct?.code ?? requestedCode,
    topic: TOPIC_VALUES.has(requestedTopic) ? requestedTopic : requestedCode ? 'quote' : 'general',
  }));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState(null);
  // The product note is dismissible, so its visibility is state and not a
  // re-reading of the URL. Deriving it from `requestedProduct` alone would make
  // the dismiss button a control that does nothing.
  const [productNoteHidden, setProductNoteHidden] = useState(false);

  // The URL can change under the form — a second Request quote click from another
  // tab's product page, or the back button. Re-seed only the two fields the URL
  // owns, and only while the form is untouched, so this can never wipe a message
  // someone is halfway through typing.
  const pristine = !submitted && values.message === '' && values.name === '';
  useEffect(() => {
    if (!pristine || !requestedCode) return;
    setValues((v) => ({ ...v, productCode: requestedProduct?.code ?? requestedCode, topic: 'quote' }));
  }, [pristine, requestedCode, requestedProduct]);

  const set = (key) => (event) => {
    const value = event?.target?.type === 'checkbox' ? event.target.checked : event.target.value;
    setValues((v) => {
      const next = { ...v, [key]: value };
      // Re-validate live, but only after the first failed submit. Marking a field
      // red while someone is still typing their first character is the most
      // disliked behaviour a form has; going quiet after they have fixed it is
      // the one they expect.
      if (submitted) setErrors(validateEnquiry(next));
      return next;
    });
  };

  const focusField = (key) => {
    const el = document.getElementById(`enq-${key}`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);
    setSubmitted(true);

    if (Object.keys(found).length > 0) {
      // Focus the summary rather than the first bad field: it tells the user how
      // many things are wrong before dropping them into one of them, and it is
      // the only way a RadioGroup or a checkbox error is reachable at all.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    // No network yet, so no artificial delay pretending there is one. The button
    // carries a loading state for when this becomes a request; a fake 800ms spin
    // would only teach everyone to distrust the timing.
    const ref = enquiryReference();
    setReference(ref);
    toast.success(`Reference ${ref}. We reply within one working day.`, { title: 'Enquiry sent' });
  };

  const reset = () => {
    setValues({ ...EMPTY_ENQUIRY });
    setErrors({});
    setSubmitted(false);
    setReference(null);
    setProductNoteHidden(false);
    // Drop the product context too, or "Send another" reopens the form still
    // pinned to a product the next enquiry may have nothing to do with.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('product');
        next.delete('topic');
        return next;
      },
      { replace: true },
    );
  };

  /* ---- Sent ------------------------------------------------------------- */
  if (reference) {
    return (
      <Panel className="p-6 sm:p-8">
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-success-bg text-success-700">
            <Icon.success size={24} />
          </span>
          <div className="min-w-0">
            <h2 className="type-h3 text-fg">Enquiry sent</h2>
            <p className="type-body mt-2 text-fg-secondary">
              Your reference is <span className="tabular font-semibold text-fg">{reference}</span>. Quote it if you
              call the order desk about this enquiry.
            </p>
            <Divider className="my-6" />
            <p className="type-label text-fg-muted">What happens next</p>
            <ol className="mt-3 space-y-2">
              {[
                'A confirmation is on its way to the email address you gave.',
                'An agent picks it up on the next working day — sooner if the office is open.',
                'Quotes come back as a PDF you can raise a purchase order against.',
              ].map((step, i) => (
                <li key={step} className="type-body-sm flex gap-2.5 text-fg-secondary">
                  <span className="tabular grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[0.6875rem] font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button as={Link} to="/products" iconRight={Icon.arrowRight}>
                Back to the catalogue
              </Button>
              <Button variant="tertiary" onClick={reset} iconLeft={Icon.add}>
                Send another enquiry
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  const problems = FIELD_ORDER.filter((key) => errors[key]);
  const remaining = MESSAGE_MAX - values.message.length;

  /* ---- Form -------------------------------------------------------------- */
  return (
    <Panel className="p-6 sm:p-8">
      <h2 className="type-h3 text-fg">Send us an enquiry</h2>
      <p className="type-body-sm mt-2 text-fg-secondary">
        Everything marked with <span className="text-error-700">*</span> is needed before we can reply. We answer
        within one working day.
      </p>

      {/* The product this enquiry is about, when we know it. */}
      {requestedProduct && !productNoteHidden && (
        <Alert
          tone="info"
          className="mt-6"
          title="About a specific product"
          onDismiss={() => {
            setProductNoteHidden(true);
            setValues((v) => ({ ...v, productCode: '' }));
          }}
        >
          <span className="tabular font-medium text-fg">{requestedProduct.code}</span> — {requestedProduct.name}.{' '}
          {requestedProduct.stock <= 0
            ? 'It is out of stock, so an agent will confirm a lead time.'
            : `In stock: ${formatQty(requestedProduct.stock)} ${requestedProduct.uom.toLowerCase()}.`}
        </Alert>
      )}

      {/* An error summary, not just red fields. Someone who submits a long form
          with three problems in it needs to know there are three, and where,
          without scrolling the page hunting for red. tabIndex -1 so it can take
          focus programmatically without becoming a tab stop afterwards. */}
      {submitted && problems.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} className="mt-6 outline-none">
          <Alert
            tone="error"
            title={
              problems.length === 1
                ? 'There is one problem with this form'
                : `There are ${problems.length} problems with this form`
            }
          >
            <ul className="mt-1 space-y-1">
              {problems.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => focusField(key)}
                    className="text-left font-medium text-error-700 underline underline-offset-2 hover:text-error"
                  >
                    {FIELD_LABEL[key]}: {errors[key]}
                  </button>
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-6">
        <RadioGroup
          legend="What is your enquiry about?"
          name="topic"
          columns={2}
          options={TOPICS}
          value={values.topic}
          onChange={(topic) => setValues((v) => ({ ...v, topic }))}
        />

        <Divider />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" htmlFor="enq-name" required error={errors.name}>
            <Input value={values.name} onChange={set('name')} autoComplete="name" placeholder="Dr Anita Rao" />
          </Field>
          <Field label="Organisation" htmlFor="enq-organisation" required error={errors.organisation}>
            <Input
              value={values.organisation}
              onChange={set('organisation')}
              autoComplete="organization"
              placeholder="Apollo Hospitals, Kondapur"
            />
          </Field>
          <Field label="Email address" htmlFor="enq-email" required error={errors.email}>
            <Input
              type="email"
              inputMode="email"
              value={values.email}
              onChange={set('email')}
              autoComplete="email"
              placeholder="procurement@hospital.in"
            />
          </Field>
          <Field
            label="Phone number"
            htmlFor="enq-phone"
            required
            error={errors.phone}
            helper="With or without +91."
          >
            <Input
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={set('phone')}
              autoComplete="tel"
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Product code"
            htmlFor="enq-productCode"
            optional
            helper="On the catalogue, under every product name."
          >
            <Input
              value={values.productCode}
              onChange={set('productCode')}
              placeholder="AST-IV-1001"
              list="enq-product-codes"
            />
            {/* A native datalist: type-ahead over the whole catalogue with no
                combobox ARIA to get wrong, and it degrades to a plain text field
                where it is unsupported. */}
            <datalist id="enq-product-codes">
              {products.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name}
                </option>
              ))}
            </datalist>
          </Field>
          <Field
            label="Quantity required"
            htmlFor="enq-quantity"
            optional
            error={errors.quantity}
            helper="Whole units. Helps us quote the right slab."
          >
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={values.quantity}
              onChange={set('quantity')}
              placeholder="500"
            />
          </Field>
        </div>

        <Field
          label="Your message"
          htmlFor="enq-message"
          required
          error={errors.message}
          hint={
            // A counter that only speaks up when it is nearly relevant. A live
            // "1000 characters remaining" from the first keystroke is noise.
            remaining <= 150 ? (
              <span className={cx('tabular', remaining < 0 ? 'text-error-700' : 'text-fg-muted')}>
                {remaining < 0 ? `${formatQty(-remaining)} over` : `${formatQty(remaining)} left`}
              </span>
            ) : undefined
          }
          helper={`Quantities, delivery location and required date get you a faster answer. ${MESSAGE_MIN} characters minimum.`}
        >
          <Textarea
            rows={6}
            value={values.message}
            onChange={set('message')}
            // maxLength would silently swallow a paste, which reads as the form
            // being broken. The rule is enforced in validateEnquiry() where it can
            // explain itself.
            placeholder="We need 5,000 vented infusion sets delivered to Kondapur before the end of the month, against rate contract RC-2026-14."
          />
        </Field>

        <Divider />

        <div>
          <Checkbox
            id="enq-consent"
            checked={values.consent}
            onChange={set('consent')}
            invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'enq-consent-error' : undefined}
            label="You may contact me about this enquiry"
            description="We use these details to answer you and nothing else. No marketing lists."
          />
          {errors.consent && (
            <p id="enq-consent-error" className="type-caption mt-2 flex items-start gap-1.5 text-error-700">
              <Icon.danger size={14} className="mt-px shrink-0" />
              {errors.consent}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-edge pt-6 sm:flex-row sm:items-center sm:justify-end">
          <p className="type-caption mr-auto text-fg-secondary">
            Prefer the phone?{' '}
            <a href="tel:+914035000000" className="font-medium text-brand-700 underline underline-offset-2">
              +91 40 3500 0000
            </a>
          </p>
          <Button type="button" variant="tertiary" onClick={reset}>
            Clear
          </Button>
          <Button type="submit" iconRight={Icon.arrowRight}>
            Send enquiry
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQs                                                                       */
/* -------------------------------------------------------------------------- */

const FAQ_GROUPS = [...new Set(FAQS.map((f) => f.group))];

function Faqs() {
  const [term, setTerm] = useState('');
  const [group, setGroup] = useState('all');

  const matches = useMemo(() => filterFaqs(FAQS, { term, group }), [term, group]);

  const grouped = FAQ_GROUPS.map((g) => [g, matches.filter((f) => f.group === g)]).filter(([, list]) => list.length);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="faq-search" className="sr-only-ds">
            Search the FAQs
          </label>
          <SearchInput
            id="faq-search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onClear={() => setTerm('')}
            placeholder="Search FAQs — MOQ, GST, dispatch…"
          />
        </div>
        <label htmlFor="faq-group" className="sr-only-ds">
          Filter FAQs by topic
        </label>
        <Select
          id="faq-group"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-48"
          options={[{ value: 'all', label: 'All topics' }, ...FAQ_GROUPS.map((g) => ({ value: g, label: g }))]}
        />
        <p role="status" aria-live="polite" className="type-caption ml-auto text-fg-secondary">
          {matches.length === FAQS.length
            ? `${formatQty(FAQS.length)} questions`
            : `${formatQty(matches.length)} of ${formatQty(FAQS.length)}`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-xl border border-edge bg-surface">
          <EmptyState
            variant="no-results"
            icon={Icon.search}
            title="No answer matches that"
            body={`Nothing in the FAQs mentions “${term.trim()}”. Ask us directly — the form above reaches an agent who can answer it properly.`}
            action={
              <Button
                variant="secondary"
                iconLeft={Icon.close}
                onClick={() => {
                  setTerm('');
                  setGroup('all');
                }}
              >
                Clear the search
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(([groupName, list]) => (
            <div key={groupName}>
              <h3 className="type-label text-brand-700">{groupName}</h3>
              {/* Native <details>. It is keyboard operable, announced correctly and
                  findable by the browser's own find-in-page in every current
                  engine — none of which a hand-rolled accordion gets for free. */}
              <div className="mt-3 divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-surface">
                {list.map((faq) => (
                  <details key={faq.q} className="group">
                    <summary className="type-body flex cursor-pointer list-none items-start gap-3 px-5 py-4 font-medium text-fg transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                      <Icon.chevronRight
                        size={18}
                        className="mt-0.5 shrink-0 text-fg-muted transition-transform group-open:rotate-90"
                      />
                      <span className="min-w-0 flex-1">{faq.q}</span>
                    </summary>
                    <div className="type-body-sm px-5 pb-5 pl-[3.25rem] text-fg-secondary">{faq.a}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

export default function SupportPage() {
  usePageTitle('Support');

  return (
    <>
      {/* ---- Header -------------------------------------------------------- */}
      <div className="border-b border-edge bg-brand-50">
        <Container width="app" className="py-12 lg:py-16">
          <h1 className="type-h2 text-brand-900">Support</h1>
          <p className="type-body-lg mt-3 max-w-2xl text-fg-secondary">
            Order and delivery questions, quotes, minimum order quantities, documentation and returns. Most of it is
            answered on this page; the rest reaches an agent within one working day.
          </p>
          <nav aria-label="On this page" className="mt-7 flex flex-wrap gap-2">
            {[
              ['#contact', 'Contact us', Icon.phone],
              ['#enquiry', 'Send an enquiry', Icon.mail],
              ['#faqs', 'FAQs', Icon.help],
              ['#documents', 'Documents', Icon.documents],
            ].map(([href, label, Glyph]) => (
              <a
                key={href}
                href={href}
                className="type-body-sm inline-flex items-center gap-2 rounded-lg border border-edge-strong bg-surface px-3 py-2 font-medium text-fg-secondary transition-colors hover:border-brand-500 hover:text-brand-700"
              >
                <Glyph size={16} />
                {label}
              </a>
            ))}
          </nav>
        </Container>
      </div>

      {/* ---- Channels ------------------------------------------------------ */}
      <Section id="contact" title="How to reach us" lede="Three ways in, with what each one is actually best at.">
        <div className="grid gap-4 lg:grid-cols-3">
          {CHANNELS.map(({ icon: Glyph, title, value, href, hours, note, live }) => (
            <Card key={title} padding="lg" className="flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Glyph size={22} />
                </span>
                <div className="min-w-0">
                  <h3 className="type-h4 text-fg">{title}</h3>
                  {href ? (
                    <a
                      href={href}
                      className="type-body mt-1 block break-words font-semibold text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="type-body mt-1 font-semibold text-fg">{value}</p>
                  )}
                </div>
              </div>
              {live && (
                <div className="mt-4">
                  <OfficeStatus />
                </div>
              )}
              <p className="type-caption mt-4 text-fg-muted">{hours}</p>
              <p className="type-body-sm mt-2 flex-1 text-fg-secondary">{note}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---- Enquiry + sidebar --------------------------------------------- */}
      <Section id="enquiry" tone="tint">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EnquiryForm />
          </div>

          <aside className="space-y-4" aria-label="Support information">
            <Card padding="lg">
              <h2 className="type-h4 text-fg">When to expect a reply</h2>
              <dl className="mt-4 space-y-3">
                {RESPONSE_TIMES.map(([what, when]) => (
                  <div key={what} className="flex items-baseline justify-between gap-4 border-b border-edge pb-3 last:border-0 last:pb-0">
                    <dt className="type-body-sm min-w-0 text-fg-secondary">{what}</dt>
                    <dd className="type-body-sm shrink-0 font-semibold text-fg">{when}</dd>
                  </div>
                ))}
              </dl>
              <p className="type-caption mt-4 text-fg-muted">
                Working days are Monday to Saturday, excluding public holidays in Telangana.
              </p>
            </Card>

            <Card padding="lg">
              <h2 className="type-h4 text-fg">Already have an order?</h2>
              <p className="type-body-sm mt-2 text-fg-secondary">
                Dispatch status, invoices and batch documents are on the order itself — usually faster than asking.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  ['Your orders', '/orders', Icon.orders],
                  ['Your account', '/account', Icon.users],
                  ['Browse the catalogue', '/products', Icon.products],
                ].map(([label, to, Glyph]) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="type-body-sm flex min-h-11 items-center gap-2.5 rounded-lg px-2 font-medium text-fg-secondary transition-colors hover:bg-surface-2 hover:text-brand-700"
                    >
                      <Glyph size={17} className="shrink-0 text-brand-700" />
                      <span className="flex-1">{label}</span>
                      <Icon.chevronRight size={15} className="shrink-0 text-fg-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </Section>

      {/* ---- FAQs ----------------------------------------------------------- */}
      <Section
        id="faqs"
        title="Frequently asked"
        lede="The questions the order desk answers most often, including the two the footer links here for — minimum order quantities and dispatch."
      >
        <Faqs />
      </Section>

      {/* ---- Documents ------------------------------------------------------ */}
      <Section
        id="documents"
        tone="tint"
        title="Documents"
        lede="Company-level documents. Per-product certificates and specifications live on each product page."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOCUMENTS.map(([name, meta]) => (
            <a
              key={name}
              href="#"
              // A placeholder until the files exist. It must not navigate: a
              // download link that reloads the page to the top is worse than one
              // that visibly does nothing.
              onClick={(e) => e.preventDefault()}
              className="group flex items-center gap-3 rounded-xl border border-edge bg-surface p-4 transition-[box-shadow,border-color] duration-150 hover:border-brand-500 hover:shadow-e1"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon.documents size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-body-sm block truncate font-semibold text-fg">{name}</span>
                <span className="type-caption text-fg-secondary">{meta}</span>
              </span>
              <Icon.download size={16} className="shrink-0 text-fg-muted transition-colors group-hover:text-brand-700" />
            </a>
          ))}
        </div>
      </Section>

      <ShopFooter />
    </>
  );
}

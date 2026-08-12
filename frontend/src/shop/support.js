// The logic behind /support, with no React in it.
//
// Same split as catalogue.js and ProductsPage.jsx: the rules live apart from the
// markup so they can be read, reasoned about and tested without mounting a page.
// Everything here is a pure function of its arguments — except officeStatus(),
// which reads the clock and says so.

/* -------------------------------------------------------------------------- */
/* Opening hours, in IST                                                      */
/* -------------------------------------------------------------------------- */

// Minutes from midnight, Sunday = 0. Sunday is absent, which is what closed means.
export const OPENING = {
  1: [570, 1110], // Mon 09:30–18:30
  2: [570, 1110],
  3: [570, 1110],
  4: [570, 1110],
  5: [570, 1110],
  6: [570, 870], // Sat 09:30–14:30
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const hhmm = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/**
 * Turn a weekday and a minute-of-day into what the office is doing.
 *
 * Split out from officeStatus so the branch that matters — Saturday afternoon and
 * Sunday both resolving to Monday, midnight not landing a day late — is testable
 * without faking a clock.
 */
export function statusAt(day, minutes) {
  const today = OPENING[day];
  if (today && minutes >= today[0] && minutes < today[1]) {
    return { open: true, detail: `Closes ${hhmm(today[1])} IST` };
  }
  // Walk forward to the next day that opens, which is how Saturday evening and
  // Sunday both reach Monday without a special case for either.
  for (let ahead = 0; ahead <= 7; ahead += 1) {
    const d = (day + ahead) % 7;
    const hours = OPENING[d];
    if (!hours) continue;
    if (ahead === 0 && minutes >= hours[0]) continue;
    const when = ahead === 0 ? 'today' : ahead === 1 ? 'tomorrow' : DAY_NAMES[d];
    return { open: false, detail: `Opens ${when} at ${hhmm(hours[0])} IST` };
  }
  return { open: false, detail: 'Mon–Sat, 09:30 IST' };
}

/**
 * Where in the working week Hyderabad currently is.
 *
 * IT READS THE CLOCK IN ASIA/KOLKATA, NOT THE VISITOR'S. A distributor in Dubai
 * looking at this page at 09:00 their time is looking at 10:30 ours, and an "Open
 * now" badge based on their clock is worse than no badge at all.
 *
 * Returns null when the environment cannot do time zones. The caller then renders
 * the hours as plain text with no live claim attached: a wrong "Open now" is a
 * broken promise, an absent one is only less information.
 */
export function officeStatus(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const get = (type) => parts.find((p) => p.type === type)?.value;
    const day = WEEKDAY_INDEX[get('weekday')];
    // en-GB emits "24" for midnight rather than "00". Left unhandled it puts the
    // office 24 hours into the following day.
    const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
    if (day == null || Number.isNaN(minutes)) return null;
    return statusAt(day, minutes);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* The enquiry form                                                           */
/* -------------------------------------------------------------------------- */

export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 1000;
export const QTY_MAX = 1_000_000;

// Deliberately permissive. A stricter pattern rejects real addresses — plus
// addressing, new TLDs, long subdomains — and the only thing that truly validates
// an email is sending one. This catches the typo, not the exotic.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const TOPICS = [
  { value: 'quote', label: 'Request a quote', description: 'Bulk quantities, rate contracts, or a product not in stock.' },
  { value: 'order', label: 'An order or delivery', description: 'Dispatch status, part deliveries, damaged consignment.' },
  { value: 'product', label: 'A product question', description: 'Specifications, sterilisation, compatibility, documentation.' },
  { value: 'account', label: 'Account or billing', description: 'Opening an account, GST details, invoices, credit terms.' },
  { value: 'returns', label: 'Returns or a complaint', description: 'Wrong item, short supply, quality concern.' },
  { value: 'general', label: 'Something else', description: 'Anything that does not fit the boxes above.' },
];
export const TOPIC_VALUES = new Set(TOPICS.map((t) => t.value));

export const EMPTY_ENQUIRY = {
  topic: 'general',
  name: '',
  organisation: '',
  email: '',
  phone: '',
  productCode: '',
  quantity: '',
  message: '',
  consent: false,
};

export const FIELD_LABEL = {
  name: 'Your name',
  organisation: 'Organisation',
  email: 'Email address',
  phone: 'Phone number',
  quantity: 'Quantity required',
  message: 'Your message',
  consent: 'Consent to be contacted',
};

// The error summary lists problems in form order, not in whatever order the
// object happened to be built in.
export const FIELD_ORDER = ['name', 'organisation', 'email', 'phone', 'quantity', 'message', 'consent'];

const formatCount = (n) => new Intl.NumberFormat('en-IN').format(n);

/**
 * Every rule the enquiry form enforces, in one function.
 *
 * One function rather than per-field handlers, because the error summary needs
 * the complete picture at submit time and because two copies of "is this
 * required" always drift apart.
 *
 * `topic` is not validated: it is a radio group that ships with a value selected,
 * so there is no state in which it can be empty. Validating it would produce an
 * error message no user can ever see, which is worse than no rule at all.
 */
export function validateEnquiry(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = 'Enter your name.';
  else if (values.name.trim().length < 2) errors.name = 'Enter your full name.';

  if (!values.organisation.trim()) errors.organisation = 'Enter your hospital, clinic or company name.';

  if (!values.email.trim()) errors.email = 'Enter an email address so we can reply.';
  else if (!EMAIL.test(values.email.trim())) errors.email = 'That does not look like an email address. Check for a typo.';

  const digits = values.phone.replace(/\D/g, '');
  if (!values.phone.trim()) {
    errors.phone = 'Enter a phone number.';
  } else if (
    // 10 digits, or 11 with a leading 0, or 12 with a leading 91 — the three ways
    // an Indian number is genuinely written. Anything else is a mistake, not a
    // format we forgot.
    !(digits.length === 10 || (digits.length === 11 && digits.startsWith('0')) || (digits.length === 12 && digits.startsWith('91')))
  ) {
    errors.phone = 'Enter a 10-digit Indian mobile or landline number, with or without +91.';
  }

  if (values.quantity.trim()) {
    const n = Number(values.quantity);
    if (!Number.isInteger(n) || n <= 0) errors.quantity = 'Quantity must be a whole number above zero.';
    else if (n > QTY_MAX) errors.quantity = `For more than ${formatCount(QTY_MAX)} units, call the order desk instead.`;
  }

  const message = values.message.trim();
  if (!message) errors.message = 'Tell us what you need.';
  else if (message.length < MESSAGE_MIN)
    errors.message = `A little more detail, please — at least ${MESSAGE_MIN} characters.`;
  else if (message.length > MESSAGE_MAX) errors.message = `Keep it under ${formatCount(MESSAGE_MAX)} characters.`;

  if (!values.consent) errors.consent = 'Tick the box so we can reply to your enquiry.';

  return errors;
}

/** A reference a caller can quote at the order desk. Never generated in render. */
export const enquiryReference = (at = Date.now()) => `AST-ENQ-${at.toString(36).toUpperCase().slice(-6)}`;

/* -------------------------------------------------------------------------- */
/* FAQs                                                                       */
/* -------------------------------------------------------------------------- */

/** Case-insensitive match across question, answer and topic. */
export function filterFaqs(faqs, { term = '', group = 'all' } = {}) {
  const needle = term.trim().toLowerCase();
  return faqs.filter(
    (f) => (group === 'all' || f.group === group) && (!needle || `${f.q} ${f.a} ${f.group}`.toLowerCase().includes(needle)),
  );
}

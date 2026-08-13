// The shared non-visual bits of the admin panel. One file, because each is a few lines.

// The panel's path is renamed by env in deployment, so it is never hardcoded in a link.
// Same expression App.jsx uses.
export const ADMIN = import.meta.env.VITE_ADMIN_PATH || 'ops-desk';
export const adminUrl = (path = '') => `/${ADMIN}${path}`;

/** "Wound Care & Gauze" -> "wound-care-gauze". Only ever pre-fills; the field stays editable. */
export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ORDER_TONE lived here: a five-state map, written because the old REST API emitted
// five statuses and the design system's registry has twelve. It was a second,
// drifting copy of ORDER_STATUS. The screens read the registry directly now, so a
// status is spelled and coloured the same on the ops desk, in the stepper, in the
// audit trail and on the customer's own order page.

/* -------------------------------------------------------------------------- */
/* Money at the form boundary                                                 */
/* -------------------------------------------------------------------------- */

// Money is integer paise everywhere in this application — see
// DesignSystem/format.js. A form input is the one place it is not: nobody types
// 425000 for ₹4,250. These two functions are that boundary, and they are the only
// place a division or multiplication by 100 belongs.
//
// formatINR output must NEVER reach an input value: "₹4,250.00" parses back to NaN,
// and the thousands separator turns ₹2,480.00 into 200 paise.

/** Paise → a plain editable number string. 425000 → "4250", 425050 → "4250.50". */
export const paiseToRupees = (paise) => {
  const value = (Number(paise) || 0) / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

/** "4,250.50" or " 4250 " → 425050. Grouping and stray spaces survive the trip. */
export const rupeesToPaise = (rupees) => {
  const cleaned = String(rupees ?? '').replace(/[,\s₹]/g, '');
  if (cleaned === '' || Number.isNaN(Number(cleaned))) return 0;
  // Rounded, not truncated: 40.555 entered by hand should not silently lose a paisa.
  return Math.round(Number(cleaned) * 100);
};

/** Is this a number a money field can accept at all? Blank is not — it is missing. */
export const isMoney = (rupees) => {
  const cleaned = String(rupees ?? '').replace(/[,\s₹]/g, '');
  return cleaned !== '' && !Number.isNaN(Number(cleaned)) && Number(cleaned) >= 0;
};

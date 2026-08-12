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

// useLoad lived here and was lib/useFetch.js line for line — same nonce retry, same live flag,
// same three states. The admin screens import useFetch directly now.

/**
 * Order status → a Design System tone and glyph.
 *
 * WHY THIS IS NOT the design system's ORDER_STATUS. That registry is §28's
 * twelve-state lifecycle from the spec — confirmed, packed, inTransit,
 * outForDelivery, returnRequested. backend/routes/orders.js writes five states,
 * and none of the other seven can occur. Passing a status this app does not have
 * to StatusBadge renders a neutral "Unknown" chip, so the five real ones map here
 * instead. Labels still come from components/StatusBadge, which is where the
 * shopper's order page reads them — one spelling for both audiences.
 *
 * Nothing in flight is green: payment pending is the normal state of a freshly
 * placed order (payment is stubbed), and cancelled is a fact rather than an error.
 */
export const ORDER_TONE = {
  paymentPending: { tone: 'warning', icon: 'pending' },
  placed: { tone: 'info', icon: 'check' },
  shipped: { tone: 'brand', icon: 'shipments' },
  delivered: { tone: 'success', icon: 'success' },
  cancelled: { tone: 'neutral', icon: 'blocked' },
};

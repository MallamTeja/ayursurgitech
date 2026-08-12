/** Join class names, dropping anything falsy. The whole of our "cn" needs. */
export const cx = (...parts) => parts.filter(Boolean).join(' ');

/**
 * Stable ids for label/input/error wiring. React 19 has useId, and this is for
 * the cases where the id must exist outside a component body (a lookup table,
 * a story). Prefer useId inside components.
 */
let seq = 0;
export const nextId = (prefix = 'ds') => `${prefix}-${++seq}`;

/** Clamp for progress bars, meters and gauge widths. */
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/**
 * Dev-only assertion for accessibility contracts a component cannot enforce in
 * types — an icon-only button with no accessible name, a table with no caption.
 * Silent in production; loud exactly once in development, where it is fixable.
 */
const warned = new Set();
export const a11yWarn = (condition, message) => {
  if (condition || import.meta.env.PROD || warned.has(message)) return;
  warned.add(message);
  // eslint-disable-next-line no-console
  console.warn(`[AyursurgiTech DS] ${message}`);
};

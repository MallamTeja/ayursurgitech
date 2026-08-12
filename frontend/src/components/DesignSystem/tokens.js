// The token catalogue, as data.
//
// theme.css is authoritative — it is what the browser reads. This file is the
// mirror the *documentation* reads, so the reference pages can render a swatch
// grid, a type ramp and a spacing ladder without hand-maintaining a third copy
// of every value in JSX.
//
// It also carries `contrast()`. That is the point of this file: every swatch on
// the Colours page computes its own WCAG ratio at render time and prints the
// verdict. Documentation that measures itself cannot drift into a lie — if
// someone edits a hex here and it stops passing AA, the page says so out loud
// instead of continuing to claim §24 compliance.

/* -------------------------------------------------------------------------- */
/* WCAG 2.2 relative luminance and contrast — the maths behind every verdict.  */
/* -------------------------------------------------------------------------- */

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** Contrast ratio between two hex colours, 1–21. */
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * The WCAG 2.2 AA verdict for a ratio at a given role.
 *   body  — text under 18.66px bold / 24px regular, needs 4.5:1
 *   large — 24px+, or 18.66px+ at 600 weight, needs 3:1
 *   ui    — borders, icons, focus rings and other non-text, needs 3:1
 */
export const verdict = (ratio, role = 'body') => {
  const min = role === 'body' ? 4.5 : 3;
  return { pass: ratio >= min, min, ratio, label: ratio.toFixed(2) };
};

/* -------------------------------------------------------------------------- */
/* Colour — §3, §4                                                            */
/* -------------------------------------------------------------------------- */

export const SURFACES = {
  surface: '#FFFFFF',
  canvas: '#F7FAFA',
  'surface-2': '#F0F5F5',
};

export const COLOR_GROUPS = [
  {
    name: 'Brand',
    section: '§3.1',
    note: 'brand-600 is the primary action colour. §3.1 forbids it as a dominant background — it earns attention by being rare.',
    tokens: [
      { name: 'brand-900', hex: '#123B4A', use: 'Deep brand, dark navigation, headings on tint', role: 'body' },
      { name: 'brand-700', hex: '#0A6170', use: 'Primary hover — and the default for teal TEXT, see the note below', role: 'body' },
      { name: 'brand-600', hex: '#087F8C', use: 'PRIMARY. Button fills, active nav, selected controls', role: 'body' },
      { name: 'brand-500', hex: '#39A9B6', use: 'Decorative fills and chart series only. Never text, never a border that carries meaning', role: 'ui' },
      { name: 'brand-100', hex: '#DDF3F5', use: 'Badge tints, light brand backgrounds', role: 'none' },
      { name: 'brand-50', hex: '#EFF9FA', use: 'Subtlest brand surface, selected table row', role: 'none' },
    ],
  },
  {
    name: 'Neutral',
    section: '§3.2',
    note: 'Roughly the 60% of §5. The interface is mostly these.',
    tokens: [
      { name: 'canvas', hex: '#F7FAFA', use: 'Application background', role: 'none' },
      { name: 'surface', hex: '#FFFFFF', use: 'Cards, panels, dialogs', role: 'none' },
      { name: 'surface-2', hex: '#F0F5F5', use: 'Table headers, wells, secondary surfaces', role: 'none' },
      { name: 'fg', hex: '#16323D', use: 'Primary text. §3.2: never pure black', role: 'body' },
      { name: 'fg-secondary', hex: '#536B73', use: 'Supporting text — and captions, see below', role: 'body' },
      { name: 'fg-muted', hex: '#82949A', use: 'Large text only. 3.16:1 is below the AA body floor', role: 'large' },
      { name: 'fg-disabled', hex: '#AAB8BC', use: 'Disabled text, always beside a disabled affordance', role: 'none' },
      { name: 'edge', hex: '#DCE7E9', use: 'Every default border', role: 'none' },
      { name: 'edge-strong', hex: '#C7D7DA', use: 'Secondary button border, input border, dividers that must read', role: 'none' },
    ],
  },
  {
    name: 'Semantic',
    section: '§4',
    note: 'Three roles per hue and they are not interchangeable: -bg is a surface, the base is a fill or icon, -700 is text. Mixing them is how a badge ends up at 2.93:1.',
    tokens: [
      { name: 'success', hex: '#198754', use: 'Delivered, Paid, Active — fills and icons', role: 'ui' },
      { name: 'success-700', hex: '#177A4C', use: 'Success TEXT', role: 'body', addition: true, tint: '#EAF7F0' },
      { name: 'success-bg', hex: '#EAF7F0', use: 'Success surface', role: 'none' },
      { name: 'warning', hex: '#C98200', use: 'Low stock, Pending, Expiring — fills and icons', role: 'ui' },
      { name: 'warning-700', hex: '#956000', use: 'Warning TEXT', role: 'body', addition: true, tint: '#FFF6E5' },
      { name: 'warning-bg', hex: '#FFF6E5', use: 'Warning surface', role: 'none' },
      { name: 'error', hex: '#C83C4A', use: 'Failed, Cancelled, Invalid — fills and icons', role: 'ui' },
      { name: 'error-700', hex: '#BF3644', use: 'Error TEXT', role: 'body', addition: true, tint: '#FDECEF' },
      { name: 'error-bg', hex: '#FDECEF', use: 'Error surface', role: 'none' },
      { name: 'info', hex: '#2778A5', use: 'Processing, system messages — fills and icons', role: 'ui' },
      { name: 'info-700', hex: '#25719B', use: 'Info TEXT', role: 'body', addition: true, tint: '#EAF4FA' },
      { name: 'info-bg', hex: '#EAF4FA', use: 'Info surface', role: 'none' },
    ],
  },
];

/** §20 — the only legal chart series. Ordered; a fifth series means rethinking the chart. */
export const CHART_SERIES = [
  { key: 'revenue', label: 'Revenue', token: 'brand-600', hex: '#087F8C' },
  { key: 'orders', label: 'Orders', token: 'brand-500', hex: '#39A9B6' },
  { key: 'customers', label: 'Customers', token: 'brand-900', hex: '#123B4A' },
  { key: 'profit', label: 'Profit', token: 'success', hex: '#198754' },
];

/* -------------------------------------------------------------------------- */
/* Typography — §6.1, plus the four styles this system adds                    */
/* -------------------------------------------------------------------------- */

export const TYPE_SCALE = [
  { cls: 'type-display', name: 'Display', px: 48, weight: 600, lh: 1.1, use: 'One per marketing page, never in an app screen', fluid: '32 → 48' },
  { cls: 'type-h1', name: 'H1', px: 40, weight: 600, lh: 1.15, use: 'Page title', fluid: '28 → 40' },
  { cls: 'type-h2', name: 'H2', px: 32, weight: 600, lh: 1.2, use: 'Section', fluid: '24 → 32' },
  { cls: 'type-h3', name: 'H3', px: 28, weight: 600, lh: 1.25, use: 'Sub-section', fluid: '20 → 28' },
  { cls: 'type-h4', name: 'H4', px: 20, weight: 600, lh: 1.3, use: 'Card and panel titles' },
  { cls: 'type-body-lg', name: 'Body Large', px: 18, weight: 400, lh: 1.55, use: 'Lead paragraph, product summary' },
  { cls: 'type-body', name: 'Body', px: 16, weight: 400, lh: 1.5, use: 'Default' },
  { cls: 'type-body-sm', name: 'Body Small', px: 14, weight: 400, lh: 1.45, use: 'Table body, dense UI, helper text' },
  { cls: 'type-caption', name: 'Caption', px: 12, weight: 400, lh: 1.4, use: 'Metadata. Pair with fg-secondary, not fg-muted' },
];

export const TYPE_ADDITIONS = [
  { cls: 'type-label', name: 'Label', spec: '12px / 600 / 0.06em / uppercase', why: 'The eyebrow above a product name in §15 and above a metric in §19. §6.1 has no style for it and it is on almost every screen.' },
  { cls: 'type-metric', name: 'Metric', spec: '28–36px / 600 / tabular', why: '§6.1 dashboard row. Fluid across the range it gives.' },
  { cls: 'type-th', name: 'Table heading', spec: '13px / 600 / 0.02em', why: '§6.1 says 13–14px 600 for table headings.' },
  { cls: 'type-nav', name: 'Navigation', spec: '15px / 500', why: '§6.1 says 14–15px 500 for navigation.' },
];

/* -------------------------------------------------------------------------- */
/* Spacing, radius, elevation, breakpoints — §8, §9, §10, §23                  */
/* -------------------------------------------------------------------------- */

export const SPACING = [
  { px: 4, tw: '1', name: 'Micro', use: 'Icon-to-label, badge padding' },
  { px: 8, tw: '2', name: 'Small', use: 'Inside a control' },
  { px: 12, tw: '3', name: 'Compact', use: 'Dense rows, compact card padding' },
  { px: 16, tw: '4', name: 'Standard', use: 'Default gap, card padding' },
  { px: 24, tw: '6', name: 'Component', use: 'Between components, panel padding' },
  { px: 32, tw: '8', name: 'Section', use: 'Between sub-sections' },
  { px: 48, tw: '12', name: 'Large section', use: 'Between sections' },
  { px: 64, tw: '16', name: 'Major section', use: 'Between major page regions' },
  { px: 80, tw: '20', name: 'Hero', use: 'Hero block breathing room' },
];

export const RADIUS = [
  { px: 8, tw: 'rounded-lg', use: 'Buttons, inputs, selects, badges-that-are-not-pills' },
  { px: 12, tw: 'rounded-xl', use: 'Cards' },
  { px: 16, tw: 'rounded-2xl', use: 'Panels, dialogs, drawers' },
  { px: 999, tw: 'rounded-full', use: 'Pills, avatars, dots. §9: not everything' },
];

export const ELEVATION = [
  { name: 'Flat', cls: 'border border-edge', use: 'The §10 default. Background plus border, no shadow at all.' },
  { name: 'e1', cls: 'shadow-e1', spec: '0 1px 3px rgb(18 59 74 / .08)', use: 'Card hover, sticky bars.' },
  { name: 'e2', cls: 'shadow-e2', spec: '0 8px 24px rgb(18 59 74 / .10)', use: 'Only things that genuinely float: dialog, drawer, menu, toast.' },
];

export const BREAKPOINTS = [
  { name: 'Mobile', range: '< 640px', tw: '(default)', note: 'One column. Tables become stacked cards.' },
  { name: 'Tablet', range: '640–1023px', tw: 'sm:', note: 'Two columns. Admin sidebar collapses to a drawer.' },
  { name: 'Desktop', range: '1024–1279px', tw: 'lg:', note: 'Admin sidebar becomes permanent.' },
  { name: 'Large', range: '1280px+', tw: 'xl:', note: 'Content caps at container-content / container-app.' },
];

export const DENSITY = [
  { cls: 'density-relaxed', rows: '56px', portal: 'Customer', why: '§29 low–medium. Discovery, not scanning.' },
  { cls: 'density-default', rows: '48px', portal: 'Agent', why: '§29 medium. Actions on a known list.' },
  { cls: 'density-compact', rows: '40px', portal: 'Admin', why: '§29 medium–high. More rows per screen wins.' },
];

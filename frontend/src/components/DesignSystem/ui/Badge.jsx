// Badges and the status vocabulary — §18, §4, §28.
//
// This file is where "never communicate state through colour alone" (§4, and
// §32 Rule 5) is made structural rather than aspirational: a StatusBadge cannot
// be rendered without a glyph and a word, because the status registry below
// stores all three together and there is no prop to turn the label off.
//
// THE REGISTRIES ARE THE POINT. One map per lifecycle, each entry naming its
// label, tone and glyph. A status column, a filter dropdown, a stepper and an
// audit trail all read the same map, so "Out for Delivery" is spelled and
// coloured identically in four places and adding a state is one line.
//
// TONE → COLOUR uses the -700 text steps from theme.css, not §4's base values.
// A badge label is 12px, §4's base colours land between 2.93:1 and 4.38:1 on
// their own tints, and §24 asks for AA. The -700 steps are the same hues at
// 4.8:1+. See the note in theme.css for the measurements.
//
// SHAPE: 8px, not a pill. §9 lists a pill radius but also says "avoid making
// every component a pill", and §2 asks for precision. So state — something the
// system asserts — is squared at 8px, and the pill is reserved for Chip below,
// which is a token the *user* put there and can remove. The shape carries the
// difference between "the system says this" and "you chose this".

import { Icon } from '../icons.jsx';
import { cx } from '../utils.js';

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

const SOFT = {
  neutral: 'bg-surface-2 text-fg-secondary ring-edge-strong',
  brand: 'bg-brand-100 text-brand-700 ring-brand-500/40',
  success: 'bg-success-bg text-success-700 ring-success/30',
  warning: 'bg-warning-bg text-warning-700 ring-warning/30',
  error: 'bg-error-bg text-error-700 ring-error/30',
  info: 'bg-info-bg text-info-700 ring-info/30',
};

const SOLID = {
  neutral: 'bg-fg-secondary text-white ring-transparent',
  brand: 'bg-brand-600 text-white ring-transparent',
  success: 'bg-success text-white ring-transparent',
  warning: 'bg-warning-700 text-white ring-transparent', // base #C98200 is 3.15:1 with white — the -700 step is 5.32:1
  error: 'bg-error text-white ring-transparent',
  info: 'bg-info text-white ring-transparent',
};

const OUTLINE = {
  neutral: 'bg-transparent text-fg-secondary ring-edge-strong',
  brand: 'bg-transparent text-brand-700 ring-brand-600',
  success: 'bg-transparent text-success-700 ring-success',
  warning: 'bg-transparent text-warning-700 ring-warning',
  error: 'bg-transparent text-error-700 ring-error',
  info: 'bg-transparent text-info-700 ring-info',
};

const TONE_SETS = { soft: SOFT, solid: SOLID, outline: OUTLINE };

const BADGE_SIZES = {
  sm: 'h-5 px-1.5 text-[0.6875rem] gap-1', // 20px tall, 11px label — table cells
  md: 'h-6 px-2 text-xs gap-1', // 24px tall, 12px label — the default
};

/**
 * The base badge. Prefer StatusBadge for anything that represents a lifecycle
 * state; reach for Badge directly only for labels that are not states —
 * "GST 12%", "Sterile", "MOQ 100".
 */
export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  icon: Glyph,
  pill = false,
  className,
  children,
  ...rest
}) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center font-medium',
        // ring rather than border: a 1px border would change the box height and
        // knock a badge out of vertical alignment with the text beside it.
        'ring-1 ring-inset',
        pill ? 'rounded-full' : 'rounded-lg',
        BADGE_SIZES[size],
        TONE_SETS[variant][tone],
        className,
      )}
      {...rest}
    >
      {Glyph && <Glyph size={size === 'sm' ? 12 : 14} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Status registries                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Order lifecycle — §28 exactly: eight forward states, four exception states.
 *
 * `step` is the position in the forward sequence, or null for an exception. The
 * Stepper reads it to know how far along an order is, and it is the reason
 * "Delivered before Dispatched" (an Overview §35 invariant) is checkable in the
 * UI as well as the backend.
 *
 * The colour progression is deliberate: neutral → info while work is happening,
 * brand at dispatch when it leaves the building, success only at Delivered.
 * Nothing in flight is green. An operations screen where six of eight states are
 * green cannot be scanned, which is the failure §17 and §19 are both warning
 * about in their own way.
 */
export const ORDER_STATUS = {
  placed: { label: 'Placed', tone: 'neutral', icon: Icon.pending, step: 1 },
  confirmed: { label: 'Confirmed', tone: 'info', icon: Icon.check, step: 2 },
  processing: { label: 'Processing', tone: 'info', icon: Icon.retry, step: 3 },
  packed: { label: 'Packed', tone: 'info', icon: Icon.products, step: 4 },
  dispatched: { label: 'Dispatched', tone: 'brand', icon: Icon.shipments, step: 5 },
  inTransit: { label: 'In Transit', tone: 'brand', icon: Icon.shipments, step: 6 },
  outForDelivery: { label: 'Out for Delivery', tone: 'brand', icon: Icon.location, step: 7 },
  delivered: { label: 'Delivered', tone: 'success', icon: Icon.success, step: 8 },
  cancelled: { label: 'Cancelled', tone: 'error', icon: Icon.error, step: null },
  rejected: { label: 'Rejected', tone: 'error', icon: Icon.blocked, step: null },
  returnRequested: { label: 'Return Requested', tone: 'warning', icon: Icon.warning, step: null },
  returned: { label: 'Returned', tone: 'warning', icon: Icon.arrowLeft, step: null },
};

/** The forward sequence, for the Stepper. Exceptions are not steps. */
export const ORDER_FLOW = Object.entries(ORDER_STATUS)
  .filter(([, s]) => s.step)
  .sort((a, b) => a[1].step - b[1].step)
  .map(([key]) => key);

/** Payment — Overview §19. Kept separate from the order: one order, many payments. */
export const PAYMENT_STATUS = {
  pending: { label: 'Payment Pending', tone: 'warning', icon: Icon.pending },
  partial: { label: 'Partially Paid', tone: 'warning', icon: Icon.discount },
  paid: { label: 'Paid', tone: 'success', icon: Icon.success },
  failed: { label: 'Failed', tone: 'error', icon: Icon.error },
  refunded: { label: 'Refunded', tone: 'neutral', icon: Icon.arrowLeft },
};

/** Quotes — §15. A quote expires, which no other entity in the system does. */
export const QUOTE_STATUS = {
  draft: { label: 'Draft', tone: 'neutral', icon: Icon.edit },
  sent: { label: 'Sent', tone: 'info', icon: Icon.mail },
  underReview: { label: 'Under Review', tone: 'info', icon: Icon.pending },
  approved: { label: 'Approved', tone: 'success', icon: Icon.approved },
  rejected: { label: 'Rejected', tone: 'error', icon: Icon.error },
  expired: { label: 'Expired', tone: 'warning', icon: Icon.calendar },
  converted: { label: 'Converted to Order', tone: 'brand', icon: Icon.orders },
};

/** Stock — §18 names "Low Stock" as a badge, so it is a status, not a number. */
export const STOCK_STATUS = {
  inStock: { label: 'In Stock', tone: 'success', icon: Icon.success },
  lowStock: { label: 'Low Stock', tone: 'warning', icon: Icon.warning },
  outOfStock: { label: 'Out of Stock', tone: 'error', icon: Icon.error },
};

/** Products, organisations, agents, users — anything with an on/off life. */
export const ENTITY_STATUS = {
  active: { label: 'Active', tone: 'success', icon: Icon.active },
  pending: { label: 'Pending Approval', tone: 'warning', icon: Icon.pending },
  'on-hold': { label: 'On Hold', tone: 'error', icon: Icon.blocked },
  inactive: { label: 'Inactive', tone: 'neutral', icon: Icon.neutral },
  discontinued: { label: 'Discontinued', tone: 'neutral', icon: Icon.blocked },
  archived: { label: 'Archived', tone: 'neutral', icon: Icon.audit },
};

export const STATUS_SETS = {
  order: ORDER_STATUS,
  payment: PAYMENT_STATUS,
  quote: QUOTE_STATUS,
  stock: STOCK_STATUS,
  entity: ENTITY_STATUS,
};

/** Derive the stock status from the two numbers a product actually carries. */
export const stockStatusOf = (stock, lowStockAt) =>
  stock <= 0 ? 'outOfStock' : stock <= lowStockAt ? 'lowStock' : 'inStock';

/* -------------------------------------------------------------------------- */
/* StatusBadge                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `<StatusBadge kind="order" value="outForDelivery" />`
 *
 * An unknown key renders as a neutral badge showing the raw value rather than
 * throwing or rendering blank. A status column that silently loses a cell is
 * worse than one that shows an unstyled string you can go and look up.
 */
export function StatusBadge({ kind = 'order', value, variant = 'soft', size = 'md', className }) {
  const entry = STATUS_SETS[kind]?.[value];
  if (!entry) {
    return (
      <Badge tone="neutral" variant="outline" size={size} icon={Icon.help} className={className}>
        {String(value ?? 'Unknown')}
      </Badge>
    );
  }
  return (
    <Badge tone={entry.tone} variant={variant} size={size} icon={entry.icon} className={className}>
      {entry.label}
    </Badge>
  );
}

/**
 * The compact form, for a dense admin table where a full badge in every row
 * turns the column into wallpaper: a coloured dot plus the plain label.
 *
 * The dot is decoration and the label carries the meaning, which is what keeps
 * this compliant with §4 — the colour is never doing the work on its own.
 */
export function StatusDot({ kind = 'order', value, className }) {
  const entry = STATUS_SETS[kind]?.[value];
  const DOT = {
    neutral: 'bg-fg-muted',
    brand: 'bg-brand-600',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
  };
  return (
    <span className={cx('inline-flex items-center gap-2 text-sm text-fg', className)}>
      <span aria-hidden="true" className={cx('size-2 shrink-0 rounded-full', DOT[entry?.tone ?? 'neutral'])} />
      <span className="truncate">{entry?.label ?? String(value ?? 'Unknown')}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Chip                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A filter token the user added and can remove — the pill shape §9 reserves a
 * radius for. `onRemove` adds a dismiss control with its own accessible name,
 * because "×" on its own tells a screen reader nothing about what it removes.
 */
export function Chip({ children, onRemove, removeLabel, icon: Glyph, className, ...rest }) {
  return (
    <span
      className={cx(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 pl-2.5 text-xs font-medium text-fg-secondary ring-1 ring-inset ring-edge-strong',
        onRemove ? 'pr-1' : 'pr-2.5',
        className,
      )}
      {...rest}
    >
      {Glyph && <Glyph size={12} />}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${typeof children === 'string' ? children : 'filter'}`}
          className="grid size-5 place-items-center rounded-full text-fg-muted transition-colors hover:bg-edge hover:text-fg"
        >
          <Icon.close size={12} />
        </button>
      )}
    </span>
  );
}

/**
 * A count beside a nav item or a tab. Tabular so a column of them does not
 * jitter as the numbers change width.
 */
export function CountBadge({ value, tone = 'neutral', className }) {
  return (
    <span
      className={cx(
        'tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-semibold',
        tone === 'brand' ? 'bg-brand-600 text-white' : 'bg-surface-2 text-fg-secondary ring-1 ring-inset ring-edge',
        className,
      )}
    >
      {value}
    </span>
  );
}

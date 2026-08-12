// Cards, panels and metric cards — §10, §19, §9.
//
// §10's instruction is the one that shapes this whole file: most cards should be
// "Background + Border", not a shadow. So the default Card has no shadow at all,
// and e1 appears only when a card is interactive and hovered — the shadow means
// "this responds to you", which is information, rather than decoration.
//
// Radius follows §9 strictly: cards 12px (rounded-xl), panels and dialogs 16px
// (rounded-2xl). The difference is not arbitrary. A panel contains cards; if they
// shared a radius the nesting would read as a mistake.

import { Icon } from '../icons.jsx';
import { formatDelta, formatINRCompact, formatQty } from '../format.js';
import { cx } from '../utils.js';

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The default container. `interactive` is for a card that is itself a link or a
 * button — it adds the hover shadow and the border change, and it should never be
 * set on a card that merely *contains* a link, or the whole surface will lie
 * about being clickable.
 */
export function Card({ as: As = 'div', interactive = false, padding = 'md', className, children, ...rest }) {
  const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <As
      className={cx(
        'rounded-xl border border-edge bg-surface',
        PADDING[padding],
        interactive && 'group transition-[box-shadow,border-color] duration-150 hover:border-edge-strong hover:shadow-e1',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function CardHeader({ title, subtitle, action, icon: Glyph, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-edge px-5 py-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Glyph && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <Glyph size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="type-h4 truncate text-fg">{title}</h3>
          {subtitle && <p className="type-body-sm mt-0.5 text-fg-secondary">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ padding = 'md', className, children }) {
  const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return <div className={cx(PADDING[padding], className)}>{children}</div>;
}

/** surface-2 rather than white, so the footer reads as a sill and not as content. */
export function CardFooter({ className, children }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-3 rounded-b-xl border-t border-edge bg-surface-2 px-5 py-3', className)}>
      {children}
    </div>
  );
}

/**
 * A panel — the 16px container from §9 that holds a whole region of a screen.
 * Use it for the outer frame of a form, a table, or a dashboard section; use Card
 * for the items inside it.
 */
export function Panel({ className, children, ...rest }) {
  return (
    <section className={cx('rounded-2xl border border-edge bg-surface', className)} {...rest}>
      {children}
    </section>
  );
}

/** A recessed block for a note, a summary, or an inline calculation. */
export function Well({ className, children }) {
  return <div className={cx('rounded-xl bg-surface-2 p-4', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* MetricCard — §19                                                           */
/* -------------------------------------------------------------------------- */

/**
 * §19 is unusually specific: label, then primary metric, then comparison — and
 * "do not fill metric cards with decorative graphics that compete with the
 * number". So this card has no chart, no ring, no gradient and no oversized
 * background glyph. The number is the largest thing in it and nothing else is
 * allowed to be.
 *
 * The delta is the one place a small icon appears, because §4 forbids colour
 * alone: a green "12.4%" and a red "12.4%" are the same string to anyone who
 * cannot tell them apart, so the arrow does the talking and the colour supports it.
 *
 * `invertDelta` exists for metrics where down is good — Outstanding, Overdue,
 * Returns. Without it, a falling receivables figure renders red, which reads as an
 * alarm about the best news on the dashboard.
 */
export function MetricCard({
  label,
  value,
  kind = 'count',
  delta,
  context,
  invertDelta = false,
  icon: Glyph,
  className,
}) {
  const shown = kind === 'money' ? formatINRCompact(value) : kind === 'percent' ? `${value}%` : formatQty(value);
  const good = delta == null ? null : invertDelta ? delta < 0 : delta > 0;
  const flat = delta === 0;

  return (
    <Card className={cx('flex flex-col justify-between gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="type-label text-fg-secondary">{label}</p>
        {Glyph && <Glyph size={16} className="shrink-0 text-fg-muted" />}
      </div>

      <p className="type-metric text-fg">{shown}</p>

      {(delta != null || context) && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {delta != null && (
            <span
              className={cx(
                'type-caption inline-flex items-center gap-1 font-semibold',
                flat ? 'text-fg-secondary' : good ? 'text-success-700' : 'text-error-700',
              )}
            >
              {!flat &&
                (delta > 0 ? <Icon.trendUp size={13} aria-hidden="true" /> : <Icon.trendDown size={13} aria-hidden="true" />)}
              <span className="tabular">{formatDelta(delta)}</span>
            </span>
          )}
          {context && <span className="type-caption text-fg-secondary">{context}</span>}
        </div>
      )}
    </Card>
  );
}

/**
 * A row of metric cards. Four across on desktop, two on tablet, one on mobile —
 * §19's cards are meant to be compared, and a comparison you have to scroll
 * through is not one.
 */
export function MetricRow({ className, children }) {
  return <div className={cx('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>;
}

/**
 * A single figure inside a card that already has a heading — the small print of a
 * dashboard: "23 invoices overdue", "4 new customers". Not a MetricCard; it does
 * not own a card of its own.
 */
export function Stat({ label, value, tone = 'default', className }) {
  const TONE = { default: 'text-fg', success: 'text-success-700', warning: 'text-warning-700', error: 'text-error-700' };
  return (
    <div className={cx('min-w-0', className)}>
      <p className="type-caption text-fg-secondary">{label}</p>
      <p className={cx('type-h4 tabular mt-0.5', TONE[tone])}>{value}</p>
    </div>
  );
}

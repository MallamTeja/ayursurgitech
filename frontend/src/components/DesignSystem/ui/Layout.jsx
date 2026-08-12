// Page scaffolding — §11, §23, §29.
//
// The pieces that decide where things sit. §11 gives three portal shapes and §29
// gives them three densities; these components are how a screen picks one
// without re-deciding margins from scratch every time.

import { Icon } from '../icons.jsx';
import { cx } from '../utils.js';

/**
 * The horizontal frame. Two widths, because §11.1 and §11.2 are not the same
 * shape: `content` (1200px) is a reading column for the customer portal, `app`
 * (1536px) is a workspace for admin and agent screens where more columns visible
 * is the whole point. `full` is for a screen that manages its own gutters.
 *
 * Padding steps 16 → 24 → 32 across the §23 breakpoints. It is on every page, so
 * getting it wrong here is getting it wrong everywhere.
 */
export function Container({ width = 'content', className, children, ...rest }) {
  const WIDTHS = {
    content: 'max-w-content',
    app: 'max-w-app',
    full: 'max-w-none',
  };
  return (
    <div className={cx('mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTHS[width], className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * The band at the top of every screen: breadcrumb, title, subtitle, actions.
 *
 * Actions stack below the title on mobile and sit beside it from `sm` up. They
 * are a slot rather than a prop list because §13 already decides what a button
 * looks like — this component only decides where the row of them goes.
 */
export function PageHeader({ breadcrumb, eyebrow, title, subtitle, actions, meta, className, children }) {
  return (
    <header className={cx('border-b border-edge pb-6', className)}>
      {breadcrumb}
      <div className={cx('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', breadcrumb && 'mt-3')}>
        <div className="min-w-0">
          {eyebrow && <p className="type-label mb-1 text-brand-700">{eyebrow}</p>}
          <h1 className="type-h2 text-fg">{title}</h1>
          {subtitle && <p className="type-body mt-2 max-w-2xl text-fg-secondary">{subtitle}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/**
 * A heading inside a page, with an optional action on the right — "Recent
 * Orders / View all". The rule that matters: the action never outranks the
 * heading, so it is always tertiary or a link, never a primary button.
 */
export function SectionHeading({ title, subtitle, action, level = 2, className }) {
  const H = `h${level}`;
  return (
    <div className={cx('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <H className="type-h4 text-fg">{title}</H>
        {subtitle && <p className="type-body-sm mt-1 text-fg-secondary">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * A rule. `label` puts a word in the middle of it — for "or" between a form and
 * an alternative action, which is the only reason to interrupt a divider.
 */
export function Divider({ label, className }) {
  if (!label) return <hr className={cx('border-0 border-t border-edge', className)} />;
  return (
    <div className={cx('flex items-center gap-3', className)} role="separator">
      <span className="h-px flex-1 bg-edge" />
      <span className="type-caption uppercase tracking-widest text-fg-muted">{label}</span>
      <span className="h-px flex-1 bg-edge" />
    </div>
  );
}

/**
 * Initials avatar. No photographs: §22 spends its whole length arguing that
 * imagery should be products, and a B2B roster of stock-photo faces is exactly
 * the "generic healthcare imagery" it rules out. Initials on a brand tint are
 * honest, load instantly and never need a fallback.
 *
 * The tint is picked from the name so the same person is the same colour on
 * every screen — recognisable without being decorative.
 */
const AVATAR_TINTS = [
  'bg-brand-100 text-brand-900',
  'bg-info-bg text-info-700',
  'bg-success-bg text-success-700',
  'bg-warning-bg text-warning-700',
  'bg-surface-2 text-fg-secondary',
];

export function Avatar({ name = '', size = 'md', className }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const tint = AVATAR_TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length];
  const SIZES = { sm: 'size-6 text-[0.625rem]', md: 'size-8 text-xs', lg: 'size-10 text-sm' };
  return (
    <span
      // The name is already beside the avatar in every usage, so announcing it
      // twice is noise. Decorative here, on purpose.
      aria-hidden="true"
      title={name}
      className={cx('inline-grid shrink-0 place-items-center rounded-full font-semibold', SIZES[size], tint, className)}
    >
      {initials || '—'}
    </span>
  );
}

/**
 * Label-and-value, the unit a B2B screen is mostly made of: GSTIN, HSN code, PO
 * number, credit terms, delivery address.
 *
 * A real <dl>, because that is what this is, and screen readers pair the terms
 * with their definitions for free. `columns` switches between the stacked form
 * (order summary) and the two-column form (organisation profile).
 */
export function DescriptionList({ items = [], columns = 1, className }) {
  return (
    <dl
      className={cx(
        'grid gap-x-8 gap-y-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map(({ label, value, hint }) => (
        <div key={label} className="min-w-0">
          <dt className="type-caption text-fg-secondary">{label}</dt>
          <dd className="type-body-sm mt-0.5 font-medium text-fg">{value ?? '—'}</dd>
          {hint && <dd className="type-caption mt-0.5 text-fg-muted">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/**
 * The same pairs as a right-aligned money block — an order total, a quote
 * summary. Amounts are tabular and right-aligned so the digits line up in a
 * column; `emphasis` promotes the last row to the grand total.
 */
export function AmountList({ rows = [], className }) {
  return (
    <dl className={cx('space-y-2', className)}>
      {rows.map(({ label, value, hint, emphasis }, i) => (
        <div
          key={label}
          className={cx(
            'flex items-baseline justify-between gap-4',
            emphasis && 'mt-3 border-t border-edge pt-3',
            i === 0 && 'mt-0',
          )}
        >
          <dt className={cx(emphasis ? 'type-body font-semibold text-fg' : 'type-body-sm text-fg-secondary')}>
            {label}
            {hint && <span className="type-caption ml-1.5 text-fg-muted">{hint}</span>}
          </dt>
          <dd className={cx('tabular shrink-0', emphasis ? 'type-h4 text-fg' : 'type-body-sm font-medium text-fg')}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The §16 "Key specifications" table. Zebra-free and border-light per §17: a
 * spec sheet is read, not scanned, so the rows do not need to be counted.
 */
export function SpecTable({ specs = [], className }) {
  return (
    <table className={cx('w-full text-left', className)}>
      <caption className="sr-only-ds">Product specifications</caption>
      <tbody>
        {specs.map(([key, value]) => (
          <tr key={key} className="border-b border-edge last:border-0">
            <th scope="row" className="type-body-sm w-2/5 py-3 pr-4 font-normal align-top text-fg-secondary">
              {key}
            </th>
            <td className="type-body-sm py-3 font-medium text-fg">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * A short list of facts with a glyph each — "Sterile", "Latex-free", "CE marked".
 * Trust signals for a product page, which §1 lists as a job of the interface.
 */
export function FeatureList({ items = [], className }) {
  return (
    <ul className={cx('space-y-2', className)}>
      {items.map((item) => (
        <li key={item} className="type-body-sm flex items-start gap-2 text-fg-secondary">
          <Icon.check size={16} className="mt-0.5 shrink-0 text-success" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

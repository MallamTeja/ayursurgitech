// Buttons — §13, with §25's loading state and §24's focus and target rules.
//
// §13 defines three variants and no more, so three is what this exports plus one
// addition:
//
//   primary    brand-600 fill, white text, brand-700 hover     §13
//   secondary  white, edge-strong border, brand-900 text       §13
//   tertiary   transparent, teal text                          §13
//   danger     error fill                                      ADDED — see below
//
// WHY `danger` EXISTS. §13 has no destructive variant, and the admin panel deletes
// products, cancels orders and rejects organisations. Without a variant for it,
// every destructive action becomes a one-off style, which is precisely what §31
// says to avoid. error #C83C4A carries white text at 5.00:1, so it is AA as a
// fill with no new colour introduced (§32 Rule 1).
//
// WHY TERTIARY TEXT IS brand-700 AND NOT §13's brand-600. Measured: brand-600 is
// 4.75:1 on white — AA, just. On surface-2 (#F0F5F5) it drops to 4.31:1, which
// is a fail, and a tertiary button's natural home is a toolbar, which is
// surface-2. brand-700 is 7.10:1 on white and 6.45:1 on surface-2, so the same
// component is legible wherever it is dropped. The fill on the primary button is
// still exactly §13's brand-600 — the brand colour keeps its loudest position.

import { forwardRef } from 'react';
import { Icon } from '../icons.jsx';
import { a11yWarn, cx } from '../utils.js';

// DISABLED IS ONE TREATMENT FOR ALL FOUR VARIANTS, and not each variant's own
// colour drained a little. Two reasons. A disabled primary that is still teal
// reads as pressable; and the obvious "white on edge-strong" measures 1.48:1,
// which is not legible by any standard — WCAG 1.4.3 exempts inactive controls
// from the contrast minimum, but a label nobody can read is still a label nobody
// can read. fg-muted on surface-2 is 2.87:1: unmistakably inert, and readable.
const DISABLED = 'disabled:bg-surface-2 disabled:text-fg-muted disabled:border-edge';

const VARIANTS = {
  primary: cx(
    'bg-brand-600 text-white border border-transparent',
    'hover:bg-brand-700 active:bg-brand-900',
    DISABLED,
  ),
  secondary: cx(
    'bg-surface text-brand-900 border border-edge-strong',
    'hover:bg-surface-2 hover:border-brand-600 active:bg-brand-50',
    DISABLED,
  ),
  tertiary: cx(
    'bg-transparent text-brand-700 border border-transparent',
    'hover:bg-brand-50 active:bg-brand-100',
    // Tertiary keeps a transparent fill even when disabled — it has no boundary
    // to begin with, and giving it one on disable makes a button appear.
    'disabled:bg-transparent disabled:text-fg-muted disabled:border-transparent',
  ),
  danger: cx('bg-error text-white border border-transparent', 'hover:bg-error-700 active:bg-error-700', DISABLED),
};

// Heights are on the §8 ladder. The 32px small size still clears WCAG 2.2
// 2.5.8's 24×24 minimum with room to spare; use `md` (40px) as the default for
// anything a customer taps on a phone.
const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[0.9375rem] gap-2 rounded-lg',
  lg: 'h-12 px-5 text-base gap-2 rounded-lg',
};

// Square, so the glyph sits on the centre of both axes. Same heights as above,
// which keeps an icon button aligned with the text button beside it in a toolbar.
const ICON_ONLY_SIZES = {
  sm: 'h-8 w-8 p-0 rounded-lg',
  md: 'h-10 w-10 p-0 rounded-lg',
  lg: 'h-12 w-12 p-0 rounded-lg',
};

const GLYPH = { sm: 16, md: 18, lg: 20 };

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    type = 'button',
    iconLeft: IconLeft,
    iconRight: IconRight,
    iconOnly = false,
    loading = false,
    loadingLabel,
    fullWidth = false,
    disabled = false,
    as: As = 'button',
    className,
    children,
    ...rest
  },
  ref,
) {
  a11yWarn(
    !iconOnly || rest['aria-label'] || rest['aria-labelledby'],
    'An icon-only Button needs aria-label — a glyph has no accessible name (§24).',
  );

  // §25: a loading button must not be clickable twice. aria-busy tells a screen
  // reader why, and the label stays put so the button does not change width and
  // shove the layout sideways mid-save.
  const isDisabled = disabled || loading;

  return (
    <As
      ref={ref}
      type={As === 'button' ? type : undefined}
      disabled={As === 'button' ? isDisabled : undefined}
      aria-disabled={As === 'button' ? undefined : isDisabled || undefined}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center whitespace-nowrap font-medium',
        'transition-colors duration-100',
        'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
        VARIANTS[variant],
        iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Icon.spinner size={GLYPH[size]} className="ds-spin" /> : IconLeft ? <IconLeft size={GLYPH[size]} /> : null}
      {!iconOnly && <span>{loading && loadingLabel ? loadingLabel : children}</span>}
      {!iconOnly && !loading && IconRight ? <IconRight size={GLYPH[size]} /> : null}
    </As>
  );
});

/**
 * A row of buttons with the §8 gap already right, and reversed on mobile so the
 * primary action sits at the bottom of a stacked form — the thumb reaches it
 * first and it reads last, which is the order a form should be confirmed in.
 */
export function ButtonGroup({ align = 'right', className, children }) {
  return (
    <div
      className={cx(
        'flex flex-col-reverse gap-3 sm:flex-row sm:items-center',
        align === 'right' && 'sm:justify-end',
        align === 'between' && 'sm:justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Square icon button. Separate from `Button iconOnly` only so the accessible
 * name is a required-looking prop at the call site rather than an easily
 * forgotten aria-label.
 */
export const IconButton = forwardRef(function IconButton(
  { icon: Glyph, label, variant = 'tertiary', size = 'md', ...rest },
  ref,
) {
  return (
    <Button ref={ref} variant={variant} size={size} iconOnly iconLeft={Glyph} aria-label={label} title={label} {...rest} />
  );
});

// Loading, empty, error and alert states — §25, §26, §27, §4.
//
// These three sections of the doc are the most prescriptive in it, and they are
// prescriptive about *copy*, not colour:
//
//   §25  "Do not leave users staring at blank screens."
//   §26  Not "No data." but a heading, a sentence explaining what happened, and
//        an action.
//   §27  Not "Error 500." but "We couldn't load the orders." plus what to do next.
//
// A design system that only ships the boxes and leaves the words to whoever is
// building the screen will get "No data." on half the screens. So EmptyState and
// ErrorState take a title, a body and an action, the body is not optional in
// practice, and ErrorState defaults to §27's exact recovery sentence.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { clamp, cx } from '../utils.js';
import { Button } from './Button.jsx';

/* -------------------------------------------------------------------------- */
/* Spinner / Skeleton — §25                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A spinner says "working" and nothing else, so it is for waits with no shape:
 * a form submitting, a dropdown fetching. For anything with a known layout, use
 * a Skeleton — it tells the user what is arriving as well as that something is.
 */
export function Spinner({ size = 20, label = 'Loading', className }) {
  return (
    <span role="status" aria-live="polite" className={cx('inline-flex items-center gap-2', className)}>
      <Icon.spinner size={size} className="ds-spin text-brand-600" />
      <span className="sr-only-ds">{label}</span>
    </span>
  );
}

/** A centred spinner for a panel that has nothing in it yet. */
export function LoadingPanel({ label = 'Loading…', className }) {
  return (
    <div className={cx('grid place-items-center gap-3 px-6 py-16 text-center', className)}>
      <Icon.spinner size={28} className="ds-spin text-brand-600" />
      <p className="type-body-sm text-fg-secondary" role="status" aria-live="polite">
        {label}
      </p>
    </div>
  );
}

/**
 * A single skeleton bar. `w` takes a Tailwind width class so a skeleton can match
 * the shape of the thing it stands in for — a 40%-wide bar where a product code
 * goes, a full-width bar where a name goes.
 *
 * aria-hidden throughout: the surrounding container announces "loading" once, and
 * a screen reader reading out nine empty boxes is worse than silence.
 */
export function Skeleton({ w = 'w-full', h = 'h-4', rounded = 'rounded', className }) {
  return <span aria-hidden="true" className={cx('ds-pulse block bg-surface-2', w, h, rounded, className)} />;
}

/** The §15 card, as a skeleton. Same 4:3 image box, so the grid does not reflow. */
export function ProductCardSkeleton({ className }) {
  return (
    <div aria-hidden="true" className={cx('overflow-hidden rounded-xl border border-edge bg-surface', className)}>
      <div className="ds-pulse aspect-[4/3] bg-surface-2" />
      <div className="space-y-2.5 p-4">
        <Skeleton w="w-20" h="h-2.5" />
        <Skeleton w="w-full" h="h-4" />
        <Skeleton w="w-3/4" h="h-4" />
        <Skeleton w="w-28" h="h-2.5" />
        <Skeleton h="h-8" rounded="rounded-lg" className="mt-3" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} h="h-3" w={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EmptyState — §26                                                           */
/* -------------------------------------------------------------------------- */

/**
 * §26's example, made into a component:
 *
 *     No products found
 *     There are no products matching your current filters.
 *     [ Clear Filters ]
 *
 * `variant` is the distinction §26 draws between its two examples and it changes
 * what the action should be. "nothing yet" is a first-run state and the action
 * creates something. "no results" is a filter state and the action clears the
 * filter — never "create a product", which is the wrong answer to a search that
 * matched nothing.
 */
export function EmptyState({
  icon: Glyph = Icon.empty,
  title,
  body,
  action,
  secondaryAction,
  variant = 'nothing-yet',
  className,
}) {
  return (
    <div className={cx('grid place-items-center px-6 py-16 text-center', className)}>
      <span
        className={cx(
          'mb-4 grid size-14 place-items-center rounded-full',
          variant === 'no-results' ? 'bg-surface-2 text-fg-secondary' : 'bg-brand-50 text-brand-700',
        )}
      >
        <Glyph size={26} aria-hidden="true" />
      </span>
      <h3 className="type-h4 text-fg">{title}</h3>
      {body && <p className="type-body-sm mt-2 max-w-sm text-fg-secondary">{body}</p>}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ErrorState — §27                                                           */
/* -------------------------------------------------------------------------- */

/**
 * §27's example verbatim, including the second sentence, which is the part that
 * usually gets dropped:
 *
 *     We couldn't load the orders.
 *     Please try again. If the problem continues, contact support.
 *     [ Try Again ]
 *
 * `thing` builds that first line so the message names what failed instead of
 * saying "Something went wrong" — §27 asks for specific where possible, and the
 * caller always knows what it was trying to load.
 *
 * `detail` is for a technical string (a request id, a status code). It renders in
 * small print rather than as the headline, so it is available to whoever needs it
 * without being what the user reads first.
 */
export function ErrorState({
  thing = 'this page',
  title,
  body = 'Please try again. If the problem continues, contact support.',
  detail,
  onRetry,
  retryLabel = 'Try Again',
  className,
}) {
  return (
    <div className={cx('grid place-items-center px-6 py-16 text-center', className)} role="alert">
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-error-bg text-error-700">
        <Icon.warning size={26} aria-hidden="true" />
      </span>
      <h3 className="type-h4 text-fg">{title ?? `We couldn't load ${thing}.`}</h3>
      <p className="type-body-sm mt-2 max-w-sm text-fg-secondary">{body}</p>
      {detail && <p className="type-caption mt-3 max-w-sm break-words font-mono text-fg-muted">{detail}</p>}
      {onRetry && (
        <Button variant="secondary" iconLeft={Icon.retry} className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Alert                                                                      */
/* -------------------------------------------------------------------------- */

const ALERT_TONES = {
  info: { wrap: 'bg-info-bg border-info/30', icon: 'text-info', title: 'text-info-700', glyph: Icon.info },
  success: { wrap: 'bg-success-bg border-success/30', icon: 'text-success', title: 'text-success-700', glyph: Icon.success },
  warning: { wrap: 'bg-warning-bg border-warning/40', icon: 'text-warning-700', title: 'text-warning-700', glyph: Icon.warning },
  error: { wrap: 'bg-error-bg border-error/30', icon: 'text-error', title: 'text-error-700', glyph: Icon.danger },
  brand: { wrap: 'bg-brand-50 border-brand-500/40', icon: 'text-brand-600', title: 'text-brand-900', glyph: Icon.info },
};

/**
 * An inline message about the thing it sits next to.
 *
 * role: an error or warning alert gets role="alert" so it is announced when it
 * appears — that is the whole point of an inline validation summary. Info and
 * success use role="status", which is polite and waits for a gap in speech. Using
 * role="alert" for everything makes a screen reader interrupt itself over a
 * "Saved" message.
 *
 * The body is dimmer than the title but still fg-secondary, never fg-muted: an
 * alert nobody can read is a decoration.
 */
export function Alert({ tone = 'info', title, children, action, onDismiss, icon: Override, className }) {
  const t = ALERT_TONES[tone];
  const Glyph = Override ?? t.glyph;
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-xl border p-4', t.wrap, className)}
    >
      <Glyph size={18} className={cx('mt-0.5 shrink-0', t.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className={cx('type-body-sm font-semibold', t.title)}>{title}</p>}
        {children && <div className={cx('type-body-sm text-fg-secondary', title && 'mt-1')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 grid size-7 shrink-0 place-items-center self-start rounded-lg text-fg-muted transition-colors hover:bg-surface/60 hover:text-fg"
        >
          <Icon.close size={16} />
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Toasts, with the provider that owns them.
 *
 *     const toast = useToast()
 *     toast.success('Product saved')
 *
 * The live region is rendered once and always present, empty or not. A live
 * region that is inserted at the same moment as its first message is frequently
 * not announced at all — the screen reader never saw it become live.
 *
 * Errors do not auto-dismiss. A message that disappears after four seconds is
 * fine for "Saved" and unacceptable for "Payment failed", which the user may need
 * to read twice and act on.
 *
 * `action` is one button — the Undo behind a destructive action:
 *
 *     toast.info('Line removed', { action: { label: 'Undo', onClick: restore } })
 *
 * ONE, not a list. A toast is read in passing and dismissed; a second choice in
 * it is a decision nobody has time to make before it disappears. It also gets
 * longer on screen than a plain message, because a notification you are meant to
 * act on has to outlive the time it takes to read it and move the pointer.
 */
const DEFAULT_DURATION = 4500;
const ACTION_DURATION = 9000;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone, message, { title, duration, action } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const ttl = duration ?? (tone === 'error' ? null : action ? ACTION_DURATION : DEFAULT_DURATION);
      setToasts((list) => [...list, { id, tone, message, title, ttl, action }]);
      return id;
    },
    [],
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      info: (m, o) => push('info', m, o),
      success: (m, o) => push('success', m, o),
      warning: (m, o) => push('warning', m, o),
      error: (m, o) => push('error', m, o),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      // Bottom-right on desktop, and full-width at the bottom on mobile where a
      // corner toast either covers the primary action or is too small to read.
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, tone, title, message, ttl, action } = toast;
  const t = ALERT_TONES[tone] ?? ALERT_TONES.info;
  const Glyph = t.glyph;

  useEffect(() => {
    if (!ttl) return undefined;
    const timer = setTimeout(() => onDismiss(id), ttl);
    return () => clearTimeout(timer);
  }, [id, ttl, onDismiss]);

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'ds-rise pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-surface p-4 shadow-e2 sm:w-96',
        // The tinted border keeps the tone readable without turning the whole
        // toast into a colour block sitting over the interface.
        t.wrap.replace(/bg-\S+/, ''),
      )}
    >
      <Glyph size={18} className={cx('mt-0.5 shrink-0', t.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className={cx('type-body-sm font-semibold', t.title)}>{title}</p>}
        <p className={cx('type-body-sm text-fg', title && 'mt-0.5')}>{message}</p>
        {action && (
          // Acting dismisses the toast. Leaving it up after an Undo would let the
          // same Undo be pressed twice, which for a restore means a duplicate.
          <button
            type="button"
            onClick={() => {
              action.onClick?.();
              onDismiss(id);
            }}
            className="type-body-sm mt-2 font-semibold text-brand-700 underline decoration-brand-500 underline-offset-2 transition-colors hover:text-brand-900"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="-m-1 grid size-7 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Icon.close size={16} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress and meters                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A determinate bar — an upload, a target. `tone` is not decoration: a target
 * bar is success once it is met and warning while it is behind, which is the
 * information an agent opens the screen for (§11.3, five to ten seconds).
 */
export function ProgressBar({ value = 0, max = 100, tone = 'brand', label, showValue = false, size = 'md', className }) {
  const pct = clamp((value / max) * 100);
  const TONE = { brand: 'bg-brand-600', success: 'bg-success', warning: 'bg-warning', error: 'bg-error' };
  return (
    <div className={cx('min-w-0', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="type-caption text-fg-secondary">{label}</span>}
          {showValue && <span className="type-caption tabular font-semibold text-fg">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={cx('overflow-hidden rounded-full bg-surface-2', size === 'sm' ? 'h-1.5' : 'h-2')}
      >
        <div className={cx('h-full rounded-full transition-[width] duration-300', TONE[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Stock level as a bar against its own low-stock threshold.
 *
 * The threshold is drawn as a tick rather than implied by the colour change, so
 * "how close is this to reordering" is answerable at a glance and the state is not
 * carried by hue alone (§4). The count beside it is the authoritative figure —
 * nobody reorders from a bar.
 */
export function StockMeter({ stock = 0, lowStockAt = 0, capacity, className }) {
  const ceiling = capacity ?? Math.max(stock, lowStockAt * 4, 1);
  const pct = clamp((stock / ceiling) * 100);
  const markPct = clamp((lowStockAt / ceiling) * 100);
  const tone = stock <= 0 ? 'error' : stock <= lowStockAt ? 'warning' : 'success';
  const TONE = { error: 'bg-error', warning: 'bg-warning', success: 'bg-success' };

  return (
    <div className={cx('min-w-0', className)}>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={cx('h-full rounded-full', TONE[tone])} style={{ width: `${pct}%` }} />
        {lowStockAt > 0 && (
          <span
            aria-hidden="true"
            title={`Reorder threshold: ${lowStockAt}`}
            className="absolute top-0 h-full w-0.5 bg-fg-secondary/70"
            style={{ left: `${markPct}%` }}
          />
        )}
      </div>
      <p className="type-caption tabular mt-1 text-fg-secondary">
        {stock.toLocaleString('en-IN')} in stock
        {lowStockAt > 0 && <span className="text-fg-muted"> · reorder at {lowStockAt.toLocaleString('en-IN')}</span>}
      </p>
    </div>
  );
}

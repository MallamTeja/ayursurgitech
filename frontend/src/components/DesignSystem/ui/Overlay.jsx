// Overlays — dialogs, drawers, menus, tooltips. §9, §10, §24.
//
// WHY NATIVE <dialog> AND NOT A DIV WITH A FIXED POSITION. Everything §24 asks
// for around a modal — focus contained inside it, Escape closes it, the page
// behind it inert and unreachable by Tab, the whole thing above every stacking
// context — is behaviour the platform now implements. A hand-rolled focus trap is
// perhaps forty lines of listeners that must handle Shift+Tab, portals, iframes
// and the first/last focusable element, and it is wrong more often than it is
// right. showModal() is one call. The shop's own mobile nav drawer already made
// this choice for the same reason.
//
// Radius is §9's 16px for both dialog and drawer, and both use e2 from §10 —
// they are the two things in the system that genuinely float.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { cx } from '../utils.js';
import { Button, IconButton } from './Button.jsx';

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

const MODAL_SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

/**
 * `<Modal open={open} onClose={…} title="Cancel order" footer={…}>`
 *
 * The dialog element is always mounted and toggled with showModal/close rather
 * than being conditionally rendered, so the browser can run its own open and
 * close transitions and return focus to whatever opened it.
 *
 * `dismissible={false}` blocks both Escape and the backdrop, for a confirmation
 * whose consequence is irreversible. Use it rarely — a dialog nobody can escape
 * is a trap, and §24's keyboard requirement is not optional.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  className,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Escape fires the dialog's own `cancel` event. Intercepting it here is what
  // keeps React state and the DOM's idea of open-ness from drifting apart.
  const onCancel = (e) => {
    e.preventDefault();
    if (dismissible) onClose?.();
  };

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      onClose={() => open && onClose?.()}
      // The backdrop is the dialog's own padding box, so a click that lands on
      // the element itself rather than on the panel inside it is a backdrop click.
      onClick={(e) => dismissible && e.target === ref.current && onClose?.()}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      // NOT .ds-root. Promoting a dialog to the top layer moves where it paints,
      // not where it sits in the DOM, so it still inherits every token from the
      // .ds-root ancestor it was rendered inside. Putting .ds-root on the dialog
      // itself would also apply that class's canvas background — painting an
      // opaque sheet across the viewport and hiding the backdrop underneath it.
      className="fixed inset-0 grid h-full max-h-full w-full max-w-full place-items-end justify-items-stretch overflow-y-auto bg-transparent p-0 sm:place-items-center sm:p-6"
    >
      <div
        className={cx(
          // Full-width sheet on mobile, centred panel from sm up. A 400px-wide
          // centred dialog on a phone wastes the screen it most needs.
          'ds-rise relative w-full rounded-t-2xl bg-surface shadow-e2 sm:rounded-2xl',
          MODAL_SIZES[size],
          className,
        )}
      >
        {(title || dismissible) && (
          <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="type-h4 text-fg">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="type-body-sm mt-1 text-fg-secondary">
                  {description}
                </p>
              )}
            </div>
            {dismissible && <IconButton icon={Icon.close} label="Close dialog" size="sm" onClick={onClose} />}
          </header>
        )}

        <div className="px-5 py-5">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse gap-3 rounded-b-2xl border-t border-edge bg-surface-2 px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

/**
 * The confirmation case, which is most modals in an admin panel, with the two
 * things that are always got wrong made into props:
 *
 *  - the button says what it does ("Cancel order"), not "OK". A dialog whose
 *    buttons are "OK" and "Cancel" and whose subject is cancelling an order is
 *    genuinely ambiguous.
 *  - destructive confirmations use the danger variant, and the safe choice is
 *    the one that gets focus.
 *
 * `confirmDisabled` is for a confirmation that cannot be granted — deleting a
 * category that still has products in it. The alternative is a button that only
 * ever produces an error toast, which makes the reader click it to find out what
 * the dialog could have told them.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  confirmDisabled = false,
  loading = false,
}) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={confirmDisabled}
            loading={loading}
            loadingLabel="Working…"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="type-body-sm text-fg-secondary">{children}</div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Drawer                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A side panel for work that needs the list behind it to stay in view — filters,
 * a quick order preview, an audit trail. Anything that needs the full screen is a
 * page, not a drawer.
 *
 * `side="left"` is the mobile navigation case; `right` is everything else.
 */
export function Drawer({ open, onClose, title, description, children, footer, side = 'right', size = 'md', className }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-xl' };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onClose={() => open && onClose?.()}
      onClick={(e) => e.target === ref.current && onClose?.()}
      aria-labelledby={titleId}
      // See the note on Modal: no .ds-root here, and an explicit transparent
      // background so the class's canvas fill cannot cover the scrim.
      className={cx(
        'fixed inset-0 flex h-full max-h-full w-full max-w-full bg-transparent p-0',
        side === 'right' ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cx(
          'flex h-full w-full flex-col bg-surface shadow-e2',
          // The panel has to enter from the edge it is anchored to. A right-hand
          // drawer sliding in from the right and a left-hand one sliding in from
          // the left are the same animation mirrored, not one animation reused.
          side === 'right' ? 'ds-slide-in-right' : 'ds-slide-in-left',
          SIZES[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="type-h4 text-fg">
              {title}
            </h2>
            {description && <p className="type-body-sm mt-1 text-fg-secondary">{description}</p>}
          </div>
          <IconButton icon={Icon.close} label="Close panel" size="sm" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-edge bg-surface-2 px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Dropdown menu                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The row-actions menu, and the account menu. Not a <dialog>: a menu should close
 * when you click elsewhere rather than blocking the page, and it does not need to
 * contain focus, only to move it with the arrow keys.
 *
 * Keyboard contract, which is the whole reason this is a component and not a
 * div: ↑ ↓ move between items, Home and End jump, Escape closes and returns focus
 * to the trigger, Tab closes and moves on. Items are buttons in a role="menu", so
 * a screen reader announces "menu, three items" rather than reading three
 * unrelated buttons.
 */
export function Dropdown({ trigger, label = 'Actions', items = [], align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();

  const close = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      setActive(-1);
      if (returnFocus) triggerRef.current?.focus();
    },
    [],
  );

  // Pointer-down rather than click: a click listener fires after the trigger's
  // own onClick, which reopens a menu the user was trying to close.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus();
  }, [open, active]);

  const enabled = items.filter((i) => !i.separator);

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      setActive(0);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % enabled.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + enabled.length) % enabled.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(enabled.length - 1);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  let itemIndex = -1;

  return (
    <div ref={rootRef} className={cx('relative inline-block', className)} onKeyDown={onKeyDown}>
      {/* The trigger must be the real focusable element, not a wrapper around it:
          Escape has to return focus to the button the user opened the menu from,
          and a span with tabIndex={-1} standing in front of it would swallow that.
          So `trigger` is a render prop handed everything it needs to spread —
          including the ref — and the default is the "⋯" row-actions button that
          most call sites want anyway. */}
      {trigger ? (
        trigger({
          ref: triggerRef,
          onClick: () => setOpen((o) => !o),
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? menuId : undefined,
          open,
        })
      ) : (
        <IconButton
          ref={triggerRef}
          icon={Icon.more}
          label={label}
          size="sm"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
        />
      )}

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cx(
            'ds-rise absolute z-40 mt-1 min-w-52 rounded-xl border border-edge bg-surface py-1.5 shadow-e2',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => {
            if (item.separator) return <hr key={`sep-${i}`} className="my-1.5 border-0 border-t border-edge" />;
            itemIndex += 1;
            const idx = itemIndex;
            const Glyph = item.icon;
            return (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect?.();
                  close();
                }}
                className={cx(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                  item.destructive
                    ? 'text-error-700 hover:bg-error-bg'
                    : 'text-fg hover:bg-surface-2',
                  item.disabled && 'cursor-not-allowed text-fg-disabled hover:bg-transparent',
                )}
              >
                {Glyph && <Glyph size={16} className="shrink-0" />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className="type-caption shrink-0 text-fg-muted">{item.hint}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A short label for a control whose meaning is not obvious — almost always an
 * icon-only button.
 *
 * WCAG 2.2 1.4.13 requires content shown on hover to be dismissible without
 * moving the pointer, so Escape hides it. It also opens on focus, not only on
 * hover, or it does not exist for a keyboard user.
 *
 * A tooltip is never the only place information lives. It cannot be read on a
 * touch screen at all — there is no hover — so anything essential goes in visible
 * helper text instead. This is a hint, not a mechanism.
 */
export function Tooltip({ label, children, side = 'top', className }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const SIDE = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <span
      className={cx('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {/* aria-describedby on the child would be better, but cloning it to add the
          attribute breaks any child that is not a DOM element. Describing the
          wrapper is announced the same way for the cases this is used in. */}
      <span aria-describedby={open ? id : undefined} className="contents">
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cx(
            'ds-fade-in pointer-events-none absolute z-50 w-max max-w-56 rounded-lg bg-brand-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-e2',
            SIDE[side],
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}

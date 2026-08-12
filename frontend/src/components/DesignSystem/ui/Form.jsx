// Forms — §14, §24, §31.
//
// §14 is short and absolute: labels above inputs, never a placeholder standing in
// for a label, and support for helper text, inline validation, error messages,
// required indicators and keyboard navigation. §32 Rule 7 repeats the placeholder
// ban, which is a good sign it gets broken a lot.
//
// HOW THAT IS ENFORCED HERE. Field owns the wiring and passes it down through
// context: the generated id, the aria-describedby list pointing at whichever of
// helper/error exist, aria-invalid, and required. A control inside a Field is
// correctly labelled and described without the call site repeating any of it, and
// — the part that matters — without the call site being *able* to forget. A
// control used outside a Field still works; it just has to be given an id and a
// label itself.
//
// PLACEHOLDERS. fg-muted is 3.16:1, below the AA body floor. That is acceptable
// here and only here, because §14 has already ruled that a placeholder may not
// carry information: the label above it and the helper text below it both do, and
// both are AA. A placeholder in this system is a formatting example ("36ABCDE1234F1Z5"),
// never an instruction. If you find yourself needing it to be read, it belongs in
// the helper text.

import { createContext, useContext, useId, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { cx } from '../utils.js';

/* -------------------------------------------------------------------------- */
/* Field — the wiring                                                        */
/* -------------------------------------------------------------------------- */

const FieldContext = createContext(null);
const useField = () => useContext(FieldContext);

/**
 * `<Field label="GSTIN" required helper="15 characters" error={err}><Input/></Field>`
 *
 * Renders in the §14 order — label, control, then helper or error — and never
 * both helper and error at once: once a field is wrong, the error is the only
 * message that matters and stacking the two makes the user read the wrong one
 * first.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  optional = false,
  helper,
  error,
  hint,
  children,
  className,
}) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy = cx(error ? errorId : helper ? helperId : null) || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cx('min-w-0', className)}>
        {label && (
          <label htmlFor={id} className="type-body-sm mb-1.5 flex items-baseline gap-1.5 font-medium text-fg">
            <span>{label}</span>
            {/* The asterisk is decoration; `required` on the control is what a
                screen reader announces. Belt and braces, no double-announcement. */}
            {required && (
              <span aria-hidden="true" className="text-error-700">
                *
              </span>
            )}
            {optional && !required && <span className="type-caption font-normal text-fg-muted">Optional</span>}
            {hint && <span className="type-caption ml-auto font-normal text-fg-muted">{hint}</span>}
          </label>
        )}
        {children}
        {error ? (
          // §4: not colour alone. The glyph and the sentence both say it failed.
          <p id={errorId} className="type-caption mt-1.5 flex items-start gap-1.5 text-error-700">
            <Icon.danger size={14} className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        ) : helper ? (
          <p id={helperId} className="type-caption mt-1.5 text-fg-secondary">
            {helper}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared control chrome                                                      */
/* -------------------------------------------------------------------------- */

// 40px to match a md Button, 8px radius per §9, edge-strong border so the input
// boundary reads at a glance — a 1.26:1 border on a white field is a field you
// cannot see.
const CONTROL_BASE = cx(
  'block w-full rounded-lg bg-surface text-fg',
  'border transition-colors',
  'placeholder:text-fg-muted',
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled',
);

const CONTROL_SIZES = { sm: 'h-8 px-2.5 text-sm', md: 'h-10 px-3 text-[0.9375rem]', lg: 'h-12 px-4 text-base' };

const borderFor = (invalid) =>
  invalid
    ? 'border-error hover:border-error-700 focus:border-error-700'
    : 'border-edge-strong hover:border-brand-500 focus:border-brand-600';

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `prefix` and `suffix` are for units, not decoration: ₹ on a price, "cm" on a
 * length, "%" on a GST rate. They sit inside the field boundary so the number
 * and its unit read as one value, and they are aria-hidden — the unit belongs in
 * the label, where it is announced once.
 */
export function Input({
  size = 'md',
  prefix,
  suffix,
  invalid,
  icon: Glyph,
  className,
  id: idProp,
  ...rest
}) {
  const field = useField();
  const id = idProp ?? field?.id;
  const isInvalid = invalid ?? field?.invalid;

  const input = (
    <input
      id={id}
      aria-describedby={field?.describedBy}
      aria-invalid={isInvalid || undefined}
      required={field?.required}
      className={cx(
        CONTROL_BASE,
        CONTROL_SIZES[size],
        borderFor(isInvalid),
        Glyph && 'pl-9',
        prefix && 'rounded-l-none border-l-0',
        suffix && 'rounded-r-none border-r-0',
        className,
      )}
      {...rest}
    />
  );

  if (!prefix && !suffix && !Glyph) return input;

  return (
    <div className={cx('flex w-full items-stretch', isInvalid && 'has-[:focus]:ring-0')}>
      {prefix && (
        <span
          aria-hidden="true"
          className={cx(
            'inline-flex shrink-0 items-center rounded-l-lg border border-r-0 bg-surface-2 px-3 text-sm font-medium text-fg-secondary',
            borderFor(isInvalid),
          )}
        >
          {prefix}
        </span>
      )}
      <span className="relative min-w-0 flex-1">
        {Glyph && (
          <Glyph size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
        )}
        {input}
      </span>
      {suffix && (
        <span
          aria-hidden="true"
          className={cx(
            'inline-flex shrink-0 items-center rounded-r-lg border border-l-0 bg-surface-2 px-3 text-sm font-medium text-fg-secondary',
            borderFor(isInvalid),
          )}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Textarea({ rows = 4, invalid, className, id: idProp, ...rest }) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid;
  return (
    <textarea
      id={idProp ?? field?.id}
      rows={rows}
      aria-describedby={field?.describedBy}
      aria-invalid={isInvalid || undefined}
      required={field?.required}
      className={cx(CONTROL_BASE, 'resize-y px-3 py-2.5 text-[0.9375rem] leading-relaxed', borderFor(isInvalid), className)}
      {...rest}
    />
  );
}

/**
 * A native select, deliberately. A custom listbox is a lot of ARIA to get wrong
 * and the native control brings keyboard behaviour, type-ahead and the platform
 * picker on mobile for free — which is most of §24. The only styling is the
 * chevron, since `appearance-none` removes the platform arrow.
 */
export function Select({ size = 'md', invalid, options = [], placeholder, className, id: idProp, children, ...rest }) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid;
  return (
    <div className="relative">
      <select
        id={idProp ?? field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={isInvalid || undefined}
        required={field?.required}
        className={cx(CONTROL_BASE, CONTROL_SIZES[size], borderFor(isInvalid), 'appearance-none pr-9', className)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
        {children}
      </select>
      <Icon.chevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-secondary"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Selection controls                                                         */
/* -------------------------------------------------------------------------- */

// The box itself is 18px, inside a 40px-tall label row. WCAG 2.2 2.5.8 measures
// the *target*, and the whole row is clickable because the box sits inside the
// <label> — so the target is the row, not the 18px square.
const BOX_BASE = cx(
  'peer size-[18px] shrink-0 appearance-none border bg-surface transition-colors',
  'checked:border-brand-600 checked:bg-brand-600',
  'disabled:cursor-not-allowed disabled:border-edge disabled:bg-surface-2',
  'disabled:checked:border-edge-strong disabled:checked:bg-edge-strong',
);

/**
 * `indeterminate` is a prop rather than something the caller sets through a ref,
 * because `input.indeterminate` is a DOM property with no HTML attribute — there
 * is no way to express it in JSX. A table's select-all needs it constantly, and
 * making every call site reach for a ref to get it is how it ends up missing.
 */
export function Checkbox({ label, description, invalid, indeterminate = false, className, id: idProp, ...rest }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cx('flex items-start gap-2.5', className)}>
      <span className="relative flex items-center">
        <input
          id={id}
          type="checkbox"
          ref={(el) => {
            if (el) el.indeterminate = indeterminate;
          }}
          aria-invalid={invalid || undefined}
          className={cx(BOX_BASE, 'rounded-[4px]', invalid ? 'border-error' : 'border-edge-strong hover:border-brand-500')}
          {...rest}
        />
        {/* The tick is drawn over the box, revealed by the peer-checked state.
            pointer-events-none so the click always lands on the input. */}
        <Icon.check
          size={14}
          strokeWidth={2.5}
          className="pointer-events-none absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 peer-disabled:text-white"
        />
        {/* Indeterminate, for a table's select-all when only some rows are picked. */}
        <Icon.remove
          size={14}
          strokeWidth={2.5}
          className="pointer-events-none absolute left-0.5 text-white opacity-0 peer-indeterminate:opacity-100"
        />
      </span>
      {label && (
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          <span className="type-body-sm font-medium text-fg">{label}</span>
          {description && <span className="type-caption block text-fg-secondary">{description}</span>}
        </label>
      )}
    </div>
  );
}

export function Radio({ label, description, className, id: idProp, ...rest }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cx('flex items-start gap-2.5', className)}>
      <span className="relative flex items-center">
        <input
          id={id}
          type="radio"
          className={cx(BOX_BASE, 'rounded-full border-edge-strong hover:border-brand-500')}
          {...rest}
        />
        <span className="pointer-events-none absolute left-1.5 size-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
      </span>
      {label && (
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          <span className="type-body-sm font-medium text-fg">{label}</span>
          {description && <span className="type-caption block text-fg-secondary">{description}</span>}
        </label>
      )}
    </div>
  );
}

/**
 * A radio group in a real <fieldset>. The legend is the group's accessible name —
 * without it, a screen reader reads four options and never says what they are
 * options *for*, which is the most common radio bug there is.
 */
export function RadioGroup({ legend, name, options = [], value, onChange, error, helper, columns = 1, className }) {
  const errorId = useId();
  return (
    <fieldset className={cx('min-w-0', className)} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? errorId : undefined}>
      <legend className="type-body-sm mb-2 font-medium text-fg">{legend}</legend>
      <div className={cx('grid gap-3', columns === 2 && 'sm:grid-cols-2')}>
        {options.map((o) => (
          <Radio
            key={o.value}
            name={name}
            value={o.value}
            label={o.label}
            description={o.description}
            checked={value === o.value}
            onChange={() => onChange?.(o.value)}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} className="type-caption mt-2 flex items-center gap-1.5 text-error-700">
          <Icon.danger size={14} />
          {error}
        </p>
      ) : helper ? (
        <p className="type-caption mt-2 text-fg-secondary">{helper}</p>
      ) : null}
    </fieldset>
  );
}

/**
 * A switch, for a setting that takes effect immediately — "Show out-of-stock
 * products". Anything that needs a Save button is a Checkbox instead; the
 * difference is not cosmetic, it is a promise about when the change lands.
 */
export function Switch({ label, description, checked, onChange, disabled, className, id: idProp, ...rest }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cx('flex items-start gap-3', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cx(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-brand-600 bg-brand-600' : 'border-edge-strong bg-surface-2',
          disabled && 'cursor-not-allowed opacity-55',
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cx(
            'absolute size-3.5 rounded-full bg-white shadow-e1 transition-[left] duration-150',
            checked ? 'left-[1.125rem]' : 'left-0.5',
          )}
        />
      </button>
      {label && (
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          <span className="type-body-sm font-medium text-fg">{label}</span>
          {description && <span className="type-caption block text-fg-secondary">{description}</span>}
        </label>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Domain controls                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Search, with a clear button that only exists once there is something to clear.
 * type="search" so mobile keyboards show the right action key.
 */
export function SearchInput({ value, onChange, onClear, placeholder = 'Search…', size = 'md', className, ...rest }) {
  return (
    <div className={cx('relative min-w-0', className)}>
      <Icon.search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cx(
          CONTROL_BASE,
          CONTROL_SIZES[size],
          'border-edge-strong pl-9 hover:border-brand-500 focus:border-brand-600',
          value && 'pr-9',
          // Chrome draws its own clear affordance for type=search; ours is
          // keyboard-reachable and on-brand, so the native one is redundant.
          '[&::-webkit-search-cancel-button]:hidden',
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Icon.close size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Quantity, and it knows about MOQ.
 *
 * B2B quantities move in pack multiples, not ones — Overview §44 asks the client
 * whether MOQ applies, and the answer for a box of 100 infusion sets is
 * obviously yes. So `step` defaults to the MOQ and the minus button stops at it
 * rather than at zero. Typing a value that is not a multiple is corrected on blur
 * rather than blocked on keypress: fighting someone mid-keystroke is how a field
 * becomes impossible to edit.
 */
export function QuantityStepper({ value, onChange, moq = 1, step, max = 999999, uom, disabled, size = 'md', className }) {
  const increment = step ?? moq;
  const clampToStep = (n) => {
    const bounded = Math.min(max, Math.max(moq, n || moq));
    return Math.round(bounded / increment) * increment;
  };
  const H = size === 'sm' ? 'h-8' : 'h-10';
  return (
    <div className={cx('inline-flex items-stretch rounded-lg border border-edge-strong bg-surface', H, className)}>
      <button
        type="button"
        onClick={() => onChange?.(clampToStep(value - increment))}
        disabled={disabled || value <= moq}
        aria-label={`Decrease quantity by ${increment}`}
        className="grid w-9 place-items-center rounded-l-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg disabled:text-fg-disabled disabled:hover:bg-transparent"
      >
        <Icon.remove size={16} />
      </button>
      <span className="flex items-center border-x border-edge">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          aria-label={uom ? `Quantity in ${uom}` : 'Quantity'}
          onChange={(e) => onChange?.(Number(e.target.value.replace(/\D/g, '')) || 0)}
          onBlur={(e) => onChange?.(clampToStep(Number(e.target.value.replace(/\D/g, ''))))}
          className="tabular w-16 bg-transparent text-center text-[0.9375rem] font-medium text-fg outline-none disabled:text-fg-disabled"
        />
      </span>
      <button
        type="button"
        onClick={() => onChange?.(clampToStep(value + increment))}
        disabled={disabled || value >= max}
        aria-label={`Increase quantity by ${increment}`}
        className="grid w-9 place-items-center rounded-r-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg disabled:text-fg-disabled disabled:hover:bg-transparent"
      >
        <Icon.add size={16} />
      </button>
    </div>
  );
}

/**
 * Document upload — the §24 "Documents" list: brochures, specifications,
 * certificates, purchase orders.
 *
 * The drop zone is a convenience layered on a real file input, not a replacement
 * for it. The label is the click target, so keyboard and pointer take the same
 * path and there is no invisible-button trick to get wrong.
 */
export function FileDrop({ accept = '.pdf,.png,.jpg,.jpeg', multiple = true, files = [], onAdd, onRemove, hint, className }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const id = useId();

  const take = (list) => onAdd?.(Array.from(list ?? []));

  return (
    <div className={cx('min-w-0', className)}>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        className={cx(
          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-brand-600 bg-brand-50' : 'border-edge-strong bg-surface-2 hover:border-brand-500 hover:bg-brand-50',
        )}
      >
        <Icon.upload size={24} className="text-brand-700" />
        <span className="type-body-sm font-medium text-fg">
          Drop files here or <span className="text-brand-700 underline">browse</span>
        </span>
        <span className="type-caption text-fg-secondary">{hint ?? `${accept.replaceAll('.', '').toUpperCase()} · up to 10 MB each`}</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => take(e.target.files)}
          className="sr-only-ds"
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-3 py-2"
            >
              <Icon.documents size={16} className="shrink-0 text-fg-secondary" />
              <span className="type-body-sm min-w-0 flex-1 truncate text-fg">{f.name}</span>
              {f.size != null && (
                <span className="type-caption tabular shrink-0 text-fg-muted">{(f.size / 1024).toFixed(0)} KB</span>
              )}
              <button
                type="button"
                onClick={() => onRemove?.(i)}
                aria-label={`Remove ${f.name}`}
                className="grid size-6 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:bg-error-bg hover:text-error-700"
              >
                <Icon.close size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form structure                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A titled group of fields. A 27-field product form is unusable as one list;
 * §31 asks components to have a clear purpose, and so should the sections of a
 * form. Description on the left, fields on the right at lg — the layout that
 * lets someone scan for the section they need without reading every label.
 */
export function FormSection({ title, description, children, className }) {
  return (
    <section className={cx('grid gap-6 border-b border-edge py-8 first:pt-0 last:border-0 lg:grid-cols-3', className)}>
      <div className="lg:col-span-1">
        <h3 className="type-h4 text-fg">{title}</h3>
        {description && <p className="type-body-sm mt-1.5 text-fg-secondary">{description}</p>}
      </div>
      <div className="space-y-5 lg:col-span-2">{children}</div>
    </section>
  );
}

/** Two fields side by side from `sm` up, stacked below it. */
export function FormRow({ columns = 2, className, children }) {
  return (
    <div className={cx('grid gap-5', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3', className)}>
      {children}
    </div>
  );
}

/**
 * The action bar. Sticky at the bottom on long forms, because a Save button 2,000
 * pixels below the field you just edited is a Save button nobody presses.
 */
export function FormActions({ children, sticky = false, note, className }) {
  return (
    <div
      className={cx(
        'flex flex-col-reverse gap-3 border-t border-edge pt-5 sm:flex-row sm:items-center sm:justify-end',
        sticky && 'sticky bottom-0 -mx-4 mt-0 bg-surface/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6',
        className,
      )}
    >
      {note && <p className="type-caption mr-auto text-fg-secondary">{note}</p>}
      {children}
    </div>
  );
}

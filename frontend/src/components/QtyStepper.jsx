import { useEffect, useId, useState } from 'react';

// −  [ 24 ]  +   44px tall, the number typable.
// Clamped to stockQty, but a quantity below minOrderQty is REFUSED WITH A REASON rather
// than snapped: snapping the number silently is how people end up ordering the wrong amount.
export default function QtyStepper({
  value,
  onChange,
  minOrderQty = 1,
  stockQty = 0,
  disabled = false,
  className = '',
}) {
  const max = stockQty > 0 ? stockQty : 1;
  const [text, setText] = useState(String(value));
  // The cart renders one stepper per line, so the message id has to be per instance.
  const hintId = useId();

  // Follow the value when a parent changes it.
  useEffect(() => setText(String(value)), [value]);

  // The field always shows what was actually committed. Typing 999 against 40 in stock
  // must not leave "999" on screen while the cart holds 40.
  const commit = (n) => {
    const clamped = Math.min(Math.max(n, 1), max);
    setText(String(clamped));
    onChange(clamped);
  };

  const belowMin = value < minOrderQty;
  // The height lives on the children, not the wrapper: h-11 on a bordered box is 44px
  // INCLUDING the border, which left every child 42px.
  const btn =
    'flex min-h-11 w-11 items-center justify-center text-lg text-ink transition-colors duration-150 hover:bg-blue-100 disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className={className}>
      <div className="inline-flex items-stretch rounded-control border border-line bg-card">
        <button
          type="button"
          className={btn}
          onClick={() => commit(value - 1)}
          disabled={disabled || value <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={text}
          disabled={disabled}
          aria-label="Quantity"
          aria-describedby={hintId}
          className="min-h-11 w-14 border-x border-line bg-card text-center text-base tabular-nums text-ink"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            // Empty is allowed mid-edit so the field can be cleared and retyped.
            if (digits === '') setText('');
            else commit(parseInt(digits, 10));
          }}
          onBlur={() => setText(String(value))}
        />
        <button
          type="button"
          className={btn}
          onClick={() => commit(value + 1)}
          disabled={disabled || value >= max}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Same id on both: they are mutually exclusive, so only one is ever in the DOM. The
          field points at it so the constraint is read out with the input, not orphaned. */}
      {belowMin && (
        <p id={hintId} className="mt-1 text-xs text-copper-700">
          Minimum order {minOrderQty} pieces
        </p>
      )}
      {!belowMin && stockQty > 0 && value >= max && (
        <p id={hintId} className="mt-1 text-xs text-ink-muted">
          Only {stockQty} in stock
        </p>
      )}
    </div>
  );
}

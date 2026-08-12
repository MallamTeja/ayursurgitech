import { useId } from 'react';

// The label is always visible, above the field. A placeholder is never the label —
// it disappears the moment someone types and they lose their place in the form.
export default function Input({ label, hint, error, id, className = '', ...rest }) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  const noteId = `${inputId}-note`;
  const note = error || hint;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`h-11 w-full rounded-control border bg-card px-3 text-base text-ink transition-colors duration-150 placeholder:text-ink-muted ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      />
      {note && (
        <p id={noteId} className={`text-xs ${error ? 'text-danger' : 'text-ink-muted'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

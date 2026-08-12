import { useId } from 'react';

// Native select on purpose: it gets the platform picker on mobile for free.
export default function Select({ label, hint, error, id, className = '', children, ...rest }) {
  const fallbackId = useId();
  const selectId = id || fallbackId;
  const noteId = `${selectId}-note`;
  const note = error || hint;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`h-11 w-full rounded-control border bg-card px-3 text-base text-ink transition-colors duration-150 ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      >
        {children}
      </select>
      {note && (
        <p id={noteId} className={`text-xs ${error ? 'text-danger' : 'text-ink-muted'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

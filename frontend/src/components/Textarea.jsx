import { useId } from 'react';

export default function Textarea({ label, hint, error, id, rows = 4, className = '', ...rest }) {
  const fallbackId = useId();
  const areaId = id || fallbackId;
  const noteId = `${areaId}-note`;
  const note = error || hint;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={areaId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`w-full rounded-control border bg-card px-3 py-2 text-base text-ink transition-colors duration-150 placeholder:text-ink-muted ${error ? 'border-danger' : 'border-line'} ${className}`}
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

import { StarIcon } from './icons';

export default function Rating({ value = 0, count, className = '' }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex text-copper-600">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} filled={i <= filled} className={i <= filled ? 'size-4' : 'size-4 text-line'} />
        ))}
      </span>
      {count !== undefined && <span className="text-sm text-ink-muted">({count})</span>}
      <span className="sr-only">
        {Number(value) || 0} out of 5{count !== undefined ? ` from ${count} reviews` : ''}
      </span>
    </span>
  );
}

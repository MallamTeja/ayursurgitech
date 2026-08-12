import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './icons';

/** trail: [{ label, to }] — the last entry is the current page and never links. */
export default function Breadcrumb({ trail }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        {trail.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon className="size-4" />}
            {/* min-h-11 on the link: 44px tap target, they were 20px tall. */}
            {item.to && i < trail.length - 1 ? (
              <Link to={item.to} className="inline-flex min-h-11 items-center hover:text-blue-500">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

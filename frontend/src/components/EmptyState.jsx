import Button from './Button';
import { PackageIcon } from './icons';

// A line icon, one plain sentence, one action. Every list needs one.
export default function EmptyState({ icon, message, actionLabel, actionTo, onAction }) {
  const action = actionLabel && (
    <Button variant="secondary" to={actionTo} onClick={actionTo ? undefined : onAction}>
      {actionLabel}
    </Button>
  );

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="text-ink-muted">{icon || <PackageIcon className="size-8" />}</span>
      <p className="max-w-sm text-sm text-ink-muted">{message}</p>
      {action}
    </div>
  );
}

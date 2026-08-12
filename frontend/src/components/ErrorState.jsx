import Button from './Button';
import { AlertIcon } from './icons';

// What every failed fetch renders. Never a blank panel. The message is the server's own
// { error } text where there is one, so it says what actually happened.
export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <AlertIcon className="size-8 text-danger" />
      <p className="max-w-sm text-sm text-ink">{message || 'This did not load.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

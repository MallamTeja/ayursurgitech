// Every pair here clears 4.5:1, because badges are text-xs and small text has no allowance.
// ink on line is 4.6:1; ink-muted on line is only 4.08:1, so muted badges use full ink.
// Two tones only. `copper` and `solid` were deleted once StatusBadge stopped using them —
// the accent fill is for the one important action on a screen, never a passive label.
const tones = {
  blue: 'bg-blue-100 text-blue-700',
  muted: 'bg-line text-ink',
};

export default function Badge({ tone = 'blue', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-1 text-xs font-medium ${tones[tone] || tones.blue} ${className}`}
    >
      {children}
    </span>
  );
}

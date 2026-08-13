// The brand lockup, in its own module because two pieces of chrome use it and
// neither should own it.

import { Link } from 'react-router-dom';
import { Icon, cx } from '../components/DesignSystem';

/**
 * `tone="dark"` is for the brand-900 panels — the login aside, and any future
 * dark band. It is a prop rather than a className override because the two spans
 * need different colours and the accent has to stay legible: brand-600 on navy
 * is 1.9:1 and effectively invisible, so the dark tone moves the accent up to
 * brand-500 and the wordmark to white.
 */
export default function Wordmark({ tone = 'light', className }) {
  const dark = tone === 'dark';
  return (
    // Straight to /products rather than to /. The catalogue is the landing page and
    // `/` only redirects there — pointing the wordmark at it would put a redirect
    // hop on the most-clicked link in the header.
    <Link to="/products" className={cx('flex shrink-0 items-center gap-2', className)}>
      <span
        aria-hidden="true"
        className={cx(
          'grid size-9 place-items-center rounded-lg',
          dark ? 'bg-white/10 text-white' : 'bg-brand-600 text-white',
        )}
      >
        <Icon.infusion size={20} />
      </span>
      {/* §6 permits no second family, so the brand voice comes from weight and
          tracking rather than from a display face. */}
      <span className={cx('type-h4 tracking-tight', dark ? 'text-white' : 'text-brand-900')}>
        Aayursurgi<span className={dark ? 'text-brand-500' : 'text-brand-600'}>Tech</span>
      </span>
    </Link>
  );
}

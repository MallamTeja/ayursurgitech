import { Link } from 'react-router-dom';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-blue-700 text-white hover:bg-blue-500',
  secondary: 'border border-line bg-transparent text-ink hover:bg-blue-100',
  // accent: one per screen, maximum. Add to cart, Proceed to checkout, Place order.
  // copper-700 fill, not copper-600: white on copper-600 is 3.79:1 and fails AA at 16px.
  // The hover goes DARKER, to copper-800 — white on it is 7.95:1, so the app's two most
  // important buttons now answer the pointer without either of them breaking contrast.
  accent: 'bg-copper-700 text-white hover:bg-copper-800',
};

export default function Button({
  variant = 'primary',
  to,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  // Radius 4, minimum 44px tall so it is a real tap target.
  const cls = `inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-base font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

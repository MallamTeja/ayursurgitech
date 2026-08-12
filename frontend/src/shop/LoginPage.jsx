// /login — on Design System v1.0.
//
// A B2B LOGIN IS NOT A GATE, IT IS A PRICE REVEAL. The catalogue, the
// specifications and the documentation are all open; what an account unlocks is
// trade pricing, live stock, order history and rate contracts. So the panel
// beside the form says exactly that, because someone who does not know why they
// are being asked to log in is someone who leaves.
//
// WHERE IT SENDS PEOPLE AFTERWARDS. The cart bounces anonymous buyers here with
// `state.from = '/checkout'`, and losing that would drop someone back on the
// catalogue with a full order and no explanation. `from` is honoured, validated
// (see safeFrom) and shown — the page says where it is about to take you.

import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Field,
  Icon,
  Input,
  cx,
} from '../components/DesignSystem';
import usePageTitle from '../components/usePageTitle';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import Wordmark from './Wordmark.jsx';

/**
 * Where to go after a successful login.
 *
 * AN OPEN REDIRECT IS A REAL BUG, NOT A THEORETICAL ONE. `from` arrives in
 * router state, and router state is reachable from any link that pushes it. A
 * value like `//evil.example` or `https://evil.example` would be a same-looking
 * login page that hands the session straight to somewhere else. Only a
 * single-slash, same-origin path is accepted; anything else falls back to the
 * catalogue rather than being sanitised into something half-intended.
 */
export function safeFrom(from, fallback = '/products') {
  if (typeof from !== 'string' || !from) return fallback;
  if (!from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return fallback;
  return from;
}

/** The two facts a login form actually checks before it bothers the server. */
export function validateLogin({ phone, password }) {
  const errors = {};
  const digits = phone.replace(/\D/g, '');
  if (!digits) errors.phone = 'Enter the phone number on the account.';
  else if (digits.length !== 10) errors.phone = 'That is not a 10-digit number. Check for a missing digit.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

const BENEFITS = [
  { icon: Icon.rupee, title: 'Your trade prices', body: 'Account pricing and slab rates, not list price.' },
  { icon: Icon.inventory, title: 'Live stock', body: 'What is in the warehouse right now, per product.' },
  { icon: Icon.orders, title: 'Order history and reorder', body: 'Repeat a past order in two clicks.' },
  { icon: Icon.quotes, title: 'Quotes and rate contracts', body: 'Standing orders and scheduled call-offs.' },
];

export default function LoginPage() {
  usePageTitle('Log in');
  const { user, login } = useAuth();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = safeFrom(state?.from);

  const [values, setValues] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const passwordRef = useRef(null);

  // Already signed in? This page has nothing to offer, and rendering a login
  // form to someone with a session is how people log themselves out by accident.
  // `replace` so Back does not bounce straight back here.
  if (user) return <Navigate to={from} replace />;

  const set = (key) => (event) => {
    // The phone field only ever holds digits, so paste, autofill and a typed
    // "+91 " are all normalised on the way in rather than rejected on the way out.
    const raw = event.target.value;
    const value = key === 'phone' ? raw.replace(/\D/g, '').slice(0, 10) : raw;
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (submitted) setErrors(validateLogin(next));
      return next;
    });
    // The server's complaint is about what was typed a moment ago, so it stops
    // being true the moment anything changes.
    setServerError('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    setSubmitted(true);
    setServerError('');
    if (Object.keys(found).length > 0) {
      document.getElementById(found.phone ? 'login-phone' : 'login-password')?.focus();
      return;
    }

    setBusy(true);
    try {
      await login(values.phone, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      // The server's own words, verbatim. "Wrong phone number or password" is
      // what the user needs; a generic "something went wrong" tells them nothing
      // and api.js already turns a dead network into a sentence worth reading.
      setServerError(err.message);
      setBusy(false);
      // Focus the password rather than clearing it. Clearing on a mistyped phone
      // number punishes the wrong field, and the browser's password manager
      // refills it anyway.
      passwordRef.current?.focus();
    }
  };

  const checkingOut = from === '/checkout';

  return (
    <Container width="app" className="py-10 lg:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
        {/* ---- Form ------------------------------------------------------- */}
        <div className="lg:col-span-6 xl:col-span-5">
          <div className="mx-auto max-w-md">
            <h1 className="type-h2 text-fg">Log in</h1>
            <p className="type-body mt-2 text-fg-secondary">
              Phone number and password. New here?{' '}
              {/* The state travels with the link, so registering and then landing
                  back on checkout works the same way logging in does. */}
              <Link
                to="/register"
                state={state}
                className="font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
              >
                Create an account
              </Link>
              .
            </p>

            {/* Why they are here, when we know. Someone bounced out of checkout
                with a full order needs telling that the order is safe. */}
            {checkingOut && (
              <Alert tone="info" className="mt-6" title="Log in to complete your order">
                {cartCount > 0
                  ? `Your ${cartCount === 1 ? 'product' : `${cartCount} products`} are saved and waiting — logging in takes you straight to checkout.`
                  : 'You will be taken straight to checkout.'}
              </Alert>
            )}

            <Card padding="lg" className="mt-6">
              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <Field
                  label="Phone number"
                  htmlFor="login-phone"
                  required
                  error={errors.phone}
                  helper="The 10-digit number registered to the account."
                >
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    autoFocus
                    maxLength={10}
                    prefix="+91"
                    value={values.phone}
                    onChange={set('phone')}
                    placeholder="98765 43210"
                  />
                </Field>

                <Field label="Password" htmlFor="login-password" required error={errors.password}>
                  <div className="relative">
                    <Input
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={values.password}
                      onChange={set('password')}
                      // Caps Lock is the single most common cause of a password
                      // that is definitely right and definitely rejected, and the
                      // field is masked so there is no way to see it.
                      onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                      onBlur={() => setCapsLock(false)}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-0 top-0 grid h-10 w-11 place-items-center rounded-r-lg text-fg-muted transition-colors hover:text-fg"
                    >
                      {showPassword ? <Icon.hide size={18} /> : <Icon.show size={18} />}
                    </button>
                  </div>
                </Field>

                {capsLock && (
                  <p className="type-caption flex items-center gap-1.5 text-warning-700">
                    <Icon.warning size={14} className="shrink-0" />
                    Caps Lock is on.
                  </p>
                )}

                {serverError && (
                  <Alert tone="error" title="Could not log you in">
                    {serverError}
                  </Alert>
                )}

                <Button type="submit" fullWidth loading={busy} loadingLabel="Logging in…">
                  Log in
                </Button>

                <p className="type-caption text-center text-fg-secondary">
                  Forgotten your password?{' '}
                  <Link
                    to="/support?topic=account"
                    className="font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 hover:text-brand-900"
                  >
                    Ask the order desk
                  </Link>
                  .
                </p>
              </form>
            </Card>

            <Divider label="or" className="my-8" />

            <div className="text-center">
              <p className="type-body-sm text-fg-secondary">
                You do not need an account to browse — specifications and documentation are open to everyone.
              </p>
              <Button as={Link} to="/products" variant="secondary" className="mt-4" iconRight={Icon.arrowRight}>
                Browse the catalogue
              </Button>
            </div>
          </div>
        </div>

        {/* ---- Why an account ---------------------------------------------- */}
        {/* Hidden below lg rather than stacked. On a phone the only thing that
            matters is the two fields, and pushing them under four benefit cards
            is the pattern that makes people scroll to find a login form. */}
        <aside className={cx('hidden lg:col-span-6 lg:block xl:col-span-7')} aria-label="What an account gives you">
          <div className="rounded-2xl border border-edge bg-brand-900 p-10">
            <Wordmark tone="dark" />
            <h2 className="type-h3 mt-8 text-white">What an account gives you</h2>
            <p className="type-body mt-3 max-w-md text-brand-100">
              Everything below is account-specific — a hospital and a distributor do not see the same price for the
              same product, which is why it is behind a login rather than on the page.
            </p>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Glyph, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-100">
                    <Glyph size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="type-body-sm font-semibold text-white">{title}</p>
                    <p className="type-caption mt-0.5 text-brand-100">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 border-t border-white/15 pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="brand" icon={Icon.certified}>
                  CE marked
                </Badge>
                <Badge tone="brand" icon={Icon.verified}>
                  ISO 13485
                </Badge>
                <Badge tone="brand" icon={Icon.shipments}>
                  24–48 h dispatch
                </Badge>
              </div>
              <p className="type-caption mt-4 text-brand-100">
                Opening an account takes a GSTIN and a delivery address, and is normally verified within one working
                day.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}

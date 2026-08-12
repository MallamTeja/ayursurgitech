import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import Input from '../components/Input';
import usePageTitle from '../components/usePageTitle';
import { useAuth } from '../lib/auth';

export default function Login() {
  usePageTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  // Bounced here from checkout? Go back there. Otherwise home.
  const from = state?.from || '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) return setPhoneError('Enter the 10-digit number on the account.');
    setPhoneError('');

    setBusy(true);
    try {
      await login(phone, password);
      navigate(from, { replace: true });
    } catch (err) {
      // The server's own message, verbatim. "Wrong phone number or password" is what the
      // user needs to read — a generic "something went wrong" tells them nothing.
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-md p-6 md:p-8">
        <h1 className="text-3xl">Log in</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Phone number and password. New here?{' '}
          <Link to="/register" state={state} className="text-blue-500 underline">
            Create an account
          </Link>
          .
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Phone number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={phone}
            error={phoneError}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p role="alert" className="rounded-control border border-danger px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" loading={busy} className="w-full">
            Log in
          </Button>
        </form>
      </Card>
    </Container>
  );
}

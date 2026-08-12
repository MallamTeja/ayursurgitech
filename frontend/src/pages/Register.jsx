import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import Input from '../components/Input';
import usePageTitle from '../components/usePageTitle';
import { useAuth } from '../lib/auth';

export default function Register() {
  usePageTitle('Create an account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from || '/';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) return setPhoneError('A phone number is 10 digits.');
    setPhoneError('');

    setBusy(true);
    try {
      await register(name.trim(), phone, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Verbatim, so a 409 reads "That phone number is already registered" and the user
      // knows to log in instead of retyping the form.
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Container className="py-12">
      <Card className="mx-auto max-w-md p-6 md:p-8">
        <h1 className="text-3xl">Create an account</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Already registered?{' '}
          <Link to="/login" state={state} className="text-blue-500 underline">
            Log in
          </Link>
          .
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Phone number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={phone}
            error={phoneError}
            hint="Used to log in and for delivery contact."
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
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
            Create account
          </Button>
        </form>
      </Card>
    </Container>
  );
}

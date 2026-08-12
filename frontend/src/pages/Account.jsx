import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AddressForm, { AddressLines } from '../components/AddressForm';
import Button from '../components/Button';
import Card from '../components/Card';
import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import usePageTitle from '../components/usePageTitle';
import { PackageIcon, PencilIcon, TrashIcon } from '../components/icons';
import { del, post, put } from '../lib/api';
import { useAuth } from '../lib/auth';

/**
 * Addresses could only ever be created, and only from inside checkout — a buyer shipping to
 * three clinics was stuck with whatever they typed the first time, typos included. This is
 * where they are managed.
 */
export default function Account() {
  const { user, updateUser } = useAuth();
  const { pathname } = useLocation();
  usePageTitle('Your account');

  // `null` = nothing open, `'new'` = the add form, an _id = that address is being edited.
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />;

  const addresses = user.addresses ?? [];

  // Every address endpoint answers with the full list, so the cached user is rewritten from
  // the response rather than re-fetched.
  const applyAddresses = (next) => updateUser({ ...user, addresses: next });

  async function save(form) {
    setBusy(true);
    setError('');
    try {
      const { addresses: saved } =
        editing === 'new'
          ? await post('/users/me/addresses', form)
          : await put(`/users/me/addresses/${editing}`, form);
      applyAddresses(saved);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(address) {
    const name = address.label || address.line1;
    if (!window.confirm(`Delete the address "${name}"? Past orders keep their own copy.`)) return;
    setError('');
    try {
      const { addresses: saved } = await del(`/users/me/addresses/${address._id}`);
      applyAddresses(saved);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl">Your account</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <Card className="p-4 md:p-6">
          <h2 className="text-lg">Details</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Name</dt>
              <dd className="text-ink">{user.name}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Phone number</dt>
              <dd className="tabular-nums text-ink">{user.phone}</dd>
            </div>
          </dl>
          {/* Said plainly rather than shown as two disabled fields, which look like something
              that ought to work. */}
          <p className="mt-4 border-t border-line pt-4 text-xs text-ink-muted">
            Your name and phone number are set when the account is created. Ask us to change
            either of them.
          </p>
          <Button variant="secondary" to="/orders" className="mt-4">
            View your orders
          </Button>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">Delivery addresses</h2>
            {editing !== 'new' && (
              <Button variant="secondary" onClick={() => setEditing('new')}>
                Add address
              </Button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          {editing === 'new' && (
            <AddressForm
              className="mt-4 border-t border-line pt-4"
              onSave={save}
              onCancel={() => {
                setEditing(null);
                setError('');
              }}
              busy={busy}
              submitLabel="Save address"
            />
          )}

          {addresses.length === 0 && editing !== 'new' && (
            <EmptyState
              icon={<PackageIcon className="size-8" />}
              message="No addresses saved yet. Add one here, or at checkout when you place your first order."
              actionLabel="Add address"
              onAction={() => setEditing('new')}
            />
          )}

          {addresses.length > 0 && (
            <ul className="mt-4 flex flex-col gap-4">
              {addresses.map((a) => (
                <li key={a._id} className="rounded-card border border-line p-4">
                  {editing === a._id ? (
                    <AddressForm
                      initial={a}
                      onSave={save}
                      onCancel={() => {
                        setEditing(null);
                        setError('');
                      }}
                      busy={busy}
                      submitLabel="Save changes"
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <AddressLines address={a} muted />
                      {/* -m-3 keeps the 44px tap targets from pushing the row taller. */}
                      <div className="-m-3 flex shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(a._id);
                            setError('');
                          }}
                          aria-label={`Edit address ${a.label || a.line1}`}
                          className="rounded-control p-3 text-ink-muted transition-colors duration-150 hover:text-blue-500"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(a)}
                          aria-label={`Delete address ${a.label || a.line1}`}
                          className="rounded-control p-3 text-ink-muted transition-colors duration-150 hover:text-danger"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-ink-muted">
            Deleting an address never changes an order that already used it —{' '}
            <Link to="/orders" className="text-blue-500 underline">
              past orders
            </Link>{' '}
            keep their own copy of where they were sent.
          </p>
        </Card>
      </div>
    </Container>
  );
}

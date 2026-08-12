import { useState } from 'react';
import Button from './Button';
import Input from './Input';

export const BLANK_ADDRESS = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
};

/**
 * The one address form. Checkout adds one mid-purchase and the account page adds and edits
 * them; when it lived inline in Checkout, the account page would have been a second copy of
 * the same seven fields and the same two digit-stripping handlers, free to drift.
 *
 * State is owned here and seeded from `initial`, so an edit opens with the current values and
 * a cancel throws away the draft rather than the saved address.
 */
export default function AddressForm({
  initial = BLANK_ADDRESS,
  onSave,
  onCancel,
  busy = false,
  error = '',
  submitLabel = 'Save address',
  className = '',
}) {
  const [form, setForm] = useState({ ...BLANK_ADDRESS, ...initial });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  // Pincode and phone are digits only, stripped as they are typed rather than rejected on
  // submit — a pasted "+91 98765 43210" becomes usable instead of an error.
  const setDigits = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '') }));

  return (
    <form
      className={`flex flex-col gap-4 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <Input label="Label" placeholder="Clinic" value={form.label} onChange={set('label')} />
      <Input label="Address line 1" value={form.line1} onChange={set('line1')} required />
      <Input label="Address line 2" value={form.line2} onChange={set('line2')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="City" value={form.city} onChange={set('city')} required />
        <Input label="State" value={form.state} onChange={set('state')} required />
        <Input
          label="Pincode"
          inputMode="numeric"
          maxLength={6}
          value={form.pincode}
          onChange={setDigits('pincode')}
          required
        />
        <Input
          label="Contact phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={setDigits('phone')}
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

/** The saved address as a block of lines. The picker and the account list render it the same. */
export function AddressLines({ address, muted = false }) {
  const rest = muted ? 'text-ink-muted' : 'text-ink';
  return (
    <span className="text-sm">
      {address.label && <span className="block font-semibold text-ink">{address.label}</span>}
      <span className="block text-ink">{address.line1}</span>
      {address.line2 && <span className={`block ${rest}`}>{address.line2}</span>}
      <span className={`block ${rest}`}>
        {address.city}, {address.state} {address.pincode}
      </span>
      <span className={`block ${rest}`}>{address.phone}</span>
    </span>
  );
}

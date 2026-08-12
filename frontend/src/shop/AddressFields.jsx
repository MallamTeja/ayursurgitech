// The address form and the saved-address block, on Design System v1.0.
//
// WHY THIS EXISTS ALONGSIDE components/AddressForm.jsx. That file is still live:
// pages/Account.jsx renders it, and Account has not been migrated. Editing it in
// place would restyle the account page to a palette its surrounding chrome does
// not use, which is the exact failure App.jsx's migration note warns about. So
// this is the v1.0 copy, and components/AddressForm.jsx is deleted when Account
// moves across — not before.
//
// The behaviour is carried over unchanged, including the one thing in it that is
// easy to lose: pincode and phone strip non-digits AS THEY ARE TYPED rather than
// rejecting on submit, so a pasted "+91 98765 43210" becomes usable instead of an
// error message.

import { useState } from 'react';
import { Alert, Button, Field, FormRow, Input, cx } from '../components/DesignSystem';

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
 * State is owned here and seeded from `initial`, so an edit opens with the current
 * values and a cancel throws away the draft rather than the saved address.
 */
export function AddressForm({
  initial = BLANK_ADDRESS,
  onSave,
  onCancel,
  busy = false,
  error = '',
  submitLabel = 'Save address',
  className,
}) {
  const [form, setForm] = useState({ ...BLANK_ADDRESS, ...initial });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setDigits = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '') }));

  return (
    <form
      className={cx('flex flex-col gap-5', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      {/* "Clinic" is a formatting example, not an instruction — §14 forbids a
          placeholder that carries information, and the label above it is the label. */}
      <Field label="Label" optional helper="What you call this address — Clinic, Store, Ward 3.">
        <Input placeholder="Clinic" value={form.label} onChange={set('label')} />
      </Field>

      <Field label="Address line 1" required>
        <Input value={form.line1} onChange={set('line1')} />
      </Field>

      <Field label="Address line 2" optional>
        <Input value={form.line2} onChange={set('line2')} />
      </Field>

      <FormRow columns={2}>
        <Field label="City" required>
          <Input value={form.city} onChange={set('city')} />
        </Field>
        <Field label="State" required>
          <Input value={form.state} onChange={set('state')} />
        </Field>
        <Field label="Pincode" required>
          <Input inputMode="numeric" maxLength={6} value={form.pincode} onChange={setDigits('pincode')} />
        </Field>
        <Field label="Contact phone" required helper="The number the courier calls on delivery.">
          <Input type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={setDigits('phone')} />
        </Field>
      </FormRow>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={busy} loadingLabel="Saving…">
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
  const rest = muted ? 'text-fg-secondary' : 'text-fg';
  return (
    <span className="type-body-sm">
      {address.label && <span className="block font-semibold text-fg">{address.label}</span>}
      <span className="block text-fg">{address.line1}</span>
      {address.line2 && <span className={cx('block', rest)}>{address.line2}</span>}
      <span className={cx('block', rest)}>
        {address.city}, {address.state} <span className="tabular">{address.pincode}</span>
      </span>
      <span className={cx('block tabular', rest)}>{address.phone}</span>
    </span>
  );
}

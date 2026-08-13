import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  Divider,
  Field,
  FormActions,
  FormRow,
  Icon,
  Input,
  PageHeader,
  Switch,
  Well,
  formatINR,
  useToast,
} from '../components/DesignSystem';
import { isMoney, paiseToRupees, rupeesToPaise } from './helpers';
import { resetAdminStore, settingsApi, useAdminStore } from './data';

// Shop-wide values the checkout reads.
//
// Money is typed in RUPEES and stored in PAISE — paiseToRupees and rupeesToPaise in
// helpers.js are the only place that conversion happens. formatINR output must never
// reach an input value: "₹400.00" parses back to NaN, and the thousands separator
// turns ₹2,480.00 into 200 paise.

/** The store's settings → the form's strings. One definition, three callers. */
const toForm = (settings) => ({
  deliveryFee: paiseToRupees(settings.deliveryFee),
  freeDeliveryAbove: paiseToRupees(settings.freeDeliveryAbove),
  gstin: settings.gstin,
  supportEmail: settings.supportEmail,
  supportPhone: settings.supportPhone,
  lowStockAlerts: settings.lowStockAlerts,
  autoApproveReviews: settings.autoApproveReviews,
});

export default function AdminSettings() {
  const settings = useAdminStore((s) => s.settings);
  const toast = useToast();

  const [form, setForm] = useState(() => toForm(settings));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Re-seed from the store after a save or a reset, so the fields never sit there
  // showing what was typed while the panel below reports something else.
  useEffect(() => {
    setForm(toForm(settings));
    setSubmitted(false);
  }, [settings]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const errors = {
    deliveryFee: !isMoney(form.deliveryFee) ? 'Rupees, e.g. 400 or 400.50. Zero is valid — it means free.' : null,
    freeDeliveryAbove: !isMoney(form.freeDeliveryAbove)
      ? 'Rupees. Zero means delivery is always free.'
      : null,
    // 15 characters, and the two-digit state code at the front is the part that is
    // actually checkable without a lookup.
    gstin:
      form.gstin.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}$/i.test(form.gstin.trim())
        ? 'Fifteen characters, in the form 36AABCA1234F1Z5.'
        : null,
    supportEmail:
      form.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail.trim())
        ? 'A single email address.'
        : null,
  };
  const invalid = Object.values(errors).some(Boolean);
  const showError = (key) => (submitted ? errors[key] : undefined);

  const dirty =
    rupeesToPaise(form.deliveryFee) !== settings.deliveryFee ||
    rupeesToPaise(form.freeDeliveryAbove) !== settings.freeDeliveryAbove ||
    form.gstin.trim() !== settings.gstin ||
    form.supportEmail.trim() !== settings.supportEmail ||
    form.supportPhone.trim() !== settings.supportPhone ||
    form.lowStockAlerts !== settings.lowStockAlerts ||
    form.autoApproveReviews !== settings.autoApproveReviews;

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (invalid) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    setBusy(true);
    try {
      const saved = await settingsApi.save({
        deliveryFee: rupeesToPaise(form.deliveryFee),
        freeDeliveryAbove: rupeesToPaise(form.freeDeliveryAbove),
        gstin: form.gstin.trim().toUpperCase(),
        supportEmail: form.supportEmail.trim(),
        supportPhone: form.supportPhone.trim(),
        lowStockAlerts: form.lowStockAlerts,
        autoApproveReviews: form.autoApproveReviews,
      });
      toast.success(`Delivery is ${formatINR(saved.deliveryFee)} per order.`, { title: 'Settings saved' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function onReset() {
    resetAdminStore();
    setResetting(false);
    toast.success('Every screen is back to the sample data it started with.', { title: 'Data reset' });
  }

  const feePaise = isMoney(form.deliveryFee) ? rupeesToPaise(form.deliveryFee) : settings.deliveryFee;
  const thresholdPaise = isMoney(form.freeDeliveryAbove)
    ? rupeesToPaise(form.freeDeliveryAbove)
    : settings.freeDeliveryAbove;

  return (
    <>
      <PageHeader title="Settings" subtitle="Shop-wide values the checkout and the product pages read." />

      <form onSubmit={onSubmit} noValidate className="mt-6 grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card padding="none" className="min-w-0">
          <CardHeader title="Delivery" icon={Icon.shipments} />
          <CardBody className="flex flex-col gap-5">
            <FormRow columns={2}>
              <Field
                label="Delivery fee"
                required
                error={showError('deliveryFee')}
                helper={showError('deliveryFee') ? undefined : 'Charged once per order. Stored as paise.'}
              >
                <Input
                  prefix="₹"
                  inputMode="decimal"
                  value={form.deliveryFee}
                  onChange={(e) => set({ deliveryFee: e.target.value })}
                />
              </Field>
              <Field
                label="Free above"
                required
                error={showError('freeDeliveryAbove')}
                helper={showError('freeDeliveryAbove') ? undefined : 'On the order subtotal, before GST.'}
              >
                <Input
                  prefix="₹"
                  inputMode="decimal"
                  value={form.freeDeliveryAbove}
                  onChange={(e) => set({ freeDeliveryAbove: e.target.value })}
                />
              </Field>
            </FormRow>

            {/* The two figures above, stated as the sentence the buyer meets. It is
                the fastest way to catch a threshold entered in paise by mistake. */}
            <Well>
              <p className="type-body-sm text-fg">
                {feePaise === 0 ? (
                  <>Delivery is free on every order.</>
                ) : thresholdPaise === 0 ? (
                  <>
                    Every order is charged <strong>{formatINR(feePaise)}</strong> for delivery.
                  </>
                ) : (
                  <>
                    Orders under <strong>{formatINR(thresholdPaise, { whole: true })}</strong> are charged{' '}
                    <strong>{formatINR(feePaise)}</strong> for delivery. At or above it, delivery is free.
                  </>
                )}
              </p>
            </Well>

            {/* A change here does not rewrite what past orders were charged, and
                that is deliberate — an order's total is a historical fact. */}
            {rupeesToPaise(form.deliveryFee) !== settings.deliveryFee && (
              <Alert tone="info">
                Existing orders keep the delivery they were charged. This applies to orders placed
                from now on.
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card padding="none" className="min-w-0">
          <CardHeader title="Business identity" icon={Icon.invoices} />
          <CardBody className="flex flex-col gap-5">
            <Field
              label="GSTIN"
              error={showError('gstin')}
              helper={showError('gstin') ? undefined : 'Printed on every invoice. Fifteen characters.'}
            >
              <Input
                className="font-mono uppercase"
                value={form.gstin}
                onChange={(e) => set({ gstin: e.target.value })}
                placeholder="36AABCA1234F1Z5"
              />
            </Field>
            <Field
              label="Support email"
              error={showError('supportEmail')}
              helper={showError('supportEmail') ? undefined : 'Shown on the shop’s support page and order emails.'}
            >
              <Input
                type="email"
                value={form.supportEmail}
                onChange={(e) => set({ supportEmail: e.target.value })}
              />
            </Field>
            <Field label="Support phone">
              <Input
                type="tel"
                value={form.supportPhone}
                onChange={(e) => set({ supportPhone: e.target.value })}
              />
            </Field>
          </CardBody>
        </Card>

        <Card padding="none" className="min-w-0 lg:col-span-2">
          <CardHeader title="Behaviour" icon={Icon.settings} />
          <CardBody className="flex flex-col gap-5">
            {/* Switch hands onChange the next boolean, not an event. */}
            <Switch
              label="Low stock alerts"
              description="Put products at or below their reorder threshold in the dashboard queue."
              checked={form.lowStockAlerts}
              onChange={(next) => set({ lowStockAlerts: next })}
            />
            <Divider />
            <Switch
              label="Approve reviews automatically"
              description="Off means nothing a buyer writes reaches a product page until someone approves it. Leave it off unless there is a reason not to."
              checked={form.autoApproveReviews}
              onChange={(next) => set({ autoApproveReviews: next })}
            />
            {form.autoApproveReviews && (
              <Alert tone="warning" title="Reviews will publish unread">
                Anything submitted goes straight onto the product page, including a complaint about a
                clinical failure. The moderation queue stays available, but by then it is public.
              </Alert>
            )}
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          <FormActions note={dirty ? 'Unsaved changes' : 'Everything saved'}>
            <Button
              variant="secondary"
              type="button"
              disabled={!dirty}
              // Re-seeding from the store is what "discard" means here: the fields
              // go back to what is saved without the store being touched.
              onClick={() => {
                setForm(toForm(settings));
                setSubmitted(false);
              }}
            >
              Discard changes
            </Button>
            <Button type="submit" loading={busy} loadingLabel="Saving…" disabled={!dirty}>
              Save settings
            </Button>
          </FormActions>
        </div>
      </form>

      {/* The honest note about what this build is, and the way back out of any mess
          made while demonstrating it. */}
      <Card className="mt-10 max-w-4xl border-warning/40 bg-warning-bg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-prose">
            <p className="type-body-sm font-semibold text-warning-700">This panel holds no database</p>
            <p className="type-body-sm mt-1 text-fg-secondary">
              Products, orders, categories and settings all come from the same sample data the shop
              renders, held in memory. Edits are real and every screen sees them, but a page reload
              restores the sample — nothing here is half-saved to somewhere you cannot see.
            </p>
          </div>
          <Button variant="secondary" iconLeft={Icon.retry} onClick={() => setResetting(true)}>
            Reset sample data
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={resetting}
        onClose={() => setResetting(false)}
        onConfirm={onReset}
        title="Reset sample data"
        confirmLabel="Reset everything"
        destructive
      >
        Every edit made in this session — products, categories, order statuses, review decisions and
        these settings — goes back to the sample data. This cannot be undone.
      </ConfirmModal>
    </>
  );
}

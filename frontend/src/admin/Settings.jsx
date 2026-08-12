import { useEffect, useState } from 'react';
import { put } from '../lib/api';
import { formatINR, paiseToRupees, rupeesToPaise } from '../lib/money';
import useFetch from '../lib/useFetch';
import {
  Button,
  Card,
  ErrorState,
  Field,
  FormActions,
  Input,
  PageHeader,
  Skeleton,
  useToast,
} from '../components/DesignSystem';

export default function AdminSettings() {
  const settings = useFetch('/settings');
  const [fee, setFee] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // A plain number string, never formatINR output: "₹40.00" parses back to NaN.
  useEffect(() => {
    if (settings.data) setFee(paiseToRupees(settings.data.deliveryFee));
  }, [settings.data]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const deliveryFee = rupeesToPaise(fee); // rupees in the field, paise on the wire
      const saved = await put('/admin/settings', { deliveryFee });
      settings.set({ deliveryFee: saved.deliveryFee }); // so the line below stops showing the old fee
      toast.success(`Delivery fee saved: ${formatINR(saved.deliveryFee)} per order.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Shop-wide values the checkout reads." />

      {settings.loading && <Skeleton h="h-64" w="w-full" rounded="rounded-2xl" className="mt-6 max-w-lg" />}

      {settings.error && (
        <Card className="mt-6 max-w-lg">
          <ErrorState thing="the settings" detail={settings.error} onRetry={settings.reload} />
        </Card>
      )}

      {settings.data && (
        <Card padding="lg" className="mt-6 max-w-lg">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <Field label="Delivery fee" required helper="Rupees, e.g. 40 or 40.50. Stored as paise.">
              <Input prefix="₹" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
            </Field>
            <p className="type-body-sm text-fg-secondary">
              Charged <strong>once per order</strong> at checkout, whatever the basket contains. Currently{' '}
              {formatINR(settings.data.deliveryFee)}.
            </p>
            <FormActions>
              <Button type="submit" loading={busy}>
                Save
              </Button>
            </FormActions>
          </form>
        </Card>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  ErrorState,
  Field,
  FileDrop,
  FormActions,
  FormRow,
  FormSection,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Panel,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
  stockStatusOf,
  useToast,
} from '../components/DesignSystem';
import { post, put, upload } from '../lib/api';
import { formatINR, paiseToRupees, rupeesToPaise } from '../lib/money';
import useFetch from '../lib/useFetch';
import { adminUrl, slugify } from './helpers';

// New and edit are one component. Every money field here is typed in RUPEES and stored in
// PAISE — see onSubmit. The inputs hold a plain number string ("240", "240.5"); formatINR
// output ("₹240.00") must never reach an input value, because parsing it back gives NaN and a
// thousands separator turns ₹2,480.00 into 200 paise.
const blank = {
  name: '',
  slug: '',
  description: '',
  brand: '',
  images: [],
  price: '',
  mrp: '',
  gstRate: '5',
  hsnCode: '',
  minOrderQty: '1',
  stockQty: '0',
  categoryId: '',
  subcategoryId: '',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const cats = useFetch('/admin/categories');
  // ponytail: there is no GET /admin/products/:id. The list carries every field, so the edit
  // form reads its product out of it rather than adding a route. null, not '' — useFetch skips
  // only on null and would happily GET an empty path.
  const products = useFetch(id ? '/admin/products' : null);

  const [form, setForm] = useState(blank);
  const [uploads, setUploads] = useState([]); // per-file: { name, state, message }
  const [busy, setBusy] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const existing = id && products.data?.find((p) => String(p._id) === id);

  useEffect(() => {
    if (!existing) return;
    setForm({
      ...blank,
      ...existing,
      brand: existing.brand || '',
      images: existing.images || [],
      // Plain number strings — paiseToRupees is the only thing that divides by 100.
      price: paiseToRupees(existing.price),
      mrp: existing.mrp ? paiseToRupees(existing.mrp) : '',
      gstRate: String(existing.gstRate),
      minOrderQty: String(existing.minOrderQty ?? 1),
      stockQty: String(existing.stockQty ?? 0),
      categoryId: String(existing.categoryId || ''),
      subcategoryId: String(existing.subcategoryId || ''),
    });
  }, [existing]);

  const loading = cats.loading || products.loading;
  const loadError = cats.error || products.error;

  const subcategories =
    cats.data?.find((c) => String(c._id) === form.categoryId)?.subcategories || [];

  // The Chapter 61/62/63 threshold is on sale value, and prices are stored GST-exclusive, so
  // the paise figure in this form is the right thing to compare. See docs/GST-REFERENCE.md.
  const textileHsn = /^6[123]/.test(form.hsnCode.trim());
  const pricePaise = rupeesToPaise(form.price);

  async function onFiles(files) {
    if (!files.length) return;
    setUploads(files.map((f) => ({ name: f.name, state: 'uploading' })));

    // ponytail: one POST per file, sequentially. fetch gives no upload progress event, so
    // "progress" is per-file state; XHR would be the upgrade if a byte-level bar is wanted.
    for (const [i, file] of files.entries()) {
      try {
        const { url } = await upload('/admin/upload', file);
        setForm((f) => ({ ...f, images: [...f.images, url] }));
        setUploads((u) => u.map((x, j) => (j === i ? { ...x, state: 'done' } : x)));
      } catch (err) {
        setUploads((u) =>
          u.map((x, j) => (j === i ? { ...x, state: 'error', message: err.message } : x)),
        );
      }
    }
  }

  function moveImage(index, delta) {
    setForm((f) => {
      const images = [...f.images];
      const target = index + delta;
      if (target < 0 || target >= images.length) return f;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...f, images };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();

    const price = rupeesToPaise(form.price);
    const mrp = form.mrp.trim() ? rupeesToPaise(form.mrp) : undefined;

    if (price <= 0) {
      toast.error('Enter a price in rupees, for example 240 or 240.50.');
      return;
    }
    // An MRP at or below the selling price renders as a 0% discount and looks broken.
    if (
      mrp !== undefined &&
      mrp <= price &&
      !window.confirm(
        `MRP ${formatINR(mrp)} is not higher than the price ${formatINR(price)}. The shop will show a 0% discount. Save anyway?`,
      )
    )
      return;

    const body = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description,
      brand: form.brand.trim() || undefined,
      images: form.images,
      price, // paise
      ...(mrp !== undefined ? { mrp } : {}),
      gstRate: Number(form.gstRate),
      hsnCode: form.hsnCode.trim(),
      minOrderQty: Number(form.minOrderQty) || 1,
      stockQty: Number(form.stockQty) || 0,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
    };

    setBusy(true);
    try {
      const saved = id
        ? await put(`/admin/products/${id}`, body)
        : await post('/admin/products', body);
      toast.success(`Saved. Price stored as ${saved.price} paise — ${formatINR(saved.price)}.`);
      if (!id) navigate(adminUrl(`/products/${saved._id}`), { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton w="w-64" h="h-9" />
        <Skeleton w="w-full" h="h-96" rounded="rounded-2xl" />
      </div>
    );

  if (loadError)
    return (
      <Panel>
        <ErrorState
          thing="this product"
          detail={loadError}
          onRetry={() => {
            cats.reload();
            products.reload();
          }}
        />
      </Panel>
    );

  if (id && !existing)
    return (
      <Panel>
        <ErrorState title="No product with that id." body="It may have been deleted." />
      </Panel>
    );

  return (
    <>
      <PageHeader
        title={id ? 'Edit product' : 'New product'}
        subtitle={existing ? existing.name : undefined}
        actions={
          <Button as={Link} to={adminUrl('/products')} variant="secondary" iconLeft={Icon.arrowLeft}>
            Back to products
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
        <Panel className="px-4 sm:px-6">
          <FormSection
            title="Identity"
            description="Name, URL slug, description and brand — the identifying details shown across the shop and admin lists."
          >
            <FormRow columns={2}>
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    set(
                      id || form.slug !== slugify(form.name) ? { name } : { name, slug: slugify(name) },
                    );
                  }}
                />
              </Field>
              <Field label="Slug" required helper="Shop URL: /p/your-slug">
                <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
              </Field>
            </FormRow>

            <Field label="Description" required helper="Plain text. Line breaks are kept.">
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </Field>

            <FormRow columns={2}>
              <Field label="Brand" optional helper="Romsons, 3M, Datar — how buyers actually search.">
                <Input value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
              </Field>
              <Field label="HSN code" required helper="Printed on invoices. 8 digits is safe at any turnover.">
                <Input
                  className="font-mono"
                  value={form.hsnCode}
                  onChange={(e) => set({ hsnCode: e.target.value })}
                />
              </Field>
            </FormRow>
          </FormSection>

          <FormSection
            title="Price and tax"
            description="What the shop charges before GST, the invoice HSN code and the GST rate that applies to it."
          >
            <FormRow columns={2}>
              <Field
                label="Price (₹, excluding GST)"
                required
                helper="Rupees, e.g. 240 or 240.50. Stored as paise."
              >
                <Input
                  prefix="₹"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => set({ price: e.target.value })}
                />
              </Field>
              <Field
                label="MRP (₹)"
                optional
                helper="Struck-through list price beside the selling price. Must be higher than the price to mean anything."
              >
                <Input
                  prefix="₹"
                  inputMode="decimal"
                  value={form.mrp}
                  onChange={(e) => set({ mrp: e.target.value })}
                />
              </Field>
            </FormRow>

            {/* 0, 5, 18 — and nothing else. The 12% slab was abolished on 22 September 2025 by
                Notification 9/2025-CTR; offering it would emit an invoice at a rate that does not
                legally exist. docs/GST-REFERENCE.md has the gazette citations. */}
            <Field
              label="GST rate"
              required
              helper="The rate follows the product's HSN code — confirm it against the current notification before invoicing."
            >
              <Select value={form.gstRate} onChange={(e) => set({ gstRate: e.target.value })}>
                <option value="0">0% — exempt</option>
                <option value="5">5% — merit rate (effectively every surgical good)</option>
                <option value="18">18% — standard rate</option>
              </Select>
            </Field>

            {textileHsn && (
              <Alert tone="warning">
                HSN {form.hsnCode.trim()} is a Chapter 61/62/63 textile — masks, gowns, drapes,
                caps. Its rate depends on the price per piece: <strong>5% at or below ₹2,500</strong>,{' '}
                <strong>18% above</strong> it (sale value, i.e. this GST-exclusive figure).
                {pricePaise > 0 && (
                  <>
                    {' '}
                    At {formatINR(pricePaise)} per piece that points to{' '}
                    <strong>{pricePaise > 250000 ? '18%' : '5%'}</strong>.
                  </>
                )}{' '}
                A hint, not a rule — you decide.
              </Alert>
            )}
          </FormSection>

          <FormSection
            title="Stock and ordering"
            description="How much is on hand, the smallest quantity a buyer can order, and where the product sits in the catalogue."
          >
            <FormRow columns={2}>
              <div>
                <Field label="Stock quantity" helper="The only stock field there is.">
                  <Input
                    type="number"
                    min="0"
                    className="font-mono"
                    value={form.stockQty}
                    onChange={(e) => set({ stockQty: e.target.value })}
                  />
                </Field>
                <p className="type-caption mt-2 flex items-center gap-2 text-fg-secondary">
                  Shop shows:{' '}
                  <StatusBadge kind="stock" value={stockStatusOf(Number(form.stockQty) || 0, 0)} size="sm" /> —
                  derived from the number, not a separate switch.
                </p>
              </div>
              <Field
                label="Minimum order quantity"
                helper="Refused at the shop's quantity stepper, with the reason shown."
              >
                <Input
                  type="number"
                  min="1"
                  value={form.minOrderQty}
                  onChange={(e) => set({ minOrderQty: e.target.value })}
                />
              </Field>
            </FormRow>

            <FormRow columns={2}>
              <Field label="Category" required>
                <Select
                  value={form.categoryId}
                  // Changing the category clears the subcategory — the old one belongs to another parent.
                  onChange={(e) => set({ categoryId: e.target.value, subcategoryId: '' })}
                >
                  <option value="">Choose a category</option>
                  {(cats.data || []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Subcategory"
                required
                helper={form.categoryId ? undefined : 'Choose a category first.'}
              >
                <Select
                  disabled={!form.categoryId}
                  value={form.subcategoryId}
                  onChange={(e) => set({ subcategoryId: e.target.value })}
                >
                  <option value="">Choose a subcategory</option>
                  {subcategories.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormRow>
          </FormSection>

          <FormSection
            title="Images"
            description="The first image is the thumbnail everywhere on the shop — cards, cart, orders. Use the arrows to change which one that is."
          >
            <FileDrop accept="image/*" multiple onAdd={onFiles} hint="JPG or PNG · any size" />

            {uploads.length > 0 && (
              <ul className="flex flex-col gap-1">
                {uploads.map((u, i) => (
                  <li
                    key={`${u.name}-${i}`}
                    className={`type-caption ${u.state === 'error' ? 'text-error-700' : 'text-fg-secondary'}`}
                  >
                    {u.name} — {u.state === 'uploading' ? 'uploading…' : u.state === 'done' ? 'uploaded' : u.message}
                  </li>
                ))}
              </ul>
            )}

            {form.images.length > 0 && (
              <ul className="flex flex-wrap gap-3">
                {form.images.map((src, i) => (
                  <li key={src} className="w-28">
                    <img
                      src={src}
                      alt=""
                      className="aspect-square w-full rounded-lg border border-edge bg-white object-contain p-1"
                    />
                    <p className="type-caption mt-1 text-fg-secondary">
                      {i === 0 ? 'Thumbnail' : `Image ${i + 1}`}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <IconButton
                        icon={Icon.chevronLeft}
                        label={`Move image ${i + 1} earlier`}
                        size="sm"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                      />
                      <IconButton
                        icon={Icon.chevronRight}
                        label={`Move image ${i + 1} later`}
                        size="sm"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.images.length - 1}
                      />
                      <IconButton
                        icon={Icon.delete}
                        label={`Remove image ${i + 1}`}
                        size="sm"
                        onClick={() =>
                          setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>
        </Panel>

        {/* Not sticky. FormActions' sticky variant sits on bg-surface/95, and over this
            form's own white panel the section underneath stays legible through it — it reads
            as a rendering fault rather than a floating bar. Categories and Settings both end
            with a plain action bar, so this matches them. */}
        <FormActions>
          <Button as={Link} to={adminUrl('/products')} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {id ? 'Save changes' : 'Create product'}
          </Button>
        </FormActions>
      </form>
    </>
  );
}

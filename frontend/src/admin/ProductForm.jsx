import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Field,
  FormActions,
  FormRow,
  FormSection,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  StockMeter,
  Switch,
  Textarea,
  formatINR,
  stockStatusOf,
  useToast,
} from '../components/DesignSystem';
import { adminUrl, isMoney, paiseToRupees, rupeesToPaise } from './helpers';
import { productsApi, useAdminStore } from './data';

// New and edit are one component, over the same product shape /products renders:
// code, summary, gst, hsn, uom, packSize, moq, stock, lowStockAt, specs. Saving
// mutates the shared fixture, so a rename shows up in the catalogue immediately —
// that is the whole reason both halves read one source.
//
// VALIDATION IS INLINE AND ON SUBMIT, never a window.confirm(). A native confirm
// dialog cannot be styled, cannot be read by the page's own focus management, and
// puts a decision in a box that looks like a browser malfunction. The MRP check
// that used to be a confirm() is an Alert beside the field that raised it.

const GST_RATES = [
  { value: 0, label: '0% — exempt' },
  { value: 5, label: '5% — merit rate (effectively every surgical good)' },
  { value: 12, label: '12% — as carried by the current catalogue' },
  { value: 18, label: '18% — standard rate' },
];

const UOMS = ['Piece', 'Box', 'Pack', 'Set', 'Roll', 'Vial'];

const blank = {
  code: '',
  name: '',
  categorySlug: '',
  subCategory: '',
  summary: '',
  price: '',
  mrp: '',
  gst: 12,
  hsn: '',
  uom: 'Piece',
  packSize: '',
  moq: '1',
  stock: '0',
  lowStockAt: '0',
  status: 'active',
  sterile: false,
  latexFree: false,
  specs: [],
  applications: [],
  documents: [],
  image: null,
};

/** The store's product → the form's strings. Money becomes rupees exactly once. */
const toForm = (product) => ({
  ...blank,
  ...product,
  summary: product.summary ?? '',
  packSize: product.packSize ?? '',
  price: paiseToRupees(product.price),
  mrp: product.mrp ? paiseToRupees(product.mrp) : '',
  gst: product.gst ?? 12,
  moq: String(product.moq ?? 1),
  stock: String(product.stock ?? 0),
  lowStockAt: String(product.lowStockAt ?? 0),
  specs: product.specs ? product.specs.map(([k, v]) => [k, v]) : [],
  applications: product.applications ?? [],
  documents: product.documents ?? [],
});

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const products = useAdminStore((s) => s.products);
  const categories = useAdminStore((s) => s.categories);

  const existing = id ? products.find((p) => p.id === id) : null;

  const [form, setForm] = useState(() => (existing ? toForm(existing) : { ...blank }));
  const [submitted, setSubmitted] = useState(false); // errors appear after the first attempt, not while typing
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-seed when the route changes to a different product — the component is
  // reused across /products/:id, and without this, opening one product from
  // another leaves the previous one's values in the fields.
  useEffect(() => {
    setForm(existing ? toForm(existing) : { ...blank });
    setSubmitted(false);
    setDirty(false);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const category = categories.find((c) => c.slug === form.categorySlug);
  const subcategories = category?.children ?? [];

  const pricePaise = rupeesToPaise(form.price);
  const mrpPaise = form.mrp.trim() ? rupeesToPaise(form.mrp) : null;

  // The Chapter 61/62/63 threshold is on sale value, and prices are stored
  // GST-exclusive, so the paise figure in this form is the right one to compare.
  const textileHsn = /^6[123]/.test(form.hsn.trim());

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = 'A product needs a name — it is what the catalogue lists.';
    if (!form.code.trim()) e.code = 'The product code is how buyers search and how orders reference this.';
    else if (products.some((p) => p.code.toLowerCase() === form.code.trim().toLowerCase() && p.id !== id))
      e.code = 'Another product already uses this code.';
    if (!isMoney(form.price)) e.price = 'Enter a price in rupees, for example 240 or 240.50.';
    else if (pricePaise <= 0) e.price = 'A price of zero would list this product as free.';
    if (form.mrp.trim() && !isMoney(form.mrp)) e.mrp = 'Enter an amount in rupees, or leave it blank.';
    if (!form.hsn.trim()) e.hsn = 'The HSN code is printed on every invoice this product appears on.';
    else if (!/^\d{4,8}$/.test(form.hsn.trim())) e.hsn = 'Four to eight digits. Eight is safe at any turnover.';
    if (!form.categorySlug) e.categorySlug = 'Pick where this sits in the catalogue.';
    if (Number(form.moq) < 1) e.moq = 'The minimum order quantity is at least one.';
    if (Number(form.stock) < 0) e.stock = 'Stock cannot be negative.';
    if (Number(form.lowStockAt) < 0) e.lowStockAt = 'A reorder threshold cannot be negative.';
    return e;
  }, [form, products, id, pricePaise]);

  const errorList = Object.entries(errors);
  const showError = (key) => (submitted ? errors[key] : undefined);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (errorList.length > 0) {
      // Focus the first bad field. A summary at the bottom of a nine-field form
      // that nobody scrolls to is a validation message that was never delivered.
      document.querySelector('[aria-invalid="true"]')?.focus();
      toast.error(`${errorList.length} field${errorList.length === 1 ? '' : 's'} need${errorList.length === 1 ? 's' : ''} attention.`);
      return;
    }

    const payload = {
      ...(id ? { id } : {}),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      summary: form.summary.trim(),
      category: category?.name ?? '',
      categorySlug: form.categorySlug,
      subCategory: form.subCategory || '',
      icon: category?.icon ?? 'products',
      price: pricePaise,
      ...(mrpPaise ? { mrp: mrpPaise } : { mrp: undefined }),
      gst: Number(form.gst),
      hsn: form.hsn.trim(),
      uom: form.uom,
      packSize: form.packSize.trim(),
      moq: Math.max(1, Number(form.moq) || 1),
      stock: Math.max(0, Number(form.stock) || 0),
      lowStockAt: Math.max(0, Number(form.lowStockAt) || 0),
      status: form.status,
      sterile: form.sterile,
      latexFree: form.latexFree,
      specs: form.specs.filter(([k, v]) => k.trim() || v.trim()),
      applications: form.applications,
      documents: form.documents,
      image: form.image ?? null,
    };

    setBusy(true);
    try {
      const saved = await productsApi.save(payload);
      setDirty(false);
      toast.success(`Saved "${payload.name}". It is live in the catalogue.`, { title: 'Product saved' });
      // `replace`, so Back from a just-created product does not return to an empty
      // New Product form that would create a second one.
      if (!id) navigate(adminUrl(`/products/${saved.id}`), { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  // A stale link to a deleted product is a normal thing to arrive with.
  if (id && !existing) {
    return (
      <>
        <PageHeader
          title="Product not found"
          actions={
            <Button as={Link} to={adminUrl('/products')} variant="secondary" iconLeft={Icon.arrowLeft}>
              Back to products
            </Button>
          }
        />
        <Panel className="mt-6">
          <ErrorState
            title="No product with that id."
            body="It may have been deleted. The catalogue list has everything currently on the shop."
          />
        </Panel>
      </>
    );
  }

  const stockKey = stockStatusOf(Number(form.stock) || 0, Number(form.lowStockAt) || 0);

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Products', href: adminUrl('/products') },
              { label: id ? (existing?.name ?? 'Edit') : 'New product' },
            ]}
          />
        }
        title={id ? 'Edit product' : 'New product'}
        subtitle={
          id
            ? 'Changes appear in the shop catalogue as soon as they are saved.'
            : 'Prices are entered in rupees, excluding GST, and stored as paise.'
        }
        meta={id && existing ? <StatusBadge kind="entity" value={existing.status} /> : undefined}
        actions={
          <Button as={Link} to={adminUrl('/products')} variant="tertiary" iconLeft={Icon.arrowLeft}>
            Back to products
          </Button>
        }
      />

      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-6">
        {/* One summary, above the fields, only once submitting has failed. §14 asks
            for the error next to the field; this is the count, so a failure below
            the fold is still visible from the top of the form. */}
        {submitted && errorList.length > 0 && (
          <Alert tone="error" title={`${errorList.length} field${errorList.length === 1 ? '' : 's'} need attention`}>
            Each one is marked below with what it needs.
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
            <Panel className="px-4 py-1 sm:px-6">
              <FormSection
                title="Identity"
                description="What the catalogue lists and what an order references. The code is the field buyers actually type."
              >
                <FormRow columns={2}>
                  <Field label="Name" required error={showError('name')}>
                    <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                  </Field>
                  <Field
                    label="Product code"
                    required
                    error={showError('code')}
                    helper="Unique. Shown on the card, the order and the invoice."
                  >
                    <Input
                      className="font-mono uppercase"
                      value={form.code}
                      onChange={(e) => set({ code: e.target.value })}
                      placeholder="AST-IV-1001"
                    />
                  </Field>
                </FormRow>

                <Field
                  label="Summary"
                  optional
                  helper="One or two sentences. It is the description under the name on the product card."
                >
                  <Textarea rows={3} value={form.summary} onChange={(e) => set({ summary: e.target.value })} />
                </Field>

                <FormRow columns={2}>
                  <Field label="Category" required error={showError('categorySlug')}>
                    <Select
                      value={form.categorySlug}
                      // Changing the category clears the subcategory — the old one
                      // belongs to a different parent and would render as a
                      // breadcrumb that does not exist.
                      onChange={(e) => set({ categorySlug: e.target.value, subCategory: '' })}
                    >
                      <option value="">Choose a category</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Subcategory"
                    optional
                    helper={
                      !form.categorySlug
                        ? 'Choose a category first.'
                        : subcategories.length === 0
                          ? `${category.name} has no subcategories.`
                          : undefined
                    }
                  >
                    <Select
                      disabled={!form.categorySlug || subcategories.length === 0}
                      value={form.subCategory}
                      onChange={(e) => set({ subCategory: e.target.value })}
                    >
                      <option value="">None</option>
                      {subcategories.map((s) => (
                        <option key={s.slug} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </FormRow>
              </FormSection>

              <FormSection
                title="Price and tax"
                description="What the shop charges before GST, the invoice HSN code, and the rate that applies to it."
              >
                <FormRow columns={2}>
                  <Field
                    label="Price, excluding GST"
                    required
                    error={showError('price')}
                    helper={
                      showError('price') ? undefined : 'Rupees, e.g. 240 or 240.50. Stored as paise.'
                    }
                  >
                    <Input
                      prefix="₹"
                      inputMode="decimal"
                      value={form.price}
                      onChange={(e) => set({ price: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="MRP"
                    optional
                    error={showError('mrp')}
                    helper={showError('mrp') ? undefined : 'The struck-through list price beside the selling price.'}
                  >
                    <Input
                      prefix="₹"
                      inputMode="decimal"
                      value={form.mrp}
                      onChange={(e) => set({ mrp: e.target.value })}
                    />
                  </Field>
                </FormRow>

                {/* Was a window.confirm() on submit. An MRP at or below the price
                    renders as a 0% discount, which looks broken on the card — so it
                    is worth saying, and it is not worth blocking a save over. */}
                {mrpPaise !== null && pricePaise > 0 && mrpPaise <= pricePaise && (
                  <Alert tone="warning" title="The MRP is not above the price">
                    At {formatINR(mrpPaise)} against {formatINR(pricePaise)} the shop shows a 0%
                    discount and the struck-through figure reads as a mistake. Leave the MRP blank to
                    show the price on its own.
                  </Alert>
                )}

                <FormRow columns={2}>
                  <Field
                    label="GST rate"
                    required
                    helper="The rate follows the HSN code. Confirm it against the current notification before invoicing."
                  >
                    <Select value={form.gst} onChange={(e) => set({ gst: Number(e.target.value) })}>
                      {GST_RATES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="HSN code"
                    required
                    error={showError('hsn')}
                    helper={showError('hsn') ? undefined : 'Printed on invoices. Eight digits is safe at any turnover.'}
                  >
                    <Input
                      className="font-mono"
                      inputMode="numeric"
                      value={form.hsn}
                      onChange={(e) => set({ hsn: e.target.value })}
                      placeholder="90183930"
                    />
                  </Field>
                </FormRow>

                {textileHsn && (
                  <Alert tone="info" title="This HSN is a textile chapter">
                    HSN {form.hsn.trim()} is Chapter 61/62/63 — masks, gowns, drapes, caps. The rate
                    depends on price per piece: <strong>5% at or below ₹2,500</strong>,{' '}
                    <strong>18% above</strong> it, measured on this GST-exclusive figure.
                    {pricePaise > 0 && (
                      <>
                        {' '}
                        At {formatINR(pricePaise)} that points to{' '}
                        <strong>{pricePaise > 250000 ? '18%' : '5%'}</strong>.
                      </>
                    )}{' '}
                    A hint, not a rule — you decide.
                  </Alert>
                )}
              </FormSection>

              <FormSection
                title="Ordering and stock"
                description="How it is sold, the smallest quantity a buyer can order, and how much is on hand."
              >
                <FormRow columns={3}>
                  <Field label="Unit of measure" required>
                    <Select value={form.uom} onChange={(e) => set({ uom: e.target.value })}>
                      {UOMS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Pack size" optional helper="As printed on the carton.">
                    <Input
                      value={form.packSize}
                      onChange={(e) => set({ packSize: e.target.value })}
                      placeholder="100 pcs / box"
                    />
                  </Field>
                  <Field
                    label="Minimum order quantity"
                    required
                    error={showError('moq')}
                    helper={showError('moq') ? undefined : "The shop's stepper counts in multiples of this."}
                  >
                    <Input
                      type="number"
                      min="1"
                      className="tabular"
                      value={form.moq}
                      onChange={(e) => set({ moq: e.target.value })}
                    />
                  </Field>
                </FormRow>

                <FormRow columns={2}>
                  <Field label="Stock on hand" required error={showError('stock')}>
                    <Input
                      type="number"
                      min="0"
                      className="tabular"
                      value={form.stock}
                      onChange={(e) => set({ stock: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="Reorder threshold"
                    required
                    error={showError('lowStockAt')}
                    helper={
                      showError('lowStockAt')
                        ? undefined
                        : 'At or below this, the product is badged Low Stock and appears in the dashboard queue.'
                    }
                  >
                    <Input
                      type="number"
                      min="0"
                      className="tabular"
                      value={form.lowStockAt}
                      onChange={(e) => set({ lowStockAt: e.target.value })}
                    />
                  </Field>
                </FormRow>

                {/* The two numbers above, as the buyer will meet them. Derived, so
                    there is no separate switch to get out of step with the count. */}
                <div className="rounded-xl bg-surface-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="type-caption text-fg-secondary">The shop will show</p>
                    <StatusBadge kind="stock" value={stockKey} size="sm" />
                  </div>
                  <StockMeter
                    className="mt-3"
                    stock={Number(form.stock) || 0}
                    lowStockAt={Number(form.lowStockAt) || 0}
                  />
                </div>
              </FormSection>

              <FormSection
                title="Specifications"
                description="The key-specification table on the product page. Rows appear in the order they are listed here."
              >
                {form.specs.length === 0 ? (
                  <p className="type-body-sm text-fg-secondary">
                    No specifications yet. A buyer comparing three infusion sets is reading this
                    table, so it is worth filling in.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {form.specs.map(([key, value], i) => (
                      <li key={i} className="flex flex-wrap items-end gap-3">
                        <div className="min-w-40 flex-1">
                          <Field label={i === 0 ? 'Specification' : undefined} htmlFor={`spec-key-${i}`}>
                            <Input
                              id={`spec-key-${i}`}
                              aria-label={`Specification ${i + 1} name`}
                              value={key}
                              onChange={(e) =>
                                set({ specs: form.specs.map((s, j) => (j === i ? [e.target.value, s[1]] : s)) })
                              }
                              placeholder="Tube length"
                            />
                          </Field>
                        </div>
                        <div className="min-w-40 flex-1">
                          <Field label={i === 0 ? 'Value' : undefined} htmlFor={`spec-value-${i}`}>
                            <Input
                              id={`spec-value-${i}`}
                              aria-label={`Specification ${i + 1} value`}
                              value={value}
                              onChange={(e) =>
                                set({ specs: form.specs.map((s, j) => (j === i ? [s[0], e.target.value] : s)) })
                              }
                              placeholder="150 cm"
                            />
                          </Field>
                        </div>
                        <IconButton
                          icon={Icon.delete}
                          label={`Remove specification ${i + 1}${key ? `, ${key}` : ''}`}
                          onClick={() => set({ specs: form.specs.filter((_, j) => j !== i) })}
                          className="mb-0.5 text-error-700"
                        />
                      </li>
                    ))}
                  </ul>
                )}

                <div>
                  <Button
                    variant="secondary"
                    type="button"
                    iconLeft={Icon.add}
                    onClick={() => set({ specs: [...form.specs, ['', '']] })}
                  >
                    Add specification
                  </Button>
                </div>
              </FormSection>
            </Panel>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <Card padding="none">
              <CardHeader title="Listing" icon={Icon.tag} />
              <CardBody className="flex flex-col gap-5">
                <Field
                  label="Status"
                  helper="Only active products appear in the shop catalogue."
                >
                  <Select value={form.status} onChange={(e) => set({ status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </Select>
                </Field>

                {/* Switch hands its onChange the next boolean, not an event — it is
                    a role="switch" button, not a checkbox input. */}
                <Switch
                  label="Sterile"
                  description="Shown as a trust signal on the product page."
                  checked={form.sterile}
                  onChange={(next) => set({ sterile: next })}
                />
                <Switch
                  label="Latex-free"
                  description="Clinically relevant, so it is stated rather than implied."
                  checked={form.latexFree}
                  onChange={(next) => set({ latexFree: next })}
                />
              </CardBody>
            </Card>

            <Card padding="none">
              <CardHeader title="Photograph" icon={Icon.noImage} />
              <CardBody>
                {/* No uploader. There is no storage behind this build, and a file
                    picker that appears to accept an image and silently discards it
                    is worse than not offering one. The catalogue's placeholder holds
                    the exact aspect ratio the real photograph will occupy. */}
                <p className="type-body-sm text-fg-secondary">
                  Product photography is not wired up in this build. Until it is, the catalogue shows
                  the category glyph and the product code in the space the photograph will take —
                  same position, same aspect ratio, so adding photographs later changes no layout.
                </p>
              </CardBody>
            </Card>

            {id && existing && (
              <Card padding="none">
                <CardHeader title="In the shop" icon={Icon.externalLink} />
                <CardBody className="flex flex-col gap-3">
                  <p className="type-body-sm text-fg-secondary">
                    See this product the way a buyer does, with the price, the stock badge and the
                    specification table as they render.
                  </p>
                  <Button
                    as="a"
                    href={`/products?q=${encodeURIComponent(existing.code)}`}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    iconRight={Icon.externalLink}
                  >
                    Open in the catalogue
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        <FormActions note={dirty ? 'Unsaved changes' : undefined}>
          <Button as={Link} to={adminUrl('/products')} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" loading={busy} loadingLabel="Saving…">
            {id ? 'Save changes' : 'Create product'}
          </Button>
        </FormActions>
      </form>
    </>
  );
}

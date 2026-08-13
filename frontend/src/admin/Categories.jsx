import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  ConfirmModal,
  DataTable,
  EmptyState,
  Field,
  FormActions,
  FormRow,
  FormSection,
  Icon,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Select,
  formatQty,
  useToast,
} from '../components/DesignSystem';
import { adminUrl, slugify } from './helpers';
import { categoriesApi, productCountOf, useAdminStore } from './data';

// The §12 taxonomy: two levels, subcategories edited inside their parent.
//
// THE FORM IS A MODAL, not a panel that pushes the table down.
//
// It used to open above the list, which moved every row 400px down the moment you
// clicked Edit — so the row you were aiming at was no longer under your cursor, and
// on a phone the form opened off-screen with no indication anything had happened.
// A modal keeps the table where it is, traps focus, closes on Esc, and makes
// "which category am I editing" unambiguous because its title says so.

const blankCategory = { name: '', slug: '', icon: 'products', children: [] };

// The glyph a category carries into the shop's nav and its catalogue tiles. This is
// the icon set the fixture already uses, so a new category looks like the six that
// shipped rather than falling back to a generic box.
const ICON_CHOICES = [
  { value: 'infusion', label: 'Infusion' },
  { value: 'vitals', label: 'Vitals / lines' },
  { value: 'lab', label: 'Lab / connectors' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'pharma', label: 'Pharma / vials' },
  { value: 'wound', label: 'Wound care' },
  { value: 'products', label: 'Generic' },
];

export default function AdminCategories() {
  const categories = useAdminStore((s) => s.categories);
  const products = useAdminStore((s) => s.products);
  const toast = useToast();

  const [form, setForm] = useState(null); // null = the modal is closed
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const editing = Boolean(form?.original);

  function open(category) {
    // A copy, so cancelling leaves the row on screen untouched. `original` is kept
    // separately because the slug is the key a save writes against and the field
    // itself is editable.
    setForm(
      category
        ? { ...category, children: category.children.map((c) => ({ ...c })), original: category.slug }
        : { ...blankCategory, original: null },
    );
    setSubmitted(false);
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setChild = (index, patch) =>
    setForm((f) => ({ ...f, children: f.children.map((c, i) => (i === index ? { ...c, ...patch } : c)) }));

  const slugTaken =
    form &&
    categories.some((c) => c.slug === (form.slug || slugify(form.name)) && c.slug !== form.original);

  const errors = form
    ? {
        name: !form.name.trim() ? 'A category needs a name — it is the label in the shop nav.' : null,
        slug: !(form.slug || slugify(form.name))
          ? 'A slug is needed for the shop URL.'
          : slugTaken
            ? 'Another category already uses this slug.'
            : null,
      }
    : {};
  const invalid = Object.values(errors).some(Boolean);
  const showError = (key) => (submitted ? errors[key] : undefined);

  async function onSave(e) {
    e.preventDefault();
    setSubmitted(true);
    if (invalid) return;

    setBusy(true);
    // The whole children array goes back on the parent — that is how §12 defines
    // editing them. Blank rows are dropped rather than saved as nameless entries.
    const payload = {
      slug: (form.slug || slugify(form.name)).trim(),
      name: form.name.trim(),
      icon: form.icon,
      children: form.children
        .filter((c) => c.name.trim())
        .map((c) => ({
          slug: (c.slug || slugify(c.name)).trim(),
          name: c.name.trim(),
          // The count is what the shop's nav prints beside the subcategory. It is
          // carried through rather than recomputed, because nothing in this build
          // assigns products to a subcategory by slug.
          count: c.count ?? 0,
        })),
      count: productCountOf(products, (form.slug || slugify(form.name)).trim()),
    };

    try {
      await categoriesApi.save(payload);
      setForm(null);
      toast.success(`Saved "${payload.name}".`, { title: editing ? 'Category updated' : 'Category created' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const category = confirming;
    setDeleting(true);
    try {
      await categoriesApi.remove(category.slug);
      setConfirming(null);
      toast.success(`Deleted "${category.name}".`);
    } catch (err) {
      // The refusal carries the real reason — "12 products still in it" — so it is
      // shown verbatim rather than flattened to "could not delete".
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Category',
      primary: true,
      sortable: true,
      render: (c) => {
        const Glyph = Icon[c.icon] ?? Icon.products;
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Glyph size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-fg">{c.name}</span>
              <span className="type-caption block truncate font-mono text-fg-muted">/c/{c.slug}</span>
            </span>
          </span>
        );
      },
    },
    {
      key: 'children',
      header: 'Subcategories',
      render: (c) =>
        c.children.length === 0 ? (
          <span className="text-fg-muted">None</span>
        ) : (
          <span className="block max-w-md">
            <span className="tabular font-medium text-fg">{c.children.length}</span>
            <span className="type-caption mt-0.5 block text-fg-secondary">
              {c.children.map((s) => s.name).join(' · ')}
            </span>
          </span>
        ),
    },
    {
      key: 'products',
      header: 'In the shop',
      align: 'right',
      sortable: true,
      // Counted from the products themselves, active only — the same rule the shop's
      // own category counts use, so the two never disagree. Anything not active is
      // reported on the line below rather than folded into the figure, because it is
      // not in the shop and the column says "In the shop".
      render: (c) => {
        const live = productCountOf(products, c.slug);
        const hidden = productCountOf(products, c.slug, { all: true }) - live;
        return (
          <span className="inline-flex flex-col items-end">
            {live === 0 ? (
              <span className="text-fg-muted">0</span>
            ) : (
              <Link
                to={adminUrl(`/products?cat=${c.slug}`)}
                className="tabular font-medium text-brand-700 underline-offset-2 hover:underline"
                aria-label={`View the ${live} product${live === 1 ? '' : 's'} listed in ${c.name}`}
              >
                {formatQty(live)}
              </Link>
            )}
            {hidden > 0 && (
              <span className="type-caption tabular text-fg-muted">
                +{formatQty(hidden)} not listed
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // Every row's button reads as a bare "Edit" / "Delete" in a screen reader's
      // control list, so each one names its category.
      render: (c) => (
        <span className="inline-flex items-center justify-end gap-1">
          <Button variant="tertiary" size="sm" onClick={() => open(c)} aria-label={`Edit ${c.name}`}>
            Edit
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setConfirming(c)}
            aria-label={`Delete ${c.name}`}
            className="text-error-700 hover:bg-error-bg"
          >
            Delete
          </Button>
        </span>
      ),
    },
  ];

  // Every product, not just the listed ones: a discontinued product still points at
  // this category, and deleting it out from under one orphans it.
  const confirmCount = confirming ? productCountOf(products, confirming.slug, { all: true }) : 0;

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Two levels. Subcategories are edited inside their parent, and the shop nav is built from this list."
        actions={
          <Button iconLeft={Icon.add} onClick={() => open(null)}>
            New category
          </Button>
        }
      />

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={categories}
          rowKey={(c) => c.slug}
          caption="Categories"
          empty={
            <EmptyState
              icon={Icon.categories}
              title="No categories yet."
              body="The shop's navigation and its catalogue filters are both built from this list."
              action={
                <Button iconLeft={Icon.add} onClick={() => open(null)}>
                  New category
                </Button>
              }
            />
          }
        />
      </div>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={editing ? `Edit ${form.name || 'category'}` : 'New category'}
        description="Subcategories are saved with their parent."
        size="lg"
      >
        {form && (
          <form id="category-form" onSubmit={onSave} noValidate className="flex flex-col gap-6">
            <FormSection title="Category">
              <FormRow columns={2}>
                <Field label="Name" required error={showError('name')}>
                  <Input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      // The slug follows the name until someone edits the slug
                      // themselves — then it is theirs and stops being overwritten.
                      set(
                        form.original || form.slug !== slugify(form.name)
                          ? { name }
                          : { name, slug: slugify(name) },
                      );
                    }}
                  />
                </Field>
                <Field
                  label="Slug"
                  required
                  error={showError('slug')}
                  helper={showError('slug') ? undefined : 'Appears in the shop URL: /c/wound-care'}
                >
                  <Input
                    className="font-mono"
                    value={form.slug}
                    onChange={(e) => set({ slug: slugify(e.target.value) })}
                  />
                </Field>
              </FormRow>

              <Field label="Icon" helper="Shown in the shop's category menu and on its catalogue tiles.">
                <Select value={form.icon} onChange={(e) => set({ icon: e.target.value })}>
                  {ICON_CHOICES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Renaming a slug changes a URL that may already be linked. Worth
                  saying once, at the moment it becomes true. */}
              {editing && form.slug !== form.original && (
                <Alert tone="warning" title="This changes the category's URL">
                  /c/{form.original} becomes /c/{form.slug}. Any existing link to the old address
                  stops resolving.
                </Alert>
              )}
            </FormSection>

            <FormSection
              title="Subcategories"
              description="Removing one that still has products against it is refused, with the count."
            >
              {form.children.length === 0 ? (
                <p className="type-body-sm text-fg-secondary">
                  None yet. A category with no subcategories is valid — three of the six that shipped
                  have none.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {form.children.map((child, i) => (
                    <li key={i} className="flex flex-wrap items-end gap-3">
                      <div className="min-w-40 flex-1">
                        <Field label={i === 0 ? 'Name' : undefined} htmlFor={`sub-name-${i}`}>
                          <Input
                            id={`sub-name-${i}`}
                            aria-label={`Subcategory ${i + 1} name`}
                            value={child.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setChild(
                                i,
                                child.slug !== slugify(child.name) ? { name } : { name, slug: slugify(name) },
                              );
                            }}
                          />
                        </Field>
                      </div>
                      <div className="min-w-40 flex-1">
                        <Field label={i === 0 ? 'Slug' : undefined} htmlFor={`sub-slug-${i}`}>
                          <Input
                            id={`sub-slug-${i}`}
                            aria-label={`Subcategory ${i + 1} slug`}
                            className="font-mono"
                            value={child.slug}
                            onChange={(e) => setChild(i, { slug: slugify(e.target.value) })}
                          />
                        </Field>
                      </div>
                      <IconButton
                        icon={Icon.delete}
                        label={`Remove subcategory ${i + 1}${child.name ? `, ${child.name}` : ''}`}
                        onClick={() => setForm((f) => ({ ...f, children: f.children.filter((_, j) => j !== i) }))}
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
                  onClick={() => setForm((f) => ({ ...f, children: [...f.children, { name: '', slug: '', count: 0 }] }))}
                >
                  Add subcategory
                </Button>
              </div>
            </FormSection>

            <FormActions>
              <Button variant="secondary" type="button" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} loadingLabel="Saving…">
                {editing ? 'Save changes' : 'Create category'}
              </Button>
            </FormActions>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={onDelete}
        title="Delete category"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        // A category with products in it cannot be deleted, so the confirm button
        // would be a control that only ever produces an error. Saying so here beats
        // letting someone click it to find out.
        confirmDisabled={confirmCount > 0}
      >
        {confirmCount > 0 ? (
          <>
            &quot;{confirming?.name}&quot; still has{' '}
            <strong>
              {formatQty(confirmCount)} product{confirmCount === 1 ? '' : 's'}
            </strong>{' '}
            in it. Move or delete them first, or they leave the catalogue with no way back to them.
          </>
        ) : (
          <>Delete &quot;{confirming?.name}&quot;? This cannot be undone.</>
        )}
      </ConfirmModal>
    </>
  );
}

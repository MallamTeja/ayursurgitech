import { useState } from 'react';
import {
  Button,
  ConfirmModal,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  FileDrop,
  FormActions,
  FormRow,
  FormSection,
  Icon,
  Input,
  PageHeader,
  Panel,
  useToast,
} from '../components/DesignSystem';
import { del, post, put, upload } from '../lib/api';
import useFetch from '../lib/useFetch';
import { slugify } from './helpers';

const blank = { name: '', slug: '', image: '', order: 0, subcategories: [] };

export default function AdminCategories() {
  const list = useFetch('/admin/categories');
  const [form, setForm] = useState(null); // null = the form is closed
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(null); // the category a delete is pending confirmation for
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  function open(category) {
    // A copy, so cancelling leaves the row on screen untouched.
    setForm(category ? { ...category, subcategories: [...category.subcategories] } : { ...blank });
  }

  function setSub(index, patch) {
    setForm((f) => ({
      ...f,
      subcategories: f.subcategories.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  async function onImage(file) {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await upload('/admin/upload', file);
      set({ image: url });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    // The whole subcategories array goes back on the parent — that is how SPEC.md defines
    // editing them. Existing rows keep their _id, because products reference it.
    const body = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      image: form.image || undefined,
      order: Number(form.order) || 0,
      subcategories: form.subcategories
        .filter((s) => s.name.trim())
        .map((s) => ({
          ...(s._id ? { _id: s._id } : {}),
          name: s.name.trim(),
          slug: (s.slug || slugify(s.name)).trim(),
        })),
    };

    try {
      if (form._id) await put(`/admin/categories/${form._id}`, body);
      else await post('/admin/categories', body);
      setForm(null);
      list.reload();
      toast.success(`Saved "${body.name}".`);
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
      await del(`/admin/categories/${category._id}`);
      list.reload();
      setConfirming(null);
      toast.success(`Deleted "${category.name}".`);
    } catch (err) {
      // 409 carries the real reason — "12 products still in it" — so it is shown verbatim.
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: 'name', header: 'Name', primary: true, render: (c) => <span className="font-medium text-fg">{c.name}</span> },
    { key: 'slug', header: 'Slug', className: 'font-mono text-xs text-fg-secondary', render: (c) => c.slug },
    {
      key: 'subcategories',
      header: 'Subcategories',
      render: (c) => (
        <span>
          {c.subcategories.length}
          {c.subcategories.length > 0 && (
            <span className="ml-2 text-xs text-fg-muted">{c.subcategories.map((s) => s.name).join(', ')}</span>
          )}
        </span>
      ),
    },
    { key: 'products', header: 'Products', align: 'right', render: (c) => c.productCount },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // Every row's button reads as plain "Edit" / "Delete" in a screen reader's control
      // list, so each one names its category.
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

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Two levels. Subcategories are edited inside their parent."
        actions={
          <Button iconLeft={Icon.add} onClick={() => open(null)}>
            New category
          </Button>
        }
      />

      {form && (
        <Panel className="mt-6 mb-6 p-4 md:p-6">
          <form onSubmit={onSave}>
            <FormSection title={form._id ? `Edit ${form.name}` : 'New category'}>
              <FormRow columns={3}>
                <Field label="Name" required>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      // The slug follows the name until someone edits the slug themselves.
                      set(
                        form._id || form.slug !== slugify(form.name) ? { name } : { name, slug: slugify(name) },
                      );
                    }}
                  />
                </Field>
                <Field label="Slug" required helper="Appears in the shop URL: /c/wound-care">
                  <Input required value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
                </Field>
                <Field label="Sort order" helper="Lower numbers come first in the shop nav.">
                  <Input type="number" value={form.order} onChange={(e) => set({ order: e.target.value })} />
                </Field>
              </FormRow>

              <Field label="Image">
                <div className="flex items-center gap-3">
                  {form.image && (
                    <img
                      src={form.image}
                      alt=""
                      className="size-11 shrink-0 rounded-lg border border-edge bg-surface object-contain p-1"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <FileDrop
                      accept="image/*"
                      multiple={false}
                      files={[]}
                      onAdd={(files) => onImage(files[0])}
                      hint="PNG or JPG"
                    />
                  </div>
                  {form.image && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      type="button"
                      onClick={() => set({ image: '' })}
                      className="shrink-0 text-error-700 hover:bg-error-bg"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </Field>

              <fieldset className="rounded-xl border border-edge p-4">
                <legend className="type-body-sm px-1 font-medium text-fg">Subcategories</legend>
                <p className="type-caption mb-3 text-fg-muted">
                  Saved with the category. Removing one that still has products is refused, with the
                  count.
                </p>

                <div className="flex flex-col gap-3">
                  {form.subcategories.map((s, i) => (
                    <div key={s._id || `new-${i}`} className="flex flex-wrap items-end gap-3">
                      <div className="min-w-40 flex-1">
                        <Field label="Name">
                          <Input
                            value={s.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setSub(
                                i,
                                s._id || s.slug !== slugify(s.name) ? { name } : { name, slug: slugify(name) },
                              );
                            }}
                          />
                        </Field>
                      </div>
                      <div className="min-w-40 flex-1">
                        <Field label="Slug">
                          <Input value={s.slug} onChange={(e) => setSub(i, { slug: e.target.value })} />
                        </Field>
                      </div>
                      <Button
                        variant="tertiary"
                        type="button"
                        iconLeft={Icon.delete}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            subcategories: f.subcategories.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  type="button"
                  iconLeft={Icon.add}
                  className="mt-3"
                  onClick={() =>
                    setForm((f) => ({ ...f, subcategories: [...f.subcategories, { name: '', slug: '' }] }))
                  }
                >
                  Add subcategory
                </Button>
              </fieldset>
            </FormSection>

            <FormActions>
              <Button variant="secondary" type="button" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} loadingLabel="Saving…">
                Save category
              </Button>
            </FormActions>
          </form>
        </Panel>
      )}

      <div className="mt-6">
        {list.error ? (
          <ErrorState thing="the categories" detail={list.error} onRetry={list.reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={list.data || []}
            rowKey={(c) => c._id}
            caption="Categories"
            loading={list.loading}
            empty={
              <EmptyState
                title="No categories yet."
                body="The shop nav is built from these."
                action={
                  <Button iconLeft={Icon.add} onClick={() => open(null)}>
                    New category
                  </Button>
                }
              />
            }
          />
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={onDelete}
        title="Delete category"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      >
        Delete &quot;{confirming?.name}&quot;? This cannot be undone.
      </ConfirmModal>
    </>
  );
}

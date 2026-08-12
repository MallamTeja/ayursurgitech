// The filter panel. One component, rendered twice: as a sticky aside from lg up and
// inside a Drawer below it. Two copies of this markup would be two copies to keep in
// step, and the mobile one is always the one that falls behind.
//
// FOUR DECISIONS WORTH DEFENDING:
//
// 1. Counts, always. "Extension Lines 9" tells you what a click is worth before you
//    spend it; "Extension Lines" makes you spend it to find out. The counting is done
//    per-facet with that facet excluded — see the header of catalogue.js for why.
//
// 2. A zero-count option is disabled, not hidden. Hiding it makes the sidebar
//    reshuffle as you filter, so the option you were reaching for moves under your
//    cursor. Showing it greyed says "not with your current filters" and holds the
//    layout still.
//
// 3. Price is two number fields, not a slider. A slider is for exploring an unknown
//    range; a procurement officer has a budget figure and wants to type it. Sliders
//    are also miserable on touch and effectively unusable by keyboard for a range.
//
// 4. Filters apply immediately, with no Apply button — on desktop. The results are
//    on screen, so the feedback is the point. The mobile drawer covers the results,
//    so it gets an explicit "Show N products" that both applies and dismisses.

import { Badge, Checkbox, Divider, Field, Icon, Input, cx, formatQty } from '../components/DesignSystem';

function Group({ title, children, hint }) {
  return (
    <div className="py-5 first:pt-0">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="type-body-sm font-semibold text-fg">{title}</h3>
        {hint && <span className="type-caption text-fg-muted">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * A facet option. The count sits at the end of the row, tabular, so a column of
 * them lines up and can be scanned rather than read.
 */
function Option({ label, count, checked, disabled, onChange, sublabel }) {
  return (
    <div className={cx('flex items-center gap-2.5', disabled && 'opacity-55')}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        label={
          <span className="flex w-full items-baseline gap-2">
            <span className="min-w-0 flex-1">
              {label}
              {sublabel && <span className="type-caption block font-normal text-fg-muted">{sublabel}</span>}
            </span>
          </span>
        }
        className="flex-1"
      />
      <span className="tabular type-caption shrink-0 text-fg-muted">{formatQty(count)}</span>
    </div>
  );
}

export default function Facets({ query, facets, total, chips, toggleIn, update, clearFilters, idPrefix = 'f' }) {
  const AVAIL_ICON = { inStock: Icon.success, lowStock: Icon.warning, outOfStock: Icon.error };

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 pb-4">
        <h2 className="type-h4 text-fg">Filters</h2>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="type-caption font-medium text-brand-700 underline decoration-brand-500 underline-offset-2 transition-colors hover:text-brand-900"
          >
            Clear all
          </button>
        )}
      </div>

      <Divider />

      <div className="divide-y divide-edge">
        <Group title="Category">
          <div className="space-y-2.5">
            {facets.categories.map((c) => (
              <Option
                key={c.slug}
                label={c.name}
                count={c.count}
                checked={query.categories.includes(c.slug)}
                // Never disable an option the user has already selected, even at a
                // count of zero — they need to be able to switch it back off.
                disabled={c.count === 0 && !query.categories.includes(c.slug)}
                onChange={() => toggleIn('cat', query.categories, c.slug)}
              />
            ))}
          </div>
        </Group>

        <Group title="Availability">
          <div className="space-y-2.5">
            {facets.availability.map((a) => {
              const Glyph = AVAIL_ICON[a.value];
              return (
                <Option
                  key={a.value}
                  label={
                    <span className="flex items-center gap-1.5">
                      <Glyph
                        size={14}
                        className={cx(
                          'shrink-0',
                          a.value === 'inStock' && 'text-success',
                          a.value === 'lowStock' && 'text-warning',
                          a.value === 'outOfStock' && 'text-error',
                        )}
                      />
                      {a.label}
                    </span>
                  }
                  count={a.count}
                  checked={query.availability.includes(a.value)}
                  disabled={a.count === 0 && !query.availability.includes(a.value)}
                  onChange={() => toggleIn('avail', query.availability, a.value)}
                />
              );
            })}
          </div>
        </Group>

        <Group title="Unit price" hint="₹, excl. GST">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor={`${idPrefix}-min`}>
              <Input
                id={`${idPrefix}-min`}
                inputMode="numeric"
                prefix="₹"
                placeholder="0"
                value={query.min ?? ''}
                invalid={Boolean(query.priceError)}
                // Strip non-digits on the way in rather than validating on submit.
                // There is no submit — the filter is live — so the field has to stay
                // in a state that means something at every keystroke.
                onChange={(e) => update({ min: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label="To" htmlFor={`${idPrefix}-max`}>
              <Input
                id={`${idPrefix}-max`}
                inputMode="numeric"
                prefix="₹"
                placeholder="Any"
                value={query.max ?? ''}
                invalid={Boolean(query.priceError)}
                onChange={(e) => update({ max: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
          </div>
          {query.priceError && (
            // §4: a glyph and a sentence, not a red border on its own. While this is
            // showing, the price filter is not applied at all — see catalogue.js.
            <p className="type-caption mt-2 flex items-start gap-1.5 text-error-700" role="alert">
              <Icon.danger size={14} className="mt-px shrink-0" />
              <span>{query.priceError} No price filter is being applied.</span>
            </p>
          )}
        </Group>

        <Group title="Minimum order quantity">
          <div className="space-y-2.5">
            {facets.moq.map((b) => (
              <Option
                key={b.value}
                label={b.label}
                count={b.count}
                // Single-select: the buckets are nested, so ticking two of them is
                // always the same as ticking the larger one. Behaving like a radio
                // group while looking like a checkbox would be worse, so ticking a
                // second bucket replaces the first.
                checked={query.moq === b.value}
                disabled={b.count === 0 && query.moq !== b.value}
                onChange={() => update({ moq: query.moq === b.value ? '' : b.value })}
              />
            ))}
          </div>
        </Group>

        <Group title="Properties">
          <div className="space-y-2.5">
            {facets.properties.map((p) => (
              <Option
                key={p.value}
                label={p.label}
                count={p.count}
                checked={query.properties.includes(p.value)}
                disabled={p.count === 0 && !query.properties.includes(p.value)}
                onChange={() => toggleIn('props', query.properties, p.value)}
              />
            ))}
          </div>
        </Group>
      </div>

      <div className="border-t border-edge pt-4">
        <p className="type-caption text-fg-secondary">
          <Badge size="sm" tone={total === 0 ? 'error' : 'brand'}>
            {formatQty(total)}
          </Badge>{' '}
          {total === 1 ? 'product matches' : 'products match'}
        </p>
      </div>
    </div>
  );
}

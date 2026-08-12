// The furniture the reference pages are built from.
//
// Kept separate from ./ui so the distinction stays clear: ui/* is the product's
// design system, showcase/* is documentation *about* it. Nothing here should ever
// be imported by a real screen — if a screen needs one of these, it belongs in
// ui/ instead.
//
// The one rule this file follows: documentation is built from the system it
// documents. Every heading, border and colour below is a token or a .type-* class,
// so a page that renders wrong is evidence about the system rather than about the
// docs.

import { contrast, SURFACES, verdict } from '../tokens.js';
import { cx } from '../utils.js';
import { Icon } from '../icons.jsx';

/* -------------------------------------------------------------------------- */
/* Page and section structure                                                 */
/* -------------------------------------------------------------------------- */

export function Page({ eyebrow, title, intro, spec, children }) {
  return (
    <article className="min-w-0">
      <header className="border-b border-edge pb-8">
        {eyebrow && <p className="type-label text-brand-700">{eyebrow}</p>}
        <h1 className="type-h1 mt-2 text-fg">{title}</h1>
        {intro && <p className="type-body-lg mt-4 max-w-3xl text-fg-secondary">{intro}</p>}
        {spec && (
          <p className="type-caption mt-4 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-fg-secondary">
            <Icon.documents size={13} />
            Design System v1.0 · {spec}
          </p>
        )}
      </header>
      <div className="space-y-16 pt-12">{children}</div>
    </article>
  );
}

export function Section({ id, title, spec, intro, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="type-h3 text-fg">{title}</h2>
        {spec && <span className="type-caption tabular text-fg-muted">{spec}</span>}
      </div>
      {intro && <p className="type-body mt-3 max-w-3xl text-fg-secondary">{intro}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export function SubSection({ title, intro, children }) {
  return (
    <div className="min-w-0">
      <h3 className="type-h4 text-fg">{title}</h3>
      {intro && <p className="type-body-sm mt-2 max-w-3xl text-fg-secondary">{intro}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * A live demo. `surface` picks the background the example sits on, which matters
 * more than it sounds: a white card on white proves nothing, and several
 * components in this system change appearance between canvas and surface.
 */
export function Example({ title, note, surface = 'canvas', padded = true, children, className }) {
  const BG = { canvas: 'bg-canvas', surface: 'bg-surface', 'surface-2': 'bg-surface-2', brand: 'bg-brand-900' };
  return (
    <figure className={cx('min-w-0 overflow-hidden rounded-xl border border-edge', className)}>
      {(title || note) && (
        <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-edge bg-surface px-4 py-2.5">
          {title && <span className="type-th text-fg-secondary">{title}</span>}
          {note && <span className="type-caption text-fg-muted">{note}</span>}
        </figcaption>
      )}
      <div className={cx(BG[surface], padded && 'p-6')}>{children}</div>
    </figure>
  );
}

/** A row of variants, wrapping. The default gap is §8's 16px. */
export function Row({ align = 'center', children, className }) {
  return (
    <div
      className={cx(
        'flex flex-wrap gap-4',
        align === 'center' && 'items-center',
        align === 'end' && 'items-end',
        align === 'start' && 'items-start',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Grid({ cols = 2, children, className }) {
  const COLS = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };
  return <div className={cx('grid gap-4', COLS[cols], className)}>{children}</div>;
}

/** A labelled specimen inside an Example — the label sits under the thing. */
export function Specimen({ label, children, className }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div>{children}</div>
      {label && <p className="type-caption mt-2 text-fg-muted">{label}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Code                                                                      */
/* -------------------------------------------------------------------------- */

export function Code({ children, className }) {
  return (
    <code className={cx('rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8125rem] text-brand-900', className)}>
      {children}
    </code>
  );
}

export function CodeBlock({ children, className }) {
  return (
    <pre
      className={cx(
        'overflow-x-auto rounded-xl border border-edge bg-surface-2 p-4 font-mono text-[0.8125rem] leading-relaxed text-fg',
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  );
}

/* -------------------------------------------------------------------------- */
/* Props table                                                               */
/* -------------------------------------------------------------------------- */

/**
 * `rows` is `[name, type, default, notes]`. Deliberately positional and terse —
 * a props table that takes an object per row does not get written.
 */
export function PropsTable({ rows = [], className }) {
  return (
    <div className={cx('overflow-x-auto rounded-xl border border-edge bg-surface', className)}>
      <table className="w-full text-left">
        <caption className="sr-only-ds">Component props</caption>
        <thead className="bg-surface-2">
          <tr className="border-b border-edge">
            {['Prop', 'Type', 'Default', 'Notes'].map((h) => (
              <th key={h} scope="col" className="type-th whitespace-nowrap px-4 py-2.5 text-fg-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, def, notes]) => (
            <tr key={name} className="border-b border-edge last:border-0">
              <td className="px-4 py-2.5 align-top">
                <Code>{name}</Code>
              </td>
              <td className="type-caption px-4 py-2.5 align-top font-mono text-fg-secondary">{type}</td>
              <td className="type-caption px-4 py-2.5 align-top font-mono text-fg-muted">{def ?? '—'}</td>
              <td className="type-body-sm px-4 py-2.5 align-top text-fg-secondary">{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Do / Don't                                                                */
/* -------------------------------------------------------------------------- */

/**
 * §32's rules are all of the form "do not X", and a rule stated without its
 * counter-example gets broken. Both halves render live, so the difference is
 * visible rather than described.
 */
export function DoDont({ doLabel = 'Do', dontLabel = "Don't", doNode, dontNode, doNote, dontNote, className }) {
  return (
    <div className={cx('grid gap-4 lg:grid-cols-2', className)}>
      <div className="overflow-hidden rounded-xl border border-success/30">
        <div className="flex items-center gap-1.5 border-b border-success/30 bg-success-bg px-4 py-2">
          <Icon.success size={14} className="text-success" />
          <span className="type-th text-success-700">{doLabel}</span>
        </div>
        <div className="bg-surface p-5">{doNode}</div>
        {doNote && <p className="type-caption border-t border-edge bg-surface px-5 pb-4 pt-3 text-fg-secondary">{doNote}</p>}
      </div>
      <div className="overflow-hidden rounded-xl border border-error/30">
        <div className="flex items-center gap-1.5 border-b border-error/30 bg-error-bg px-4 py-2">
          <Icon.error size={14} className="text-error" />
          <span className="type-th text-error-700">{dontLabel}</span>
        </div>
        <div className="bg-surface p-5">{dontNode}</div>
        {dontNote && (
          <p className="type-caption border-t border-edge bg-surface px-5 pb-4 pt-3 text-fg-secondary">{dontNote}</p>
        )}
      </div>
    </div>
  );
}

/** A §32 rule, quoted. */
export function Rule({ n, children }) {
  return (
    <div className="flex gap-3 rounded-xl border border-edge bg-surface p-4">
      <span className="type-caption grid size-6 shrink-0 place-items-center rounded-full bg-brand-900 font-semibold text-white">
        {n}
      </span>
      <p className="type-body-sm text-fg">{children}</p>
    </div>
  );
}

/**
 * A note about a decision this system made that the doc did not, or made
 * differently. Every one of these should say what changed and why.
 */
export function Decision({ title, children, kind = 'addition' }) {
  const KIND = {
    addition: { label: 'Addition', cls: 'border-info/30 bg-info-bg', text: 'text-info-700', icon: Icon.add },
    change: { label: 'Change', cls: 'border-warning/40 bg-warning-bg', text: 'text-warning-700', icon: Icon.retry },
    open: { label: 'Open question', cls: 'border-edge-strong bg-surface-2', text: 'text-fg-secondary', icon: Icon.help },
  };
  const k = KIND[kind];
  return (
    <div className={cx('rounded-xl border p-4', k.cls)}>
      <p className={cx('type-label flex items-center gap-1.5', k.text)}>
        <k.icon size={13} />
        {k.label}
      </p>
      <p className="type-body-sm mt-2 font-semibold text-fg">{title}</p>
      <div className="type-body-sm mt-1.5 space-y-2 text-fg-secondary">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Colour swatches — the self-measuring kind                                  */
/* -------------------------------------------------------------------------- */

/**
 * A swatch that computes its own contrast against all three surfaces and prints
 * the verdict. `role` is the level it must reach: 'body' 4.5:1, 'large' or 'ui'
 * 3:1, 'none' for a colour that is only ever a background.
 *
 * This is the part of the documentation that cannot go stale. Change a hex in
 * tokens.js and the badge under it changes with no one having to remember to
 * re-check.
 */
export function Swatch({ name, hex, use, role = 'body', addition, tint }) {
  const measurements = Object.entries(SURFACES).map(([label, bg]) => {
    const ratio = contrast(hex, bg);
    return { label, ...verdict(ratio, role === 'none' ? 'ui' : role) };
  });
  if (tint) {
    const ratio = contrast(hex, tint);
    measurements.push({ label: 'own tint', ...verdict(ratio, role === 'none' ? 'ui' : role) });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="h-16 w-full border-b border-edge" style={{ backgroundColor: hex }} />
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="type-body-sm font-semibold text-fg">{name}</p>
          {addition && (
            <span className="type-caption rounded bg-info-bg px-1.5 py-0.5 font-medium text-info-700">added</span>
          )}
        </div>
        <p className="type-caption tabular mt-0.5 font-mono uppercase text-fg-secondary">{hex}</p>
        <p className="type-caption mt-2 text-fg-secondary">{use}</p>

        {role !== 'none' && (
          <ul className="mt-3 space-y-1 border-t border-edge pt-3">
            {measurements.map((m) => (
              <li key={m.label} className="flex items-center justify-between gap-2">
                <span className="type-caption text-fg-muted">on {m.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="type-caption tabular font-medium text-fg">{m.ratio.toFixed(2)}</span>
                  <span
                    className={cx(
                      'type-caption inline-flex items-center gap-1 rounded px-1.5 font-semibold',
                      m.pass ? 'bg-success-bg text-success-700' : 'bg-error-bg text-error-700',
                    )}
                  >
                    {m.pass ? <Icon.check size={11} /> : <Icon.close size={11} />}
                    {m.pass ? 'AA' : 'fail'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {role === 'none' && <p className="type-caption mt-3 border-t border-edge pt-3 text-fg-muted">Background only — not measured for text.</p>}
      </div>
    </div>
  );
}

/** A token row for the spacing / radius / elevation ladders. */
export function TokenRow({ token, value, use, children }) {
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="px-4 py-3 align-middle">
        <Code>{token}</Code>
      </td>
      <td className="type-caption tabular px-4 py-3 align-middle font-mono text-fg-secondary">{value}</td>
      <td className="px-4 py-3 align-middle">{children}</td>
      <td className="type-body-sm px-4 py-3 align-middle text-fg-secondary">{use}</td>
    </tr>
  );
}

export function TokenTable({ head = ['Token', 'Value', '', 'Use'], children, className }) {
  return (
    <div className={cx('overflow-x-auto rounded-xl border border-edge bg-surface', className)}>
      <table className="w-full text-left">
        <caption className="sr-only-ds">Design tokens</caption>
        <thead className="bg-surface-2">
          <tr className="border-b border-edge">
            {head.map((h, i) => (
              <th key={i} scope="col" className="type-th whitespace-nowrap px-4 py-2.5 text-fg-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

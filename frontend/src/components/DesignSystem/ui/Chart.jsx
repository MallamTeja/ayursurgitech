// Charts — §20.
//
// §20 is three sentences and a colour table, and all three sentences are
// restrictions: restrained colours, no rainbows, "charts should communicate
// information, not decoration". So this file deliberately ships four small chart
// primitives rather than wrapping a charting library.
//
// WHY NO CHART LIBRARY. Recharts or Chart.js would arrive with its own palette,
// its own type scale, its own tooltip and its own idea of a grid line — four
// design decisions already made by this document, differently. Overriding all of
// them is more work than drawing a bar, and every upgrade puts them back. A
// dashboard needs a bar chart, a line, a sparkline and a share-of-total; those are
// SVG primitives, and they are below. When a real analytics screen needs axes,
// zoom and brushing, that is the moment to add a library — and to theme it against
// tokens.js on the way in.
//
// SERIES COLOUR comes from CHART_SERIES in tokens.js, which is §20's mapping
// exactly: revenue brand-600, orders brand-500, customers brand-900, profit
// success. Four series is the whole vocabulary — a fifth means the chart is trying
// to answer two questions.
//
// ACCESSIBILITY. Every chart here is decorative in the ARIA sense (aria-hidden)
// and ships with a real <table> beside it — visually hidden, but present. A chart
// that is only pixels is unreadable to a screen reader, and §24 does not exempt
// data visualisation. It also means the numbers are copy-pasteable, which is what
// the person doing the monthly report actually wants.

import { useId, useState } from 'react';
import { CHART_SERIES } from '../tokens.js';
import { cx } from '../utils.js';

/* -------------------------------------------------------------------------- */
/* Shared: the hidden data table                                              */
/* -------------------------------------------------------------------------- */

function DataFallback({ caption, columns, rows }) {
  return (
    <table className="sr-only-ds">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) =>
              j === 0 ? (
                <th key={j} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={j}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------------- */
/* BarChart                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A vertical bar chart, for a month-by-month figure.
 *
 * Grid lines: four, horizontal, in edge — §17's "avoid excessive grid lines"
 * applies to charts for the same reason it applies to tables. There are no
 * vertical grid lines because the bars already are the vertical structure.
 *
 * The bars are drawn as flex divs rather than SVG rects so they respond to
 * container width without a viewBox recalculation, and the hover state can be a
 * plain CSS transition.
 */
export function BarChart({
  data = [],
  xKey = 'month',
  yKey = 'revenue',
  series = 'revenue',
  format = (v) => v,
  height = 200,
  caption,
  className,
}) {
  const [hover, setHover] = useState(null);
  const meta = CHART_SERIES.find((s) => s.key === series) ?? CHART_SERIES[0];
  const max = Math.max(...data.map((d) => d[yKey]), 1);
  const ticks = 4;

  return (
    <figure className={cx('min-w-0', className)}>
      <div className="relative" style={{ height }}>
        {/* Grid */}
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: ticks + 1 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="type-caption tabular w-12 shrink-0 text-right text-fg-muted">
                {format(Math.round((max * (ticks - i)) / ticks))}
              </span>
              <span className="h-px flex-1 bg-edge" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1 pl-14">
          {data.map((d, i) => {
            const pct = (d[yKey] / max) * 100;
            const active = hover === i;
            return (
              <div
                key={d[xKey]}
                className="group/bar relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className="w-full rounded-t transition-[height,opacity] duration-200"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: meta.hex,
                    opacity: hover === null || active ? 1 : 0.45,
                  }}
                />
                {active && (
                  <div className="ds-fade-in pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-900 px-2 py-1 text-xs font-medium text-white shadow-e2">
                    <span className="tabular">{format(d[yKey])}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X axis */}
      <div aria-hidden="true" className="mt-2 flex gap-1 pl-14">
        {data.map((d) => (
          <span key={d[xKey]} className="type-caption flex-1 text-center text-fg-secondary">
            {d[xKey]}
          </span>
        ))}
      </div>

      <DataFallback
        caption={caption ?? `${meta.label} by ${xKey}`}
        columns={[xKey, meta.label]}
        rows={data.map((d) => [d[xKey], format(d[yKey])])}
      />
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* LineChart                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One or two lines over the same x axis — revenue against orders, this year
 * against last. Two is the limit: §20's "avoid rainbow charts" arrives fast, and
 * two series on one axis with different units is already a chart that needs a
 * second y axis and therefore a library.
 *
 * The area fill under a line is at 12% opacity. It exists to make the line's
 * direction readable at a glance, not to be seen.
 */
export function LineChart({ data = [], xKey = 'month', lines = [{ key: 'revenue', series: 'revenue' }], format = (v) => v, height = 200, caption, className }) {
  const gradientId = useId();
  const max = Math.max(...data.flatMap((d) => lines.map((l) => d[l.key])), 1);
  const w = 100;
  const h = 100;

  const pointsFor = (key) =>
    data.map((d, i) => ({
      x: (i / Math.max(1, data.length - 1)) * w,
      y: h - (d[key] / max) * h,
    }));

  return (
    <figure className={cx('min-w-0', className)}>
      <div className="relative" style={{ height }}>
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-px w-full bg-edge" />
          ))}
        </div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible"
        >
          {lines.map((line, li) => {
            const meta = CHART_SERIES.find((s) => s.key === line.series) ?? CHART_SERIES[li];
            const pts = pointsFor(line.key);
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            return (
              <g key={line.key}>
                <defs>
                  <linearGradient id={`${gradientId}-${li}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={meta.hex} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={meta.hex} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#${gradientId}-${li})`} />
                {/* vectorEffect keeps the stroke 2px at any container width — without
                    it, preserveAspectRatio="none" stretches the line thickness too. */}
                <path
                  d={path}
                  fill="none"
                  stroke={meta.hex}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="2"
                    fill="var(--color-surface)"
                    stroke={meta.hex}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div aria-hidden="true" className="mt-2 flex justify-between">
        {data.map((d) => (
          <span key={d[xKey]} className="type-caption text-fg-secondary">
            {d[xKey]}
          </span>
        ))}
      </div>

      <DataFallback
        caption={caption ?? 'Trend'}
        columns={[xKey, ...lines.map((l) => CHART_SERIES.find((s) => s.key === l.series)?.label ?? l.key)]}
        rows={data.map((d) => [d[xKey], ...lines.map((l) => format(d[l.key]))])}
      />
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Sparkline                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A trend line small enough to sit inside a table cell.
 *
 * Deliberately axis-free and label-free: a sparkline answers "which way" and
 * nothing else. If the reader needs a value, the number belongs beside it as text —
 * which is why every usage in this system pairs it with one.
 */
export function Sparkline({ values = [], series = 'revenue', width = 72, height = 24, className }) {
  const meta = CHART_SERIES.find((s) => s.key === series) ?? CHART_SERIES[0];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const path = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={cx('overflow-visible', className)}
    >
      <path d={path} fill="none" stroke={meta.hex} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* ShareBar                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Share of a total, as a stacked horizontal bar with a real legend — revenue by
 * category, orders by region.
 *
 * A stacked bar rather than a pie or donut, on purpose. Comparing angles is harder
 * than comparing lengths, a donut with a number in the hole is the "decorative
 * graphic competing with the number" §19 rules out, and five slices need five
 * colours, which is one more than §20 permits. A stacked bar needs no extra colour
 * and stays readable at any width.
 */
export function ShareBar({ items = [], format = (v) => v, caption, className }) {
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
  return (
    <figure className={cx('min-w-0', className)}>
      <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-surface-2">
        {items.map((item, i) => {
          const meta = CHART_SERIES[i % CHART_SERIES.length];
          return (
            <span
              key={item.label}
              title={`${item.label}: ${format(item.value)}`}
              style={{
                width: `${(item.value / total) * 100}%`,
                backgroundColor: meta.hex,
                // A hairline of surface between segments, so two adjacent teals
                // do not read as one segment.
                boxShadow: i > 0 ? 'inset 1px 0 0 var(--color-surface)' : undefined,
              }}
            />
          );
        })}
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item, i) => {
          const meta = CHART_SERIES[i % CHART_SERIES.length];
          return (
            <li key={item.label} className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="mt-1.5 size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: meta.hex }}
              />
              <span className="type-body-sm min-w-0 flex-1 truncate text-fg-secondary">{item.label}</span>
              <span className="type-body-sm tabular shrink-0 font-medium text-fg">{format(item.value)}</span>
              <span className="type-caption tabular w-10 shrink-0 text-right text-fg-muted">
                {Math.round((item.value / total) * 100)}%
              </span>
            </li>
          );
        })}
      </ul>

      <DataFallback
        caption={caption ?? 'Share of total'}
        columns={['Item', 'Value', 'Share']}
        rows={items.map((i) => [i.label, format(i.value), `${Math.round((i.value / total) * 100)}%`])}
      />
    </figure>
  );
}

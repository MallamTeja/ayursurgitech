// Navigation — §12, §11.2, §16, §28.
//
// §12 gives two navigations, and the difference between them is the point:
// customer navigation is six flat items, admin navigation is twenty-plus grouped
// under seven business headings. One component cannot be both, so there are two.
//
// §32 Rule 9 — "do not make the admin panel look like the marketing website" — is
// enforced here more than anywhere else in the system. The customer header is
// white, spacious and horizontal. The admin sidebar is brand-900, dense and
// vertical. Same tokens, same type scale, deliberately different weight.

import { useId, useState } from 'react';
import { Icon } from '../icons.jsx';
import { cx } from '../utils.js';
import { CountBadge, ORDER_FLOW, ORDER_STATUS } from './Badge.jsx';

/* -------------------------------------------------------------------------- */
/* Breadcrumb — §16                                                           */
/* -------------------------------------------------------------------------- */

/**
 * §16 puts a breadcrumb at the top of the product detail hierarchy, and a
 * four-level category taxonomy (§12) is unusable without one.
 *
 * The current page is the last item and is not a link — it is marked
 * aria-current="page" and rendered as text. A breadcrumb whose last item links to
 * the page you are already on is a control that does nothing.
 *
 * Long trails collapse in the middle on mobile rather than wrapping to three
 * lines: the first and last two items are what orient you, the middle rarely is.
 */
export function Breadcrumb({ items = [], className }) {
  const collapse = items.length > 3;
  return (
    <nav aria-label="Breadcrumb" className={cx('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const hiddenOnMobile = collapse && i > 0 && i < items.length - 2;
          return (
            <li
              key={item.label}
              className={cx('flex items-center gap-1.5', hiddenOnMobile && 'hidden sm:flex')}
            >
              {i > 0 && <Icon.chevronRight size={14} className="shrink-0 text-fg-muted" aria-hidden="true" />}
              {last ? (
                <span aria-current="page" className="type-body-sm truncate font-medium text-fg">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href ?? '#'}
                  className="type-body-sm truncate text-fg-secondary underline-offset-2 transition-colors hover:text-brand-700 hover:underline"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Tabs for sections of one record — an order's Items / Shipment / Invoice /
 * History. Not for navigation between pages; that is what the sidebar is for.
 *
 * The count badges matter on an admin screen: "Documents 0" tells you not to click
 * before you click, which is the difference between four tabs and one tab plus
 * three disappointments.
 *
 * Keyboard: arrow keys move between tabs, which is the WAI-ARIA tabs pattern —
 * Tab itself moves *out* of the tablist to the panel, so a five-tab record does
 * not cost five tab stops on the way past.
 */
export function Tabs({ tabs = [], value, onChange, className }) {
  const baseId = useId();
  const index = tabs.findIndex((t) => t.value === value);

  const onKeyDown = (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (index + dir + tabs.length) % tabs.length;
    onChange?.(tabs[next].value);
    document.getElementById(`${baseId}-tab-${tabs[next].value}`)?.focus();
  };

  return (
    <div className={cx('border-b border-edge', className)}>
      <div role="tablist" onKeyDown={onKeyDown} className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const selected = tab.value === value;
          const Glyph = tab.icon;
          return (
            <button
              key={tab.value}
              id={`${baseId}-tab-${tab.value}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange?.(tab.value)}
              className={cx(
                'type-nav flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 transition-colors',
                selected
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-fg-secondary hover:border-edge-strong hover:text-fg',
                tab.disabled && 'cursor-not-allowed text-fg-disabled hover:border-transparent hover:text-fg-disabled',
              )}
            >
              {Glyph && <Glyph size={16} />}
              <span>{tab.label}</span>
              {tab.count != null && <CountBadge value={tab.count} tone={selected ? 'brand' : 'neutral'} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The panel half of the tabs pattern, wired to the same id scheme. */
export function TabPanel({ id, value, children, className }) {
  if (id !== value) return null;
  return (
    <div role="tabpanel" tabIndex={0} className={cx('pt-6 outline-none', className)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SidebarNav — §11.2, §12                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The admin sidebar: §12's groups, in §12's order.
 *
 * brand-900 (#123B4A), which §3.1 assigns to "dark navigation". At 12:1 against
 * white text it is comfortably AA, and it does the §32 Rule 9 job of making the
 * admin panel unmistakably not the shop.
 *
 * The group headings are labels, not buttons. Seven collapsible sections is seven
 * decisions before you can navigate; the doc's grouping exists to help scanning,
 * not to hide things.
 *
 * The active item is marked three ways — a brand-500 left bar, a lighter
 * background, and aria-current="page" — because §4's rule about colour applies to
 * navigation state too.
 */
export function SidebarNav({ groups = [], activeKey, onNavigate, footer, className }) {
  return (
    <nav aria-label="Admin sections" className={cx('flex h-full flex-col bg-brand-900 text-white', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label ?? 'root'} className="mb-5 last:mb-0">
            {group.label && (
              <p className="type-label px-3 pb-2 text-white/45">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.key === activeKey;
                const Glyph = item.icon ?? Icon.neutral;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onNavigate?.(item.key)}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'type-nav relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                        active ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white',
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-500"
                        />
                      )}
                      <Glyph size={18} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.count != null && (
                        <span className="tabular rounded-full bg-white/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold">
                          {item.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer && <div className="border-t border-white/10 p-3">{footer}</div>}
    </nav>
  );
}

/** §12's admin groups as data, so the sidebar and any future command palette agree. */
export const ADMIN_NAV = [
  { items: [{ key: 'dashboard', label: 'Dashboard', icon: Icon.dashboard }] },
  {
    label: 'Catalog',
    items: [
      { key: 'products', label: 'Products', icon: Icon.products },
      { key: 'categories', label: 'Categories', icon: Icon.categories },
      { key: 'documents', label: 'Product Documents', icon: Icon.documents },
    ],
  },
  {
    label: 'Sales',
    items: [
      { key: 'orders', label: 'Orders', icon: Icon.orders, count: 12 },
      { key: 'quotes', label: 'Quotes', icon: Icon.quotes, count: 4 },
      { key: 'customers', label: 'Customers', icon: Icon.customers },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'inventory', label: 'Inventory', icon: Icon.inventory },
      { key: 'shipments', label: 'Shipments', icon: Icon.shipments },
    ],
  },
  {
    label: 'People',
    items: [
      { key: 'agents', label: 'Agents', icon: Icon.agents },
      { key: 'organizations', label: 'Organizations', icon: Icon.organizations },
      { key: 'users', label: 'Users', icon: Icon.users },
    ],
  },
  {
    label: 'Finance',
    items: [
      { key: 'invoices', label: 'Invoices', icon: Icon.invoices },
      { key: 'payments', label: 'Payments', icon: Icon.payments },
      { key: 'revenue', label: 'Revenue', icon: Icon.revenue },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { key: 'reports', label: 'Reports', icon: Icon.reports },
      { key: 'performance', label: 'Performance', icon: Icon.performance },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'notifications', label: 'Notifications', icon: Icon.notifications },
      { key: 'audit', label: 'Audit Logs', icon: Icon.audit },
      { key: 'settings', label: 'Settings', icon: Icon.settings },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Customer header — §11.1, §12                                               */
/* -------------------------------------------------------------------------- */

/**
 * §12's customer navigation, which is six items and should stay that way.
 * White, bordered, no shadow — §10's default. The primary action (Cart) is the
 * only coloured thing in it.
 */
export function CustomerHeader({ items = [], activeKey, cartCount = 0, onNavigate, className }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className={cx('sticky top-0 z-30 border-b border-edge bg-surface/95 backdrop-blur', className)}>
      <div className="mx-auto flex h-16 max-w-content items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* The wordmark. Inter at 600 with tightened tracking — §6 allows no
            second family, so the brand voice has to come from weight and spacing. */}
        <a href="#" className="flex shrink-0 items-center gap-2">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
            <Icon.infusion size={18} />
          </span>
          <span className="type-h4 tracking-tight text-brand-900">
            Aayursurgi<span className="text-brand-600">Tech</span>
          </span>
        </a>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate?.(item.key)}
              aria-current={item.key === activeKey ? 'page' : undefined}
              className={cx(
                'type-nav rounded-lg px-3 py-2 transition-colors',
                item.key === activeKey
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-fg-secondary hover:bg-surface-2 hover:text-fg',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search products"
            className="grid size-10 place-items-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Icon.search size={20} />
          </button>
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label={`Cart, ${cartCount} items`}
          >
            <Icon.cart size={20} />
            {cartCount > 0 && (
              <span className="tabular absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[0.625rem] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu"
            className="grid size-10 place-items-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-2 lg:hidden"
          >
            <Icon.menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Stepper — §28                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The §28 order lifecycle as a horizontal progress track, reading the same
 * ORDER_STATUS registry the badges and the audit trail read.
 *
 * Eight steps do not fit a phone, so below `sm` it collapses to "Step 5 of 8 —
 * Dispatched" plus a bar. Squeezing eight labels into 360px produces eight
 * unreadable labels, which is worse than one readable sentence.
 *
 * An exception state (cancelled, returned) is not a step. Passing one renders the
 * track as halted rather than pretending the order is still moving — an order
 * shown at 60% progress when it was cancelled is a lie the UI is telling.
 */
export function Stepper({ status, className }) {
  const entry = ORDER_STATUS[status];
  const isException = entry && entry.step === null;
  const currentStep = entry?.step ?? 0;

  if (isException) {
    return (
      <div className={cx('rounded-xl border border-edge bg-surface-2 px-4 py-3', className)}>
        <div className="flex items-center gap-2.5">
          <entry.icon size={18} className={entry.tone === 'error' ? 'text-error' : 'text-warning'} />
          <p className="type-body-sm font-semibold text-fg">{entry.label}</p>
        </div>
        <p className="type-caption mt-1 text-fg-secondary">
          This order left the normal delivery flow. See the history below for when and why.
        </p>
      </div>
    );
  }

  return (
    <div className={cx('min-w-0', className)}>
      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-2">
          <p className="type-body-sm font-semibold text-fg">{entry?.label ?? 'Unknown'}</p>
          <p className="type-caption tabular text-fg-secondary">
            Step {currentStep} of {ORDER_FLOW.length}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
            style={{ width: `${(currentStep / ORDER_FLOW.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop */}
      <ol className="hidden sm:flex sm:items-start">
        {ORDER_FLOW.map((key, i) => {
          const step = ORDER_STATUS[key];
          const done = step.step < currentStep;
          const current = step.step === currentStep;
          return (
            <li key={key} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
              <div className="flex w-full items-center">
                {/* Connectors are drawn as half-segments either side of each dot so
                    the track lines up with the centre of the dot at any width. */}
                <span className={cx('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done || current ? 'bg-brand-600' : 'bg-edge')} />
                <span
                  className={cx(
                    'grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    done && 'border-brand-600 bg-brand-600 text-white',
                    current && 'border-brand-600 bg-surface text-brand-700',
                    !done && !current && 'border-edge-strong bg-surface text-fg-muted',
                  )}
                >
                  {done ? <Icon.check size={14} strokeWidth={2.5} /> : <span className="type-caption tabular font-semibold">{step.step}</span>}
                </span>
                <span
                  className={cx(
                    'h-0.5 flex-1',
                    i === ORDER_FLOW.length - 1 ? 'bg-transparent' : done ? 'bg-brand-600' : 'bg-edge',
                  )}
                />
              </div>
              <span
                className={cx(
                  'type-caption px-1 leading-tight',
                  current ? 'font-semibold text-fg' : done ? 'text-fg-secondary' : 'text-fg-muted',
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline — §28 status history, Overview §25 audit                          */
/* -------------------------------------------------------------------------- */

/**
 * The audit trail. §28 requires status history to be auditable and Overview §25
 * wants who-did-what-when on every important transition, which means three facts
 * per entry — status, actor, timestamp — and this component refuses to render
 * without them being passed.
 *
 * Newest last, oldest first: a trail is read as a narrative, and reversing it
 * makes "Confirmed by Admin B" appear above "Created by Agent A".
 */
export function Timeline({ entries = [], className }) {
  return (
    <ol className={cx('relative space-y-0', className)}>
      {entries.map((entry, i) => {
        const meta = ORDER_STATUS[entry.status];
        const Glyph = meta?.icon ?? Icon.active;
        const last = i === entries.length - 1;
        return (
          <li key={`${entry.status}-${entry.at}`} className="flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cx(
                  'grid size-7 shrink-0 place-items-center rounded-full ring-4 ring-surface',
                  last ? 'bg-brand-600 text-white' : 'bg-surface-2 text-fg-secondary',
                )}
              >
                <Glyph size={14} />
              </span>
              {!last && <span aria-hidden="true" className="mt-1 w-0.5 flex-1 bg-edge" />}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="type-body-sm font-semibold text-fg">{meta?.label ?? entry.status}</p>
              <p className="type-caption mt-0.5 text-fg-secondary">
                {entry.by} · {entry.at}
              </p>
              {entry.note && <p className="type-body-sm mt-1 text-fg-secondary">{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

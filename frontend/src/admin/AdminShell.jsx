import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Container,
  Drawer,
  Dropdown,
  Icon,
  LoadingPanel,
  SidebarNav,
  ToastProvider,
  cx,
} from '../components/DesignSystem';
import { adminUrl } from './helpers';
import { useAdminAlerts, useAdminQueues } from './data';

// The admin chrome, on Design System v1.0 — the same system /products renders in.
//
// WHY THIS IS NOT ADMIN_NAV. The design system exports ADMIN_NAV: twenty-one items
// under seven headings, from §12 of the design doc. Nineteen of them have no route
// in this application. A sidebar whose items 404 is worse navigation than a short
// one, so the groups below are the six screens that exist, in the shape §12 asks
// for. Add to it when the route lands, not before.
//
// §32 Rule 9 — "do not make the admin panel look like the marketing website" — is
// why this is a brand-900 vertical sidebar and the shop is a white horizontal
// header. Same tokens, same type scale, deliberately different weight.

// `count` is a function of the store rather than a number, because a badge that
// does not move when you clear the queue behind it is worse than no badge.
const NAV = [
  { items: [{ key: '', label: 'Dashboard', icon: Icon.dashboard }] },
  {
    label: 'Catalogue',
    items: [
      { key: '/products', label: 'Products', icon: Icon.products },
      { key: '/categories', label: 'Categories', icon: Icon.categories },
      { key: '/reviews', label: 'Reviews', icon: Icon.star, count: (q) => q.pendingReviews },
    ],
  },
  {
    label: 'Sales',
    items: [{ key: '/orders', label: 'Orders', icon: Icon.orders, count: (q) => q.pendingOrders }],
  },
  { label: 'System', items: [{ key: '/settings', label: 'Settings', icon: Icon.settings }] },
];

/** The label of the section currently open — the topbar's only piece of text. */
const sectionOf = (activeKey) =>
  NAV.flatMap((g) => g.items).find((i) => i.key === activeKey)?.label ?? 'Ops desk';

/** The wordmark block above the nav. Sits on the sidebar's own brand-900 fill. */
function Brandmark() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
        <Icon.infusion size={18} />
      </span>
      <span className="min-w-0">
        <span className="type-body-sm block truncate font-semibold tracking-tight text-white">
          Aayursurgi<span className="text-brand-500">Tech</span>
        </span>
        <span className="type-label block text-white/45">Ops desk</span>
      </span>
    </div>
  );
}

// The glyph per alert tone. §4 — every row also states what it is in words, so the
// colour is never carrying the meaning by itself.
const ALERT_GLYPH = { error: Icon.danger, warning: Icon.warning, info: Icon.info, success: Icon.success };

/**
 * The alert menu.
 *
 * Every row is computed from what is on the desk right now and every row opens the
 * screen that clears it — see useAdminAlerts. The count on the bell is the number of
 * things needing a decision, so it goes down as they are dealt with.
 */
function Alerts({ alerts, onOpen }) {
  return (
    <Dropdown
      align="right"
      label="Alerts"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={
            alerts.length > 0 ? `Alerts, ${alerts.length} needing attention` : 'Alerts, nothing needs attention'
          }
          className="relative grid size-10 place-items-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Icon.notifications size={20} />
          {alerts.length > 0 && (
            <span className="tabular absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[0.625rem] font-semibold text-white">
              {alerts.length}
            </span>
          )}
        </button>
      )}
      items={
        alerts.length === 0
          ? // A menu that says nothing is wrong, rather than an empty box that
            // looks like it failed to load.
            [{ label: 'Nothing needs attention', icon: Icon.success, disabled: true }]
          : alerts.slice(0, 8).map((a) => ({
              label: a.title,
              icon: ALERT_GLYPH[a.tone] ?? Icon.info,
              onSelect: () => onOpen(a.to),
            }))
      }
    />
  );
}

export default function AdminShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const queues = useAdminQueues();
  const alerts = useAdminAlerts();

  // Any navigation closes the drawer, or tapping a section navigates behind an
  // overlay that is still covering the result.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // The token gate that used to stand here is gone with the ops-desk sign-in. The panel
  // renders for anyone who reaches the URL, which is what the API now allows too.

  // The longest nav key the path starts with, so /products/new keeps Products lit.
  // '' would match everything, so it only wins when nothing else does.
  const rest = pathname.replace(adminUrl(''), '');
  const activeKey =
    NAV.flatMap((g) => g.items)
      .map((i) => i.key)
      .filter((k) => k && rest.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] ?? '';

  const go = (key) => navigate(adminUrl(key));

  // "Log out" left with the sign-in — there is no session to end.
  const footer = (
    <a
      href="/products"
      className="type-nav flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-white/70 transition-colors hover:bg-white/8 hover:text-white"
    >
      <Icon.externalLink size={18} className="shrink-0" />
      View shop
    </a>
  );

  // The counts are resolved here rather than stored on NAV, so the constant stays a
  // constant and the numbers stay live.
  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.map(({ count, ...item }) => ({
      ...item,
      // Zero is not shown. A "0" badge beside Reviews says the same thing as no
      // badge and costs a glance to work that out.
      count: count?.(queues) || undefined,
    })),
  }));

  const nav = (
    <SidebarNav groups={groups} activeKey={activeKey} onNavigate={go} footer={footer} className="min-h-0 flex-1" />
  );

  return (
    // .ds-root scopes every v1.0 token and the heading, focus and dialog resets.
    // Nothing below renders correctly outside it.
    <div className="ds-root flex min-h-dvh bg-canvas">
      <ToastProvider>
        <a
          href="#main"
          className="sr-only-ds focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-fg focus:shadow-e2"
        >
          Skip to content
        </a>

        {/* Desktop: the sidebar is its own scroll region, so a 400-row table does
            not scroll the navigation off the top of the screen.
            print-hide, because a navy column printed down the left margin is a
            page of toner and nothing a packing bench can use. */}
        <aside className="print-hide hidden w-60 shrink-0 bg-brand-900 lg:block">
          <div className="sticky top-0 flex h-dvh flex-col">
            <Brandmark />
            {nav}
          </div>
        </aside>

        {/* min-w-0 is load-bearing: without it a wide table stretches this flex
            child and the whole page scrolls sideways instead of the table's own
            container. */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* One topbar at every width, rather than a mobile-only one.
              The panel had no desktop header at all, which left nowhere for the
              things a shop header carries — where you are, what is waiting, who you
              are signed in as. Below lg it also owns the menu button. */}
          <header className="print-hide sticky top-0 z-20 border-b border-edge bg-surface/95 backdrop-blur">
            <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:h-16 lg:px-8">
              <Button
                variant="tertiary"
                size="md"
                iconOnly
                iconLeft={Icon.menu}
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
                className="-ml-2 lg:hidden"
              />

              {/* The wordmark on mobile, where the sidebar carrying it is closed;
                  the section name on desktop, where the sidebar is already
                  showing the wordmark and printing it twice is one word doing one
                  job twice. */}
              <span className="type-body-sm font-semibold text-brand-900 lg:hidden">
                Aayursurgi<span className="text-brand-600">Tech</span>
              </span>
              <h2 className="type-h4 hidden min-w-0 truncate text-fg lg:block">{sectionOf(activeKey)}</h2>

              <div className="ml-auto flex items-center gap-1">
                {/* The one number worth carrying on every screen. It is a link, so
                    it is an answer and not just an alarm. */}
                {queues.pendingOrders > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(adminUrl('/orders?status=open'))}
                    className="hidden sm:inline-flex"
                    aria-label={`${queues.pendingOrders} orders waiting to be dispatched`}
                  >
                    <Badge tone="warning" icon={Icon.pending}>
                      {queues.pendingOrders} to dispatch
                    </Badge>
                  </button>
                )}

                <Alerts alerts={alerts} onOpen={(to) => navigate(adminUrl(to))} />

                {/* No "Log out": the ops desk has no sign-in, so a control that
                    ends a session that does not exist would be a lie. */}
                <Dropdown
                  align="right"
                  items={[
                    { label: 'Settings', icon: Icon.settings, onSelect: () => navigate(adminUrl('/settings')) },
                    { separator: true },
                    {
                      label: 'View the shop',
                      icon: Icon.externalLink,
                      onSelect: () => window.open('/products', '_blank', 'noopener'),
                    },
                  ]}
                  trigger={(props) => (
                    <button
                      {...props}
                      type="button"
                      className={cx(
                        'type-nav flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-fg-secondary transition-colors',
                        'hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      <Avatar name="Priya Sharma" size="md" />
                      <span className="hidden max-w-32 truncate sm:block">Priya Sharma</span>
                      <Icon.chevronDown size={14} className="hidden sm:block" />
                    </button>
                  )}
                />
              </div>
            </div>
          </header>

          <main id="main" className="print-full min-w-0 flex-1 py-6 lg:py-8">
            <Container width="app">
              <Suspense fallback={<LoadingPanel label="Loading…" />}>
                <Outlet />
              </Suspense>
            </Container>
          </main>
        </div>

        {/* Mobile: the same nav in a drawer. <dialog> brings Esc, focus trapping and an
            inert page for free.
            No Brandmark in here — the Drawer's own header already says "Ops desk", and
            printing it twice down one panel is the same word doing one job twice. The
            negative margin cancels the Drawer body's padding so the navy fills the panel
            edge to edge, the way it does in the desktop sidebar. */}
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Ops desk" side="left" size="sm">
          <div className="-m-5 flex h-[calc(100%+2.5rem)] flex-col bg-brand-900">{nav}</div>
        </Drawer>
      </ToastProvider>
    </div>
  );
}

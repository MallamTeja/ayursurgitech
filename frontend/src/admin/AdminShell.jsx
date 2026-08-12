import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Drawer,
  Icon,
  LoadingPanel,
  SidebarNav,
  ToastProvider,
} from '../components/DesignSystem';
import { adminUrl } from './helpers';

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

const NAV = [
  { items: [{ key: '', label: 'Dashboard', icon: Icon.dashboard }] },
  {
    label: 'Catalogue',
    items: [
      { key: '/products', label: 'Products', icon: Icon.products },
      { key: '/categories', label: 'Categories', icon: Icon.categories },
      { key: '/reviews', label: 'Reviews', icon: Icon.star },
    ],
  },
  { label: 'Sales', items: [{ key: '/orders', label: 'Orders', icon: Icon.orders }] },
  { label: 'System', items: [{ key: '/settings', label: 'Settings', icon: Icon.settings }] },
];

/** The wordmark block above the nav. Sits on the sidebar's own brand-900 fill. */
function Brandmark() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
        <Icon.infusion size={18} />
      </span>
      <span className="min-w-0">
        <span className="type-body-sm block truncate font-semibold tracking-tight text-white">
          Ayursurgi<span className="text-brand-500">Tech</span>
        </span>
        <span className="type-label block text-white/45">Ops desk</span>
      </span>
    </div>
  );
}

export default function AdminShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const nav = (
    <SidebarNav groups={NAV} activeKey={activeKey} onNavigate={go} footer={footer} className="min-h-0 flex-1" />
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
            not scroll the navigation off the top of the screen. */}
        <aside className="hidden w-60 shrink-0 bg-brand-900 lg:block">
          <div className="sticky top-0 flex h-dvh flex-col">
            <Brandmark />
            {nav}
          </div>
        </aside>

        {/* min-w-0 is load-bearing: without it a wide table stretches this flex
            child and the whole page scrolls sideways instead of the table's own
            container. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-edge bg-surface/95 backdrop-blur lg:hidden">
            <div className="flex h-14 items-center gap-2 px-4">
              <Button
                variant="tertiary"
                size="md"
                iconOnly
                iconLeft={Icon.menu}
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
                className="-ml-2"
              />
              <span className="type-body-sm font-semibold text-brand-900">
                Ayursurgi<span className="text-brand-600">Tech</span>
                <span className="type-label ml-2 text-fg-muted">Ops desk</span>
              </span>
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 py-6 lg:py-8">
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

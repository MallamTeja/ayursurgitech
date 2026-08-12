// The customer-portal chrome, on Design System v1.0.
//
// WHY THIS EXISTS ALONGSIDE components/Layout.jsx, AND WHY BOTH ARE MOUNTED.
//
// A page cannot be migrated to a new design system on its own. It renders inside
// shared chrome, and a teal §3.1 page body sitting under the shop's navy/copper
// header does not look migrated — it looks broken. The smallest unit of migration
// is chrome plus one page.
//
// The alternative — convert Header and Footer first, then bodies one at a time —
// puts new chrome above old bodies on every unmigrated page, so the whole site
// looks half-finished until the last page lands. This way each route is internally
// consistent: /products is entirely v1.0, everything else is entirely the old shop,
// and every page always looks finished.
//
// The cost, stated plainly: navigating from an unmigrated page to a migrated one
// changes the header's identity. That is visible, and it is the price of shipping
// incrementally. It shrinks with every page moved and disappears when
// components/Layout.jsx is deleted.
//
// App.jsx decides which shell a route uses. Migrating a page is: build it, move its
// <Route> from the Layout group to the ShopShell group, done.
//
// SHARED STATE IS NOT DUPLICATED. This shell reads the existing CartProvider and
// AuthProvider from main.jsx, so a cart filled on a migrated page is the same cart
// an unmigrated page reads. Forking the cart per shell would be the one migration
// mistake that loses real user data.

import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Divider,
  Drawer,
  Dropdown,
  Icon,
  LoadingPanel,
  ToastProvider,
  cx,
} from '../components/DesignSystem';
import { categories } from '../components/DesignSystem/dummy.js';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import Wordmark from './Wordmark.jsx';

// §12's customer navigation.
//
// NO "Categories" LINK HERE. The categories dropdown immediately to the left of
// this list is already that navigation, and a menu labelled Categories sitting
// beside a link labelled Categories is two controls with one name and two different
// behaviours — the reader has to click one to learn the difference. The dropdown
// wins because it shows the six categories and their counts without a page load.
const NAV = [
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/support', label: 'Support' },
];

function ShopHeader() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Any navigation closes the drawer. Without this, tapping a category inside it
  // navigates behind an overlay that is still covering the result.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, search]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    // Straight to the catalogue rather than to /search. The catalogue already
    // searches, and it does it with facets and a shareable URL beside the results;
    // a separate results page for the same job is a redundancy worth removing
    // rather than migrating. Empty query is a valid destination — it means
    // "show me everything".
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  const searchField = (id) => (
    <>
      <label htmlFor={id} className="sr-only-ds">
        Search products by name or product code
      </label>
      <div className="relative">
        <Icon.search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Search by name or product code"
          className="h-11 w-full rounded-lg border border-edge-strong bg-surface pl-10 pr-3 text-[0.9375rem] text-fg transition-colors placeholder:text-fg-muted hover:border-brand-500 focus:border-brand-600 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-surface/95 backdrop-blur">
      <Container width="app" className="flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
        >
          <Icon.menu size={22} />
        </button>

        <Wordmark />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {/* The categories menu is a dropdown rather than a hover mega-panel.
              A hover panel is unusable on touch and hostile to keyboards, and §12
              asks for simple customer navigation. */}
          <Dropdown
            align="left"
            trigger={(props) => (
              <button
                {...props}
                type="button"
                className="type-nav flex items-center gap-1 rounded-lg px-3 py-2 text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
              >
                Categories
                <Icon.chevronDown size={15} />
              </button>
            )}
            items={categories.map((c) => ({
              label: c.name,
              icon: Icon[c.icon] ?? Icon.products,
              hint: String(c.count),
              onSelect: () => navigate(`/products?cat=${c.slug}`),
            }))}
          />
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'type-nav rounded-lg px-3 py-2 transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-fg-secondary hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} role="search" className="ml-auto hidden max-w-sm flex-1 lg:block">
          {searchField('shop-search')}
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          {user ? (
            <Dropdown
              items={[
                { label: 'Your account', icon: Icon.users, onSelect: () => navigate('/account') },
                { label: 'Your orders', icon: Icon.orders, onSelect: () => navigate('/orders') },
                { separator: true },
                { label: 'Log out', icon: Icon.logout, onSelect: logout },
              ]}
              trigger={(props) => (
                <button
                  {...props}
                  type="button"
                  className="type-nav hidden items-center gap-2 rounded-lg px-2.5 py-2 text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg lg:flex"
                >
                  <Icon.users size={18} />
                  {/* Their whole name, truncated by CSS. Splitting on the first
                      space renders "Dr" for "Dr Anita Rao". */}
                  <span className="max-w-28 truncate">{user.name || 'Account'}</span>
                  <Icon.chevronDown size={14} />
                </button>
              )}
            />
          ) : (
            <Button as={Link} to="/login" variant="tertiary" size="sm" iconLeft={Icon.users} className="hidden lg:inline-flex">
              Log in
            </Button>
          )}

          <Link
            to="/cart"
            aria-label={count > 0 ? `Order, ${count} ${count === 1 ? 'product' : 'products'}` : 'Order, empty'}
            className="relative grid size-11 place-items-center rounded-lg text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Icon.cart size={22} />
            {count > 0 && (
              <span className="tabular absolute right-1 top-1.5 grid min-w-[1.125rem] place-items-center rounded-full bg-brand-600 px-1 text-[0.625rem] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </Container>

      {/* Search gets its own permanent row below lg. On a phone it is the primary
          way in for anyone who arrives knowing a product code, and burying it in a
          menu makes it the feature nobody finds. */}
      <Container width="app" className="pb-3 lg:hidden">
        <form onSubmit={onSearch} role="search">
          {searchField('shop-search-mobile')}
        </form>
      </Container>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left" size="sm">
        <nav aria-label="Mobile" className="space-y-6">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="type-body flex min-h-11 items-center rounded-lg px-3 font-medium text-fg transition-colors hover:bg-surface-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Divider />

          <div>
            <p className="type-label px-3 pb-2 text-fg-muted">Shop by category</p>
            <ul className="space-y-1">
              {categories.map((c) => {
                const Glyph = Icon[c.icon] ?? Icon.products;
                return (
                  <li key={c.slug}>
                    <Link
                      to={`/products?cat=${c.slug}`}
                      className="type-body-sm flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      <Glyph size={17} className="shrink-0 text-brand-700" />
                      <span className="flex-1">{c.name}</span>
                      <span className="tabular type-caption text-fg-muted">{c.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <Divider />

          <ul className="space-y-1">
            {user ? (
              <>
                <li>
                  <Link to="/orders" className="type-body flex min-h-11 items-center rounded-lg px-3 font-medium text-fg">
                    Your orders
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="type-body flex min-h-11 items-center rounded-lg px-3 font-medium text-fg">
                    Your account
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={logout}
                    className="type-body flex min-h-11 w-full items-center rounded-lg px-3 text-left text-fg-secondary"
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="type-body flex min-h-11 items-center rounded-lg px-3 font-medium text-brand-700">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="type-body flex min-h-11 items-center rounded-lg px-3 text-fg-secondary">
                    Create an account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </Drawer>
    </header>
  );
}

export default function ShopShell() {
  return (
    // .ds-root is what scopes every v1.0 token and the heading, focus and dialog
    // resets. Nothing below renders correctly outside it.
    <div className="ds-root flex min-h-dvh flex-col">
      <ToastProvider>
        <a
          href="#main"
          className="sr-only-ds focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-fg focus:shadow-e2"
        >
          Skip to content
        </a>

        {/* Route announcer. A <title> change alone is not spoken when the browser
            never actually navigates, so usePageTitle writes the page name here. */}
        <p id="route-announcer" role="status" aria-live="polite" className="sr-only-ds" />

        <ShopHeader />

        {/* No footer. It was removed from the catalogue by request, and /products
            is the only route in this shell today, so removing it there removed it
            everywhere. The markup is preserved in ShopFooter.jsx — pages like
            /about and /support render it themselves where it earns its place. */}
        <main id="main" className="flex-1">
          <Suspense fallback={<LoadingPanel label="Loading…" />}>
            <Outlet />
          </Suspense>
        </main>
      </ToastProvider>
    </div>
  );
}

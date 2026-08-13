import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';

// ---------------------------------------------------------------------------
// THE MIGRATION SPLIT — Design System v1.0
//
// A page cannot move to the new design system on its own: it renders inside shared
// chrome, and a teal v1.0 body under the navy/copper shop header looks broken, not
// migrated. So there are two shells mounted at once, and each route belongs to
// exactly one of them:
//
//   <Layout>     the shop as it shipped — navy/copper, docs/DESIGN-SYSTEM.md
//   <ShopShell>  Design System v1.0 — teal/navy, the B2B direction
//
// Every route is internally consistent, so every page always looks finished. The
// visible cost is that the header's identity changes when you cross between the two
// groups; that shrinks with each page moved and disappears when Layout is deleted.
//
// TO MIGRATE A PAGE: build it under src/shop/, then move its <Route> from the Layout
// group to the ShopShell group. That is the whole change.
//
// Both shells share the CartProvider and AuthProvider from main.jsx, so the cart and
// the session do not fork across the split.
// ---------------------------------------------------------------------------
// Lazy, both of them. Until the migration finishes, a visitor who lands on the old
// Home page should not download the v1.0 component library and lucide to get there —
// that is ~150 kB they never render. When the last page moves and Layout is deleted,
// these become the app's main chunk and the lazy boundary can go.
const ShopShell = lazy(() => import('./shop/ShopShell'));
const ProductsPage = lazy(() => import('./shop/ProductsPage'));
const ProductPage = lazy(() => import('./shop/ProductPage'));
const AboutPage = lazy(() => import('./shop/AboutPage'));
const SupportPage = lazy(() => import('./shop/SupportPage'));
const LoginPage = lazy(() => import('./shop/LoginPage'));
const CartPage = lazy(() => import('./shop/CartPage'));
const CheckoutPage = lazy(() => import('./shop/CheckoutPage'));

// Shop pages are eager.
import Register from './pages/Register';
import Search from './pages/Search';
import Account from './pages/Account';
import Category from './pages/Category';
import OrderDetail from './pages/OrderDetail';
import Orders from './pages/Orders';
import NotFound from './pages/NotFound';

// Admin pages are lazy, so they compile to a chunk a shopper never downloads.
// The <Suspense> they resolve inside is on the admin route below.
const AdminDashboard = lazy(() => import('./admin/Dashboard'));
const AdminCategories = lazy(() => import('./admin/Categories'));
const AdminProducts = lazy(() => import('./admin/Products'));
const AdminProductForm = lazy(() => import('./admin/ProductForm'));
const AdminOrders = lazy(() => import('./admin/Orders'));
const AdminOrderDetail = lazy(() => import('./admin/OrderDetail'));
const AdminReviews = lazy(() => import('./admin/Reviews'));
const AdminSettings = lazy(() => import('./admin/Settings'));
// The admin chrome — sidebar and nav. No logout and no token check any more. Lazy like the
// pages it wraps.
const AdminShell = lazy(() => import('./admin/AdminShell'));

// The Design System v1.0 reference site — docs/AayursurgiTech-Design-System-v1.0.md
// made live. Lazy, and it owns its own nested routes, so neither the component
// library nor lucide-react reaches a shopper's bundle.
const DesignSystem = lazy(() => import('./components/DesignSystem/showcase/DesignSystemApp'));

// Never hardcode the admin path — it is renamed by env in deployment.
const ADMIN = import.meta.env.VITE_ADMIN_PATH || 'ops-desk';

export default function App() {
  return (
    <Routes>
      {/* ---- Design System v1.0 ------------------------------------------------
          Migrated pages. Add to this group as each one is rebuilt; remove the
          matching line from the Layout group below at the same time — a path in
          both groups resolves to whichever <Route> React Router reaches first,
          which is a silent way to keep shipping the old page. */}
      <Route
        element={
          // ShopShell is itself lazy, so the boundary has to sit above it. The shell
          // renders its own <Suspense> for the page inside, which is what keeps a
          // route change from blanking the header and footer.
          <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading…</div>}>
            <ShopShell />
          </Suspense>
        }
      >
        {/* The catalogue is the landing page. `/` redirects rather than rendering
            ProductsPage a second time, so there is one canonical URL for it — two
            paths serving identical content means every share, bookmark and future
            analytics event splits across both. `replace` keeps the redirect out of
            the history stack, so Back from the catalogue leaves the site instead of
            bouncing through `/` again. */}
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products" element={<ProductsPage />} />
        {/* The catalogue's Quick View footer links here ("Full product page"), so this
            route was being reached from inside a v1.0 drawer while it still rendered
            the old Layout's page — a palette change mid-flow, and an error state on
            arrival, because pages/Product.jsx fetches the API and the catalogue's
            slugs come from the dummy.js fixture. Migrated for both reasons. */}
        <Route path="p/:slug" element={<ProductPage />} />
        {/* /about and /support were in the header nav before they existed, so
            both were 404s reached from every page. */}
        <Route path="about" element={<AboutPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="cart" element={<CartPage />} />
        {/* /cart → /checkout is one continuous flow, so they migrate together. The next
            hop, /order/:id, is still on the old Layout — placing an order lands on a
            navy/copper confirmation. That is the documented cost of migrating a page at
            a time, and it closes when pages/OrderDetail.jsx moves across. */}
        <Route path="checkout" element={<CheckoutPage />} />
      </Route>

      {/* ---- The shop as it shipped ------------------------------------------- */}
      {/* pages/Home.jsx and pages/Product.jsx are no longer routed. Both files are left
          in place rather than deleted — Home is the only existing reference for the home
          page's content, and Product.jsx is the only reference for an API-backed detail
          page, which is what shop/ProductPage.jsx becomes when the fixture is swapped
          for useFetch. */}
      <Route element={<Layout />}>
        <Route path="register" element={<Register />} />
        <Route path="search" element={<Search />} />
        <Route path="account" element={<Account />} />
        <Route path="c/:categorySlug" element={<Category />} />
        <Route path="c/:categorySlug/:subSlug" element={<Category />} />
        <Route path="order/:id" element={<OrderDetail />} />
        <Route path="orders" element={<Orders />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* The design system reference site, outside the shop Layout for the same reason
          admin is: it carries its own chrome and its own palette. The splat lets it
          own the nesting below /design-system. */}
      <Route
        path="design-system/*"
        element={
          <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading…</div>}>
            <DesignSystem />
          </Suspense>
        }
      />

      {/* Admin sits outside the shop Layout: a blue shop header above a stock table is not a
          product. This Suspense replaces the one Layout was providing for these lazy chunks. */}
      <Route
        path={ADMIN}
        element={
          <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading…</div>}>
            <Outlet />
          </Suspense>
        }
      >
        {/* No login route — the ops desk has no sign-in. An old bookmark to /login falls
            through to the shop's NotFound, which is the honest answer. */}
        <Route element={<AdminShell />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';
import Spinner from './Spinner';

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      {/* Route announcer. usePageTitle writes the new page's name here — a <title> change on
          its own is not spoken when the browser never navigates. */}
      <p id="route-announcer" role="status" className="sr-only" />

      <Header />

      <main id="main" className="flex-1">
        {/* One Suspense for the whole shell — admin routes are the lazy ones. */}
        <Suspense
          fallback={
            <div className="flex justify-center py-24 text-blue-700">
              <Spinner className="size-8" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

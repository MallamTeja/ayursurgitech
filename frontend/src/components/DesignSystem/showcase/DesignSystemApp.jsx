// The reference site shell.
//
// Its own chrome, deliberately neither portal. §32 Rule 9 says the admin panel
// must not look like the marketing site; documentation should look like neither, or
// people start reading the docs' own layout as a pattern to copy. So: a light
// bordered sidebar, no brand-900, no hero.
//
// Mounted by App.jsx at /design-system/* as one lazy chunk, so none of this — and
// none of lucide — reaches a shopper's bundle.
//
// LINKS HERE ARE ABSOLUTE, AND THAT IS NOT A STYLE CHOICE.
// This shell renders a descendant <Routes> under a splat route (design-system/*).
// Inside a splat match, React Router resolves a relative `to` against the *whole*
// matched pathname — splat segment included — not against the route's base. So
// `<NavLink to="overview">` sitting at /design-system/overview resolves to
// /design-system/overview/overview. Click it again and you get a third segment.
// Worse, the `*` catch-all below then redirects with a relative <Navigate>, which
// appends once more on every pass, so a single stray click walks the URL out to
// hundreds of repeated segments and never settles.
//
// The fix is to build every destination from the mount point. `base` is derived
// from the splat rather than hardcoded, so remounting this at another path — or
// behind an env-named route the way admin is — keeps working with no edits here.

import { NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { ToastProvider } from '../ui/Feedback.jsx';
import { cx } from '../utils.js';

import Overview from './pages/Overview.jsx';
import Colors from './pages/Colors.jsx';
import Typography from './pages/Typography.jsx';
import Foundations from './pages/Foundations.jsx';
import Icons from './pages/Icons.jsx';
import Buttons from './pages/Buttons.jsx';
import Forms from './pages/Forms.jsx';
import DataDisplay from './pages/DataDisplay.jsx';
import Tables from './pages/Tables.jsx';
import Cards from './pages/Cards.jsx';
import FeedbackPage from './pages/Feedback.jsx';
import Overlays from './pages/Overlays.jsx';
import NavigationPage from './pages/Navigation.jsx';
import Patterns from './pages/Patterns.jsx';

const NAV = [
  {
    label: 'Foundations',
    items: [
      { to: 'overview', label: 'Overview', icon: Icon.dashboard },
      { to: 'colors', label: 'Colour', icon: Icon.tag },
      { to: 'typography', label: 'Typography', icon: Icon.documents },
      { to: 'foundations', label: 'Space, radius, elevation', icon: Icon.spec },
      { to: 'icons', label: 'Iconography', icon: Icon.star },
    ],
  },
  {
    label: 'Components',
    items: [
      { to: 'buttons', label: 'Buttons', icon: Icon.add },
      { to: 'forms', label: 'Forms', icon: Icon.edit },
      { to: 'data-display', label: 'Status & data display', icon: Icon.active },
      { to: 'tables', label: 'Tables', icon: Icon.reports },
      { to: 'cards', label: 'Cards & products', icon: Icon.products },
      { to: 'feedback', label: 'Loading, empty, error', icon: Icon.info },
      { to: 'overlays', label: 'Dialogs & menus', icon: Icon.externalLink },
      { to: 'navigation', label: 'Navigation', icon: Icon.arrowRight },
    ],
  },
  {
    label: 'Patterns',
    items: [{ to: 'patterns', label: 'Portal patterns', icon: Icon.organizations }],
  },
];

/**
 * The pathname this shell is mounted at, with the splat removed.
 *
 * At /design-system/colors the outer route is `design-system/*`, so the splat is
 * "colors" and the base is "/design-system". Trimming the splat off the end of the
 * pathname is exact — it does not care how deep the mount point is or what it is
 * called — which is the property that makes every link below safe.
 */
function useBasePath() {
  const { pathname } = useLocation();
  const splat = useParams()['*'] ?? '';
  const base = splat ? pathname.slice(0, pathname.length - splat.length) : pathname;
  return base.replace(/\/+$/, '');
}

function SideNav({ base, onNavigate }) {
  return (
    <nav aria-label="Design system sections" className="space-y-6">
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="type-label px-3 pb-2 text-fg-muted">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={`${base}/${item.to}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      'type-body-sm flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors',
                      isActive
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-fg-secondary hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function DesignSystemApp() {
  const base = useBasePath();

  return (
    // .ds-root is what scopes every token and every override in theme.css. Nothing
    // in this system renders correctly outside it.
    <div className="ds-root min-h-screen">
      <ToastProvider>
        <header className="sticky top-0 z-30 border-b border-edge bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-app items-center gap-3 px-4 sm:px-6 lg:px-8">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
              <Icon.infusion size={18} />
            </span>
            <div className="min-w-0">
              <p className="type-body-sm font-semibold leading-tight text-brand-900">
                Ayursurgi<span className="text-brand-600">Tech</span> Design System
              </p>
              <p className="type-caption leading-tight text-fg-secondary">v1.0 · Clinical Precision</p>
            </div>
            <a
              href="#ds-content"
              className="type-caption ml-auto rounded-lg border border-edge-strong px-2.5 py-1.5 text-fg-secondary hover:border-brand-500 hover:text-brand-700"
            >
              Skip to content
            </a>
          </div>
        </header>

        <div className="mx-auto flex max-w-app gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* The sidebar becomes a horizontal scroller on mobile rather than a
              drawer — this is a documentation site, and one tap to a section beats
              two. */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24">
              <SideNav base={base} />
            </div>
          </aside>

          <div id="ds-content" className="min-w-0 flex-1 scroll-mt-20">
            <div className="mb-8 overflow-x-auto lg:hidden">
              <div className="flex min-w-max gap-4 pb-2">
                {NAV.flatMap((g) => g.items).map((item) => (
                  <NavLink
                    key={item.to}
                    to={`${base}/${item.to}`}
                    className={({ isActive }) =>
                      cx(
                        'type-body-sm whitespace-nowrap rounded-lg px-3 py-2',
                        isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'bg-surface-2 text-fg-secondary',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <Routes>
              {/* Both redirects are absolute for the reason in the file header: a
                  relative <Navigate> under a splat appends instead of replacing,
                  and the catch-all would then append on every subsequent pass. */}
              <Route index element={<Navigate to={`${base}/overview`} replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="colors" element={<Colors />} />
              <Route path="typography" element={<Typography />} />
              <Route path="foundations" element={<Foundations />} />
              <Route path="icons" element={<Icons />} />
              <Route path="buttons" element={<Buttons />} />
              <Route path="forms" element={<Forms />} />
              <Route path="data-display" element={<DataDisplay />} />
              <Route path="tables" element={<Tables />} />
              <Route path="cards" element={<Cards />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="overlays" element={<Overlays />} />
              <Route path="navigation" element={<NavigationPage />} />
              <Route path="patterns" element={<Patterns />} />
              <Route path="*" element={<Navigate to={`${base}/overview`} replace />} />
            </Routes>

            <footer className="mt-20 border-t border-edge pt-6">
              <p className="type-caption text-fg-secondary">
                Built from docs/AyursurgiTech-Design-System-v1.0.md. Where this system departs from that document, the
                departure is labelled on the page and the reason is in the source comments.
              </p>
            </footer>
          </div>
        </div>
      </ToastProvider>
    </div>
  );
}

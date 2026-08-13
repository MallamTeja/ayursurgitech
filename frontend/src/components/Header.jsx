import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import Container from './Container';
import ErrorState from './ErrorState';
import Spinner from './Spinner';
import { CartIcon, ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from './icons';

// blue-500 is invisible against blue-700, so the ring goes white on the dark bar.
const onDark = 'rounded-control focus-visible:outline-white';

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [catsOpen, setCatsOpen] = useState(false);
  const [cats, setCats] = useState(null);
  const [catsError, setCatsError] = useState(null);
  const asked = useRef(false);
  const dropdown = useRef(null);
  const drawer = useRef(null);

  function loadCats() {
    asked.current = true;
    setCatsError(null);
    setCats(null);
    get('/categories')
      .then((list) => setCats(Array.isArray(list) ? list : []))
      .catch((err) => setCatsError(err.message));
  }

  // Fetched the first time someone asks for the tree, not on every page load.
  const ensureCats = () => {
    if (!asked.current) loadCats();
  };

  const openDrawer = () => {
    ensureCats();
    drawer.current?.showModal();
  };

  // Navigating anywhere closes whatever is open.
  useEffect(() => {
    setCatsOpen(false);
    drawer.current?.close();
  }, [pathname]);

  // Click outside or Escape closes the category dropdown.
  useEffect(() => {
    if (!catsOpen) return;
    const onPointerDown = (e) => {
      if (!dropdown.current?.contains(e.target)) setCatsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setCatsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [catsOpen]);

  function onSearch(e) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get('q') || '').trim();
    if (!q) return;
    drawer.current?.close();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const tree = (
    <>
      {catsError && <ErrorState message={catsError} onRetry={loadCats} />}
      {!catsError && !cats && (
        <div className="flex justify-center py-6 text-blue-700">
          <Spinner className="size-6" />
        </div>
      )}
      {!catsError && cats?.length === 0 && (
        <p className="px-2 py-6 text-center text-sm text-ink-muted">No categories yet.</p>
      )}
      {!catsError && cats?.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {cats.map((c) => (
            <li key={c._id || c.slug}>
              {/* flex + min-h-11 makes the whole row the tap target. These 30 links are the
                  only navigation at 390px and were 17px tall, under WCAG 2.2's 24px floor. */}
              <Link
                to={`/c/${c.slug}`}
                className="flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:text-blue-500"
              >
                {c.name}
              </Link>
              {c.subcategories?.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {c.subcategories.map((s) => (
                    <li key={s._id || s.slug}>
                      <Link
                        to={`/c/${c.slug}/${s.slug}`}
                        className="flex min-h-11 items-center text-sm text-ink-muted hover:text-blue-500"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  // Rendered in three places — the bar at md+, the mobile row, and the drawer — so the id is
  // a parameter. The icon sits inside the field rather than beside it: a separate submit
  // button costs a tap target that Enter already provides.
  const searchField = (id) => (
    <>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Search products"
          className="h-11 w-full rounded-control border border-line bg-card pl-10 pr-3 text-base text-ink placeholder:text-ink-muted"
        />
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-blue-700 text-white">
      <Container className="flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={openDrawer}
          aria-label="Open menu"
          className={`-ml-1 flex size-11 items-center justify-center md:hidden ${onDark}`}
        >
          <MenuIcon className="size-6" />
        </button>

        <Link
          to="/"
          className={`font-display text-lg font-semibold tracking-display whitespace-nowrap md:text-2xl ${onDark}`}
        >
          AayursurgiTech
        </Link>

        <div ref={dropdown} className="relative hidden md:block">
          <button
            type="button"
            aria-expanded={catsOpen}
            onClick={() => {
              ensureCats();
              setCatsOpen((v) => !v);
            }}
            className={`flex min-h-11 items-center gap-1 px-2 text-base font-medium hover:text-blue-100 ${onDark}`}
          >
            Categories
            <ChevronDownIcon className="size-4" />
          </button>
          {catsOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[min(90vw,34rem)] rounded-card border border-line bg-card p-4 text-ink shadow-lift">
              {tree}
            </div>
          )}
        </div>

        <Link
          to="/products"
          className={`hidden min-h-11 items-center px-2 text-base font-medium hover:text-blue-100 md:inline-flex ${onDark}`}
        >
          All products
        </Link>

        <form onSubmit={onSearch} role="search" className="ml-auto hidden max-w-md flex-1 md:block">
          {searchField('search-bar')}
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {user ? (
            <>
              <Link
                to="/account"
                className={`hidden min-h-11 items-center gap-2 px-2 text-sm font-medium md:inline-flex ${onDark}`}
              >
                <UserIcon className="size-5" />
                {/* Their whole name, truncated by CSS. Splitting on the first space shows
                    "Dr" for "Dr Anita Rao" and mangles single-word names. */}
                <span className="max-w-32 truncate">{user.name || 'Account'}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className={`hidden min-h-11 items-center px-2 text-sm text-blue-100 hover:text-white md:inline-flex ${onDark}`}
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className={`hidden min-h-11 items-center gap-2 px-2 text-sm font-medium md:inline-flex ${onDark}`}
            >
              <UserIcon className="size-5" />
              Log in
            </Link>
          )}

          <Link
            to="/cart"
            aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? 'product' : 'products'}` : 'Cart, empty'}
            className={`relative flex size-11 items-center justify-center ${onDark}`}
          >
            <CartIcon className="size-6" />
            {count > 0 && (
              // paper on blue-700, not copper-600: copper-600 against the blue header is
              // 2.97:1 and barely separates from it, and the white digit inside fails too.
              <span className="absolute right-0 top-1 min-w-5 rounded-pill bg-paper px-1 text-center text-xs font-semibold tabular-nums text-blue-700">
                {count}
              </span>
            )}
          </Link>
        </div>
      </Container>

      {/* Search is the primary navigation for someone who arrives knowing the product name,
          and on a phone it was reachable only from inside the menu drawer. It gets its own
          permanent row instead — the header is two rows tall below md, and that is the right
          trade for a catalogue this size. */}
      <Container className="pb-3 md:hidden">
        <form onSubmit={onSearch} role="search">
          {searchField('search-mobile')}
        </form>
      </Container>

      {/* Mobile nav. <dialog> gives Escape, focus trapping and an inert page for free. */}
      <dialog
        ref={drawer}
        className="m-0 ml-auto h-dvh max-h-dvh w-80 max-w-[85vw] bg-paper p-0 text-ink"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <span className="font-display text-lg font-semibold text-blue-700">Menu</span>
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-control text-ink"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>

        {/* No search field in here any more — it is a permanent row in the bar above, and two
            of them meant the drawer one was the copy nobody could find. */}
        <div className="flex flex-col gap-6 overflow-y-auto p-4">
          <nav className="flex flex-col gap-2">
            <Link to="/products" className="min-h-11 text-base font-medium text-blue-700">
              All products
            </Link>
            {user ? (
              <>
                <Link to="/orders" className="min-h-11 text-base font-medium text-blue-700">
                  My orders
                </Link>
                <Link to="/account" className="min-h-11 text-base font-medium text-blue-700">
                  Your account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    drawer.current?.close();
                    logout();
                  }}
                  className="min-h-11 text-left text-base text-ink-muted"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="min-h-11 text-base font-medium text-blue-700">
                  Log in
                </Link>
                <Link to="/register" className="min-h-11 text-base text-ink-muted">
                  Create an account
                </Link>
              </>
            )}
          </nav>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-label text-ink-muted">
              Categories
            </p>
            {tree}
          </div>
        </div>
      </dialog>
    </header>
  );
}

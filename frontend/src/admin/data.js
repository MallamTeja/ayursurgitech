// The ops desk's data layer. No network. Read this before touching an admin screen.
//
// WHY THERE IS NO API HERE. The customer side runs entirely on
// components/DesignSystem/dummy.js — /products, /cart and /about all read the same
// fixture. The admin screens used to read a different source (a live REST API, with
// its own field names: `_id`, `stockQty`, `gstRate`, `grandTotal`). That is what made
// the two halves of the application disagree: the shop showed
// "AST-IV-1001 · ₹42.50 · 12,400 in stock" and the ops desk showed a different
// product list, in a different shape, with a different money format.
//
// So both halves now read dummy.js. One fixture, one set of field names, one
// spelling of every status. A product edited here is the product the catalogue
// renders, because there is only one of it.
//
// MUTATIONS ARE REAL, AND THEY ARE IN MEMORY. Saving a product mutates the store
// and every mounted screen re-renders — that is what makes the panel demonstrable
// rather than a set of dead mockups. A reload restores the fixture, which is the
// honest behaviour for a build with no backend: nothing is silently half-persisted.
//
// WHEN THE API ARRIVES: `useAdminData` is the seam. Give it the same
// { data, loading, error, retry } shape backed by fetch, and no screen above it
// changes. That is the same seam ProductsPage.jsx documents on the shop side.

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { formatINR } from '../components/DesignSystem';
import {
  categories as fixtureCategories,
  metrics as fixtureMetrics,
  orderHistory as fixtureOrderHistory,
  orders as fixtureOrders,
  organizations as fixtureOrganizations,
  products as fixtureProducts,
  revenueSeries as fixtureRevenueSeries,
  topProducts as fixtureTopProducts,
} from '../components/DesignSystem/dummy.js';

/* -------------------------------------------------------------------------- */
/* Fixtures the shop does not need, so they live here rather than in dummy.js */
/* -------------------------------------------------------------------------- */

// Reviews are an ops-desk concern only — nothing on the customer side reads them
// yet — so they are seeded here instead of being pushed into the shared fixture.
// Real-shaped for the same reason everything in dummy.js is: a 180-character
// review body and a one-word review are the two rows that break a table.
const seedReviews = [
  {
    id: 'r-1',
    productId: 'p-polyfusion-airvent',
    productName: 'Polyfusion I.V. Infusion Set with Airvent Spike',
    author: 'Dr Anita Rao',
    org: 'Apollo Hospitals, Kondapur',
    rating: 5,
    body: 'Consistent drop rate across the whole box and the roller clamp holds its setting overnight. We have moved our general wards onto these.',
    at: '2026-08-11T10:24:00',
    status: 'pending',
  },
  {
    id: 'r-2',
    productId: 'p-polyfusion-micro',
    productName: 'Polyfusion Micro Drip Set 60 drops/mL',
    author: 'Sister Kavitha M',
    org: 'Sunrise Multi-Speciality Clinic',
    rating: 4,
    body: 'Good chamber clarity for paediatric doses. The packaging tears unevenly, which is a nuisance at the bedside.',
    at: '2026-08-10T16:02:00',
    status: 'pending',
  },
  {
    id: 'r-3',
    productId: 'p-extension-high',
    productName: 'High Pressure Extension Line 200 cm, 1200 psi',
    author: 'Dr Sameer Kulkarni',
    org: 'CityCare Nursing Home',
    rating: 2,
    body: 'Two lines in the last batch kinked at the luer end under injector pressure. Raising this with the agent.',
    at: '2026-08-09T09:41:00',
    status: 'pending',
  },
  {
    id: 'r-4',
    productId: 'p-polyvol-burette',
    productName: 'Polyvol Burette Set 150 mL with Graduated Chamber',
    author: 'Ramesh Pillai',
    org: 'Medipoint',
    rating: 5,
    body: 'Graduations stay legible after handling.',
    at: '2026-08-06T13:15:00',
    status: 'approved',
  },
  {
    id: 'r-5',
    productId: 'p-polyfusion-airvent',
    productName: 'Polyfusion I.V. Infusion Set with Airvent Spike',
    author: 'Dr Anita Rao',
    org: 'Apollo Hospitals, Kondapur',
    rating: 4,
    body: 'Reordering. Lead time was four days against the six we were quoted, which suits us.',
    at: '2026-07-28T11:50:00',
    status: 'approved',
  },
];

// Shop-wide values the checkout reads. Money is paise, like everything else.
const seedSettings = {
  deliveryFee: 40000,
  freeDeliveryAbove: 5000000,
  gstin: '36AABCA9021K1ZT',
  supportEmail: 'orders@aayursurgitech.com',
  supportPhone: '+91 90000 12345',
  lowStockAlerts: true,
  autoApproveReviews: false,
};

/* -------------------------------------------------------------------------- */
/* The store                                                                  */
/* -------------------------------------------------------------------------- */

// A structural clone per boot, so a mutation never writes through to the fixture
// module — the catalogue and the ops desk share the *shape*, not the array
// identity, and an accidental push here would otherwise corrupt /products too.
const clone = (value) => JSON.parse(JSON.stringify(value));

/* -------------------------------------------------------------------------- */
/* Order lines, derived                                                       */
/* -------------------------------------------------------------------------- */

// A tiny deterministic hash, so the same order gets the same basket on every
// render and every reload. Math.random() here would reshuffle an order's contents
// each time you opened it, which reads as data corruption rather than dummy data.
const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

/**
 * The basket behind an order.
 *
 * WHY THIS IS COMPUTED. The fixture carries `lines: 6` and a single shared
 * four-row `orderLines` array, so the list said "6 items" and the detail screen
 * showed four — and its own subtotal agreed with neither. Deriving the lines from
 * the real product catalogue, then computing the money from the lines, is what
 * makes the figure in the Orders table the same figure as the total on the order,
 * the same figure as the sum of the rows above it. Three screens, one arithmetic.
 */
function linesFor(order, products) {
  if (!products.length) return [];
  const seed = hash(order.id);
  const count = Math.max(1, Math.min(order.lines ?? 1, products.length));
  const lines = [];
  for (let i = 0; i < count; i += 1) {
    // A stride co-prime with most catalogue lengths, so a 14-line order does not
    // land on the same product twice before it has used them all.
    const product = products[(seed + i * 7) % products.length];
    // Whole multiples of the MOQ — a B2B order line for 137 pieces of something
    // sold in boxes of 100 is not a thing that can exist.
    const multiple = 1 + ((seed >> (i % 12)) % 6);
    lines.push({
      productId: product.id,
      code: product.code,
      name: product.name,
      hsn: product.hsn,
      uom: product.uom,
      qty: product.moq * multiple,
      rate: product.price,
      gst: product.gst,
    });
  }
  return lines;
}

/** Line totals and the order total, from the lines. GST per line, then summed. */
export function totalsOf(lines, deliveryFee = 0) {
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.rate, 0);
  // Rounded per line, not on the sum: that is how an invoice is computed, and the
  // two differ by a paisa often enough to look like a bug on a 22-line order.
  const gst = lines.reduce((sum, l) => sum + Math.round((l.qty * l.rate * l.gst) / 100), 0);
  return { subtotal, gst, delivery: deliveryFee, total: subtotal + gst + deliveryFee };
}

/** Money on the line, for a row in the items table. */
export const lineTotalsOf = (line) => {
  const amount = line.qty * line.rate;
  return { amount, gst: Math.round((amount * line.gst) / 100), total: amount + Math.round((amount * line.gst) / 100) };
};

/**
 * The §28 audit trail for an order.
 *
 * The fixture's `orderHistory` documents one order (AST-26-0405). Every other
 * order would render an empty timeline, so the rest is synthesised from the
 * forward states it has actually passed through — an order at "packed" has four
 * entries, spaced across the day it was placed. An exception state is appended
 * last, because that is when it happened.
 */
export function orderHistoryOf(order, appended = []) {
  const own = appended.filter((h) => h.orderId === order.id);
  if (order.id === 'AST-26-0405') return [...clone(fixtureOrderHistory), ...own];

  const placedAt = new Date(order.placed);
  const entry = ORDER_STEPS[order.status];
  const reached = entry?.step ?? ORDER_STEPS.placed.step;

  const trail = FORWARD_STATES.filter((s) => ORDER_STEPS[s].step <= reached).map((status, i) => ({
    status,
    // Six hours per transition. Enough that the timestamps read as a sequence
    // rather than as five events in the same minute.
    at: new Date(placedAt.getTime() + i * 6 * 3600 * 1000).toISOString(),
    by: i === 0 ? 'Sales agent' : i < 3 ? 'Priya Sharma (Admin)' : 'Warehouse — Hyderabad',
    note: i === 0 ? `Placed against ${order.po && order.po !== '—' ? order.po : 'no PO'}` : undefined,
  }));

  if (!entry?.step) {
    trail.push({
      status: order.status,
      at: new Date(placedAt.getTime() + 4 * 24 * 3600 * 1000).toISOString(),
      by: 'Priya Sharma (Admin)',
      note: 'Left the normal delivery flow.',
    });
  }
  return [...trail, ...own];
}

// The forward lifecycle, mirrored from the design system's registry so this file
// does not become a second, drifting copy of it.
const ORDER_STEPS = {
  placed: { step: 1 },
  confirmed: { step: 2 },
  processing: { step: 3 },
  packed: { step: 4 },
  dispatched: { step: 5 },
  inTransit: { step: 6 },
  outForDelivery: { step: 7 },
  delivered: { step: 8 },
};
const FORWARD_STATES = Object.keys(ORDER_STEPS);

const initial = () => {
  const products = clone(fixtureProducts);
  const settings = { ...seedSettings };
  const orders = clone(fixtureOrders).map((order) => {
    const lines = linesFor(order, products);
    // Delivery is waived above the free-delivery threshold, exactly as the
    // checkout does it — so an ops-desk total is the total the buyer was charged.
    const provisional = totalsOf(lines, 0);
    const delivery = provisional.subtotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryFee;
    return { ...order, items: lines, lines: lines.length, ...totalsOf(lines, delivery) };
  });

  return {
    products,
    categories: clone(fixtureCategories),
    orders,
    // Appended transitions only. The seeded trail and the synthesised one both
    // come out of orderHistoryOf, so this array holds just what the panel did.
    orderHistory: [],
    organizations: clone(fixtureOrganizations),
    reviews: clone(seedReviews),
    metrics: clone(fixtureMetrics),
    revenueSeries: clone(fixtureRevenueSeries),
    topProducts: clone(fixtureTopProducts),
    settings,
  };
};

let state = initial();
const listeners = new Set();

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// A new top-level object every time, so useSyncExternalStore's identity check
// fires. Mutating in place and notifying would leave React with the same snapshot
// and no re-render.
function commit(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

const getSnapshot = () => state;

/** Read one collection. Re-renders the caller when that collection changes. */
export function useAdminStore(select) {
  // A stable selector per caller — an inline arrow would be a new function each
  // render, which is fine for getSnapshot but not for the memo below.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return select ? select(snapshot) : snapshot;
}

/**
 * The seam a real API slots into.
 *
 * `?state=loading` and `?state=error` in the URL force those two branches, which
 * is how they stay reachable — and reviewable — in a build with nothing to break.
 * Same trick, same parameter name, as the shop's catalogue.
 */
export function useAdminData(select, { forced } = {}) {
  const data = useAdminStore(select);
  const failed = forced === 'error';
  const loading = forced === 'loading';
  return {
    data,
    loading,
    error: failed ? 'Forced by ?state=error in the URL.' : null,
    loaded: !loading && !failed,
  };
}

/** Reset to the fixture — the "discard my changes" affordance on Settings. */
export function resetAdminStore() {
  state = initial();
  listeners.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every write returns a promise and resolves on a timer.
 *
 * NOT to fake a spinner for its own sake. A save that resolves synchronously
 * makes the loading state of every submit button unreachable, and a disabled
 * button that flickers for zero milliseconds is a state nobody can review or
 * screenshot. 320ms is long enough to see and short enough not to be in the way.
 */
const settle = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 320));

/** A url-safe id from a name, uniqued against what is already stored. */
function uniqueId(prefix, name, taken) {
  const base = `${prefix}-${String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`.slice(0, 48);
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export const productsApi = {
  save(product) {
    const exists = state.products.some((p) => p.id === product.id);
    const next = exists
      ? state.products.map((p) => (p.id === product.id ? { ...p, ...product } : p))
      : [{ ...product, id: uniqueId('p', product.name || 'product', state.products.map((p) => p.id)) }, ...state.products];
    commit({ products: next });
    return settle(exists ? product : next[0]);
  },
  remove(id) {
    commit({
      products: state.products.filter((p) => p.id !== id),
      // A deleted product's reviews go with it, or the reviews table grows rows
      // that link to a product page that 404s.
      reviews: state.reviews.filter((r) => r.productId !== id),
    });
    return settle(true);
  },
};

export const categoriesApi = {
  save(category) {
    const exists = state.categories.some((c) => c.slug === category.slug);
    const next = exists
      ? state.categories.map((c) => (c.slug === category.slug ? { ...c, ...category } : c))
      : [...state.categories, category];
    commit({ categories: next });
    return settle(category);
  },
  remove(slug) {
    // Refused rather than cascaded: deleting a category that still has products
    // would orphan them out of the catalogue silently. The count is the message.
    const count = state.products.filter((p) => p.categorySlug === slug).length;
    if (count > 0) {
      return Promise.reject(
        new Error(`${count} product${count === 1 ? '' : 's'} still in this category. Move them first.`),
      );
    }
    commit({ categories: state.categories.filter((c) => c.slug !== slug) });
    return settle(true);
  },
};

export const ordersApi = {
  setStatus(id, status, by = 'Priya Sharma (Admin)') {
    commit({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      // The audit trail is append-only. §28 wants every transition attributable,
      // so a status change that left no history entry would be a gap in it.
      orderHistory: [
        ...state.orderHistory,
        { status, at: new Date().toISOString(), by, note: `Set from the ops desk order screen.`, orderId: id },
      ],
    });
    return settle(status);
  },
};

export const reviewsApi = {
  setStatus(id, status) {
    commit({ reviews: state.reviews.map((r) => (r.id === id ? { ...r, status } : r)) });
    return settle(status);
  },
  remove(id) {
    commit({ reviews: state.reviews.filter((r) => r.id !== id) });
    return settle(true);
  },
};

export const settingsApi = {
  save(patch) {
    commit({ settings: { ...state.settings, ...patch } });
    return settle(state.settings);
  },
};

/* -------------------------------------------------------------------------- */
/* Derived reads                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Products in a category, counted from the products themselves — never a stored
 * total.
 *
 * ACTIVE ONLY, and that is not a detail. dummy.js derives the category counts the
 * shop's header dropdown prints using exactly this rule, because a count beside a
 * filter is a promise about what clicking it returns, and the shop never lists a
 * product that is not active. Counting everything here made the ops desk say
 * "Vial Access 4" against the shop's 3 — one discontinued transfer spike, two
 * screens, no way to tell which was lying.
 *
 * `all` gives the ops-desk figure for the same category, which is what the second
 * line of the Categories cell reports.
 */
export const productCountOf = (products, slug, { all = false } = {}) =>
  products.filter((p) => p.categorySlug === slug && (all || p.status === 'active')).length;

/**
 * The notification list behind the topbar bell.
 *
 * DERIVED FROM THE STORE, not read from dummy.js's `notifications` array. That
 * fixture is four fixed events — a low-stock warning for a product whose stock this
 * panel can change, a quote for a screen that does not exist — so every row was
 * either stale the moment someone edited something or a menu item that navigated
 * nowhere. A notification whose only behaviour is to close the menu again is not a
 * notification.
 *
 * Everything here is computed from what is actually on the desk right now, and every
 * entry has a destination that exists.
 */
export function useAdminAlerts() {
  return useAdminStore((s) => {
    const alerts = [];

    for (const p of s.products.filter((p) => p.stock <= 0)) {
      alerts.push({
        id: `out-${p.id}`,
        tone: 'error',
        title: `Out of stock — ${p.name}`,
        body: 'Nothing can be ordered against it until it is restocked.',
        to: '/products?stock=out',
      });
    }

    for (const p of s.products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt)) {
      alerts.push({
        id: `low-${p.id}`,
        tone: 'warning',
        title: `Low stock — ${p.name}`,
        body: `${p.stock.toLocaleString('en-IN')} left, at or below the ${p.lowStockAt.toLocaleString('en-IN')} threshold.`,
        to: '/products?stock=low',
      });
    }

    const pendingReviews = s.reviews.filter((r) => r.status === 'pending').length;
    if (pendingReviews > 0) {
      alerts.push({
        id: 'reviews',
        tone: 'info',
        title: `${pendingReviews} review${pendingReviews === 1 ? '' : 's'} waiting`,
        body: 'Nothing is visible on a product page until it is approved.',
        to: '/reviews?status=pending',
      });
    }

    for (const o of s.orders.filter((o) => o.payment === 'pending' && o.status !== 'cancelled')) {
      alerts.push({
        id: `unpaid-${o.id}`,
        tone: 'warning',
        title: `Unpaid — ${o.id}`,
        body: `${o.org} · ${formatINR(o.total, { whole: true })}`,
        to: `/orders/${o.id}`,
      });
    }

    return alerts;
  });
}

/**
 * The queues the dashboard leads with. Computed, not stored: a hardcoded
 * "3 pending" that does not move when you clear the queue is the one dashboard
 * bug nobody forgives.
 */
export function useAdminQueues() {
  return useAdminStore((s) => ({
    // Anything not yet dispatched is work. `step` comes from the DS registry, so
    // adding a lifecycle state does not need this line edited.
    pendingOrders: s.orders.filter((o) => ['placed', 'confirmed', 'processing', 'packed'].includes(o.status)).length,
    outOfStock: s.products.filter((p) => p.stock <= 0).length,
    lowStock: s.products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt).length,
    pendingReviews: s.reviews.filter((r) => r.status === 'pending').length,
    unpaidOrders: s.orders.filter((o) => o.payment === 'pending' || o.payment === 'partial').length,
  }));
}

/* -------------------------------------------------------------------------- */
/* Small hooks the screens share                                              */
/* -------------------------------------------------------------------------- */

/**
 * A value that lags its input by `delay` — the search box, so a 27-row filter does
 * not re-run on every keystroke and the field never feels like it is fighting you.
 */
export function useDebounced(value, delay = 200) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return settled;
}

/**
 * Sort + paginate one list.
 *
 * The clamp is the edge case that matters: filter a 40-row table down to 3 while
 * standing on page 2 and you get an empty table with no explanation. Page always
 * lands back inside the range the data actually has.
 */
export function useTableView(rows, { sortKey, pageSize = 12, initialSort } = {}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const pick = sortKey?.[sort.key] ?? ((row) => row[sort.key]);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = pick(a);
      const y = pick(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1; // blanks last, whichever way the column is sorted
      if (y == null) return -1;
      return (
        dir *
        (typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y), 'en-IN', { numeric: true, sensitivity: 'base' }))
      );
    });
  }, [rows, sort, sortKey]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset to page 1 whenever the row set itself changes — a new filter is a new
  // list, and staying on page 3 of it is never what was meant.
  useEffect(() => {
    setPage(1);
  }, [rows]);

  const onSortChange = useCallback((next) => {
    setSort(next);
    setPage(1);
  }, []);

  return {
    rows: pageRows,
    total: sorted.length,
    page: safePage,
    pages,
    pageSize,
    setPage,
    sort,
    onSortChange,
  };
}

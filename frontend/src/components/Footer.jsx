import { Link } from 'react-router-dom';
import Container from './Container';
import { COMPANY, hasContactDetails } from '../lib/company';

// "All products" used to point at /search, which with no query renders a prompt to use a
// search field that is not on screen on a phone. It has a real destination now.
const shop = [
  ['All products', '/products'],
  ['Your cart', '/cart'],
  ['Your orders', '/orders'],
  ['Your account', '/account'],
];

function Column({ title, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-label text-blue-100">{title}</p>
      {children}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 bg-blue-900 text-blue-100">
      <Container className="grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-white">AyurSurgiTech</p>
          {/* Flat tokens, no opacity modifiers: /80 and /70 composite a colour that is not in
              DESIGN-SYSTEM, which forbids invented colours. Contrast was already fine. */}
          <p className="mt-2 max-w-xs text-sm text-blue-100">
            Surgical instruments, wound care and pharma supplies for clinics and hospitals.
          </p>
        </div>

        <Column title="Shop">
          <ul className="mt-4 flex flex-col gap-2">
            {shop.map(([label, to]) => (
              <li key={to}>
                {/* flex + min-h-11: a 17px-tall link is under the 44px tap target rule. */}
                <Link to={to} className="flex min-h-11 items-center text-sm hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Ordering">
          {/* Verbatim, per UX-CONVENTIONS rule 1.1 — this exact sentence in exactly two places
              (here and the checkout summary) is what carries the LMPC Rule 3 trade framing. */}
          <p className="mt-4 text-sm text-blue-100">
            All prices are trade prices, exclusive of GST. GST is added at checkout.
          </p>
          <p className="mt-3 text-sm text-blue-100">
            Dispatched in 24–48 hours. Minimum order quantities are shown on every product.
          </p>
          <p className="mt-3 text-sm text-blue-100">
            A GST invoice with HSN codes is issued for every order.
          </p>
        </Column>

        {/* Rendered only once real details exist in lib/company.js. A contact column that says
            nothing is worse than no contact column — it reads as a supplier with nothing to
            put in it. */}
        {hasContactDetails && (
          <Column title="Contact">
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {COMPANY.phone && (
                <li>
                  <a
                    href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`}
                    className="flex min-h-11 items-center tabular-nums hover:text-white"
                  >
                    {COMPANY.phone}
                  </a>
                </li>
              )}
              {COMPANY.email && (
                <li>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="flex min-h-11 items-center break-all hover:text-white"
                  >
                    {COMPANY.email}
                  </a>
                </li>
              )}
              {COMPANY.place && <li className="py-2">{COMPANY.place}</li>}
              {COMPANY.gstin && (
                <li className="py-2">
                  <span className="text-blue-100">GSTIN </span>
                  <span className="font-mono text-white">{COMPANY.gstin}</span>
                </li>
              )}
            </ul>
          </Column>
        )}
      </Container>

      <Container className="flex flex-wrap gap-x-6 gap-y-2 border-t border-blue-700 py-6">
        <p className="text-xs text-blue-100">
          Demo storefront. No real orders are fulfilled and no payment is taken.
        </p>
        <p className="text-xs text-blue-100">For professional and institutional use.</p>
      </Container>
    </footer>
  );
}

// The customer-portal footer.
//
// NOT CURRENTLY MOUNTED. ShopShell used to render this below every migrated page;
// it was removed from the catalogue by request, and since /products is the only
// route in the shell today, removing it there meant removing it everywhere.
//
// It lives on as its own module rather than being deleted because the content is
// real — the trust signals, the contact block and the ordering links are the
// answers a procurement officer looks for, and pages like /about, /support and the
// eventual landing page will want them back. Restoring it is one import and one
// line in ShopShell.jsx.

import { Link } from 'react-router-dom';
import { Container, Divider, Icon } from '../components/DesignSystem';
import { categories } from '../components/DesignSystem/dummy.js';
import Wordmark from './Wordmark.jsx';

export default function ShopFooter() {
  return (
    <footer className="mt-20 border-t border-edge bg-surface-2">
      <Container width="app" className="py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Wordmark />
            <p className="type-body-sm mt-4 max-w-xs text-fg-secondary">
              Medical and surgical consumables for hospitals, clinics, distributors and pharmacies across India.
            </p>
            {/* Trust signals belong in the footer of a medical supplier, where a
                procurement officer looks for them. Badges in the header would be
                decoration; here they are an answer. */}
            <ul className="mt-5 space-y-2">
              {[
                [Icon.certified, 'CE marked product range'],
                [Icon.verified, 'ISO 13485 quality system'],
                [Icon.shipments, 'Dispatch in 24–48 hours'],
              ].map(([Glyph, label]) => (
                <li key={label} className="type-caption flex items-center gap-2 text-fg-secondary">
                  <Glyph size={15} className="shrink-0 text-brand-600" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="type-label pb-3 text-fg">Catalogue</p>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/products?cat=${c.slug}`}
                    className="type-body-sm text-fg-secondary underline-offset-2 transition-colors hover:text-brand-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="type-label pb-3 text-fg">Ordering</p>
            <ul className="space-y-2">
              {[
                ['All products', '/products'],
                ['Request a quote', '/support'],
                ['Your orders', '/orders'],
                ['Minimum order quantities', '/support'],
                ['Delivery and dispatch', '/support'],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="type-body-sm text-fg-secondary underline-offset-2 transition-colors hover:text-brand-700 hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="type-label pb-3 text-fg">Contact</p>
            <ul className="space-y-3">
              <li className="type-body-sm flex items-start gap-2 text-fg-secondary">
                <Icon.phone size={15} className="mt-0.5 shrink-0 text-fg-muted" />
                <a href="tel:+914035000000" className="underline-offset-2 hover:text-brand-700 hover:underline">
                  +91 40 3500 0000
                </a>
              </li>
              <li className="type-body-sm flex items-start gap-2 text-fg-secondary">
                <Icon.mail size={15} className="mt-0.5 shrink-0 text-fg-muted" />
                <a href="mailto:orders@aayursurgitech.com" className="break-all underline-offset-2 hover:text-brand-700 hover:underline">
                  orders@aayursurgitech.com
                </a>
              </li>
              <li className="type-body-sm flex items-start gap-2 text-fg-secondary">
                <Icon.location size={15} className="mt-0.5 shrink-0 text-fg-muted" />
                <span>Hyderabad, Telangana</span>
              </li>
            </ul>
          </div>
        </div>

        <Divider className="my-8" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-caption text-fg-secondary">
            © {new Date().getFullYear()} AayursurgiTech. All prices exclusive of GST unless stated.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {['Terms of sale', 'Privacy', 'Returns'].map((label) => (
              <li key={label}>
                <Link to="/support" className="type-caption text-fg-secondary underline-offset-2 hover:text-brand-700 hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

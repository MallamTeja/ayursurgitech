/**
 * The business's own details, for the footer.
 *
 * FILL THESE IN. They are deliberately blank rather than plausible-looking samples: a GSTIN or
 * a phone number that looks real but is not is worse than an absent one, and a buyer checking
 * whether you are a registered supplier before their first order is exactly who reads them.
 * Every field is optional and anything left empty is simply not rendered.
 *
 * Set them here, or per-deployment through the matching VITE_ variables — see .env.example.
 */
export const COMPANY = {
  phone: import.meta.env.VITE_COMPANY_PHONE || '',
  email: import.meta.env.VITE_COMPANY_EMAIL || '',
  gstin: import.meta.env.VITE_COMPANY_GSTIN || '',
  /** One line, e.g. "Hyderabad, Telangana". Not a full postal address. */
  place: import.meta.env.VITE_COMPANY_PLACE || '',
};

export const hasContactDetails = Object.values(COMPANY).some(Boolean);

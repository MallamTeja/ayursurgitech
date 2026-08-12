// One date format for the whole app. It was written four times — three times as
// `day: 'numeric'` in the shop and once as `day: '2-digit'` in admin/Orders.jsx — so the
// same order read "8 Aug 2026" to the customer and "08 Aug 2026" in the ops desk, which is
// exactly the kind of disagreement that makes someone doubt they are looking at one order.
export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

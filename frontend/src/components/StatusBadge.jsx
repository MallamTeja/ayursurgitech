import Badge from './Badge';

// The one place order status becomes a colour and a label. Four screens across three agents
// render these, so the mapping lives here and nowhere else.
//
// Neither paymentPending nor cancelled is red. Payment is stubbed, so paymentPending is the
// normal state of a freshly placed order, and a cancelled order is a fact, not an error.
// DESIGN-SYSTEM "Status badge": placed, shipped and delivered are ONE colour — blue-100
// fill, blue-700 text. They are stages of the same healthy order, not three severities.
// Giving shipped the copper fill in particular put the accent — the "one most important
// action on this screen" colour — onto a passive label, three times over on a busy /orders.
const statuses = {
  paymentPending: { tone: 'muted', label: 'Payment pending' },
  placed: { tone: 'blue', label: 'Placed' },
  shipped: { tone: 'blue', label: 'Shipped' },
  delivered: { tone: 'blue', label: 'Delivered' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
};

// The label map and the status order live with the colour map, for the same reason the
// colour map lives here: admin/Orders.jsx had grown its own copy, so a label edit landed on
// one of the two and the ops desk and the customer's order page disagreed.
export const STATUS_LABELS = Object.fromEntries(
  Object.entries(statuses).map(([status, { label }]) => [status, label]),
);
export const STATUSES = Object.keys(statuses);

export default function StatusBadge({ status, className = '' }) {
  const { tone, label } = statuses[status] || { tone: 'muted', label: status || 'Unknown' };
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

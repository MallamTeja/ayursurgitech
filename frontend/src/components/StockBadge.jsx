import Badge from './Badge';

// Takes stockQty and nothing else. There is no inStock boolean anywhere in this app:
// stockQty > 0 is the only truth, and out of stock is a fact, not an error — never red.
export default function StockBadge({ stockQty, className = '' }) {
  const inStock = Number(stockQty) > 0;
  return (
    <Badge tone={inStock ? 'blue' : 'muted'} className={className}>
      {inStock ? 'In stock' : 'Out of stock'}
    </Badge>
  );
}

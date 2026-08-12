// Border, not shadow, at rest. Radius 10.
export default function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-card border border-line bg-card ${className}`} {...rest}>
      {children}
    </div>
  );
}

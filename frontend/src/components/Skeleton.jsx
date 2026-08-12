// blue-100 blocks in the shape of the real layout. Never a spinner on a blank page.
export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-control bg-blue-100 ${className}`} />;
}

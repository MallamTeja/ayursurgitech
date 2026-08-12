// 1200px max, 16px gutter on mobile and 24px from md. Every page sits inside one.
export default function Container({ className = '', children }) {
  return <div className={`mx-auto w-full max-w-page px-4 md:px-6 ${className}`}>{children}</div>;
}

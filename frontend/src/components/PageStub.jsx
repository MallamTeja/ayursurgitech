import { useLocation } from 'react-router-dom';
import Container from './Container';

// Placeholder for a page another agent builds. The route, the shell and the design
// system around it are real; only the body is missing.
export default function PageStub({ name }) {
  const { pathname } = useLocation();

  return (
    <Container className="py-12">
      <div className="rounded-card border border-dashed border-line bg-card p-6 md:p-8">
        <p className="text-xs font-medium uppercase tracking-label text-ink-muted">Not built yet</p>
        <h1 className="mt-2 text-3xl">{name}</h1>
        <p className="mt-4 max-w-prose text-sm text-ink-muted">
          This route resolves and the shell around it is finished. The page body arrives with the
          next pass.
        </p>
        <p className="mt-4 font-mono text-sm text-blue-700">{pathname}</p>
      </div>
    </Container>
  );
}

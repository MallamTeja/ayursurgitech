import Container from '../components/Container';
import EmptyState from '../components/EmptyState';
import usePageTitle from '../components/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <Container className="py-12 md:py-24">
      <h1 className="text-center text-3xl">Page not found</h1>
      <EmptyState
        message="That address does not match anything on this site. The link may be old, or the page may have moved."
        actionLabel="Go to the home page"
        actionTo="/"
      />
    </Container>
  );
}

import { Icon } from '../../icons.jsx';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingPanel,
  ProductCardSkeleton,
  ProductGrid,
  Skeleton,
  SkeletonText,
  Spinner,
  useToast,
} from '../../index.js';
import { Code, Decision, DoDont, Example, Page, PropsTable, Row, Section } from '../kit.jsx';

export default function FeedbackPage() {
  const toast = useToast();

  return (
    <Page
      eyebrow="Components"
      title="Loading, empty & error"
      intro="§25, §26 and §27 are the most prescriptive sections of the document, and they are prescriptive about copy rather than colour. §26 rules out “No data.” and §27 rules out “Error 500.” — so these components take a title and a body, and the defaults are the document's own sentences."
      spec="§25, §26, §27"
    >
      <Section
        title="Loading"
        spec="§25"
        intro="“Do not leave users staring at blank screens.” A spinner says working and nothing else, so it is for waits with no shape. Anything with a known layout gets a skeleton, which tells the user what is arriving as well as that something is."
      >
        <Example title="Spinner and panel" surface="surface">
          <Row>
            <Spinner />
            <Spinner size={28} />
            <Button loading loadingLabel="Saving Product…">
              Save Product
            </Button>
          </Row>
          <div className="mt-4 rounded-xl border border-edge">
            <LoadingPanel label="Loading orders…" />
          </div>
        </Example>

        <Example title="Skeletons match the shape of what is coming" surface="canvas">
          <ProductGrid>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </ProductGrid>
        </Example>

        <Example title="Text and bars" surface="surface">
          <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
            <div>
              <p className="type-caption mb-2 text-fg-muted">SkeletonText</p>
              <SkeletonText lines={4} />
            </div>
            <div>
              <p className="type-caption mb-2 text-fg-muted">Skeleton</p>
              <div className="space-y-2">
                <Skeleton w="w-24" h="h-2.5" />
                <Skeleton h="h-5" />
                <Skeleton w="w-2/3" h="h-5" />
                <Skeleton h="h-9" rounded="rounded-lg" />
              </div>
            </div>
          </div>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            Skeletons are <Code>aria-hidden</Code>. The container announces “loading” once through a{' '}
            <Code>role="status"</Code>; a screen reader reading out nine empty boxes is worse than silence. The pulse
            animation is flattened automatically by the global <Code>prefers-reduced-motion</Code> block.
          </p>
        </Card>
      </Section>

      <Section
        title="Empty"
        spec="§26"
        intro="§26 gives a bad example and a better one, and the difference is a sentence explaining what happened plus an action. The variant matters because it changes what the action should be."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-edge bg-surface">
            <EmptyState
              title="No products yet"
              body="Products you add to the catalogue will appear here. Start with a category, then add products to it."
              action={<Button iconLeft={Icon.add}>Add Product</Button>}
              secondaryAction={<Button variant="secondary">Import CSV</Button>}
            />
          </div>
          <div className="rounded-xl border border-edge bg-surface">
            <EmptyState
              variant="no-results"
              icon={Icon.search}
              title="No products found"
              body="There are no products matching your current filters."
              action={<Button variant="secondary">Clear Filters</Button>}
            />
          </div>
        </div>

        <Decision kind="addition" title="The action depends on the cause">
          <p>
            A first-run empty offers “Add Product”. A filtered empty offers “Clear Filters”. Offering “Add Product” to
            someone whose search matched nothing is the wrong answer to the question they asked — and it is the default
            mistake, because both states look the same to the component unless it is told which one it is in.
          </p>
        </Decision>

        <Example title="§26's admin example" surface="surface" padded={false}>
          <EmptyState icon={Icon.orders} title="No orders yet" body="Orders placed by customers will appear here." />
        </Example>

        <DoDont
          doNote="§26's shape: what happened, why, and what to do about it."
          dontNote="§26's own bad example, quoted. It tells the user nothing and offers nothing."
          doNode={
            <EmptyState
              variant="no-results"
              icon={Icon.search}
              title="No orders found"
              body="Nothing matches “AST-26-9999”. Check the order number, or clear the filter to see all 348 orders."
              action={<Button variant="secondary">Clear Filters</Button>}
              className="!py-6"
            />
          }
          dontNode={
            <div className="grid place-items-center py-10">
              <p className="type-body-sm text-fg-muted">No data.</p>
            </div>
          }
        />
      </Section>

      <Section
        title="Error"
        spec="§27"
        intro="§27's example is “We couldn't load the orders. Please try again. If the problem continues, contact support.” — and the second sentence is the part that usually gets dropped. It is the default body here."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-edge bg-surface">
            <ErrorState thing="the orders" onRetry={() => {}} />
          </div>
          <div className="rounded-xl border border-edge bg-surface">
            <ErrorState
              thing="this product"
              detail="request-id: 7f3a91c2 · 503 upstream unavailable"
              onRetry={() => {}}
            />
          </div>
        </div>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            <Code>thing</Code> builds the first line, so the message names what failed — §27 asks for specific where
            possible, and the caller always knows what it was trying to load. <Code>detail</Code> is for a request id or a
            status code, rendered as small print rather than as the headline: available to whoever needs it, not what the
            user reads first.
          </p>
        </Card>

        <DoDont
          doNote="Names the thing, says what to do, offers the action. Someone can act on this without opening a ticket."
          dontNote="§27's own bad example. It is accurate and useless."
          doNode={<ErrorState thing="the orders" onRetry={() => {}} className="!py-6" />}
          dontNode={
            <div className="grid place-items-center py-10">
              <p className="type-body-sm text-error">Error 500</p>
            </div>
          }
        />
      </Section>

      <Section
        title="Alerts"
        spec="§4"
        intro="An inline message about the thing it sits next to. The role differs by tone, which matters more than the colour: error and warning use role=alert so they are announced when they appear, info and success use role=status, which is polite and waits for a gap in speech."
      >
        <Example title="Four tones, plus brand" surface="surface">
          <div className="space-y-3">
            <Alert tone="info" title="Quote QT-26-0091 expires in 14 days">
              Valid until 25 August 2026. After that it must be re-issued at current prices.
            </Alert>
            <Alert tone="success" title="Payment received">
              ₹89,568.00 against SRC/PO/1142. The order has moved to Processing.
            </Alert>
            <Alert
              tone="warning"
              title="Two products are below their reorder threshold"
              action={
                <Button size="sm" variant="secondary">
                  Create purchase order
                </Button>
              }
            >
              Polyfusion Micro Drip Set (1,840) and Four-Gang Manifold (260).
            </Alert>
            <Alert
              tone="error"
              title="This organisation is on credit hold"
              action={
                <>
                  <Button size="sm" variant="secondary">
                    View invoices
                  </Button>
                  <Button size="sm" variant="tertiary">
                    Request override
                  </Button>
                </>
              }
            >
              Outstanding ₹7,19,000 against a ₹7,50,000 limit. New orders require director approval.
            </Alert>
            <Alert tone="brand" title="12% GST applies to every line in this order" onDismiss={() => {}}>
              Split as CGST 6% and SGST 6% because the delivery address is in the same state as the place of supply.
            </Alert>
          </div>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            Using <Code>role="alert"</Code> for everything makes a screen reader interrupt itself over a “Saved” message,
            which trains people to ignore it. The body text is <Code>fg-secondary</Code> and never <Code>fg-muted</Code> —
            an alert nobody can read is a decoration.
          </p>
        </Card>
      </Section>

      <Section
        title="Toasts"
        spec="§25"
        intro="For confirmation of something that has already happened and does not block. Anything the user must act on is an Alert in the page, where it stays."
      >
        <Example title="Press one" surface="surface">
          <Row>
            <Button variant="secondary" onClick={() => toast.success('Product saved')}>
              Success
            </Button>
            <Button variant="secondary" onClick={() => toast.info('Export started — we will email the file')}>
              Info
            </Button>
            <Button variant="secondary" onClick={() => toast.warning('2 products are below their reorder threshold')}>
              Warning
            </Button>
            <Button variant="secondary" onClick={() => toast.error('Could not reach the payment gateway', { title: 'Payment failed' })}>
              Error
            </Button>
          </Row>
        </Example>

        <Decision kind="addition" title="Errors do not auto-dismiss">
          <p>
            Four and a half seconds is fine for “Saved” and unacceptable for “Payment failed”, which the user may need to
            read twice and act on. Every other tone expires; error waits to be dismissed.
          </p>
          <p>
            The live region is rendered once and always present, empty or not. A live region inserted at the same moment as
            its first message is frequently never announced at all — the screen reader never saw it become live.
          </p>
        </Decision>
      </Section>

      <Section title="Props" spec="§26, §27">
        <PropsTable
          rows={[
            ['EmptyState title', 'string', '—', 'What is not here. Not “No data.”'],
            ['EmptyState body', 'string', '—', 'Why, and what the user can do. §26 requires it in spirit.'],
            ['EmptyState variant', "'nothing-yet' | 'no-results'", "'nothing-yet'", 'Changes the tint and, more importantly, what the action should be.'],
            ['ErrorState thing', 'string', "'this page'", 'Builds “We couldn’t load {thing}.”'],
            ['ErrorState body', 'string', '§27 default', 'Pre-set to “Please try again. If the problem continues, contact support.”'],
            ['ErrorState detail', 'string', '—', 'Request id or status code, in small print.'],
            ['Alert tone', "'info' | 'success' | 'warning' | 'error' | 'brand'", "'info'", 'Error and warning get role=alert; the rest role=status.'],
            ['toast.error(msg, opts)', 'fn', '—', 'Never auto-dismisses. Others expire after 4.5s.'],
          ]}
        />
      </Section>
    </Page>
  );
}

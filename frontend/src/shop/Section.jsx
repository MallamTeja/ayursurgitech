// One vertical rhythm for the two long-form pages.
//
// /about and /support are both stacks of titled bands, and if each page invents
// its own spacing they read as two different sites. This is the only place the
// gap between bands is decided.
//
// `tone="tint"` is a full-bleed band on surface-2. It exists so a page can break
// a long scroll into chapters without a hairline rule every 400px — the change of
// ground does the same job more quietly.

import { Container, cx } from '../components/DesignSystem';

export default function Section({ id, title, lede, tone = 'plain', width = 'app', className, children }) {
  const body = (
    <Container width={width}>
      {title && (
        <div className="max-w-3xl">
          <h2 className="type-h3 text-fg">{title}</h2>
          {lede && <p className="type-body mt-3 text-fg-secondary">{lede}</p>}
        </div>
      )}
      <div className={cx(title && 'mt-8')}>{children}</div>
    </Container>
  );

  return (
    <section
      id={id}
      // scroll-mt clears the 64px sticky header, so an in-page anchor does not
      // land with its own heading hidden behind the chrome.
      className={cx(
        'scroll-mt-20 py-14 lg:py-20',
        tone === 'tint' && 'border-y border-edge bg-surface-2',
        className,
      )}
    >
      {body}
    </section>
  );
}

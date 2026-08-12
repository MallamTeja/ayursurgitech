import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  ConfirmModal,
  Drawer,
  Dropdown,
  Field,
  IconButton,
  Input,
  Modal,
  RadioGroup,
  Select,
  Textarea,
  Tooltip,
} from '../../index.js';
import { Code, Decision, Example, Page, PropsTable, Row, Section } from '../kit.jsx';

export default function Overlays() {
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [reason, setReason] = useState('stock');

  const doConfirm = () => {
    setWorking(true);
    setTimeout(() => {
      setWorking(false);
      setConfirm(false);
    }, 1400);
  };

  return (
    <Page
      eyebrow="Components"
      title="Dialogs, drawers & menus"
      intro="Everything §24 asks for around a modal — focus contained inside it, Escape closes it, the page behind inert and unreachable by Tab, the whole thing above every stacking context — is behaviour the platform now implements. So the dialog and the drawer are a native <dialog>, and the focus trap nobody has to maintain is the one that is not written."
      spec="§9, §10, §24"
    >
      <Section
        title="Modal"
        spec="§9, §10"
        intro="16px radius per §9, e2 shadow per §10 — one of only four things in the system that genuinely floats. Full-width sheet on mobile and a centred panel from sm up: a 400px dialog centred on a phone wastes the screen it most needs."
      >
        <Example title="Open it, then press Escape and Tab" surface="surface">
          <Row>
            <Button onClick={() => setModal(true)}>Edit delivery address</Button>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              Cancel order
            </Button>
          </Row>
        </Example>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Edit delivery address"
          description="Applies to this order only. The organisation's default address is unchanged."
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModal(false)}>Save address</Button>
            </>
          }
        >
          <div className="grid gap-5">
            <Field label="Attention" helper="Person or department receiving the consignment.">
              <Input defaultValue="Central Stores, Gate 3" />
            </Field>
            <Field label="Address" required>
              <Textarea defaultValue={'Apollo Hospitals, Kondapur\nCentral Stores, Gate 3'} rows={3} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City" required>
                <Input defaultValue="Hyderabad" />
              </Field>
              <Field label="PIN code" required>
                <Input defaultValue="500084" inputMode="numeric" />
              </Field>
            </div>
            <Checkbox label="Save as the default address for this organisation" />
          </div>
        </Modal>

        <ConfirmModal
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={doConfirm}
          title="Cancel order AST-26-0412?"
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          destructive
          loading={working}
        >
          <p>
            Apollo Hospitals will be notified and the six reserved stock lines will be released. This cannot be undone —
            a new order will need a new PO.
          </p>
          <div className="mt-4">
            <RadioGroup
              legend="Reason"
              name="reason"
              value={reason}
              onChange={setReason}
              options={[
                { value: 'stock', label: 'Stock unavailable' },
                { value: 'customer', label: 'Cancelled by customer' },
                { value: 'credit', label: 'Credit hold' },
              ]}
            />
          </div>
        </ConfirmModal>

        <Decision kind="addition" title="ConfirmModal makes the two usual mistakes into props">
          <p>
            The confirm button says what it does — “Cancel order”, not “OK”. A dialog whose buttons are OK and Cancel and
            whose subject is cancelling an order is genuinely ambiguous, and people click the wrong one. And on a
            destructive confirmation the safe choice takes focus, so Enter does not delete anything.
          </p>
        </Decision>

        <Alert tone="warning" title="dismissible={false} exists and should be rare">
          <p>
            It blocks both Escape and the backdrop. A dialog nobody can escape is a trap and §24's keyboard requirement is
            not optional — reserve it for a consequence that is genuinely irreversible and already in progress.
          </p>
        </Alert>
      </Section>

      <Section
        title="Drawer"
        spec="§9, §10"
        intro="For work that needs the list behind it to stay in view — filters, a quick preview, an audit trail. Anything that needs the whole screen is a page, not a drawer."
      >
        <Example surface="surface">
          <Button variant="secondary" iconLeft={Icon.filter} onClick={() => setDrawer(true)}>
            Filters
          </Button>
        </Example>

        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          title="Filter products"
          description="348 products in the catalogue"
          footer={
            <>
              <Button variant="tertiary" onClick={() => setDrawer(false)}>
                Reset
              </Button>
              <Button onClick={() => setDrawer(false)}>Show 42 products</Button>
            </>
          }
        >
          <div className="space-y-6">
            <Field label="Category">
              <Select
                placeholder="All categories"
                options={['I.V. Infusion', 'Extension Lines', 'Connectors', 'Stop Cocks', 'Vial Access']}
              />
            </Field>
            <div>
              <p className="type-body-sm mb-2 font-medium text-fg">Availability</p>
              <div className="space-y-2.5">
                <Checkbox label="In stock" defaultChecked />
                <Checkbox label="Low stock" />
                <Checkbox label="Out of stock" />
              </div>
            </div>
            <div>
              <p className="type-body-sm mb-2 font-medium text-fg">Properties</p>
              <div className="space-y-2.5">
                <Checkbox label="Sterile" />
                <Checkbox label="Latex-free" />
                <Checkbox label="DEHP-free" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Min price">
                <Input prefix="₹" placeholder="0" />
              </Field>
              <Field label="Max price">
                <Input prefix="₹" placeholder="500" />
              </Field>
            </div>
          </div>
        </Drawer>
      </Section>

      <Section
        title="Dropdown"
        spec="§17, §24"
        intro="The row-actions menu and the account menu. Not a dialog: a menu should close when you click elsewhere rather than blocking the page, and it does not need to contain focus, only to move it with the arrow keys."
      >
        <Example title="Arrow keys, Home, End, Escape" surface="surface">
          <Row>
            <Dropdown
              label="Order actions"
              items={[
                { label: 'View order', icon: Icon.show },
                { label: 'Print invoice', icon: Icon.print, hint: '⌘P' },
                { label: 'Duplicate', icon: Icon.copy },
                { separator: true },
                { label: 'Mark dispatched', icon: Icon.shipments },
                { label: 'Record payment', icon: Icon.payments },
                { separator: true },
                { label: 'Cancel order', icon: Icon.error, destructive: true },
              ]}
            />

            <Dropdown
              align="left"
              trigger={(props) => (
                <Button {...props} variant="secondary" iconRight={Icon.chevronDown}>
                  Bulk actions
                </Button>
              )}
              items={[
                { label: 'Export selected', icon: Icon.export },
                { label: 'Print invoices', icon: Icon.print },
                { label: 'Assign to agent', icon: Icon.agents },
                { separator: true },
                { label: 'Delete', icon: Icon.delete, destructive: true, disabled: true },
              ]}
            />
          </Row>
        </Example>

        <Card>
          <p className="type-body-sm text-fg-secondary">
            The trigger is a render prop rather than a wrapped child, so the ref lands on the real button: Escape has to
            return focus to the control the menu was opened from, and a wrapper element standing in front of it would
            swallow that. Outside clicks are caught on <Code>pointerdown</Code>, not <Code>click</Code> — a click listener
            fires after the trigger's own handler and reopens the menu the user was trying to close.
          </p>
        </Card>
      </Section>

      <Section
        title="Tooltip"
        spec="§24"
        intro="A short label for a control whose meaning is not obvious — almost always an icon-only button."
      >
        <Example title="Hover, or Tab to it, then press Escape" surface="surface">
          <Row>
            <Tooltip label="Edit product">
              <IconButton icon={Icon.edit} label="Edit product" variant="secondary" />
            </Tooltip>
            <Tooltip label="Export as CSV" side="bottom">
              <IconButton icon={Icon.export} label="Export as CSV" variant="secondary" />
            </Tooltip>
            <Tooltip label="Reorder threshold: 2,000 units" side="right">
              <span className="type-body-sm flex items-center gap-1.5 text-fg">
                1,840 in stock
                <Icon.help size={14} className="text-fg-muted" />
              </span>
            </Tooltip>
          </Row>
        </Example>

        <Alert tone="info" title="A tooltip is a hint, never a mechanism">
          <p>
            It cannot be read on a touch screen at all — there is no hover — so anything essential goes in visible helper
            text instead. WCAG 2.2 1.4.13 requires hover content to be dismissible without moving the pointer, so Escape
            hides it, and it opens on focus as well as hover or it does not exist for a keyboard user.
          </p>
        </Alert>
      </Section>

      <Section title="Props" spec="§24">
        <PropsTable
          rows={[
            ['Modal open / onClose', 'boolean / fn', '—', 'Controlled. The dialog element stays mounted and is toggled with showModal().'],
            ['Modal size', "'sm' | 'md' | 'lg' | 'xl'", "'md'", 'Full-width sheet below sm regardless.'],
            ['Modal dismissible', 'boolean', 'true', 'false blocks Escape and the backdrop. Use rarely.'],
            ['Modal footer', 'ReactNode', '—', 'Sits on surface-2. Reversed on mobile so the primary is at the bottom.'],
            ['ConfirmModal destructive', 'boolean', 'false', 'Danger variant, and focus starts on the safe choice.'],
            ['Drawer side', "'right' | 'left'", "'right'", 'Left is the mobile navigation case.'],
            ['Dropdown items', 'Item[]', '[]', '{label, icon, onSelect, hint, destructive, disabled} or {separator:true}.'],
            ['Dropdown trigger', '(props) => ReactNode', '—', 'Render prop. Spread props onto a real focusable control.'],
            ['Tooltip side', "'top' | 'bottom' | 'left' | 'right'", "'top'", ''],
          ]}
        />
      </Section>
    </Page>
  );
}

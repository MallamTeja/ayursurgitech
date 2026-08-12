// The icon system — §21.
//
// §21 mandates Lucide and §32 Rule 6 forbids mixing icon families, so this file
// is the single door icons come through. Nothing in this design system imports
// from 'lucide-react' directly; it imports from here. That gives us one place to
// hold the two defaults §21 asks for and the app cannot drift from:
//
//   stroke  1.75px  — §21 says 1.5–2px. Lucide ships 2. 1.75 is the middle of
//                     the range the doc allows and reads lighter beside Inter at
//                     14px, which is most of the admin UI.
//   size    20px    — §21's "standard controls" size, so the common case needs
//                     no prop. 16 inline/table, 24 navigation, 32 empty states.
//
// aria-hidden is on by default. An icon next to a text label must not be
// announced twice, and an icon that is the *only* content of a control gets its
// name from the control's aria-label instead — never from the glyph. Pass
// `aria-hidden={false}` with a `title` only for the rare standalone informative
// icon.
//
// WHY A REGISTRY AND NOT `export * from 'lucide-react'`: named imports are what
// keep the bundle honest. `import * as L` followed by `L[name]` defeats
// tree-shaking and would pull all ~1,600 Lucide icons into the chunk. Every icon
// below is a static named import, so only what is used ships.
//
// Names are the modern Lucide ones (CircleCheck, TriangleAlert, LoaderCircle),
// not the deprecated aliases (CheckCircle2, AlertTriangle, Loader2). Both
// resolve in lucide-react 1.31, but the aliases are the ones that will vanish.

import { forwardRef } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Ban,
  Banknote,
  Bandage,
  Bell,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDot,
  CircleHelp,
  CircleX,
  ClipboardList,
  Clock,
  Copy,
  CreditCard,
  Download,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  GripVertical,
  HeartPulse,
  ImageOff,
  Inbox,
  IndianRupee,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Microscope,
  Minus,
  Package,
  PanelLeftClose,
  Paperclip,
  Pencil,
  Percent,
  Phone,
  Pill,
  Plus,
  Printer,
  Quote,
  RefreshCw,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Stethoscope,
  Syringe,
  Tag,
  Tags,
  Target,
  TestTube,
  Thermometer,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Truck,
  Upload,
  UserCog,
  Users,
  Warehouse,
  X,
} from 'lucide-react';

/** §21's defaults, applied once. */
const withDefaults = (Glyph, key) => {
  const Wrapped = forwardRef(function DsIcon({ size = 20, strokeWidth = 1.75, ...rest }, ref) {
    return <Glyph ref={ref} size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...rest} />;
  });
  Wrapped.displayName = `Icon.${key}`;
  return Wrapped;
};

// Keys are semantic where the domain has a word for it (`quote`, `dispatch`,
// `stock`) and literal where it does not (`chevronDown`). A semantic key means a
// glyph swap is one edit here, not a search across every screen.
const glyphs = {
  // ---- Navigation: the §12 admin groups, in order -------------------------
  dashboard: LayoutDashboard,
  products: Package,
  categories: Tags,
  documents: FileText,
  orders: ShoppingCart,
  quotes: Quote,
  customers: Users,
  inventory: Boxes,
  shipments: Truck,
  warehouse: Warehouse,
  agents: Briefcase,
  organizations: Building2,
  users: UserCog,
  invoices: Receipt,
  payments: CreditCard,
  revenue: IndianRupee,
  reports: ChartColumn,
  performance: Target,
  notifications: Bell,
  audit: ScrollText,
  settings: Settings,

  // ---- Actions -----------------------------------------------------------
  add: Plus,
  remove: Minus,
  search: Search,
  filter: Filter,
  sort: ArrowUpDown,
  edit: Pencil,
  delete: Trash2,
  download: Download,
  upload: Upload,
  print: Printer,
  copy: Copy,
  retry: RefreshCw,
  externalLink: ExternalLink,
  attach: Paperclip,
  show: Eye,
  hide: EyeOff,
  logout: LogOut,
  menu: Menu,
  close: X,
  more: Ellipsis,
  moreVertical: EllipsisVertical,
  drag: GripVertical,
  collapse: PanelLeftClose,
  export: FileSpreadsheet,

  // ---- Direction ---------------------------------------------------------
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  first: ChevronsLeft,
  last: ChevronsRight,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,

  // ---- Status: the glyph half of "never colour alone", §4 -----------------
  check: Check,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  danger: CircleAlert,
  info: Info,
  pending: Clock,
  active: CircleDot,
  neutral: Circle,
  spinner: LoaderCircle,
  verified: ShieldCheck,
  certified: BadgeCheck,
  approved: FileCheck,
  blocked: Ban,
  help: CircleHelp,
  empty: Inbox,
  noImage: ImageOff,

  // ---- Commerce ----------------------------------------------------------
  rupee: IndianRupee,
  tag: Tag,
  cash: Banknote,
  discount: Percent,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  cart: ShoppingCart,
  spec: ClipboardList,

  // ---- Domain: §22 wants the product to be the hero, and these are the
  //      category glyphs that stand in for it in navigation and empty states.
  infusion: Syringe,
  clinical: Stethoscope,
  pharma: Pill,
  vitals: Activity,
  lab: TestTube,
  microscope: Microscope,
  temperature: Thermometer,
  cardiac: HeartPulse,
  wound: Bandage,

  // ---- Misc --------------------------------------------------------------
  calendar: Calendar,
  location: MapPin,
  phone: Phone,
  mail: Mail,
  star: Star,
};

/** `<Icon.orders />`, `<Icon.success size={16} />`. */
export const Icon = Object.fromEntries(
  Object.entries(glyphs).map(([key, Glyph]) => [key, withDefaults(Glyph, key)]),
);

/** For the reference page, and for anything that needs to enumerate the set. */
export const ICON_NAMES = Object.keys(glyphs);

/** §21's size ladder, so a component can say `ICON_SIZE.inline` instead of 16. */
export const ICON_SIZE = {
  inline: 16, // inside text, inside a table cell
  control: 20, // buttons, inputs — the default
  nav: 24, // navigation
  feature: 32, // empty states, feature blocks
};

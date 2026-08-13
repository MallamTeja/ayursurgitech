// AayursurgiTech Design System v1.0 — public surface.
//
//     import { Button, DataTable, StatusBadge } from '@/components/DesignSystem'
//
// One import path for the whole system. Deep imports into ./ui/* work but are not
// the contract: this file is what a consumer should be able to rely on, and it is
// where a rename gets absorbed.
//
// The tokens live in theme.css, which index.css imports once for the whole app —
// importing this module does not pull in any CSS.

/* Foundations */
export { Icon, ICON_NAMES, ICON_SIZE } from './icons.jsx';
export {
  BREAKPOINTS,
  CHART_SERIES,
  COLOR_GROUPS,
  DENSITY,
  ELEVATION,
  RADIUS,
  SPACING,
  SURFACES,
  TYPE_ADDITIONS,
  TYPE_SCALE,
  contrast,
  luminance,
  verdict,
} from './tokens.js';
export { formatDate, formatDateTime, formatDelta, formatINR, formatINRCompact, formatQty } from './format.js';
export { a11yWarn, clamp, cx } from './utils.js';

/* Primitives */
export { Button, ButtonGroup, IconButton } from './ui/Button.jsx';
export {
  Badge,
  Chip,
  CountBadge,
  ENTITY_STATUS,
  ORDER_FLOW,
  ORDER_STATUS,
  PAYMENT_STATUS,
  QUOTE_STATUS,
  STATUS_SETS,
  STOCK_STATUS,
  StatusBadge,
  StatusDot,
  stockStatusOf,
} from './ui/Badge.jsx';

/* Layout */
export {
  AmountList,
  Avatar,
  Container,
  DescriptionList,
  Divider,
  FeatureList,
  PageHeader,
  SectionHeading,
  SpecTable,
} from './ui/Layout.jsx';
export { Card, CardBody, CardFooter, CardHeader, MetricCard, MetricRow, Panel, Stat, Well } from './ui/Card.jsx';

/* Forms */
export {
  Checkbox,
  Field,
  FileDrop,
  FormActions,
  FormRow,
  FormSection,
  Input,
  QuantityStepper,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  Switch,
  Textarea,
} from './ui/Form.jsx';

/* Data */
export { DataTable, FilterBar, Pagination, TableToolbar } from './ui/Table.jsx';
export { BarChart, LineChart, ShareBar, Sparkline } from './ui/Chart.jsx';

/* Product */
export { CategoryTile, PriceBlock, ProductCard, ProductGrid, ProductImage } from './ui/Product.jsx';

/* Feedback */
export {
  Alert,
  EmptyState,
  ErrorState,
  LoadingPanel,
  ProductCardSkeleton,
  ProgressBar,
  Skeleton,
  SkeletonText,
  Spinner,
  StockMeter,
  ToastProvider,
  useToast,
} from './ui/Feedback.jsx';

/* Overlays */
export { ConfirmModal, Drawer, Dropdown, Modal, Tooltip } from './ui/Overlay.jsx';

/* Navigation */
export {
  ADMIN_NAV,
  Breadcrumb,
  CustomerHeader,
  SidebarNav,
  TabPanel,
  Tabs,
  Stepper,
  Timeline,
} from './ui/Nav.jsx';

# AayursurgiTech Design System

**Version:** 1.0  
**Design Direction:** Clinical Precision  
**Platform:** B2B Medical Products & Distribution  
**Primary Audiences:** Customers, Sales Agents, Administrators

---

## 1. Design Philosophy

AayursurgiTech should communicate:

> **Clinical trust + precision + cleanliness + reliability + modern technology**

The interface should feel:

- Clinical
- Precise
- Calm
- Professional
- Modern
- Trustworthy

It should **not** feel:

- Generic hospital-blue
- Overly colorful
- Childish
- Dark/futuristic SaaS
- Luxury/corporate
- Sterile to the point of feeling lifeless

### Core principle

**The product itself is the hero.**

Use clean layouts, generous whitespace, precise typography, restrained color, and high-quality product imagery.

---

# 2. Brand Concept

## Clinical Precision

The visual language combines:

- Clean medical white space
- Deep clinical navy
- Controlled teal accents
- Strong typographic hierarchy
- Subtle borders
- Minimal elevation
- Consistent spacing

The intended subconscious message is:

> **“These people are serious about medical products, quality, and reliability.”**

---

# 3. Color System

## 3.1 Brand Colors

| Token | HEX | Usage |
|---|---|---|
| `brand-900` | `#123B4A` | Deep brand, headings, dark navigation |
| `brand-700` | `#0A6170` | Dark primary, hover states |
| `brand-600` | `#087F8C` | Primary brand/action color |
| `brand-500` | `#39A9B6` | Accent and supporting visuals |
| `brand-100` | `#DDF3F5` | Light brand backgrounds |
| `brand-50` | `#EFF9FA` | Very subtle brand surfaces |

### Primary color

**Medical Teal — `#087F8C`**

Use for:

- Primary buttons
- Links
- Active navigation
- Selected controls
- Important UI actions
- Product/category accents

Do not use the primary color as the dominant background of the entire application.

---

## 3.2 Neutral Colors

| Token | HEX | Usage |
|---|---|---|
| `canvas` | `#F7FAFA` | Application/page background |
| `surface` | `#FFFFFF` | Cards, panels, dialogs |
| `surface-2` | `#F0F5F5` | Secondary surfaces |
| `text-primary` | `#16323D` | Primary text |
| `text-secondary` | `#536B73` | Supporting text |
| `text-muted` | `#82949A` | Muted/caption text |
| `text-disabled` | `#AAB8BC` | Disabled text |
| `border` | `#DCE7E9` | Default borders |
| `border-strong` | `#C7D7DA` | Stronger borders |

### Important rule

Do not use pure black `#000000` for normal application text.

Use `#16323D`.

---

# 4. Semantic Colors

Semantic colors communicate state and must not be the only method of communicating meaning.

## Success

```text
success:            #198754
success-background: #EAF7F0
```

Use for:

- Delivered
- Paid
- Active
- Completed
- Successful

## Warning

```text
warning:            #C98200
warning-background: #FFF6E5
```

Use for:

- Low stock
- Pending
- Attention required
- Expiring soon

## Error

```text
error:            #C83C4A
error-background: #FDECEF
```

Use for:

- Failed
- Cancelled
- Invalid
- Critical errors

## Information

```text
info:            #2778A5
info-background: #EAF4FA
```

Use for:

- Information
- Processing
- System messages
- Informational alerts

### Accessibility rule

Never communicate state through color alone.

Prefer:

```text
✓ Delivered
! Payment Pending
× Cancelled
```

with color supporting the icon/text.

---

# 5. Color Usage Ratio

Use approximately:

```text
60%  White / very light surfaces
30%  Navy / neutral typography and structure
10%  Teal / semantic and functional accents
```

The interface should feel calm rather than saturated.

---

# 6. Typography

## Primary Typeface

**Inter**

Use Inter throughout the application.

Reasons:

- Excellent UI readability
- Professional
- Neutral
- Modern
- Excellent numerals
- Strong dashboard readability
- Good small-size rendering

---

## 6.1 Typography Scale

| Style | Size | Weight | Suggested Line Height |
|---|---:|---:|---:|
| Display | 48px | 600 | 1.1 |
| H1 | 40px | 600 | 1.15 |
| H2 | 32px | 600 | 1.2 |
| H3 | 28px | 600 | 1.25 |
| H4 | 20px | 600 | 1.3 |
| Body Large | 18px | 400 | 1.55 |
| Body | 16px | 400 | 1.5 |
| Body Small | 14px | 400 | 1.45 |
| Caption | 12px | 400 | 1.4 |

### Dashboard typography

| Element | Size | Weight |
|---|---:|---:|
| Metric value | 28–36px | 600 |
| Table heading | 13–14px | 600 |
| Table body | 14px | 400 |
| Navigation | 14–15px | 500 |

---

# 7. Font Weight Rules

Use primarily:

```text
400 → Regular
500 → Medium
600 → Semibold
700 → Bold
```

Prefer `400`, `500`, and `600`.

Avoid excessive bold text.

---

# 8. Spacing System

Use an **8px spacing system**, with 4px for micro spacing.

```text
4px   → Micro
8px   → Small
12px  → Compact
16px  → Standard
24px  → Component
32px  → Section
48px  → Large section
64px  → Major section
80px  → Hero spacing
```

Do not introduce arbitrary values unless there is a strong layout reason.

Avoid:

```text
13px
19px
27px
37px
```

Prefer:

```text
12px
16px
24px
32px
```

---

# 9. Border Radius

AayursurgiTech should feel precise rather than overly rounded.

| Component | Radius |
|---|---:|
| Buttons | 8px |
| Inputs | 8px |
| Selects | 8px |
| Cards | 12px |
| Panels | 16px |
| Dialogs | 16px |
| Pills | 999px |

Avoid making every component a pill.

---

# 10. Elevation & Shadows

Use elevation sparingly.

Most cards should use:

```text
Background + Border
```

rather than large shadows.

### Small elevation

```text
0 1px 3px rgba(18, 59, 74, 0.08)
```

### Large elevation

```text
0 8px 24px rgba(18, 59, 74, 0.10)
```

Shadows should remain subtle.

---

# 11. Layout Principles

## 11.1 Customer Portal

The customer portal should be:

**Spacious + visual + product-focused + trustworthy**

Typical structure:

```text
┌─────────────────────────────────────────────────────┐
│ LOGO     Products   Categories   About    Login     │
├─────────────────────────────────────────────────────┤
│                                                     │
│       Reliable medical products                    │
│       for healthcare professionals.                 │
│                                                     │
│       [ Explore Products ]                          │
│                                                     │
│                         Product imagery             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Product Categories                     │
│                                                     │
│ [Infusion] [Connectors] [Extension] [Other]        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 11.2 Admin Panel

The admin panel should be:

**Dense + efficient + operational + data-first**

```text
┌───────────────┬─────────────────────────────────────┐
│ AAYURSURGI    │ Dashboard                           │
│               │                                     │
│ Dashboard     │ Revenue    Orders    Customers      │
│ Products      │ ₹12.4L     348       126            │
│ Orders        │                                     │
│ Customers     │ ┌─────────────────────────────────┐ │
│ Agents        │ │ Revenue Chart                   │ │
│ Inventory     │ │                                 │ │
│ Reports       │ └─────────────────────────────────┘ │
│ Settings      │                                     │
│               │ Recent Orders                       │
└───────────────┴─────────────────────────────────────┘
```

---

## 11.3 Agent Portal

The agent portal should emphasize:

- Today's orders
- Pending follow-ups
- Customers
- Sales
- Revenue
- Targets
- Performance

An agent should understand their current business situation within **5–10 seconds**.

---

# 12. Navigation

## Customer Navigation

Keep navigation simple:

```text
Products
Categories
About
Support
Account
Cart
```

## Admin Navigation

Group by business function:

```text
Dashboard

Catalog
  Products
  Categories
  Product Documents

Sales
  Orders
  Quotes
  Customers

Operations
  Inventory
  Shipments

People
  Agents
  Organizations
  Users

Finance
  Invoices
  Payments
  Revenue

Analytics
  Reports
  Performance

System
  Notifications
  Audit Logs
  Settings
```

---

# 13. Buttons

## Primary Button

```text
Background: #087F8C
Text:       #FFFFFF
Radius:     8px
```

Hover:

```text
#0A6170
```

Use for the primary action on a page.

Example:

```text
[ Create Product ]
[ Place Order ]
[ Confirm Order ]
```

---

## Secondary Button

```text
Background: #FFFFFF
Border:     #C7D7DA
Text:       #123B4A
Radius:     8px
```

Example:

```text
[ Cancel ]
[ Export ]
[ View Details ]
```

---

## Tertiary Button

```text
Background: transparent
Text:       #087F8C
```

Use for lower-priority actions.

---

# 14. Form Design

Always place labels above inputs.

Preferred:

```text
Product Name

┌──────────────────────────────────┐
│ Enter product name               │
└──────────────────────────────────┘
```

Avoid placeholder-only labels:

```text
┌──────────────────────────────────┐
│ Enter product name               │
└──────────────────────────────────┘
```

Forms should support:

- Clear labels
- Helper text
- Inline validation
- Error messages
- Required indicators
- Accessible keyboard navigation

---

# 15. Product Card

Product cards should prioritize the product itself.

```text
┌─────────────────────────────────┐
│                                 │
│          PRODUCT IMAGE          │
│                                 │
├─────────────────────────────────┤
│ I.V. INFUSION                   │
│                                 │
│ Polyfusion                      │
│ I.V. Infusion Set with          │
│ Airvent Spike                   │
│                                 │
│ Product Code: XXXX              │
│                                 │
│ [ View Details ]                │
└─────────────────────────────────┘
```

Do not overload product cards with technical specifications.

The product detail page should contain the deeper information.

---

# 16. Product Detail Page

Recommended hierarchy:

```text
Breadcrumb
    ↓
Product category
    ↓
Product name
    ↓
Short description
    ↓
Product imagery
    ↓
Key specifications
    ↓
Applications / features
    ↓
Documents
    ↓
Request Quote / Order
    ↓
Related products
```

Product imagery should be high quality and consistent.

---

# 17. Tables

Tables are critical for the admin portal.

Example:

```text
┌────┬──────────────┬───────────┬─────────┬──────────┐
│    │ Product      │ Category  │ Stock   │ Status   │
├────┼──────────────┼───────────┼─────────┼──────────┤
│ □  │ Polyfusion   │ Infusion  │ 1,240   │ Active   │
│ □  │ Polyway      │ Stopcock  │ 820     │ Active   │
│ □  │ Polyvol      │ Burette   │ 420     │ Low      │
└────┴──────────────┴───────────┴─────────┴──────────┘
```

Rules:

- Avoid excessive grid lines
- Use subtle borders
- Maintain generous row height
- Use hover states
- Keep column alignment consistent
- Use semantic status badges
- Support sorting/filtering/pagination
- Keep actions predictable

---

# 18. Status Badges

Use compact semantic badges.

Examples:

```text
✓ Delivered
✓ Paid
● Active
! Pending
! Low Stock
× Cancelled
```

Do not use more than necessary.

---

# 19. Dashboard Cards

Dashboard cards should have a clear hierarchy:

```text
Revenue

₹12,48,500

+12.4% vs previous month
```

Recommended structure:

```text
Label
    ↓
Primary metric
    ↓
Comparison / context
```

Do not fill metric cards with decorative graphics that compete with the number.

---

# 20. Charts

Use restrained colors.

Recommended mapping:

```text
Revenue       → brand-600
Orders        → brand-500
Customers     → brand-900
Profit        → success
Warnings      → warning
Errors        → error
```

Avoid rainbow charts.

Charts should communicate information, not decoration.

---

# 21. Iconography

Use **Lucide Icons** consistently.

Do not mix multiple unrelated icon families.

Recommended icon style:

- 1.5–2px stroke
- Simple geometry
- Consistent size
- Minimal decorative usage

Typical sizes:

```text
16px → Inline/table
20px → Standard controls
24px → Navigation
32px → Feature/empty states
```

---

# 22. Imagery

Prioritize:

1. Actual Aayursurgi products
2. Product close-ups
3. Clinical environments
4. Healthcare professionals using relevant equipment
5. Clean medical/laboratory environments

Avoid generic stock photography such as:

- Smiling doctors holding clipboards
- Generic hospital corridors
- Unrelated healthcare imagery

The actual product should be the visual hero.

---

# 23. Responsive Breakpoints

Recommended baseline:

```text
Mobile:   < 640px
Tablet:   640px–1023px
Desktop:  1024px–1279px
Large:    1280px+
```

Use responsive design based on layout needs rather than designing only for specific devices.

---

# 24. Accessibility

Target **WCAG 2.2 AA** as the baseline.

Requirements:

- Sufficient text contrast
- Keyboard navigation
- Visible focus states
- Semantic HTML
- Accessible form labels
- Meaningful button labels
- Status not conveyed by color alone
- Appropriate touch targets
- Screen-reader-friendly structure
- Alternative text for meaningful images

---

# 25. Loading States

Do not leave users staring at blank screens.

Use:

- Skeleton loaders
- Progress indicators
- Button loading states

Example:

```text
[ Saving Product... ]
```

rather than allowing the user to click repeatedly.

---

# 26. Empty States

Empty states should explain what happened and what the user can do.

Bad:

```text
No data.
```

Better:

```text
No products found

There are no products matching your current filters.

[ Clear Filters ]
```

Admin example:

```text
No orders yet

Orders placed by customers will appear here.
```

---

# 27. Error States

Errors should be:

- Clear
- Actionable
- Human-readable
- Specific where possible

Bad:

```text
Error 500
```

Better:

```text
We couldn't load the orders.

Please try again. If the problem continues, contact support.

[ Try Again ]
```

---

# 28. Order Status Model

Recommended order lifecycle:

```text
ORDER PLACED
      ↓
ORDER CONFIRMED
      ↓
PROCESSING
      ↓
PACKED
      ↓
DISPATCHED
      ↓
IN TRANSIT
      ↓
OUT FOR DELIVERY
      ↓
DELIVERED
```

Exception states:

```text
CANCELLED
REJECTED
RETURN REQUESTED
RETURNED
```

Status history should be auditable.

---

# 29. Design Density by Portal

| Portal | Density | Visual Priority |
|---|---|---|
| Customer | Low–Medium | Products & discovery |
| Agent | Medium | Actions & sales |
| Admin | Medium–High | Data & operations |

The three portals should share the same design language but **not the same density**.

---

# 30. Design Tokens

Recommended CSS variables:

```css
:root {
  --color-brand-900: #123B4A;
  --color-brand-700: #0A6170;
  --color-brand-600: #087F8C;
  --color-brand-500: #39A9B6;
  --color-brand-100: #DDF3F5;
  --color-brand-50: #EFF9FA;

  --color-canvas: #F7FAFA;
  --color-surface: #FFFFFF;
  --color-surface-2: #F0F5F5;

  --color-text-primary: #16323D;
  --color-text-secondary: #536B73;
  --color-text-muted: #82949A;
  --color-text-disabled: #AAB8BC;

  --color-border: #DCE7E9;
  --color-border-strong: #C7D7DA;

  --color-success: #198754;
  --color-success-bg: #EAF7F0;

  --color-warning: #C98200;
  --color-warning-bg: #FFF6E5;

  --color-error: #C83C4A;
  --color-error-bg: #FDECEF;

  --color-info: #2778A5;
  --color-info-bg: #EAF4FA;
}
```

---

# 31. Component Principles

Every reusable component should have:

1. Clear purpose
2. Consistent spacing
3. Consistent typography
4. Predictable interaction
5. Keyboard accessibility
6. Loading state where applicable
7. Disabled state where applicable
8. Error state where applicable
9. Responsive behavior

Avoid one-off styling wherever possible.

---

# 32. Design Rules — Non-Negotiable

### Rule 1
Do not randomly introduce colors.

### Rule 2
Do not use pure black as normal text.

### Rule 3
Do not make every component rounded.

### Rule 4
Do not use excessive shadows.

### Rule 5
Do not use color as the only status indicator.

### Rule 6
Do not mix icon families.

### Rule 7
Do not use placeholder text as a replacement for labels.

### Rule 8
Do not overload product cards.

### Rule 9
Do not make the admin panel look like the marketing website.

### Rule 10
Do not sacrifice usability for visual decoration.

### Rule 11
The actual medical product should receive visual priority.

### Rule 12
Every new visual pattern should be evaluated against the existing design system before being introduced.

---

# 33. Brand Summary

## AayursurgiTech should feel like:

> **A modern, precise, trustworthy medical-device company powered by technology.**

### Visual keywords

```text
Clinical
Precise
Clean
Trustworthy
Professional
Calm
Modern
Reliable
Structured
Accessible
```

### Core palette

```text
#123B4A  Clinical Navy
#087F8C  Medical Teal
#39A9B6  Medical Aqua
#F7FAFA  Clinical Canvas
#FFFFFF  Surface
#16323D  Primary Text
```

### Primary font

```text
Inter
```

### Icon system

```text
Lucide
```

### Design philosophy

```text
Less decoration.
More clarity.

Less saturation.
More trust.

Less complexity.
More precision.

Less generic imagery.
More actual products.
```

---

## 34. Implementation Principle

This document is the **visual contract** for AayursurgiTech.

Before adding a new component, page, or visual treatment, ask:

> Does this strengthen the Clinical Precision design language?

If not, it should not be introduced without a clear reason.

---

**End of AayursurgiTech Design System v1.0**

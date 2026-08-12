# AyursurgiTech — Project Overview

**Project:** AyursurgiTech  
**Project Type:** B2B Medical Products & Distribution Platform  
**Status:** Initial Product/Architecture Planning  
**Document Version:** 1.0  
**Primary Audience:** Project owner, developers, designers, business stakeholders

---

## 1. Executive Summary

AyursurgiTech is a technology platform being developed for a medical-products distributor/manufacturer to manage and sell medical and surgical products through a centralized digital platform.

The platform is intended to support the complete business lifecycle:

```text
Product Catalog
      ↓
Customer Discovery
      ↓
Quote / Order
      ↓
Order Processing
      ↓
Inventory
      ↓
Shipment
      ↓
Delivery
      ↓
Payment / Invoice
      ↓
Revenue & Business Analytics
```

The system will provide separate experiences for:

- Customers / organizations
- Sales agents
- Administrators
- Business managers

The goal is to create a professional, reliable, scalable B2B medical-commerce and distribution management system rather than a simple product-listing website.

---

# 2. Business Context

AyursurgiTech is being developed as a freelancing technology project under a broader technology-services initiative.

The business operates in the medical-products domain and deals with products such as:

- I.V. Infusion Sets
- Extension Lines
- Needle-Free Connectors
- I.V. Flow Regulator Extension Sets
- Burette Sets
- Three-Way Stop Cocks
- Vial Access Spikes
- Transfer Spikes
- Manifolds
- Pre-filled Saline Syringes
- Specialty infusion sets
- High-pressure extension lines
- Low-pressure extension lines
- Other medical and surgical consumables/instruments

The exact final product catalog, pricing, inventory, regulatory information, and business rules must be supplied and approved by the client.

---

# 3. Product Vision

## Vision Statement

> Build a trusted digital platform that makes medical-product discovery, procurement, sales, distribution, and business monitoring simple, transparent, and efficient.

The platform should combine:

**Medical-product commerce + distribution management + sales management + business intelligence**

---

# 4. Product Positioning

AyursurgiTech should not be treated as a generic e-commerce website.

It is better defined as:

> **A B2B medical-device commerce and distribution management platform with customer, sales-agent, inventory, order, logistics, financial, and analytics capabilities.**

This distinction is important because B2B medical procurement can involve:

- Organizations rather than individuals
- Purchase orders
- Quotations
- Credit terms
- Offline payments
- Sales agents
- Customer-specific pricing
- Inventory constraints
- Shipment workflows
- Invoices
- Batch/lot information
- Regulatory documents
- Product certificates

---

# 5. Primary Users

## 5.1 Customer

A customer may be:

- Hospital
- Clinic
- Medical organization
- Distributor
- Pharmacy
- Healthcare professional
- Other approved organization or individual buyer

Customer capabilities may include:

- Registration/login
- Organization profile
- Product browsing
- Product search
- Product filtering
- Product details
- Product documents
- Cart
- Request quote
- Place order
- Order history
- Order tracking
- Invoice access
- Payment information
- Support requests

---

## 5.2 Sales Agent

Sales agents act as the commercial bridge between the business and customers.

Capabilities may include:

- Assigned customers
- Customer management
- Customer creation
- Customer purchase history
- Create orders on behalf of customers
- Quote management
- Order tracking
- Sales tracking
- Revenue tracking
- Target tracking
- Commission tracking
- Follow-ups
- Notifications

---

## 5.3 Administrator

Administrators manage the platform and business operations.

Capabilities include:

- Dashboard
- Product management
- Category management
- Customer management
- Organization management
- Agent management
- Order management
- Inventory management
- Shipment management
- Invoice management
- Payment management
- Revenue analytics
- Reports
- Notifications
- Audit logs
- System settings

---

## 5.4 Business Manager / Sales Manager

A manager may require visibility into:

- Agent performance
- Sales targets
- Revenue
- Customers
- Orders
- Product performance
- Regional performance
- Outstanding payments
- Customer acquisition
- Business trends

---

# 6. High-Level System Architecture

```text
                         AYURSURGITECH
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
 CUSTOMER PORTAL         AGENT PORTAL          ADMIN PANEL
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                         FRONTEND
                              │
                           REST API
                              │
                         BACKEND
                              │
       ┌──────────────┬───────┼────────┬──────────────┐
       │              │       │        │              │
    Products        Orders  Inventory Revenue       Users
       │              │       │        │              │
       └──────────────┴───────┼────────┴──────────────┘
                              │
                         PostgreSQL
                              │
              ┌───────────────┼────────────────┐
              │               │                │
            Redis          Object Storage   Background Jobs
              │
           BullMQ
```

---

# 7. Recommended Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

## Backend

- NestJS
- TypeScript
- REST API
- OpenAPI / Swagger

## Database

- PostgreSQL
- Prisma ORM

## Supporting Infrastructure

- Redis
- BullMQ
- S3-compatible object storage
- Docker
- GitHub Actions
- Cloudflare
- AWS / suitable production infrastructure

## Testing

- Vitest
- Playwright

## Monitoring

- Sentry or equivalent error monitoring
- Structured application logs
- Audit logs
- Health checks

---

# 8. Architecture Strategy

## Modular Monolith

The initial backend should be a **modular monolith**, not a microservices architecture.

Suggested backend modules:

```text
auth
users
organizations
customers
agents
products
categories
inventory
orders
quotes
shipments
invoices
payments
commissions
notifications
reports
audit
settings
```

Each module should have clear ownership of its business logic.

Microservices can be considered later if there is a demonstrated operational or scaling requirement.

---

# 9. Frontend Structure

A single Next.js application can initially contain role-specific experiences.

Suggested structure:

```text
/app

  /(public)
    /products
    /categories
    /about
    /contact

  /(customer)
    /dashboard
    /products
    /cart
    /orders
    /quotes
    /invoices
    /profile

  /(agent)
    /dashboard
    /customers
    /orders
    /sales
    /targets
    /commissions

  /(admin)
    /dashboard
    /products
    /categories
    /customers
    /organizations
    /agents
    /orders
    /inventory
    /shipments
    /invoices
    /payments
    /reports
    /settings
```

The actual application structure may change as implementation begins.

---

# 10. Core Business Modules

## 10.1 Authentication & Authorization

Responsibilities:

- Login
- Logout
- Registration
- Password management
- Refresh tokens
- Role-based access control
- Permission management
- Session security

Initial roles:

```text
SUPER_ADMIN
ADMIN
SALES_MANAGER
AGENT
CUSTOMER
```

Authorization should eventually support permissions rather than relying only on roles.

Examples:

```text
PRODUCT_CREATE
PRODUCT_UPDATE
PRODUCT_DELETE

ORDER_VIEW
ORDER_CREATE
ORDER_UPDATE
ORDER_CANCEL

CUSTOMER_VIEW
CUSTOMER_UPDATE

REPORT_REVENUE_VIEW
```

---

# 11. Product Catalog

The product catalog is one of the most important modules.

Product information may include:

```text
Product
├── Product Name
├── SKU / Product Code
├── Category
├── Short Description
├── Long Description
├── Product Images
├── Specifications
├── Features
├── Applications
├── Pricing
├── Availability
├── Documents
├── Certificates
├── Status
└── Related Products
```

Potential future information:

```text
Batch / Lot
Expiry
Manufacturer
Regulatory Information
Packaging
Unit of Measure
Storage Requirements
```

---

# 12. Product Categories

Categories should support structured product discovery.

Example:

```text
Medical Products
│
├── I.V. Infusion
│   ├── Standard Infusion Sets
│   ├── Micro Sets
│   ├── Filter Sets
│   └── Specialty Sets
│
├── Extension Lines
│   ├── Low Pressure
│   └── High Pressure
│
├── Connectors
│   ├── Needle-Free Connectors
│   └── Other Connectors
│
├── Stop Cocks
│
├── Vial Access
│
└── Other Products
```

The final taxonomy must be defined with the client.

---

# 13. Customer & Organization Management

A B2B customer model should support organizations.

Recommended structure:

```text
Organization
    │
    ├── Users
    ├── Addresses
    ├── Contacts
    ├── Orders
    ├── Quotes
    ├── Invoices
    └── Payments
```

This is preferable to assuming every buyer is an individual.

Potential organization fields:

- Legal name
- Trade name
- Organization type
- GST information
- Tax information
- Billing address
- Shipping address
- Contact persons
- Credit terms
- Customer status
- Assigned agent

---

# 14. Agent Management

Agents may be assigned:

- Customers
- Organizations
- Territories
- Sales targets
- Product portfolios

Agent performance can include:

```text
Revenue
Orders
Customers
New Customers
Target Achievement
Commission
Conversion
```

---

# 15. Quote Management

Because this is a B2B medical-products platform, quotation support should be considered a first-class feature.

Potential workflow:

```text
Customer
   ↓
Request Quote
   ↓
Sales Agent / Admin
   ↓
Review Requirement
   ↓
Prepare Quote
   ↓
Customer Approval
   ↓
Convert to Order
```

A quote may contain:

- Products
- Quantity
- Unit price
- Discount
- Taxes
- Shipping
- Validity date
- Payment terms
- Notes

---

# 16. Order Management

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

Every important transition should be recorded in an order-status history.

---

# 17. Inventory Management

Inventory should eventually support:

```text
Product
   ↓
Warehouse
   ↓
Stock
   ↓
Stock Movements
```

Potential operations:

- Stock received
- Stock reserved
- Stock released
- Stock dispatched
- Stock adjusted
- Stock returned
- Stock transferred

Important future consideration:

```text
Product
  ↓
Batch / Lot
  ↓
Expiry Date
  ↓
Warehouse
  ↓
Stock
```

This should be evaluated before finalizing the database model because medical products may require batch/lot and expiry traceability.

---

# 18. Shipment & Delivery

Shipment management may include:

- Shipment creation
- Courier/logistics provider
- Tracking number
- Dispatch date
- Expected delivery
- Delivery status
- Proof of delivery
- Delivery address
- Delivery history

Potential lifecycle:

```text
Packed
  ↓
Dispatched
  ↓
In Transit
  ↓
Out for Delivery
  ↓
Delivered
```

---

# 19. Invoice & Payment Management

The system should separate:

**Order**

from

**Invoice**

from

**Payment**

Example:

```text
Order
  ↓
Invoice
  ↓
Payment
```

Payment methods may include:

- Online payment
- Bank transfer
- UPI
- Credit terms
- Other offline payment

Payment statuses:

```text
PENDING
PARTIAL
PAID
FAILED
REFUNDED
```

The final financial model must be validated with the client's accounting process.

---

# 20. Revenue & Analytics

Revenue dashboards may include:

```text
Total Revenue
Monthly Revenue
Daily Revenue
Orders
Average Order Value
Top Products
Top Customers
Agent Revenue
Revenue by Category
Revenue by Region
Outstanding Payments
```

Revenue calculations must have a clearly defined business definition.

For example:

```text
Gross Revenue
- Discounts
- Returns
- Adjustments
----------------
Net Revenue
```

Tax treatment and accounting definitions should be confirmed before implementation.

---

# 21. Dashboard Design

## Customer

Focus on:

- Products
- Recent orders
- Order status
- Quotes
- Invoices
- Quick actions

## Agent

Focus on:

- Today's activity
- Orders
- Customers
- Revenue
- Targets
- Follow-ups

## Admin

Focus on:

- Revenue
- Orders
- Customers
- Inventory
- Agents
- Operational alerts
- Business trends

---

# 22. Notification System

Notifications should be abstracted behind a notification service.

Potential channels:

```text
Notification Service
       │
       ├── Email
       ├── SMS
       ├── WhatsApp
       └── In-App
```

Events may include:

- Account created
- Quote received
- Quote approved
- Order placed
- Order confirmed
- Order dispatched
- Order delivered
- Payment received
- Low inventory
- Important system alerts

---

# 23. Background Processing

Use background jobs for operations that should not block API requests.

Example:

```text
Order Created
     │
     ├── Send Email
     ├── Send WhatsApp
     ├── Notify Agent
     ├── Generate Invoice
     └── Update Analytics
```

Redis + BullMQ can support this architecture.

---

# 24. Document Management

Potential documents:

- Product brochures
- Technical specifications
- Product certificates
- Compliance documents
- Invoices
- Purchase orders
- Other business documents

Files should be stored in object storage rather than directly in PostgreSQL.

Database stores metadata such as:

```text
document_id
entity_type
entity_id
file_name
mime_type
storage_key
uploaded_by
created_at
```

---

# 25. Audit Logging

The system should maintain audit history for important business operations.

Examples:

```text
Product price changed
Order status changed
Customer updated
Inventory adjusted
Invoice modified
User permissions changed
```

Example audit record:

```text
Order #1234
Created by: Agent A
Confirmed by: Admin B
Packed by: Warehouse C
Dispatched by: Admin B
Delivered
```

This provides accountability and simplifies troubleshooting.

---

# 26. Security Principles

Security should be considered from the beginning.

Key principles:

- HTTPS everywhere
- Secure password hashing
- Short-lived access tokens
- Refresh token rotation/revocation strategy
- RBAC/permissions
- Input validation
- Server-side authorization
- Rate limiting
- Secure file access
- Audit logging
- Secrets outside source control
- Database backups
- Least-privilege access
- Secure error handling

Never rely on frontend authorization.

---

# 27. Data Model — Initial Domain

A high-level conceptual model:

```text
User
 │
 ├── Role
 ├── Organization
 └── Agent profile

Organization
 │
 ├── Users
 ├── Addresses
 ├── Orders
 ├── Quotes
 └── Invoices

Product
 │
 ├── Category
 ├── Images
 ├── Documents
 ├── Pricing
 └── Inventory

Order
 │
 ├── Customer / Organization
 ├── Agent
 ├── Order Items
 ├── Shipment
 ├── Invoice
 ├── Payments
 └── Status History

Inventory
 │
 ├── Product
 ├── Warehouse
 └── Stock Movements
```

This is conceptual only and should not yet be treated as the final database schema.

---

# 28. Design System

The visual direction is:

## Clinical Precision

Primary brand:

```text
Clinical Navy   #123B4A
Medical Teal    #087F8C
Medical Aqua    #39A9B6
```

Neutral foundation:

```text
Canvas          #F7FAFA
Surface         #FFFFFF
Primary Text    #16323D
Secondary Text  #536B73
Border          #DCE7E9
```

Typography:

```text
Inter
```

Iconography:

```text
Lucide
```

Design characteristics:

- Clean
- Precise
- Calm
- Professional
- Medical
- Trustworthy
- Data-driven

Customer portal should be spacious and product-focused.

Admin portal should be denser and operational.

Agent portal should be action-focused.

The complete visual system is documented separately in:

**AyursurgiTech Design System v1.0**

---

# 29. API Strategy

Use versioned REST APIs.

Example:

```text
/api/v1/auth
/api/v1/users
/api/v1/organizations

/api/v1/products
/api/v1/categories

/api/v1/customers
/api/v1/agents

/api/v1/quotes
/api/v1/orders
/api/v1/shipments

/api/v1/inventory

/api/v1/invoices
/api/v1/payments

/api/v1/reports
```

API documentation should be generated using OpenAPI/Swagger.

---

# 30. Repository Strategy

Recommended monorepo:

```text
ayursurgitech/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   └── config/
│
├── infrastructure/
│
├── docs/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

The exact structure can evolve during implementation.

---

# 31. Development Environments

At minimum:

```text
Development
    ↓
Staging
    ↓
Production
```

Never use production data casually in development.

Environment-specific configuration should be separated.

---

# 32. Local Development

Recommended local infrastructure:

```text
Docker Compose
    │
    ├── PostgreSQL
    └── Redis
```

Application services:

```text
Next.js
NestJS
```

A new developer should ideally be able to clone the repository and start the core stack with a small number of commands.

---

# 33. CI/CD

Recommended pipeline:

```text
Git Push
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Build
   ↓
E2E Tests
   ↓
Deploy Staging
   ↓
Approval
   ↓
Production
```

GitHub Actions can manage the pipeline.

---

# 34. Testing Strategy

## Unit Tests

Focus on business rules:

- Pricing
- Discounts
- Order totals
- Permissions
- Inventory calculations
- Commission calculations
- Status transitions

## Integration Tests

Test:

- Database interactions
- APIs
- Authentication
- Authorization
- Order workflows

## End-to-End Tests

Important flows:

```text
Customer registration
Product browsing
Quote request
Order placement
Agent order creation
Admin order processing
Shipment tracking
Payment update
```

---

# 35. Business Invariants

The system should protect important rules.

Examples:

```text
An agent cannot access another agent's restricted customers.

A customer cannot modify a confirmed order without an approved workflow.

An order cannot be marked Delivered before it is Dispatched.

Inventory should not become negative unless explicitly permitted.

Unauthorized users cannot change product pricing.

Revenue must remain consistent after cancellation/refund adjustments.
```

These rules should be represented in backend business logic and tests.

---

# 36. Search Strategy

Start with PostgreSQL search.

Search may cover:

- Product name
- Product code
- Category
- Product description
- Relevant attributes

Do not introduce Elasticsearch/OpenSearch unless actual requirements justify it.

---

# 37. Scalability Strategy

The initial architecture should be intentionally simple.

Start with:

```text
Next.js
   ↓
NestJS Modular Monolith
   ↓
PostgreSQL
   +
Redis
```

Scale only when necessary.

Potential future evolution:

```text
Transactional DB
      ↓
Events / ETL
      ↓
Analytics Platform
```

Microservices should be introduced only when there is a real operational reason.

---

# 38. Future Features

Potential future capabilities:

- Batch/lot tracking
- Expiry tracking
- Multi-warehouse support
- Advanced procurement
- Purchase orders
- Customer-specific pricing
- Credit management
- Advanced commissions
- Territory management
- WhatsApp integration
- SMS integration
- Advanced analytics
- AI customer support
- AI sales assistant
- Demand forecasting
- Product recommendations
- Document intelligence

These should not unnecessarily complicate V1.

---

# 39. AI Opportunities

Because the broader technology initiative includes AI capabilities, AyursurgiTech can later incorporate AI in controlled areas.

Potential use cases:

### Customer Support

```text
Customer Question
      ↓
AI Assistant
      ↓
Product / Order Knowledge
      ↓
Answer
```

### Sales Assistance

```text
Customer requirement
      ↓
AI product matching
      ↓
Relevant products
      ↓
Agent recommendation
```

### Product Search

Natural-language search such as:

> “Show me infusion sets with an in-line filter.”

### Business Intelligence

Questions such as:

> “Which products generated the highest revenue this quarter?”

AI should be introduced after the underlying product, order, inventory, and analytics data models are reliable.

---

# 40. Non-Functional Requirements

The platform should target:

## Performance

- Fast initial page loads
- Efficient API responses
- Pagination for large datasets
- Optimized product imagery
- Appropriate caching

## Reliability

- Database backups
- Error monitoring
- Health checks
- Graceful failure handling
- Auditability

## Security

- RBAC
- Input validation
- Secure authentication
- Secure file handling
- HTTPS
- Rate limiting
- Audit logs

## Maintainability

- TypeScript
- Modular architecture
- Automated tests
- Documentation
- Design system
- Code standards
- CI/CD

---

# 41. MVP Scope

A sensible initial MVP could contain:

### Authentication

- Login
- Registration
- Roles
- Permissions

### Product Catalog

- Categories
- Products
- Images
- Specifications
- Search
- Product details

### Customer

- Organization profile
- Product browsing
- Cart
- Quote request
- Order placement
- Order history

### Agent

- Dashboard
- Customers
- Create orders
- Order tracking
- Sales metrics

### Admin

- Dashboard
- Products
- Categories
- Customers
- Agents
- Orders
- Basic inventory
- Basic revenue reporting

### Infrastructure

- PostgreSQL
- Redis if needed
- Object storage
- Docker
- CI/CD
- Monitoring

---

# 42. V1 Should Not Overreach

Avoid building everything at once.

Do not initially over-engineer:

- Microservices
- Advanced data warehouse
- Complex AI
- Elasticsearch
- Complex workflow engines
- Multi-country tax engines
- Advanced logistics integrations

Build the core business workflow first.

---

# 43. Recommended Development Phases

## Phase 0 — Discovery & Foundation

```text
Business requirements
Domain model
Design system
Architecture
Repository setup
Development standards
```

## Phase 1 — Identity & Catalog

```text
Authentication
Users
Roles
Organizations
Categories
Products
Product media
```

## Phase 2 — Customer Commerce

```text
Customer portal
Product search
Product details
Cart
Quotes
Orders
```

## Phase 3 — Agent Operations

```text
Agent portal
Customers
Orders
Sales
Targets
Commissions
```

## Phase 4 — Admin Operations

```text
Admin dashboard
Order management
Inventory
Shipment
Customer management
Agent management
```

## Phase 5 — Finance & Analytics

```text
Invoices
Payments
Revenue
Reports
Performance dashboards
```

## Phase 6 — Optimization

```text
Notifications
Caching
Background jobs
Performance
Security hardening
Observability
```

## Phase 7 — Advanced Capabilities

```text
AI
Advanced analytics
Batch/expiry
Multi-warehouse
Advanced integrations
```

---

# 44. Key Decisions Required From Client

Before final database and workflow implementation, clarify:

1. Is Ayursurgi the manufacturer, distributor, or both?
2. Who are the actual customers?
3. Can customers purchase directly?
4. Is quotation mandatory for certain products?
5. Is online payment required?
6. Are credit terms supported?
7. Is customer-specific pricing required?
8. Are agents assigned to customers?
9. Are agents assigned territories?
10. Is commission calculated?
11. Is inventory tracked in the application?
12. Are multiple warehouses required?
13. Is batch/lot tracking required?
14. Is expiry tracking required?
15. Are product certificates stored?
16. Is GST/invoicing handled inside the system?
17. Is shipment tracking integrated with a courier?
18. Are returns supported?
19. Is partial shipment supported?
20. Can orders be partially fulfilled?
21. Are purchase orders uploaded by customers?
22. Are there approval workflows for organizations?
23. Are there minimum order quantities?
24. Is customer-specific MOQ required?
25. Are product prices publicly visible?
26. Is pricing different for agents/customers?
27. What notification channels are required?
28. Is WhatsApp required?
29. What reports does management currently use?
30. What existing ERP/accounting system, if any, must integrate?

These decisions should be documented before locking the database schema.

---

# 45. Definition of Done — Product Module Example

A product module should not be considered complete merely because CRUD works.

A production-ready product module should cover:

```text
✓ Create
✓ Read
✓ Update
✓ Archive/Delete strategy
✓ Validation
✓ Permissions
✓ Images
✓ Documents
✓ Search
✓ Filtering
✓ Pagination
✓ Status
✓ Audit history
✓ Error handling
✓ Loading states
✓ Empty states
✓ Responsive UI
✓ Accessibility
✓ API tests
✓ Business-rule tests
```

---

# 46. Project Principles

## Principle 1 — Business First

Technology should support the business workflow.

## Principle 2 — Domain Before Database

Understand the business domain before finalizing schemas.

## Principle 3 — Modular Architecture

Keep business modules independent and understandable.

## Principle 4 — Security by Design

Authorization is a backend responsibility.

## Principle 5 — Design Consistency

The design system is the visual contract.

## Principle 6 — Avoid Premature Complexity

Prefer a modular monolith until scaling requirements justify otherwise.

## Principle 7 — Audit Important Actions

Important business changes must be traceable.

## Principle 8 — Data Quality Matters

Analytics are only useful when business definitions and source data are trustworthy.

## Principle 9 — Accessibility Is a Requirement

Accessibility is part of product quality, not an optional enhancement.

## Principle 10 — Build for Evolution

The architecture should make future capabilities possible without forcing unnecessary complexity into V1.

---

# 47. Initial Project Definition

### Product

**AyursurgiTech**

### Category

**B2B Medical Products & Distribution Platform**

### Core Value

**Digitize and simplify medical-product sales, procurement, distribution, and business management.**

### Primary Interfaces

```text
Customer Portal
Agent Portal
Admin Panel
```

### Core Business Areas

```text
Catalog
Customers
Agents
Quotes
Orders
Inventory
Shipments
Invoices
Payments
Revenue
Analytics
Notifications
```

### Technical Foundation

```text
Next.js
React
TypeScript
NestJS
PostgreSQL
Prisma
Redis
Docker
```

### Design Direction

```text
Clinical Precision
```

### Primary Brand Color

```text
#087F8C
```

### Primary Typeface

```text
Inter
```

---

# 48. Final Product Statement

AyursurgiTech is intended to become a **professional digital operating platform for medical-product distribution**, connecting products, customers, sales agents, orders, inventory, logistics, payments, and business intelligence in one system.

The initial implementation should remain focused on the core business workflow while establishing strong foundations for:

- Security
- Scalability
- Maintainability
- Auditability
- Analytics
- Future AI capabilities

The project should evolve from a reliable operational platform into a broader digital ecosystem as real business requirements emerge.

---

**Document Status:** Planning / Architecture Foundation  
**Version:** 1.0  
**Next Recommended Documents:**

1. `01-business-requirements.md`
2. `02-domain-model.md`
3. `03-functional-requirements.md`
4. `04-database-design.md`
5. `05-api-specification.md`
6. `06-architecture.md`
7. `07-authentication-authorization.md`
8. `08-order-workflow.md`
9. `09-inventory-workflow.md`
10. `10-design-system.md`
11. `11-development-guidelines.md`
12. `12-deployment-architecture.md`

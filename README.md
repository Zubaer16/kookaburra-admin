# Kookaburra Admin

A responsive commerce administration frontend for the Kookaburra single-vendor, multi-category international store.

## Technology

- Next.js 15 App Router, React 19 and TypeScript
- Tailwind CSS 4 and editable shadcn-style component primitives
- Radix UI dialogs and Lucide icons
- Zustand with browser-local persistence for interface prototyping
- Playwright for end-to-end user interaction testing

## Quick start

Requires **Node.js 24** and npm.

```powershell
npm install --include=dev
npm run dev
```

Open <http://localhost:3000>. The root route opens the dashboard.

## Current sections

- **Dashboard:** summary KPIs, illustrative sales trend, alerts, recent orders
- **Products:** search, filter, create/edit products, size/color/SKU variants, image references and preview stock totals
- **Categories:** add, edit, nest subcategories and delete only unused leaf categories
- **Inventory:** simulate product or variant-level stock adjustments with a recent-activity list
- **Orders:** itemized order details, forward-only fulfillment transitions, local shipment tracking, cancellation, return decisions, refund preview and activity timeline
- **Customers:** view sample customer profiles and sales history
- **Promotions:** locally manage coupons and marketing campaigns with USD discount previews
- **Store content:** edit sample hero banners and featured product collections
- **Shipping & taxes:** configure local-only international zones, sample rates, thresholds and illustrative tax rules
- **Payment reporting:** search/filter read-only, fictional payment examples; never real Stripe transactions

All UI text is English, and all displayed prices use USD. No special Bangladesh market mode exists.

## Important limitation

This is a **frontend-only workspace**. It does not authenticate administrators, enforce real permissions, process transactions, connect to Stripe or update a server database. Sample records and edits are saved to **localStorage in your own browser**. They are not shared between devices and must not be used as real merchant operations. Use **Reset sample data** in the navigation to restore the seed records.

Do not publicly deploy this preview as a functioning administration system. Real staff authentication, role-based access control, sensitive-data protection, audit logs, inventory integrity and payment administration require backend integration.

## Promotions and content previews

See [Merchandising workflows](docs/MERCHANDISING.md). Editing a banner or coupon never changes the public storefront.

## Shipping and payments preview

See [shipping, tax and payment contract notes](docs/SHIPPING_PAYMENT_PREVIEWS.md) and the [two-frontend compatibility audit](docs/CROSS_FRONTEND_ALIGNMENT.md). Admin preview policies are **not transmitted to the Storefront**, whose checkout still uses fixed sample fees.

## Quality checks

```powershell
npm run verify
npm run verify:merchandising
npm run verify:commerce
npm run typecheck
npm run lint
npm run build
# Or run all four with:
npm run check
```

### Browser automation

```powershell
npx playwright install chromium
npm run test:e2e:visual
npm run test:e2e:report
```

Visual testing uses **900 ms after each recorded interaction**, sequential Chromium tests, an initial viewport of 1120 × 600, and starts a development server automatically on port 3101.

Optional terminal overrides:

```powershell
$env:E2E_DELAY_MS="900"
$env:E2E_VIEWPORT_WIDTH="1160"
$env:E2E_VIEWPORT_HEIGHT="620"
npm run test:e2e:visual
```

## Architecture

The admin and customer storefront are separate Next.js applications. Eventually both must consume the same versioned, independent REST API. See [architecture notes](docs/ARCHITECTURE.md).

## Order workflow details

See [Order workflows](docs/ORDER_WORKFLOWS.md) for fulfillment transitions, shipment previews, returns and refund limits. All workflows are simulated locally; no real carrier or payment actions occur.

## Catalog workflow details

See [Catalog workflows](docs/CATALOG_WORKFLOWS.md) for product variants, SKU validation, hierarchy and media reference behavior.

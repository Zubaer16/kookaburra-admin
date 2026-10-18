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
- **Products:** search, filter, create, edit and remove sample products
- **Categories:** add and remove empty categories
- **Inventory:** simulate stock adjustments with a recent-activity list
- **Orders:** view sample line items and change preview order status
- **Customers:** view sample customer profiles and sales history

All UI text is English, and all displayed prices use USD. No special Bangladesh market mode exists.

## Important limitation

This is a **frontend-only workspace**. It does not authenticate administrators, enforce real permissions, process transactions, connect to Stripe or update a server database. Sample records and edits are saved to **localStorage in your own browser**. They are not shared between devices and must not be used as real merchant operations. Use **Reset sample data** in the navigation to restore the seed records.

Do not publicly deploy this preview as a functioning administration system. Real staff authentication, role-based access control, sensitive-data protection, audit logs, inventory integrity and payment administration require backend integration.

## Quality checks

```powershell
npm run verify
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

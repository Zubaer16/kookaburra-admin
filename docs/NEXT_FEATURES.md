# Admin frontend roadmap

This repository intentionally starts with a polished, testable frontend foundation. Subsequent frontend work, **before backend implementation**, includes:

1. **Implemented frontend previews:** size/color/SKU product variants, stock adjustment per variant, image references, nested category management and field validation. Remaining: real media uploads, bulk actions and publishing governance.
2. **Implemented frontend preview:** order details, shipment references, activity timeline, guarded status transitions, reasoned cancellation, return decisions, capped refund records. Remaining: real carrier integrations, financial settlement, per-line return eligibility and server audit enforcement.
3. **Implemented frontend previews:** coupons, campaigns, hero banners and featured collections. Remaining: shipping zones/rates, tax settings, payment reporting and real storefront publishing once a backend exists.
4. Staff/role screens with visual permission matrix (server enforcement later), global settings and reporting.
5. Accessibility, keyboard navigation, mobile/tablet layouts, error/empty/loading states and exhaustive Playwright E2E coverage.
6. Final design QA and acceptance. Only then start backend work with explicit user authorization.

Shared-store backend and real Stripe sandbox payments are **not implemented** in the current frontend.

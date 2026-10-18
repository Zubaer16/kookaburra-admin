# Admin frontend roadmap

This repository intentionally starts with a polished, testable frontend foundation. Subsequent frontend work, **before backend implementation**, includes:

1. Product variant management: size/color/SKU combinations, media, bulk actions, draft publishing, and field validation.
2. Order workflows: detail view, delivery/return/refund interfaces, shipping timelines and guarded status transitions.
3. Promotions, website content management (hero banners and merchandising), shipping zones/rates, tax settings and payment reporting UI.
4. Staff/role screens with visual permission matrix (server enforcement later), global settings and reporting.
5. Accessibility, keyboard navigation, mobile/tablet layouts, error/empty/loading states and exhaustive Playwright E2E coverage.
6. Final design QA and acceptance. Only then start backend work with explicit user authorization.

Shared-store backend and real Stripe sandbox payments are **not implemented** in the current frontend.

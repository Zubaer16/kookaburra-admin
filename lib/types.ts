export type ProductStatus = 'Active' | 'Draft'
export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'

/** All catalog changes are browser-local previews until a backend is introduced. */
export type ProductVariant = {
  id: string
  sku: string
  size: string
  color: string
  stock: number
}
export type ProductMedia = { id: string; url: string; alt: string }
export type Product = {
  id: string
  name: string
  sku: string
  categoryId: string
  price: number
  stock: number
  status: ProductStatus
  color: string
  createdAt: string
  variants?: ProductVariant[]
  images?: ProductMedia[]
}
export type Category = {
  id: string
  name: string
  slug: string
  description: string
  color: string
  parentId?: string | null
}
export type Customer = {
  id: string
  name: string
  email: string
  location: string
  joinedAt: string
}
export type ShipmentPreview = {
  carrier: string
  trackingNumber: string
  service: string
  estimatedDelivery: string
  updatedAt: string
}
export type OrderTimelineEvent = {
  id: string
  at: string
  title: string
  detail: string
}
export type ReturnDecision = 'Requested' | 'Approved' | 'Rejected'
export type ReturnPreview = {
  id: string
  reason: string
  status: ReturnDecision
  requestedAt: string
  resolvedAt?: string
}
export type RefundRecord = {
  id: string
  amount: number
  note: string
  at: string
}
export type Order = {
  id: string
  customerId: string
  items: { productId: string; name: string; qty: number; price: number }[]
  status: OrderStatus
  createdAt: string
  channel: 'Web' | 'Mobile'
  country: string
  shipment?: ShipmentPreview
  timeline?: OrderTimelineEvent[]
  cancellationReason?: string
  returnRequest?: ReturnPreview
  refunds?: RefundRecord[]
}
export type StockEvent = {
  id: string
  productId: string
  variantId?: string
  delta: number
  note: string
  at: string
}
export type ProductInput = Omit<Product, 'id' | 'createdAt'>

/** Marketing records are local-only editor previews, never live promotions. */
export type Promotion = {
  id: string
  code: string
  kind: 'percent' | 'fixed'
  value: number
  minimumUsd: number
  capUsd: number
  limit: number
  startDate: string
  endDate: string
  scope: 'all' | 'category'
  categoryId: string
  enabled: boolean
}
export type Campaign = {
  id: string
  title: string
  slug: string
  status: 'Draft' | 'Scheduled' | 'Active' | 'Paused'
  startDate: string
  endDate: string
  description: string
}
export type StoreBanner = {
  id: string
  headline: string
  subtitle: string
  ctaText: string
  ctaHref: string
  imageUrl: string
  position: number
  enabled: boolean
}
export type FeaturedCollection = {
  id: string
  title: string
  description: string
  productIds: string[]
  position: number
  enabled: boolean
}

/** Draft storefront delivery/tax policy. Never interpreted as live checkout eligibility. */
export type ShippingService = {
  kind: 'standard' | 'express'
  feeUsd: number
  freeOverUsd: number
  etaNote: string
  enabled: boolean
}
export type ShippingZone = {
  id: string
  name: string
  countries: string[]
  enabled: boolean
  services: ShippingService[]
}
export type TaxRule = {
  id: string
  country: string
  ratePercent: number
  note: string
  enabled: boolean
}

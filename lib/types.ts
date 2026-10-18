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

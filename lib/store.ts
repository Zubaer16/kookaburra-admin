'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Category,
  Product,
  ProductInput,
  Customer,
  Order,
  OrderStatus,
  StockEvent,
  ShipmentPreview,
} from './types'
import {
  canAdvanceStatus,
  canCancelOrder,
  canSaveShipment,
  canRequestReturn,
  canDecideReturn,
  validRefund,
} from './order-workflow'
import {
  stockOf,
  productValidationError,
  categoryParentWouldCycle,
} from './catalog'
import {
  seedCategories,
  seedProducts,
  seedCustomers,
  seedOrders,
} from './fixtures'

type AdminState = {
  products: Product[]
  categories: Category[]
  orders: Order[]
  customers: Customer[]
  stockEvents: StockEvent[]
  addProduct: (p: ProductInput) => string
  editProduct: (id: string, p: ProductInput) => void
  deleteProduct: (id: string) => void
  addCategory: (name: string, description: string, parentId?: string) => boolean
  updateCategory: (
    id: string,
    name: string,
    description: string,
    parentId?: string,
  ) => boolean
  deleteCategory: (id: string) => boolean
  adjustStock: (
    productId: string,
    delta: number,
    note: string,
    variantId?: string,
  ) => boolean
  updateOrderStatus: (id: string, status: OrderStatus) => boolean
  saveShipment: (
    id: string,
    shipment: Omit<ShipmentPreview, 'updatedAt'>,
  ) => boolean
  cancelOrder: (id: string, reason: string) => boolean
  requestReturn: (id: string, reason: string) => boolean
  decideReturn: (id: string, decision: 'Approved' | 'Rejected') => boolean
  recordRefund: (id: string, amount: number, note: string) => boolean
  resetPreview: () => void
}
const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const base = () => ({
  products: seedProducts.map((p) => ({
    ...p,
    variants: p.variants?.map((v) => ({ ...v })),
    images: p.images?.map((i) => ({ ...i })),
  })),
  categories: seedCategories.map((c) => ({ ...c })),
  orders: seedOrders.map((o) => ({
    ...o,
    items: o.items.map((i) => ({ ...i })),
    timeline: [],
    refunds: [],
  })),
  customers: seedCustomers.map((c) => ({ ...c })),
  stockEvents: [] as StockEvent[],
})
function sanitizeProduct(input: ProductInput): ProductInput {
  const variants =
    input.variants?.map((v) => ({
      ...v,
      id: v.id || newId('var'),
      sku: v.sku.trim(),
      size: v.size.trim(),
      color: v.color.trim(),
    })) ?? []
  const images =
    input.images?.map((i) => ({
      ...i,
      id: i.id || newId('media'),
      url: i.url.trim(),
      alt: i.alt.trim(),
    })) ?? []
  return {
    ...input,
    name: input.name.trim(),
    sku: input.sku.trim(),
    variants,
    images,
    stock: variants.length
      ? variants.reduce((n, v) => n + v.stock, 0)
      : input.stock,
  }
}
export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      ...base(),
      addProduct: (input) => {
        if (
          !get().categories.some((c) => c.id === input.categoryId) ||
          productValidationError(input, get().products)
        )
          return ''
        const id = newId('product')
        set((s) => ({
          products: [
            {
              ...sanitizeProduct(input),
              id,
              createdAt: new Date().toISOString(),
            },
            ...s.products,
          ],
        }))
        return id
      },
      editProduct: (id, input) => {
        if (
          !get().categories.some((c) => c.id === input.categoryId) ||
          productValidationError(input, get().products, id)
        )
          return
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...sanitizeProduct(input) } : p,
          ),
        }))
      },
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      addCategory: (name, description, parentId) => {
        const clean = name.trim()
        const slug = clean
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        if (
          !clean ||
          !slug ||
          get().categories.some((c) => c.slug === slug) ||
          (parentId && !get().categories.some((c) => c.id === parentId))
        )
          return false
        set((s) => ({
          categories: [
            ...s.categories,
            {
              id: newId('cat'),
              name: clean,
              slug,
              description: description.trim(),
              color: '#e5e7eb',
              parentId: parentId || null,
            },
          ],
        }))
        return true
      },
      updateCategory: (id, name, description, parentId) => {
        const existing = get().categories.find((c) => c.id === id)
        const clean = name.trim()
        const slug = clean
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        if (
          !existing ||
          !slug ||
          get().categories.some((c) => c.id !== id && c.slug === slug) ||
          (parentId && !get().categories.some((c) => c.id === parentId)) ||
          categoryParentWouldCycle(id, parentId, get().categories)
        )
          return false
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: clean,
                  slug,
                  description: description.trim(),
                  parentId: parentId || null,
                }
              : c,
          ),
        }))
        return true
      },
      deleteCategory: (id) => {
        if (
          get().products.some((p) => p.categoryId === id) ||
          get().categories.some((c) => c.parentId === id)
        )
          return false
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
        return true
      },
      adjustStock: (productId, delta, note, variantId) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product || !Number.isInteger(delta) || delta === 0) return false
        const hasVariants = !!product.variants?.length
        if (hasVariants) {
          const variant = product.variants?.find((v) => v.id === variantId)
          if (!variant || variant.stock + delta < 0) return false
        } else if (variantId || stockOf(product) + delta < 0) return false
        set((s) => ({
          products: s.products.map((p) => {
            if (p.id !== productId) return p
            if (hasVariants) {
              const variants = (p.variants ?? []).map((v) =>
                v.id === variantId ? { ...v, stock: v.stock + delta } : v,
              )
              return {
                ...p,
                variants,
                stock: variants.reduce((sum, v) => sum + v.stock, 0),
              }
            }
            return { ...p, stock: p.stock + delta }
          }),
          stockEvents: [
            {
              id: newId('stock'),
              productId,
              variantId,
              delta,
              note: note.trim() || 'Manual adjustment',
              at: new Date().toISOString(),
            },
            ...s.stockEvents,
          ].slice(0, 100),
        }))
        return true
      },
      updateOrderStatus: (id, status) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order || !canAdvanceStatus(order.status, status)) return false
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== id
              ? o
              : {
                  ...o,
                  status,
                  timeline: [
                    {
                      id: newId('event'),
                      at: new Date().toISOString(),
                      title: `Status: ${status}`,
                      detail: `Advanced from ${o.status}`,
                    },
                    ...(o.timeline ?? []),
                  ],
                },
          ),
        }))
        return true
      },
      saveShipment: (id, values) => {
        const order = get().orders.find((o) => o.id === id)
        if (
          !order ||
          !canSaveShipment(order) ||
          !values.carrier.trim() ||
          !values.trackingNumber.trim()
        )
          return false
        const at = new Date().toISOString()
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== id
              ? o
              : {
                  ...o,
                  status: 'Shipped',
                  shipment: {
                    carrier: values.carrier.trim(),
                    trackingNumber: values.trackingNumber.trim(),
                    service: values.service.trim(),
                    estimatedDelivery: values.estimatedDelivery,
                    updatedAt: at,
                  },
                  timeline: [
                    {
                      id: newId('event'),
                      at,
                      title: 'Shipment saved',
                      detail: `${values.carrier.trim()} · ${values.trackingNumber.trim()}`,
                    },
                    ...(o.timeline ?? []),
                  ],
                },
          ),
        }))
        return true
      },
      cancelOrder: (id, reason) => {
        const order = get().orders.find((o) => o.id === id)
        const clean = reason.trim()
        if (!order || !canCancelOrder(order) || clean.length < 5) return false
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== id
              ? o
              : {
                  ...o,
                  status: 'Cancelled',
                  cancellationReason: clean,
                  timeline: [
                    {
                      id: newId('event'),
                      at: new Date().toISOString(),
                      title: 'Order cancelled',
                      detail: clean,
                    },
                    ...(o.timeline ?? []),
                  ],
                },
          ),
        }))
        return true
      },
      requestReturn: (id, reason) => {
        const order = get().orders.find((o) => o.id === id)
        const clean = reason.trim()
        if (!order || !canRequestReturn(order) || clean.length < 5) return false
        const at = new Date().toISOString()
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== id
              ? o
              : {
                  ...o,
                  returnRequest: {
                    id: newId('return'),
                    reason: clean,
                    status: 'Requested',
                    requestedAt: at,
                  },
                  timeline: [
                    {
                      id: newId('event'),
                      at,
                      title: 'Return requested',
                      detail: clean,
                    },
                    ...(o.timeline ?? []),
                  ],
                },
          ),
        }))
        return true
      },
      decideReturn: (id, decision) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order || !canDecideReturn(order)) return false
        const at = new Date().toISOString()
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== id
              ? o
              : {
                  ...o,
                  returnRequest: o.returnRequest
                    ? { ...o.returnRequest, status: decision, resolvedAt: at }
                    : undefined,
                  timeline: [
                    {
                      id: newId('event'),
                      at,
                      title: `Return ${decision.toLowerCase()}`,
                      detail: 'Decision saved in local preview only',
                    },
                    ...(o.timeline ?? []),
                  ],
                },
          ),
        }))
        return true
      },
      recordRefund: (id, amount, note) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order || !validRefund(order, amount) || note.trim().length < 3)
          return false
        const at = new Date().toISOString()
        const rounded = Math.round(amount * 100) / 100
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id !== id
              ? o
              : {
                  ...o,
                  refunds: [
                    ...(o.refunds ?? []),
                    {
                      id: newId('refund'),
                      amount: rounded,
                      note: note.trim(),
                      at,
                    },
                  ],
                  timeline: [
                    {
                      id: newId('event'),
                      at,
                      title: 'Refund preview recorded',
                      detail: `$${rounded.toFixed(2)} — ${note.trim()}`,
                    },
                    ...(o.timeline ?? []),
                  ],
                },
          ),
        }))
        return true
      },
      resetPreview: () => set(base()),
    }),
    {
      name: 'kookaburra-admin-local-preview-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      partialize: (s) => ({
        products: s.products,
        categories: s.categories,
        orders: s.orders,
        customers: s.customers,
        stockEvents: s.stockEvents,
      }),
    },
  ),
)

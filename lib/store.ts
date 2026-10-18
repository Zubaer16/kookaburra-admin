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
  Promotion,
  Campaign,
  StoreBanner,
  FeaturedCollection,
  ShippingZone,
  TaxRule,
} from './types'
import {
  canAdvanceStatus,
  canCancelOrder,
  canSaveShipment,
  canRequestReturn,
  canDecideReturn,
  validRefund,
} from './order-workflow'
import { shippingZoneError, taxRuleError } from './commerce-policy'
import {
  promotionError,
  campaignError,
  bannerError,
  collectionError,
  couponCode,
  campaignSlug,
} from './merchandising'
import {
  stockOf,
  productValidationError,
  categoryParentWouldCycle,
} from './catalog'
import {
  seedPromotions,
  seedCampaigns,
  seedBanners,
  seedCollections,
  seedShippingZones,
  seedTaxRules,
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
  promotions: Promotion[]
  campaigns: Campaign[]
  banners: StoreBanner[]
  collections: FeaturedCollection[]
  shippingZones: ShippingZone[]
  taxRules: TaxRule[]
  saveShippingZone: (input: ShippingZone) => string | null
  removeShippingZone: (id: string) => void
  saveTaxRule: (input: TaxRule) => string | null
  removeTaxRule: (id: string) => void
  savePromotion: (item: Promotion) => string | null
  removePromotion: (id: string) => void
  saveCampaign: (item: Campaign) => string | null
  removeCampaign: (id: string) => void
  saveBanner: (item: StoreBanner) => string | null
  removeBanner: (id: string) => void
  saveCollection: (item: FeaturedCollection) => string | null
  removeCollection: (id: string) => void
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
  promotions: seedPromotions.map((p) => ({ ...p })),
  campaigns: seedCampaigns.map((c) => ({ ...c })),
  banners: seedBanners.map((b) => ({ ...b })),
  collections: seedCollections.map((c) => ({
    ...c,
    productIds: [...c.productIds],
  })),
  shippingZones: seedShippingZones.map((z) => ({
    ...z,
    countries: [...z.countries],
    services: z.services.map((s) => ({ ...s })),
  })),
  taxRules: seedTaxRules.map((r) => ({ ...r })),
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
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          collections: s.collections.map((c) => {
            const productIds = c.productIds.filter((pid) => pid !== id)
            return {
              ...c,
              productIds,
              enabled: productIds.length > 0 && c.enabled,
            }
          }),
        })),
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
          get().categories.some((c) => c.parentId === id) ||
          get().promotions.some(
            (p) => p.scope === 'category' && p.categoryId === id,
          )
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
      savePromotion: (input) => {
        const current = get().promotions
        const item = {
          ...input,
          id: input.id || newId('promo'),
          code: couponCode(input.code),
          categoryId: input.scope === 'all' ? '' : input.categoryId,
        }
        const error = promotionError(item, current, get().categories)
        if (error) return error
        set((s) => ({
          promotions: s.promotions.some((p) => p.id === item.id)
            ? s.promotions.map((p) => (p.id === item.id ? item : p))
            : [item, ...s.promotions],
        }))
        return null
      },
      removePromotion: (id) =>
        set((s) => ({ promotions: s.promotions.filter((p) => p.id !== id) })),
      saveCampaign: (input) => {
        const item = {
          ...input,
          id: input.id || newId('camp'),
          title: input.title.trim(),
          slug: campaignSlug(input.title),
          description: input.description.trim(),
        }
        const error = campaignError(item, get().campaigns)
        if (error) return error
        set((s) => ({
          campaigns: s.campaigns.some((p) => p.id === item.id)
            ? s.campaigns.map((p) => (p.id === item.id ? item : p))
            : [item, ...s.campaigns],
        }))
        return null
      },
      removeCampaign: (id) =>
        set((s) => ({ campaigns: s.campaigns.filter((p) => p.id !== id) })),
      saveBanner: (input) => {
        const item = {
          ...input,
          id: input.id || newId('banner'),
          headline: input.headline.trim(),
          subtitle: input.subtitle.trim(),
          ctaText: input.ctaText.trim(),
          ctaHref: input.ctaHref.trim(),
          imageUrl: input.imageUrl.trim(),
        }
        const error = bannerError(item)
        if (error) return error
        set((s) => ({
          banners: s.banners.some((p) => p.id === item.id)
            ? s.banners.map((p) => (p.id === item.id ? item : p))
            : [item, ...s.banners],
        }))
        return null
      },
      removeBanner: (id) =>
        set((s) => ({ banners: s.banners.filter((p) => p.id !== id) })),
      saveCollection: (input) => {
        const item = {
          ...input,
          id: input.id || newId('collection'),
          title: input.title.trim(),
          description: input.description.trim(),
          productIds: [...input.productIds],
        }
        const error = collectionError(item, get().products, get().collections)
        if (error) return error
        set((s) => ({
          collections: s.collections.some((p) => p.id === item.id)
            ? s.collections.map((p) => (p.id === item.id ? item : p))
            : [item, ...s.collections],
        }))
        return null
      },
      removeCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((p) => p.id !== id) })),
      saveShippingZone: (input) => {
        const zone = {
          ...input,
          id: input.id || newId('zone'),
          name: input.name.trim(),
          countries: [...input.countries],
          services: input.services.map((s) => ({
            ...s,
            etaNote: s.etaNote.trim(),
          })),
        }
        const error = shippingZoneError(zone, get().shippingZones)
        if (error) return error
        set((s) => ({
          shippingZones: s.shippingZones.some((z) => z.id === zone.id)
            ? s.shippingZones.map((z) => (z.id === zone.id ? zone : z))
            : [...s.shippingZones, zone],
        }))
        return null
      },
      removeShippingZone: (id) =>
        set((s) => ({
          shippingZones: s.shippingZones.filter((z) => z.id !== id),
        })),
      saveTaxRule: (input) => {
        const rule = {
          ...input,
          id: input.id || newId('tax'),
          note: input.note.trim(),
        }
        const error = taxRuleError(rule, get().taxRules)
        if (error) return error
        set((s) => ({
          taxRules: s.taxRules.some((r) => r.id === rule.id)
            ? s.taxRules.map((r) => (r.id === rule.id ? rule : r))
            : [...s.taxRules, rule],
        }))
        return null
      },
      removeTaxRule: (id) =>
        set((s) => ({ taxRules: s.taxRules.filter((r) => r.id !== id) })),
      resetPreview: () => set(base()),
    }),
    {
      name: 'kookaburra-admin-local-preview-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AdminState>
        return {
          ...current,
          ...saved,
          promotions: Array.isArray(saved.promotions)
            ? saved.promotions
            : current.promotions,
          campaigns: Array.isArray(saved.campaigns)
            ? saved.campaigns
            : current.campaigns,
          banners: Array.isArray(saved.banners)
            ? saved.banners
            : current.banners,
          collections: Array.isArray(saved.collections)
            ? saved.collections
            : current.collections,
          shippingZones: Array.isArray(saved.shippingZones)
            ? saved.shippingZones
            : current.shippingZones,
          taxRules: Array.isArray(saved.taxRules)
            ? saved.taxRules
            : current.taxRules,
        }
      },
      partialize: (s) => ({
        products: s.products,
        categories: s.categories,
        orders: s.orders,
        customers: s.customers,
        stockEvents: s.stockEvents,
        promotions: s.promotions,
        campaigns: s.campaigns,
        banners: s.banners,
        collections: s.collections,
        shippingZones: s.shippingZones,
        taxRules: s.taxRules,
      }),
    },
  ),
)

import type { Customer, Order, Product, StockEvent } from './types'
import { orderTotal } from './fixtures'

/** Reporting is derived from browser-local order previews, NOT real payment ledger data. */
export type ReportPeriod = 'all' | 'last7' | 'last30' | 'custom'
export type ReportView = 'sales' | 'products' | 'inventory' | 'customers'
export type ReportFilter = { period: ReportPeriod; from?: string; to?: string }
export type ProductReport = {
  id: string
  name: string
  sku: string
  units: number
  orderValueUsd: number
  stock: number
  status: string
}
export type CustomerReport = {
  id: string
  name: string
  email: string
  country: string
  orderCount: number
  orderValueUsd: number
  joinedAt: string
}
export type DailyReport = { date: string; count: number; valueUsd: number }
export type ReportResult = {
  range: { from: string | null; to: string | null; reference: string }
  orders: Order[]
  placedCount: number
  cancelledCount: number
  nonCancelledCount: number
  bookedValueUsd: number
  refundPreviewUsd: number
  afterRefundPreviewUsd: number
  averageOrderValueUsd: number
  statusCounts: Record<Order['status'], number>
  byDay: DailyReport[]
  products: ProductReport[]
  customers: CustomerReport[]
  inventory: {
    totalUnits: number
    lowStock: number
    outOfStock: number
    events: StockEvent[]
  }
}

function validDay(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}
export function reportRangeError(filter: ReportFilter): string | null {
  if (filter.period !== 'custom') return null
  if (!validDay(filter.from) || !validDay(filter.to))
    return 'Choose valid From and To dates.'
  return filter.from > filter.to ? 'From date must not be after To date.' : null
}
function dayBefore(reference: string, n: number): string {
  const d = new Date(`${reference}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}
/** Relative windows use the latest preview order date so seed reports stay reproducible. */
export function reportRange(orders: Order[], filter: ReportFilter) {
  const reference =
    orders
      .map((o) => o.createdAt)
      .filter(validDay)
      .sort()
      .at(-1) ?? '2026-10-18'
  if (filter.period === 'all') return { from: null, to: null, reference }
  if (filter.period === 'last7')
    return { from: dayBefore(reference, 6), to: reference, reference }
  if (filter.period === 'last30')
    return { from: dayBefore(reference, 29), to: reference, reference }
  return { from: filter.from ?? null, to: filter.to ?? null, reference }
}
export function buildReports(
  orders: Order[],
  products: Product[],
  customers: Customer[],
  stockEvents: StockEvent[],
  filter: ReportFilter,
): ReportResult {
  const range = reportRange(orders, filter)
  const selected = orders.filter(
    (order) =>
      validDay(order.createdAt) &&
      (!range.from || order.createdAt >= range.from) &&
      (!range.to || order.createdAt <= range.to),
  )
  const eligible = selected.filter((o) => o.status !== 'Cancelled')
  const bookedValueUsd = eligible.reduce(
    (sum, order) => sum + orderTotal(order),
    0,
  )
  const refundPreviewUsd = eligible.reduce(
    (sum, order) =>
      sum + (order.refunds ?? []).reduce((s, r) => s + r.amount, 0),
    0,
  )
  const statusCounts: ReportResult['statusCounts'] = {
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  }
  const days = new Map<string, DailyReport>()
  const productsMap = new Map<string, ProductReport>(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        sku: p.sku,
        units: 0,
        orderValueUsd: 0,
        stock: p.variants?.length
          ? p.variants.reduce((s, v) => s + v.stock, 0)
          : p.stock,
        status: p.status,
      },
    ]),
  )
  for (const order of selected) statusCounts[order.status]++
  for (const order of eligible) {
    const day = days.get(order.createdAt) ?? {
      date: order.createdAt,
      count: 0,
      valueUsd: 0,
    }
    day.count++
    day.valueUsd += orderTotal(order)
    days.set(order.createdAt, day)
    for (const item of order.items) {
      const product = productsMap.get(item.productId) ?? {
        id: item.productId,
        name: item.name,
        sku: 'Archived product',
        units: 0,
        orderValueUsd: 0,
        stock: 0,
        status: 'Archived',
      }
      product.units += item.qty
      product.orderValueUsd += item.price * item.qty
      productsMap.set(item.productId, product)
    }
  }
  const customersMap = new Map<string, CustomerReport>(
    customers.map((c) => [
      c.id,
      {
        id: c.id,
        name: c.name,
        email: c.email,
        country: c.location,
        orderCount: 0,
        orderValueUsd: 0,
        joinedAt: c.joinedAt,
      },
    ]),
  )
  for (const order of eligible) {
    const customer = customersMap.get(order.customerId)
    if (!customer) continue
    customer.orderCount++
    customer.orderValueUsd += orderTotal(order)
  }
  const productRows = [...productsMap.values()].sort(
    (a, b) => b.orderValueUsd - a.orderValueUsd || a.name.localeCompare(b.name),
  )
  const customerRows = [...customersMap.values()].sort(
    (a, b) => b.orderValueUsd - a.orderValueUsd || a.name.localeCompare(b.name),
  )
  const stocks = products.map((p) =>
    p.variants?.length
      ? p.variants.reduce((sum, v) => sum + v.stock, 0)
      : p.stock,
  )
  return {
    range,
    orders: [...selected].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    placedCount: selected.length,
    cancelledCount: statusCounts.Cancelled,
    nonCancelledCount: eligible.length,
    bookedValueUsd,
    refundPreviewUsd,
    afterRefundPreviewUsd: bookedValueUsd - refundPreviewUsd,
    averageOrderValueUsd: eligible.length
      ? bookedValueUsd / eligible.length
      : 0,
    statusCounts,
    byDay: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    products: productRows,
    customers: customerRows,
    inventory: {
      totalUnits: stocks.reduce((sum, n) => sum + n, 0),
      lowStock: stocks.filter((n) => n > 0 && n < 10).length,
      outOfStock: stocks.filter((n) => n === 0).length,
      events: [...stockEvents].sort((a, b) => b.at.localeCompare(a.at)),
    },
  }
}

/** Quote CSV fields and guard against spreadsheet formula injection. */
export function reportCsv(view: ReportView, data: ReportResult): string {
  const rows: (string | number)[][] =
    view === 'sales'
      ? [
          [
            'Order ID',
            'Date',
            'Status',
            'Country',
            'Channel',
            'Order value USD',
            'Refund preview USD',
          ],
          ...data.orders.map((o) => [
            o.id,
            o.createdAt,
            o.status,
            o.country,
            o.channel,
            orderTotal(o),
            (o.refunds ?? []).reduce((sum, r) => sum + r.amount, 0),
          ]),
        ]
      : view === 'products'
        ? [
            [
              'Product ID',
              'Product',
              'SKU',
              'Units in orders',
              'Order value USD',
              'Stock units',
              'Status',
            ],
            ...data.products.map((p) => [
              p.id,
              p.name,
              p.sku,
              p.units,
              p.orderValueUsd,
              p.stock,
              p.status,
            ]),
          ]
        : view === 'customers'
          ? [
              [
                'Customer ID',
                'Name',
                'Email',
                'Country',
                'Orders',
                'Order value USD',
                'Joined',
              ],
              ...data.customers.map((c) => [
                c.id,
                c.name,
                c.email,
                c.country,
                c.orderCount,
                c.orderValueUsd,
                c.joinedAt,
              ]),
            ]
          : [
              ['Product ID', 'Product', 'SKU', 'Stock units', 'Status'],
              ...data.products.map((p) => [
                p.id,
                p.name,
                p.sku,
                p.stock,
                p.status,
              ]),
            ]
  const escape = (value: string | number) => {
    const raw = String(value).replace(/\r\n?|\n/g, ' ')
    const safe =
      typeof value === 'number'
        ? raw
        : /^[\s]*[=+\-@\t]/.test(raw)
          ? `'${raw}`
          : raw
    return `"${safe.replaceAll('"', '""')}"`
  }
  return `\uFEFF${rows.map((row) => row.map(escape).join(',')).join('\r\n')}\r\n`
}

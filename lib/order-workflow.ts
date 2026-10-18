import type { Order, OrderStatus, RefundRecord, ReturnDecision } from './types'

/** Frontend-only workflow rules; the future backend must enforce them independently. */
const nextStatus: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export const statusOptions = (current: OrderStatus): OrderStatus[] => [
  current,
  ...nextStatus[current],
]

export const canAdvanceStatus = (current: OrderStatus, next: OrderStatus) =>
  nextStatus[current].includes(next)

export const canCancelOrder = (order: Order) =>
  order.status === 'Pending' || order.status === 'Processing'

export const canSaveShipment = (order: Order) =>
  order.status === 'Processing' || order.status === 'Shipped'

export const canRequestReturn = (order: Order) =>
  order.status === 'Delivered' && !order.returnRequest

export const canDecideReturn = (order: Order) =>
  order.returnRequest?.status === 'Requested'

export const canRecordRefund = (order: Order) =>
  order.returnRequest?.status === 'Approved'

export const refundedTotal = (order: Order) =>
  (order.refunds ?? []).reduce((total, refund) => total + refund.amount, 0)

export const orderValue = (order: Order) =>
  order.items.reduce((total, item) => total + item.price * item.qty, 0)

export const remainingRefundable = (order: Order) =>
  Math.max(
    0,
    Math.round((orderValue(order) - refundedTotal(order)) * 100) / 100,
  )

export const validRefund = (order: Order, amount: number) =>
  canRecordRefund(order) &&
  Number.isFinite(amount) &&
  amount > 0 &&
  Math.abs(Math.round(amount * 100) - amount * 100) < 0.00001 &&
  Math.round(amount * 100) <= Math.round(remainingRefundable(order) * 100)

export function timelineFor(order: Order) {
  const initial = {
    id: `created-${order.id}`,
    at: order.createdAt,
    title: 'Order created',
    detail: 'Sample order imported into the local preview',
  }
  const events = order.timeline ?? []
  return [initial, ...events].sort((a, b) => b.at.localeCompare(a.at))
}

export type ReturnOutcome = Exclude<ReturnDecision, 'Requested'>
export const sumRefunds = (records: RefundRecord[] = []) =>
  records.reduce((sum, item) => sum + item.amount, 0)

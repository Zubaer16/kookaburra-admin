/** Sample reporting rows, NOT Stripe data, transaction tokens, or reconciliation. */
import type { Order } from './types'
export type PaymentReportStatus = 'Succeeded' | 'Pending' | 'Failed' | 'Refunded'
export type SamplePayment = {
  id: string
  orderId: string
  status: PaymentReportStatus
  amountUsd: number
  createdAt: string
  channel: 'Web' | 'Mobile'
  country: string
}
export const paymentExamples: Record<string, PaymentReportStatus> = {
  'KB-1048': 'Succeeded',
  'KB-1047': 'Pending',
  'KB-1046': 'Succeeded',
  'KB-1045': 'Failed',
  'KB-1044': 'Refunded',
  'KB-1043': 'Failed',
}
export function samplePayments(orders: Order[]): SamplePayment[] {
  return orders.map((o) => ({
    id: `SAMPLE-${o.id}`,
    orderId: o.id,
    status: paymentExamples[o.id] ?? 'Pending',
    amountUsd: Math.round(o.items.reduce((sum, item) => sum + item.qty * item.price, 0) * 100) / 100,
    createdAt: o.createdAt,
    country: o.country,
    channel: o.channel,
  }))
}
export function samplePaymentSummary(rows: SamplePayment[]) {
  const settled = rows.filter((r) => r.status === 'Succeeded')
  return {
    count: rows.length,
    successfulCount: settled.length,
    simulatedSuccessfulUsd: Math.round(settled.reduce((sum, r) => sum + r.amountUsd, 0) * 100) / 100,
    attentionCount: rows.filter((r) => r.status === 'Failed' || r.status === 'Pending').length,
  }
}

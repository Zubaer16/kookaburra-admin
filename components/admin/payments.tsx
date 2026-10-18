'use client'
import { useMemo, useState } from 'react'
import {
  CreditCard,
  Search,
  ShieldAlert,
  Clock3,
  CircleCheck,
  Eye,
} from 'lucide-react'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import { money } from '@/lib/utils'
import {
  samplePayments,
  samplePaymentSummary,
  type PaymentReportStatus,
  type SamplePayment,
} from '@/lib/payment-report'

const statusColor: Record<
  PaymentReportStatus,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  Succeeded: 'success',
  Pending: 'warning',
  Failed: 'danger',
  Refunded: 'neutral',
}
export function Payments() {
  const ready = useAdminReady()
  const orders = useAdminStore((s) => s.orders)
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SamplePayment | null>(null)
  const rows = useMemo(() => samplePayments(orders), [orders])
  const summary = useMemo(() => samplePaymentSummary(rows), [rows])
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === 'All' || r.status === status) &&
          (!query.trim() ||
            `${r.orderId} ${r.id} ${r.country}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [rows, status, query],
  )
  if (!ready)
    return <p className="text-sm text-muted">Loading sample payment report…</p>
  return (
    <>
      <PageHeading
        eyebrow="Finance preview"
        title="Payment reporting"
        description="Read-only, fictional payment examples derived from Admin sample orders. No Stripe connection."
        action={<Badge kind="warning">Simulated data only</Badge>}
      />
      <Panel className="mb-5 flex gap-3 bg-amber-50 p-4 text-amber-900">
        <ShieldAlert size={21} className="shrink-0" />
        <p className="text-sm">
          <strong>Not Stripe reporting.</strong> No real charges, captures,
          refunds, payment intents, card details or webhook events. Preview
          refund records on the Orders page are not payment transactions.
        </p>
      </Panel>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Panel className="p-5">
          <CreditCard className="text-primary" size={20} />
          <p className="mt-2 text-xs text-muted">Fictional rows</p>
          <p className="mt-1 text-2xl font-black" data-testid="payment-count">
            {summary.count}
          </p>
        </Panel>
        <Panel className="p-5">
          <CircleCheck className="text-emerald-600" size={20} />
          <p className="mt-2 text-xs text-muted">Simulated successful amount</p>
          <p
            className="mt-1 text-2xl font-black"
            data-testid="sample-success-total"
          >
            {money(summary.simulatedSuccessfulUsd)}
          </p>
        </Panel>
        <Panel className="p-5">
          <Clock3 className="text-amber-600" size={20} />
          <p className="mt-2 text-xs text-muted">Simulated pending / failed</p>
          <p className="mt-1 text-2xl font-black">{summary.attentionCount}</p>
        </Panel>
      </div>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-5">
          <div className="flex-1">
            <h2 className="font-extrabold">Sample payment events</h2>
            <p className="mt-1 text-xs text-muted">
              Filtered display only; statuses do not represent real provider
              responses.
            </p>
          </div>
          <Field label="Search order or destination">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-muted" />
              <input
                className={`${controlClass} pl-9`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="KB-1048"
              />
            </div>
          </Field>
          <Field label="Payment status">
            <select
              className={controlClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Succeeded</option>
              <option>Pending</option>
              <option>Failed</option>
              <option>Refunded</option>
            </select>
          </Field>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Example ID</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Amount USD</th>
                  <th className="px-5 py-3">Simulated status</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr className="border-t border-line" key={r.id}>
                    <td className="px-5 py-3 font-medium">{r.id}</td>
                    <td className="px-5 py-3">{r.orderId}</td>
                    <td className="px-5 py-3">{r.country}</td>
                    <td className="px-5 py-3 font-bold">
                      {money(r.amountUsd)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge kind={statusColor[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Inspect sample payment ${r.orderId}`}
                        onClick={() => setSelected(r)}
                      >
                        <Eye size={14} />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching sample payments"
            description="Change search or status filter to view example rows."
          />
        )}
      </Panel>
      {selected && (
        <Modal
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
          title={`Sample payment ${selected.orderId}`}
          description="Fictional reporting detail. No payment provider data."
        >
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Example identifier</span>
              <strong>{selected.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>Sample status</span>
              <Badge kind={statusColor[selected.status]}>
                {selected.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Example amount</span>
              <strong>{money(selected.amountUsd)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Destination</span>
              <strong>{selected.country}</strong>
            </div>
            <div className="flex justify-between">
              <span>Channel</span>
              <strong>{selected.channel}</strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-xs text-muted">
              Actual provider status, settlement, fees, chargebacks, and refunds
              require server-verified Stripe test-mode events after backend
              approval.
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSelected(null)}>Close details</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

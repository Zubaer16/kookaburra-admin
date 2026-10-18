'use client'
import { useMemo, useState } from 'react'
import { Search, Eye } from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { PageHeading } from './page-heading'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { controlClass } from '@/components/ui/field'
import type { OrderStatus } from '@/lib/types'
import { orderTotal } from '@/lib/fixtures'
import { money, shortDate } from '@/lib/utils'
import { OrderDetails } from './order-details'
const statuses: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
]
export function Orders() {
  const orders = useAdminStore((s) => s.orders)
  const customers = useAdminStore((s) => s.customers)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const list = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            (filter === 'all' || o.status === filter) &&
            `${o.id} ${customers.find((c) => c.id === o.customerId)?.name ?? ''} ${o.country}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, customers, filter, query],
  )
  const pending = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Processing',
  ).length
  const inTransit = orders.filter((o) => o.status === 'Shipped').length
  const returns = orders.filter(
    (o) => o.returnRequest?.status === 'Requested',
  ).length
  return (
    <>
      <PageHeading
        eyebrow="FULFILLMENT"
        title="Orders"
        description="Review fulfillment, shipments and return/refund previews in one place."
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Orders requiring action', pending],
          ['Shipped orders', inTransit],
          ['Return requests', returns],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-line bg-white p-4"
          >
            <p className="text-xs font-bold text-muted">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4 sm:p-5">
          <label className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-3 text-muted" />
            <input
              aria-label="Search orders"
              placeholder="Search order, name or country..."
              className={controlClass + ' pl-10'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter order status"
            className={controlClass + ' w-auto'}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All orders</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Country</th>
                <th>Total</th>
                <th>Status</th>
                <th>Return / tracking</th>
                <th className="text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>
                    {customers.find((c) => c.id === o.customerId)?.name ??
                      'Unknown'}
                  </td>
                  <td className="text-muted">{shortDate(o.createdAt)}</td>
                  <td>{o.country}</td>
                  <td className="font-bold">{money(orderTotal(o))}</td>
                  <td>
                    <Badge kind={statusKind(o.status)}>{o.status}</Badge>
                  </td>
                  <td className="text-xs text-muted">
                    {o.returnRequest
                      ? `Return: ${o.returnRequest.status}`
                      : o.shipment
                        ? `Tracking: ${o.shipment.trackingNumber}`
                        : '—'}
                  </td>
                  <td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedId(o.id)}
                    >
                      <Eye size={14} /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <EmptyState title="No matching orders" />}
        </div>
      </Panel>
      <OrderDetails id={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}

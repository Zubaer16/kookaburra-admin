'use client'
import { useMemo, useState } from 'react'
import { Search, Eye, ShoppingBag } from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { PageHeading } from './page-heading'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { controlClass } from '@/components/ui/field'
import type { Order, OrderStatus } from '@/lib/types'
import { orderTotal } from '@/lib/fixtures'
import { money, shortDate } from '@/lib/utils'
const statuses: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
]
export function Orders() {
  const orders = useAdminStore((s) => s.orders),
    customers = useAdminStore((s) => s.customers),
    update = useAdminStore((s) => s.updateOrderStatus)
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState<Order | null>(null)
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
  return (
    <>
      <PageHeading
        eyebrow="FULFILLMENT"
        title="Orders"
        description="Track order flow and preview operational status changes."
      />
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
            {statuses.map((status) => (
              <option key={status}>{status}</option>
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
                  <td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelected(o)}
                    >
                      <Eye size={14} />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <EmptyState title="No matching orders" />}
        </div>
      </Panel>
      {selected && (
        <Modal
          title={`Order ${selected.id}`}
          description="Status changes are saved locally for preview only."
          open={!!selected}
          onOpenChange={(v) => {
            if (!v) setSelected(null)
          }}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted">Customer</p>
                <p className="mt-1 font-bold">
                  {customers.find((c) => c.id === selected.customerId)?.name ??
                    'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">Destination</p>
                <p className="mt-1 font-bold">{selected.country}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">Channel</p>
                <p className="mt-1 font-bold">{selected.channel}</p>
              </div>
            </div>
            <div>
              {selected.items.map((item) => (
                <div
                  className="flex justify-between border-b border-line py-3 text-sm"
                  key={item.productId}
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">Qty: {item.qty}</p>
                  </div>
                  <span className="font-bold">
                    {money(item.qty * item.price)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-4 font-black">
                <span>Total</span>
                <span>{money(orderTotal(selected))}</span>
              </div>
            </div>
            <label className="block text-sm font-bold">
              Fulfillment status
              <select
                aria-label="Change order status"
                className={controlClass + ' mt-2'}
                value={
                  orders.find((o) => o.id === selected.id)?.status ??
                  selected.status
                }
                onChange={(e) =>
                  update(selected.id, e.target.value as OrderStatus)
                }
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end">
              <Button onClick={() => setSelected(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

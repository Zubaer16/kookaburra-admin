'use client'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  ShoppingBag,
  Users,
  Wallet,
  AlertTriangle,
  PackageCheck,
  TrendingUp,
} from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { useAdminReady } from '@/components/providers'
import { orderTotal } from '@/lib/fixtures'
import { money, number, shortDate } from '@/lib/utils'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, SectionHeading } from '@/components/ui/panel'
import { PageHeading } from '@/components/admin/page-heading'
import { Button } from '@/components/ui/button'
function Figure({
  children,
  label,
  detail,
  icon: Icon,
}: {
  children: React.ReactNode
  label: string
  detail: string
  icon: typeof Wallet
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted">{label}</p>
          <p className="mt-3 text-[27px] font-black tracking-tight text-ink">
            {children}
          </p>
          <p className="mt-1 text-xs text-muted">{detail}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-primary">
          <Icon size={20} />
        </div>
      </div>
    </Panel>
  )
}
export function Dashboard() {
  const ready = useAdminReady(),
    orders = useAdminStore((s) => s.orders),
    products = useAdminStore((s) => s.products),
    customers = useAdminStore((s) => s.customers)
  const paid = orders.filter((o) =>
      ['Delivered', 'Processing', 'Shipped'].includes(o.status),
    ),
    sales = paid.reduce((sum, o) => sum + orderTotal(o), 0),
    low = products.filter((p) => p.stock < 10),
    active = products.filter((p) => p.status === 'Active').length
  const latest = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
  return (
    <>
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title="Good to see you again."
        description="Here is what's happening across your store."
        action={
          <Link href="/products">
            <Button>
              <ShoppingBag size={16} />
              Manage products
              <ArrowRight size={15} />
            </Button>
          </Link>
        }
      />
      {!ready && (
        <p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-primary">
          Loading saved workspace...
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Figure
          label="Sample revenue"
          detail="Non-cancelled, non-pending orders"
          icon={Wallet}
        >
          {money(sales)}
        </Figure>
        <Figure
          label="Total orders"
          detail="Across all order statuses"
          icon={ShoppingBag}
        >
          {number(orders.length)}
        </Figure>
        <Figure
          label="Active products"
          detail={`${products.length} total products`}
          icon={Box}
        >
          {number(active)}
        </Figure>
        <Figure label="Customers" detail="Sample customer records" icon={Users}>
          {number(customers.length)}
        </Figure>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Panel className="overflow-hidden p-5 sm:p-6">
          <SectionHeading
            title="Sales performance"
            subtitle="Illustrative trend, not live revenue"
            action={
              <Badge kind="info">
                <TrendingUp size={13} />
                Store overview
              </Badge>
            }
          />
          <div className="mt-7 flex items-baseline gap-3">
            <strong className="text-3xl font-black tracking-tight">
              {money(sales)}
            </strong>
            <span className="text-xs text-muted">Sample sales total</span>
          </div>
          <svg
            className="metric-line mt-5 h-[180px] w-full"
            viewBox="0 0 700 200"
            role="img"
            aria-label="Illustrative sales trend chart"
          >
            <defs>
              <linearGradient id="salesfill" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#2459e8" stopOpacity=".20" />
                <stop offset="1" stopColor="#2459e8" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[40, 80, 120, 160].map((y) => (
              <line
                key={y}
                x1="0"
                x2="700"
                y1={y}
                y2={y}
                stroke="#e8edf6"
                strokeDasharray="5 7"
              />
            ))}
            <path
              fill="url(#salesfill)"
              d="M0 151C49 137 82 154 123 124S203 132 246 93S331 114 379 75S470 106 517 57S620 82 700 19V200H0Z"
            />
            <path
              fill="none"
              stroke="#2459e8"
              strokeWidth="4"
              strokeLinecap="round"
              d="M0 151C49 137 82 154 123 124S203 132 246 93S331 114 379 75S470 106 517 57S620 82 700 19"
            />
          </svg>
          <div className="flex justify-between border-t border-line pt-3 text-xs font-semibold text-muted">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <SectionHeading
            title="Needs your attention"
            subtitle="Simple inventory and fulfillment checks"
          />
          <div className="mt-6 space-y-3">
            <Link
              href="/inventory"
              className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 hover:bg-amber-100"
            >
              <AlertTriangle className="shrink-0 text-amber-600" size={19} />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {low.length} low-stock products
                </p>
                <p className="mt-1 text-xs text-muted">
                  Items under 10 units, including out of stock
                </p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/orders"
              className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 hover:bg-blue-100"
            >
              <PackageCheck className="shrink-0 text-primary" size={19} />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {
                    orders.filter(
                      (o) =>
                        o.status === 'Pending' || o.status === 'Processing',
                    ).length
                  }{' '}
                  orders need action
                </p>
                <p className="mt-1 text-xs text-muted">
                  Pending or in processing
                </p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/products"
              className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100"
            >
              <Box className="shrink-0 text-slate-500" size={19} />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {products.filter((p) => p.status === 'Draft').length} draft
                  products
                </p>
                <p className="mt-1 text-xs text-muted">
                  Review before publishing
                </p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </Panel>
      </div>
      <Panel className="mt-6 overflow-hidden">
        <div className="p-5 sm:p-6">
          <SectionHeading
            title="Recent orders"
            subtitle="Latest sample orders and statuses"
            action={
              <Link
                className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                href="/orders"
              >
                View all orders
                <ArrowRight size={14} />
              </Link>
            }
          />
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Placed</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((o) => {
                const c = customers.find((c) => c.id === o.customerId)
                return (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{c?.name || 'Unknown'}</td>
                    <td className="text-muted">{shortDate(o.createdAt)}</td>
                    <td>
                      <Badge kind={statusKind(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="text-right font-bold">
                      {money(orderTotal(o))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

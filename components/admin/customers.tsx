'use client'
import { useState } from 'react'
import { Search, UserRound } from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { controlClass } from '@/components/ui/field'
import { money, shortDate } from '@/lib/utils'
import { orderTotal } from '@/lib/fixtures'
export function Customers() {
  const customers = useAdminStore((s) => s.customers),
    orders = useAdminStore((s) => s.orders),
    [query, setQuery] = useState('')
  const matching = customers.filter((c) =>
    `${c.name} ${c.email} ${c.location}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  return (
    <>
      <PageHeading
        eyebrow="CUSTOMER RELATIONSHIPS"
        title="Customers"
        description="Browse customer history across international orders."
      />
      <Panel className="overflow-hidden">
        <div className="border-b border-line p-4 sm:p-5">
          <label className="relative block max-w-sm">
            <Search className="absolute left-3 top-3 text-muted" size={17} />
            <input
              aria-label="Search customers"
              className={controlClass + ' pl-10'}
              placeholder="Search customers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Country</th>
                <th>Orders</th>
                <th>Lifetime value (sample)</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {matching.map((c) => {
                const owned = orders.filter((o) => o.customerId === c.id)
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex min-w-52 items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-primary">
                          <UserRound size={19} />
                        </span>
                        <div>
                          <p>{c.name}</p>
                          <p className="text-xs font-normal text-muted">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{c.location}</td>
                    <td>{owned.length}</td>
                    <td>
                      {money(
                        owned
                          .filter((o) => o.status !== 'Cancelled')
                          .reduce((s, o) => s + orderTotal(o), 0),
                      )}
                    </td>
                    <td className="text-muted">{shortDate(c.joinedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!matching.length && <EmptyState title="No matching customers" />}
        </div>
      </Panel>
    </>
  )
}

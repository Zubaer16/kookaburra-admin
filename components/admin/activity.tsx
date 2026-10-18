'use client'
import { useMemo, useState } from 'react'
import { ClipboardList, ShieldAlert } from 'lucide-react'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Field, controlClass } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { useAdminReady } from '@/components/providers'
import { useAdminStore } from '@/lib/store'
export function Activity() {
  const ready = useAdminReady()
  const entries = useAdminStore((s) => s.activity)
  const [area, setArea] = useState('All')
  const [search, setSearch] = useState('')
  const results = useMemo(
    () =>
      entries.filter(
        (row) =>
          (area === 'All' || row.area === area) &&
          `${row.action} ${row.detail}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [entries, area, search],
  )
  if (!ready)
    return <p className="text-sm text-muted">Loading activity preview…</p>
  return (
    <>
      <PageHeading
        eyebrow="Local workspace history"
        title="Activity preview"
        description="A recent list of staff, role and settings edits made in this browser."
        action={<Badge kind="warning">Not a security audit log</Badge>}
      />
      <Panel className="mb-5 flex gap-3 bg-amber-50 p-4 text-amber-950">
        <ShieldAlert size={20} className="shrink-0" />
        <p className="text-sm">
          <strong>Limited and editable.</strong> Events come only from local
          Staff, Roles and Settings changes. Other Admin actions are not logged
          here; entries can be cleared with browser storage and cannot prove who
          performed an action.
        </p>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-5">
          <div className="flex-1">
            <ClipboardList size={20} className="text-primary" />
            <h2 className="mt-1 font-extrabold">
              Recent preview changes{' '}
              <span data-testid="activity-count">({entries.length})</span>
            </h2>
          </div>
          <Field label="Search events">
            <input
              className={controlClass}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find an action"
            />
          </Field>
          <Field label="Activity area">
            <select
              className={controlClass}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option>All</option>
              <option>Staff</option>
              <option>Roles</option>
              <option>Settings</option>
            </select>
          </Field>
        </div>
        {results.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[650px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Local time</th>
                  <th className="px-5 py-3">Area</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {results.map((event) => (
                  <tr key={event.id} className="border-t border-line">
                    <td className="px-5 py-3 whitespace-nowrap">
                      {new Date(event.at).toLocaleString('en-US')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{event.area}</Badge>
                    </td>
                    <td className="px-5 py-3 font-semibold">{event.action}</td>
                    <td className="px-5 py-3">{event.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching local events"
            description="Edit a sample staff member, role or store settings to create a preview event."
          />
        )}
      </Panel>
    </>
  )
}

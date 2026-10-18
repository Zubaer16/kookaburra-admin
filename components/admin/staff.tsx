'use client'
import { useMemo, useState } from 'react'
import {
  UsersRound,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { PageHeading } from './page-heading'
import { Panel, EmptyState } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useAdminReady } from '@/components/providers'
import { useAdminStore } from '@/lib/store'
import {
  permissionCatalog,
  staffRoles,
  seedRolePermissions,
  type StaffMember,
  type StaffRole,
  type PermissionKey,
} from '@/lib/workspace-policy'

const blank = (): StaffMember => ({
  id: '',
  name: '',
  email: '',
  role: 'Support',
  status: 'Active',
  createdAt: new Date().toISOString(),
})

export function Staff() {
  const ready = useAdminReady()
  const staff = useAdminStore((s) => s.staff)
  const permissions = useAdminStore((s) => s.rolePermissions)
  const saveStaff = useAdminStore((s) => s.saveStaff)
  const removeStaff = useAdminStore((s) => s.removeStaff)
  const saveRolePermissions = useAdminStore((s) => s.saveRolePermissions)
  const [tab, setTab] = useState<'directory' | 'roles'>('directory')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [error, setError] = useState('')
  const [role, setRole] = useState<StaffRole>('Manager')
  const [draft, setDraft] = useState<PermissionKey[]>([
    ...seedRolePermissions.Manager,
  ])
  const [roleError, setRoleError] = useState('')
  const filtered = useMemo(
    () =>
      staff.filter((s) =>
        `${s.name} ${s.email} ${s.role}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [staff, search],
  )
  const chooseRole = (next: StaffRole) => {
    setRole(next)
    setDraft([...(permissions[next] ?? seedRolePermissions[next])])
    setRoleError('')
  }
  if (!ready)
    return <p className="text-sm text-muted">Loading staff preview…</p>
  const roleDraft = draft
  return (
    <>
      <PageHeading
        eyebrow="Workspace preview"
        title="Staff & permissions"
        description="Manage sample staff and explore permission assignments. These settings do not secure routes or authenticate anyone."
        action={<Badge kind="warning">No real access enforcement</Badge>}
      />
      <Panel className="mb-5 flex gap-3 bg-amber-50 p-4 text-amber-950">
        <ShieldAlert className="shrink-0" size={21} />
        <p className="text-sm">
          <strong>UI simulation only.</strong> Everyone opening this local app
          can still access all pages and change preview data. Do not enter real
          staff identities or use this for production authorization.
        </p>
      </Panel>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Panel className="p-4">
          <UsersRound className="text-primary" size={20} />
          <p className="mt-2 text-xs text-muted">Sample team members</p>
          <p className="text-2xl font-black" data-testid="staff-count">
            {staff.length}
          </p>
        </Panel>
        <Panel className="p-4">
          <ShieldCheck className="text-primary" size={20} />
          <p className="mt-2 text-xs text-muted">Active preview accounts</p>
          <p className="text-2xl font-black">
            {staff.filter((s) => s.status === 'Active').length}
          </p>
        </Panel>
        <Panel className="p-4">
          <ShieldCheck className="text-primary" size={20} />
          <p className="mt-2 text-xs text-muted">Role templates</p>
          <p className="text-2xl font-black">{staffRoles.length}</p>
        </Panel>
      </div>
      <div
        className="mb-4 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Staff workspace views"
      >
        <Button
          role="tab"
          aria-selected={tab === 'directory'}
          variant={tab === 'directory' ? 'primary' : 'secondary'}
          onClick={() => setTab('directory')}
        >
          Staff directory
        </Button>
        <Button
          role="tab"
          aria-selected={tab === 'roles'}
          variant={tab === 'roles' ? 'primary' : 'secondary'}
          onClick={() => {
            setTab('roles')
            chooseRole(role)
          }}
        >
          Role permission matrix
        </Button>
      </div>
      {tab === 'directory' ? (
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
            <Field label="Find staff">
              <input
                className={controlClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sample team"
              />
            </Field>
            <Button
              onClick={() => {
                setEditing(blank())
                setError('')
              }}
            >
              <Plus size={16} /> Add staff member
            </Button>
          </div>
          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((person) => (
                    <tr className="border-t border-line" key={person.id}>
                      <td className="px-5 py-3 font-bold">{person.name}</td>
                      <td className="px-5 py-3">{person.email}</td>
                      <td className="px-5 py-3">{person.role}</td>
                      <td className="px-5 py-3">
                        <Badge
                          kind={
                            person.status === 'Active' ? 'success' : 'warning'
                          }
                        >
                          {person.status}
                        </Badge>
                      </td>
                      <td className="flex gap-2 px-5 py-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Edit staff ${person.name}`}
                          onClick={() => {
                            setEditing({ ...person })
                            setError('')
                          }}
                        >
                          <Pencil size={14} /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          aria-label={`Remove staff ${person.name}`}
                          disabled={person.role === 'Owner'}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove sample staff member ${person.name}?`,
                              )
                            )
                              removeStaff(person.id)
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No matching staff"
              description="Try another name, email or role."
            />
          )}
        </Panel>
      ) : (
        <Panel className="p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">Role permission matrix</h2>
              <p className="text-sm text-muted">
                Preview assignments only. Never used to protect navigation or
                APIs.
              </p>
            </div>
            <div className="w-full sm:w-56">
              <Field label="Choose role">
                <select
                  className={controlClass}
                  value={role}
                  onChange={(e) => chooseRole(e.target.value as StaffRole)}
                >
                  {staffRoles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {permissionCatalog.map((permission) => (
              <label
                key={permission.key}
                className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm"
              >
                <input
                  type="checkbox"
                  aria-label={permission.label}
                  checked={
                    role === 'Owner' || roleDraft.includes(permission.key)
                  }
                  disabled={role === 'Owner'}
                  onChange={(e) => {
                    setRoleError('')
                    setDraft((old) =>
                      e.target.checked
                        ? [...new Set([...old, permission.key])]
                        : old.filter((p) => p !== permission.key),
                    )
                  }}
                />
                <span>
                  <strong className="block">{permission.label}</strong>
                  <small className="text-muted">{permission.group}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              disabled={role === 'Owner'}
              onClick={() => {
                const result = saveRolePermissions(role, roleDraft)
                setRoleError(result ?? '')
                if (!result) setDraft([...roleDraft])
              }}
            >
              Save role preview
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft([...(permissions[role] ?? seedRolePermissions[role])])
                setRoleError('')
              }}
            >
              <RotateCcw size={14} /> Discard changes
            </Button>
            {role === 'Owner' && (
              <span className="text-xs text-muted">
                Owner template is fixed.
              </span>
            )}
          </div>
          {roleError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {roleError}
            </p>
          )}
          <p className="mt-4 text-xs text-muted">
            Saved matrix is stored locally. Backend RBAC must independently
            define and enforce each permission.
          </p>
        </Panel>
      )}
      {editing && (
        <Modal
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null)
          }}
          title={
            editing.id ? 'Edit sample staff member' : 'Add sample staff member'
          }
          description="Mock identity only; no invitation email or user account is created."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const result = saveStaff(editing)
              if (result) setError(result)
              else setEditing(null)
            }}
          >
            <Field label="Full name">
              <input
                className={controlClass}
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Email address">
              <input
                className={controlClass}
                type="email"
                required
                value={editing.email}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </Field>
            <Field label="Staff role">
              <select
                className={controlClass}
                value={editing.role}
                disabled={editing.id === 'staff-owner'}
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value as StaffRole })
                }
              >
                {staffRoles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Account status">
              <select
                className={controlClass}
                value={editing.status}
                disabled={editing.id === 'staff-owner'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as StaffMember['status'],
                  })
                }
              >
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </Field>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save staff member</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

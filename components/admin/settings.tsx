'use client'
import { useState } from 'react'
import { Globe2, ShieldAlert } from 'lucide-react'
import { PageHeading } from './page-heading'
import { Panel } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, controlClass } from '@/components/ui/field'
import { useAdminReady } from '@/components/providers'
import { useAdminStore } from '@/lib/store'
import { supportedTimezones, type StoreSettings } from '@/lib/workspace-policy'

function SettingsEditor({
  saved,
  save,
}: {
  saved: StoreSettings
  save: (settings: StoreSettings) => string | null
}) {
  const [form, setForm] = useState<StoreSettings>(() => ({ ...saved }))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const edit = (key: keyof StoreSettings, value: string) => {
    setForm((old) => ({ ...old, [key]: value }))
    setError('')
    setSuccess(false)
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const result = save(form)
        setError(result ?? '')
        setSuccess(!result)
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Store display name">
          <input
            className={controlClass}
            value={form.storeName}
            maxLength={70}
            onChange={(e) => edit('storeName', e.target.value)}
            required
          />
        </Field>
        <Field label="Support contact email">
          <input
            className={controlClass}
            type="email"
            value={form.supportEmail}
            onChange={(e) => edit('supportEmail', e.target.value)}
            required
          />
        </Field>
        <Field label="Storefront URL (HTTPS)">
          <input
            className={controlClass}
            value={form.websiteUrl}
            placeholder="https://example.com"
            onChange={(e) => edit('websiteUrl', e.target.value)}
          />
        </Field>
        <Field label="Reporting time zone">
          <select
            className={controlClass}
            value={form.timezone}
            onChange={(e) => edit('timezone', e.target.value)}
          >
            {supportedTimezones.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Order reference prefix">
          <input
            className={controlClass}
            value={form.orderPrefix}
            onChange={(e) => edit('orderPrefix', e.target.value.toUpperCase())}
            maxLength={8}
          />
        </Field>
        <Field label="Support notice (preview only)">
          <input
            className={controlClass}
            value={form.supportNotice}
            maxLength={180}
            onChange={(e) => edit('supportNotice', e.target.value)}
            placeholder="Optional support message"
          />
        </Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-slate-50 p-4">
          <p className="text-xs text-muted">Store language</p>
          <p className="mt-1 font-bold">English — locked</p>
        </div>
        <div className="rounded-xl border border-line bg-slate-50 p-4">
          <p className="text-xs text-muted">Display currency</p>
          <p className="mt-1 font-bold">USD ($) — locked</p>
        </div>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 text-sm text-emerald-700" role="status">
          Store settings preview saved locally.
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <Button type="submit">Save store settings</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setForm({ ...saved })
            setError('')
            setSuccess(false)
          }}
        >
          Discard edits
        </Button>
      </div>
    </form>
  )
}
export function Settings() {
  const ready = useAdminReady()
  const saved = useAdminStore((s) => s.storeSettings)
  const save = useAdminStore((s) => s.saveStoreSettings)
  if (!ready)
    return <p className="text-sm text-muted">Loading store preferences…</p>
  return (
    <>
      <PageHeading
        eyebrow="Global preferences"
        title="Store settings"
        description="Set draft store identity and operational defaults for the future shared API."
        action={<Badge kind="warning">Local preview only</Badge>}
      />
      <Panel className="mb-5 flex gap-3 bg-amber-50 p-4 text-amber-950">
        <ShieldAlert size={20} className="shrink-0" />
        <p className="text-sm">
          These settings affect the Admin preview only. Changes do not appear on
          the Customer Storefront and do not change checkout, emails or order
          IDs.
        </p>
      </Panel>
      <Panel className="p-5">
        <div className="mb-5 flex items-center gap-2">
          <Globe2 className="text-primary" size={20} />
          <h2 className="text-lg font-extrabold">Store profile</h2>
        </div>
        <SettingsEditor saved={saved} save={save} />
      </Panel>
    </>
  )
}
